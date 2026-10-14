/**
 * Wire protocol shared by the widget document and the host-page loader.
 *
 * Intentionally dependency-free: the loader ships to third-party pages, so it
 * must not pull the app's API client or React code into its bundle.
 * Re-exported from `#/lib/widget` for the widget-side callers.
 */

/** Embed → loader: the size/anchor the widget wants its iframe to have. */
export const WIDGET_FRAME_MESSAGE_TYPE = 'sapai:widget-frame' as const

/** Loader → embed: everything the widget needs to know about the host page. */
export const WIDGET_HOST_ENV_MESSAGE_TYPE = 'sapai:host-env' as const

/** Host → embed postMessage type for a signed visitor JWT. */
export const VISITOR_TOKEN_MESSAGE_TYPE = 'sapai:visitor-token' as const

/** Embed → host: ask the parent page to mint and post a fresh visitor JWT. */
export const VISITOR_TOKEN_REQUEST_MESSAGE_TYPE =
  'sapai:visitor-token-request' as const

/** Host → embed: open or close the widget programmatically. */
export const WIDGET_COMMAND_MESSAGE_TYPE = 'sapai:widget-command' as const

/** Embed → loader: widget config load finished (success or failure). */
export const WIDGET_LIFECYCLE_MESSAGE_TYPE = 'sapai:widget-lifecycle' as const

const WIDGET_CORNERS = [
  'bottom-right',
  'bottom-left',
  'top-right',
  'top-left',
] as const

export type WidgetCorner = (typeof WIDGET_CORNERS)[number]

export function isWidgetCorner(value: unknown): value is WidgetCorner {
  return (
    typeof value === 'string' &&
    (WIDGET_CORNERS as readonly string[]).includes(value)
  )
}

/**
 * `opening` means "make the frame big, I have not animated yet"; `closing`
 * means "keep the frame big, I am animating out". The frame only shrinks once
 * the widget reports `closed`.
 */
export type WidgetFramePhase = 'closed' | 'opening' | 'open' | 'closing'

export type WidgetFrameMessage = {
  type: typeof WIDGET_FRAME_MESSAGE_TYPE
  publicKey: string
  phase: WidgetFramePhase
  width: number
  height: number
  corner: WidgetCorner
  /** Anchor to the full host viewport instead of a corner (drag, small screens). */
  fullBleed: boolean
  dragging: boolean
}

export type WidgetHostEnv = {
  hostOrigin: string
  viewportWidth: number
  viewportHeight: number
  corner: WidgetCorner
  reducedMotion: boolean
}

export type WidgetHostEnvMessage = WidgetHostEnv & {
  type: typeof WIDGET_HOST_ENV_MESSAGE_TYPE
  publicKey: string
}

export type VisitorTokenRequestMessage = {
  type: typeof VISITOR_TOKEN_REQUEST_MESSAGE_TYPE
  publicKey: string
}

export type VisitorTokenMessage = {
  type: typeof VISITOR_TOKEN_MESSAGE_TYPE
  token: string
}

export type WidgetCommand = 'open' | 'close'

export type WidgetCommandMessage = {
  type: typeof WIDGET_COMMAND_MESSAGE_TYPE
  publicKey: string
  command: WidgetCommand
}

export type WidgetLifecycleStatus = 'ready' | 'error'

export type WidgetLifecycleMessage = {
  type: typeof WIDGET_LIFECYCLE_MESSAGE_TYPE
  publicKey: string
  status: WidgetLifecycleStatus
}

/** Space the widget keeps between its panel/launcher and the viewport edge. */
export const WIDGET_EDGE_GAP = 16
/** Launcher badge is capped at 80px, plus the edge gap on both sides. */
export const WIDGET_LAUNCHER_FRAME_SIZE = 112
export const WIDGET_PANEL_WIDTH = 400
export const WIDGET_PANEL_EXPANDED_WIDTH = 720
export const WIDGET_PANEL_HEIGHT = 720
/** Below this the panel takes over the whole host viewport. */
export const WIDGET_FULL_BLEED_MAX_WIDTH = 480
export const WIDGET_FULL_BLEED_MAX_HEIGHT = 640

/** Path of the embed document, served from the widget's own origin. */
export function embedWidgetPath(publicKey: string): string {
  return `/embed/widget/${encodeURIComponent(publicKey)}`
}

export function isWidgetFrameMessage(
  value: unknown,
): value is WidgetFrameMessage {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    record.type === WIDGET_FRAME_MESSAGE_TYPE &&
    typeof record.publicKey === 'string' &&
    typeof record.width === 'number' &&
    typeof record.height === 'number' &&
    typeof record.fullBleed === 'boolean' &&
    typeof record.dragging === 'boolean' &&
    isWidgetCorner(record.corner)
  )
}

export function isWidgetHostEnvMessage(
  value: unknown,
): value is WidgetHostEnvMessage {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    record.type === WIDGET_HOST_ENV_MESSAGE_TYPE &&
    typeof record.publicKey === 'string' &&
    typeof record.hostOrigin === 'string' &&
    typeof record.viewportWidth === 'number' &&
    typeof record.viewportHeight === 'number' &&
    isWidgetCorner(record.corner) &&
    typeof record.reducedMotion === 'boolean'
  )
}

export function isWidgetCommandMessage(
  value: unknown,
): value is WidgetCommandMessage {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    record.type === WIDGET_COMMAND_MESSAGE_TYPE &&
    typeof record.publicKey === 'string' &&
    (record.command === 'open' || record.command === 'close')
  )
}

export function isVisitorTokenRequestMessage(
  value: unknown,
): value is VisitorTokenRequestMessage {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    record.type === VISITOR_TOKEN_REQUEST_MESSAGE_TYPE &&
    typeof record.publicKey === 'string'
  )
}

export function isWidgetLifecycleMessage(
  value: unknown,
): value is WidgetLifecycleMessage {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    record.type === WIDGET_LIFECYCLE_MESSAGE_TYPE &&
    typeof record.publicKey === 'string' &&
    (record.status === 'ready' || record.status === 'error')
  )
}
