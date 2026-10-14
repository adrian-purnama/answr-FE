/**
 * SapAi widget loader.
 *
 * Runs on the host page and owns exactly one thing: the iframe's box. It never
 * injects a stylesheet, never touches host elements, and applies every iframe
 * property as an inline `!important` declaration so no host CSS (resets,
 * `iframe {}` rules, `max-width: 100%`, global transitions) can reach the
 * widget. All sizing, positioning and animation decisions are made inside the
 * widget document and delivered here as messages.
 *
 * Usage:
 *   <script src="https://app.example.com/widget.js"
 *           data-public-key="YOUR_PUBLIC_KEY"
 *           data-on-error-load="true"
 *           data-wait-until-loaded="false"></script>
 */

import {
  VISITOR_TOKEN_MESSAGE_TYPE,
  WIDGET_COMMAND_MESSAGE_TYPE,
  WIDGET_HOST_ENV_MESSAGE_TYPE,
  WIDGET_LAUNCHER_FRAME_SIZE,
  embedWidgetPath,
  isVisitorTokenRequestMessage,
  isWidgetCorner,
  isWidgetFrameMessage,
  isWidgetLifecycleMessage,
  type VisitorTokenMessage,
  type WidgetCommand,
  type WidgetCommandMessage,
  type WidgetCorner,
  type WidgetFrameMessage,
  type WidgetHostEnvMessage,
} from '../lib/widgetFrameProtocol'

type VisitorTokenRequestHandler = () => void

export type SapAiWidgetApi = {
  publicKey: string
  setVisitorToken: (token: string) => void
  onVisitorTokenRequest: (handler: VisitorTokenRequestHandler) => void
  open: () => void
  close: () => void
  destroy: () => void
}

declare global {
  interface Window {
    SapAiWidget?: SapAiWidgetApi
  }
}

/** Just under the 32-bit max so a host can still layer something above us. */
const FRAME_Z_INDEX = '2147483000'
const RESIZE_DEBOUNCE_MS = 150

/**
 * Applied on every geometry update, not just at creation: a host script or
 * stylesheet that mutates the iframe later cannot win.
 */
const HARDENED_STYLE: Record<string, string> = {
  position: 'fixed',
  border: '0',
  margin: '0',
  padding: '0',
  background: 'transparent',
  'color-scheme': 'normal',
  'z-index': FRAME_Z_INDEX,
  display: 'block',
  opacity: '1',
  visibility: 'visible',
  transform: 'none',
  // No host-side animation: the widget animates itself inside the frame.
  transition: 'none',
  animation: 'none',
  'max-width': 'none',
  'max-height': 'none',
  'min-width': '0',
  'min-height': '0',
  'box-shadow': 'none',
  filter: 'none',
  clip: 'auto',
  'clip-path': 'none',
  'border-radius': '0',
  'pointer-events': 'auto',
  float: 'none',
  inset: 'auto',
}

function applyStyle(el: HTMLElement, style: Record<string, string>): void {
  for (const property in style) {
    const value = style[property]
    if (value !== undefined) el.style.setProperty(property, value, 'important')
  }
}

function cornerStorageKey(publicKey: string): string {
  return `sapai-widget-corner:${publicKey}`
}

/**
 * Corner lives in the *host page's* storage: storage inside a cross-origin
 * iframe is partitioned or blocked outright by some browsers.
 */
function readCorner(publicKey: string): WidgetCorner {
  try {
    const raw = window.localStorage.getItem(cornerStorageKey(publicKey))
    if (isWidgetCorner(raw)) return raw
  } catch {
    // Storage unavailable (private mode, blocked cookies): fall through.
  }
  return 'bottom-right'
}

function writeCorner(publicKey: string, corner: WidgetCorner): void {
  try {
    window.localStorage.setItem(cornerStorageKey(publicKey), corner)
  } catch {
    // Non-fatal: the widget still works, the corner just is not remembered.
  }
}

function currentScript(): HTMLScriptElement | null {
  if (document.currentScript instanceof HTMLScriptElement) {
    return document.currentScript
  }
  const scripts = document.querySelectorAll<HTMLScriptElement>(
    'script[data-public-key]',
  )
  return scripts.length > 0 ? scripts[scripts.length - 1]! : null
}

function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** Missing/empty → default; "false"/"0" → false; anything else → true. */
function readBoolAttr(
  script: HTMLScriptElement | null,
  datasetKey: 'onErrorLoad' | 'waitUntilLoaded',
  defaultValue: boolean,
): boolean {
  if (!script) return defaultValue
  const raw = script.dataset[datasetKey]
  if (raw == null || raw === '') return defaultValue
  return raw !== 'false' && raw !== '0'
}

const HIDDEN_UNTIL_READY_STYLE: Record<string, string> = {
  visibility: 'hidden',
  opacity: '0',
  'pointer-events': 'none',
}

function mount(parent: HTMLElement, iframe: HTMLIFrameElement): void {
  if (document.body) {
    document.body.appendChild(iframe)
    return
  }
  document.addEventListener(
    'DOMContentLoaded',
    () => {
      ;(document.body ?? parent).appendChild(iframe)
    },
    { once: true },
  )
}

function init(): void {
  const script = currentScript()
  const configuredKey = script?.dataset.publicKey?.trim()
  if (!configuredKey) {
    console.error('[sapai-widget] missing data-public-key on the script tag')
    return
  }
  const publicKey: string = configuredKey
  const onErrorLoad = readBoolAttr(script, 'onErrorLoad', true)
  const waitUntilLoaded = readBoolAttr(script, 'waitUntilLoaded', false)

  if (window.SapAiWidget) return

  const widgetOrigin = script?.src
    ? new URL(script.src, window.location.href).origin
    : window.location.origin

  const iframe = document.createElement('iframe')
  const src = new URL(embedWidgetPath(publicKey), widgetOrigin)
  src.searchParams.set('hostOrigin', window.location.origin)

  iframe.title = 'SapAi widget'
  iframe.src = src.toString()
  iframe.setAttribute('allow', 'clipboard-write')
  iframe.setAttribute('aria-label', 'SapAi widget')

  let corner = readCorner(publicKey)
  let tokenRequestHandler: VisitorTokenRequestHandler | null = null
  let resizeTimer: ReturnType<typeof setTimeout> | null = null
  let revealed = !waitUntilLoaded

  /** Closed launcher box; replaced as soon as the widget reports its geometry. */
  function applyGeometry(
    width: number,
    height: number,
    nextCorner: WidgetCorner,
    fullBleed: boolean,
  ): void {
    applyStyle(iframe, HARDENED_STYLE)
    if (!revealed) {
      applyStyle(iframe, HIDDEN_UNTIL_READY_STYLE)
    }

    if (fullBleed) {
      applyStyle(iframe, {
        top: '0',
        left: '0',
        right: 'auto',
        bottom: 'auto',
        width: '100%',
        height: '100%',
      })
      return
    }

    const vertical = nextCorner.startsWith('top-')
      ? { top: '0', bottom: 'auto' }
      : { top: 'auto', bottom: '0' }
    const horizontal = nextCorner.endsWith('-left')
      ? { left: '0', right: 'auto' }
      : { left: 'auto', right: '0' }

    applyStyle(iframe, {
      ...vertical,
      ...horizontal,
      width: `${width}px`,
      height: `${height}px`,
    })
  }

  function revealFrame(): void {
    if (revealed) return
    revealed = true
    applyStyle(iframe, {
      visibility: 'visible',
      opacity: '1',
      'pointer-events': 'auto',
    })
  }

  function postToFrame(
    message: WidgetHostEnvMessage | VisitorTokenMessage | WidgetCommandMessage,
  ): void {
    iframe.contentWindow?.postMessage(message, widgetOrigin)
  }

  function sendHostEnv(): void {
    postToFrame({
      type: WIDGET_HOST_ENV_MESSAGE_TYPE,
      publicKey,
      hostOrigin: window.location.origin,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      corner,
      reducedMotion: prefersReducedMotion(),
    })
  }

  function destroy(): void {
    if (resizeTimer) clearTimeout(resizeTimer)
    iframe.removeEventListener('load', sendHostEnv)
    window.removeEventListener('message', onFrameMessage)
    window.removeEventListener('resize', onResize)
    window.removeEventListener('orientationchange', onResize)
    iframe.remove()
    delete window.SapAiWidget
  }

  function onFrameMessage(event: MessageEvent): void {
    if (event.origin !== widgetOrigin) return
    if (event.source !== iframe.contentWindow) return

    const data: unknown = event.data

    if (isWidgetLifecycleMessage(data)) {
      if (data.publicKey !== publicKey) return
      if (data.status === 'ready') {
        revealFrame()
        return
      }
      if (onErrorLoad) {
        revealFrame()
      } else {
        destroy()
      }
      return
    }

    if (isWidgetFrameMessage(data)) {
      const frame: WidgetFrameMessage = data
      if (frame.publicKey !== publicKey) return
      if (frame.corner !== corner) {
        corner = frame.corner
        writeCorner(publicKey, corner)
      }
      applyGeometry(
        frame.width,
        frame.height,
        frame.corner,
        frame.fullBleed || frame.dragging,
      )
      return
    }

    if (isVisitorTokenRequestMessage(data)) {
      if (data.publicKey !== publicKey) return
      tokenRequestHandler?.()
    }
  }

  function onResize(): void {
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = setTimeout(sendHostEnv, RESIZE_DEBOUNCE_MS)
  }

  function sendCommand(command: WidgetCommand): void {
    postToFrame({ type: WIDGET_COMMAND_MESSAGE_TYPE, publicKey, command })
  }

  applyGeometry(
    WIDGET_LAUNCHER_FRAME_SIZE,
    WIDGET_LAUNCHER_FRAME_SIZE,
    corner,
    false,
  )
  iframe.addEventListener('load', sendHostEnv)
  window.addEventListener('message', onFrameMessage)
  window.addEventListener('resize', onResize)
  window.addEventListener('orientationchange', onResize)

  mount(document.documentElement, iframe)

  window.SapAiWidget = {
    publicKey,
    setVisitorToken(token: string) {
      const trimmed = token.trim()
      if (!trimmed) return
      postToFrame({ type: VISITOR_TOKEN_MESSAGE_TYPE, token: trimmed })
    },
    onVisitorTokenRequest(handler: VisitorTokenRequestHandler) {
      tokenRequestHandler = handler
    },
    open() {
      sendCommand('open')
    },
    close() {
      sendCommand('close')
    },
    destroy,
  }
}

init()
