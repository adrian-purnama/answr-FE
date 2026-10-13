import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
  type TransitionEvent,
} from 'react'
import {
  WidgetRuntimeProvider,
} from '#/components/widget/context/WidgetRuntimeContext'
import WidgetEmbedShell, {
  DefaultBadgeIcon,
} from '#/components/widget/WidgetEmbedShell'
import WidgetPanel from '#/components/widget/WidgetPanel'
import {
  usePublicWidgetLoad,
} from '#/components/widget/hooks/usePublicWidgetLoad'
import {
  usePublicWidgetSession,
  type ApplySessionFn,
} from '#/components/widget/hooks/usePublicWidgetSession'
import { useVisitorTokenBridge } from '#/components/widget/hooks/useVisitorTokenBridge'
import {
  WIDGET_FALLBACK_VIEWPORT,
  WIDGET_LAUNCHER_FRAME_SIZE,
  defaultLoginPrompt,
  isWidgetCommandMessage,
  isWidgetHostEnvMessage,
  normalizeChatSettings,
  normalizeHomeSettings,
  normalizeLoginPrompt,
  postWidgetFrame,
  readStoredWidgetCorner,
  recordPublicWidgetVisit,
  resolveWidgetHostOrigin,
  snapWidgetCorner,
  widgetAppAnchorClass,
  widgetGeometry,
  widgetPublicMediaPath,
  writeStoredWidgetCorner,
  type WidgetCorner,
  type WidgetFramePhase,
} from '#/lib/widget'
import { cn } from '#/lib/utils'

type WidgetAppProps = {
  /** Public embed key   widget loads all of its own config from the API. */
  publicKey: string
  className?: string
}

/** Matches the panel transition duration; guards a missed `transitionend`. */
const PANEL_EXIT_FALLBACK_MS = 400

/**
 * Self-contained embeddable widget environment.
 *
 * Owns every visual decision: its own dimensions (derived from the host
 * viewport the loader reports, never from the iframe's own viewport), its
 * corner, and its open/close animation. The host-page loader only applies the
 * frame size this component asks for, so the widget looks and behaves the same
 * in this app and inside any third-party page.
 */
export default function WidgetApp({ publicKey, className }: WidgetAppProps) {
  const { widget, error, loading } = usePublicWidgetLoad(publicKey)
  const [phase, setPhase] = useState<WidgetFramePhase>('closed')
  const [panelExpanded, setPanelExpanded] = useState(false)
  const [reserveExpandedWidth, setReserveExpandedWidth] = useState(false)
  const [corner, setCorner] = useState<WidgetCorner>(() =>
    readStoredWidgetCorner(publicKey),
  )
  const [viewport, setViewport] = useState<{ width: number; height: number }>(
    () => ({ ...WIDGET_FALLBACK_VIEWPORT }),
  )
  const [reducedMotion, setReducedMotion] = useState(false)
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null)
  const [hostDragging, setHostDragging] = useState(false)
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const widthReserveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    offsetX: number
    offsetY: number
    moved: boolean
  } | null>(null)

  const applySessionRef = useRef<ApplySessionFn>(() => {})
  const getSessionIdRef = useRef<() => string | null>(() => null)

  const hostOrigin = useMemo(() => resolveWidgetHostOrigin(), [])
  const open = phase !== 'closed'

  const {
    pendingVisitorToken,
    setPendingVisitorToken,
    bindVisitorToken,
    requestVisitorTokenRefresh,
    getUsableVisitorToken,
  } = useVisitorTokenBridge({
    publicKey,
    hostOrigin,
    getSessionId: () => getSessionIdRef.current(),
    applySession: (...args) => applySessionRef.current(...args),
  })

  const {
    session,
    sessionEpoch,
    applySession,
    getSessionId,
    ensureSession,
    startFreshChatSession,
    renewSession,
    markSessionEnded,
    handleExit,
  } = usePublicWidgetSession({
    publicKey,
    open,
    widgetReady: Boolean(widget),
    pendingVisitorToken,
    setPendingVisitorToken,
    bindVisitorToken,
    requestVisitorTokenRefresh,
    getUsableVisitorToken,
  })

  applySessionRef.current = applySession
  getSessionIdRef.current = getSessionId

  useEffect(() => {
    setPhase('closed')
    setPanelExpanded(false)
    setReserveExpandedWidth(false)
    if (widthReserveTimerRef.current) {
      clearTimeout(widthReserveTimerRef.current)
      widthReserveTimerRef.current = null
    }
    setCorner(readStoredWidgetCorner(publicKey))
    setDragPos(null)
    setHostDragging(false)
    dragRef.current = null
  }, [publicKey])

  useEffect(() => {
    if (!widget) return
    recordPublicWidgetVisit(publicKey)
  }, [widget, publicKey])

  // Standalone (not framed): the iframe viewport *is* the viewport.
  useEffect(() => {
    if (hostOrigin) return
    function sync() {
      setViewport({ width: window.innerWidth, height: window.innerHeight })
    }
    sync()
    setReducedMotion(
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    )
    window.addEventListener('resize', sync)
    return () => window.removeEventListener('resize', sync)
  }, [hostOrigin])

  // Framed: the loader tells us about the host page.
  useEffect(() => {
    if (!hostOrigin) return

    function onMessage(event: MessageEvent) {
      if (event.origin !== hostOrigin) return
      const data: unknown = event.data

      if (isWidgetHostEnvMessage(data)) {
        if (data.publicKey !== publicKey) return
        setViewport({
          width: data.viewportWidth,
          height: data.viewportHeight,
        })
        setReducedMotion(data.reducedMotion)
        setCorner(data.corner)
        return
      }

      if (isWidgetCommandMessage(data)) {
        if (data.publicKey !== publicKey) return
        if (data.command === 'open') setPhase((p) => (p === 'closed' ? 'opening' : p))
        else setPhase((p) => (p === 'closed' ? p : 'closing'))
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [hostOrigin, publicKey])

  const geometry = widgetGeometry({
    open,
    expanded: panelExpanded,
    reserveExpandedWidth,
    viewportWidth: viewport.width,
    viewportHeight: viewport.height,
  })

  // Tell the loader what box we need. Runs before the phase advance below so
  // the frame is already resizing when the enter animation starts.
  useEffect(() => {
    if (error) {
      postWidgetFrame({
        publicKey,
        phase: 'closed',
        width: 320,
        height: 148,
        corner,
        fullBleed: false,
        dragging: false,
      })
      return
    }

    if (hostDragging) {
      postWidgetFrame({
        publicKey,
        phase,
        width: viewport.width,
        height: viewport.height,
        corner,
        fullBleed: true,
        dragging: true,
      })
      return
    }

    postWidgetFrame({
      publicKey,
      phase,
      width: geometry.frameWidth,
      height: geometry.frameHeight,
      corner,
      fullBleed: geometry.fullBleed,
      dragging: false,
    })
  }, [
    publicKey,
    phase,
    corner,
    error,
    hostDragging,
    viewport.width,
    viewport.height,
    geometry.frameWidth,
    geometry.frameHeight,
    geometry.fullBleed,
  ])

  // Enter: let the frame grow first, then animate the panel in.
  useEffect(() => {
    if (phase !== 'opening') return
    if (reducedMotion) {
      setPhase('open')
      return
    }
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setPhase('open'))
    })
    return () => {
      cancelAnimationFrame(raf1)
      if (raf2) cancelAnimationFrame(raf2)
    }
  }, [phase, reducedMotion])

  // Exit: the frame must stay big until the panel has finished animating out.
  useEffect(() => {
    if (phase !== 'closing') return
    if (reducedMotion) {
      setPhase('closed')
      return
    }
    exitTimerRef.current = setTimeout(
      () => setPhase('closed'),
      PANEL_EXIT_FALLBACK_MS,
    )
    return () => {
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current)
        exitTimerRef.current = null
      }
    }
  }, [phase, reducedMotion])

  const releaseExpandedWidth = useCallback(() => {
    if (widthReserveTimerRef.current) {
      clearTimeout(widthReserveTimerRef.current)
      widthReserveTimerRef.current = null
    }
    setReserveExpandedWidth(false)
  }, [])

  useEffect(() => {
    return () => {
      if (widthReserveTimerRef.current) {
        clearTimeout(widthReserveTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (phase !== 'closed') return
    setPanelExpanded(false)
    releaseExpandedWidth()
  }, [phase, releaseExpandedWidth])

  const handleClose = useCallback(() => {
    setPhase((current) => (current === 'closed' ? current : 'closing'))
  }, [])

  const onExpandedChange = useCallback((expanded: boolean) => {
    setReserveExpandedWidth(true)
    setPanelExpanded(expanded)
    if (widthReserveTimerRef.current) {
      clearTimeout(widthReserveTimerRef.current)
    }
    widthReserveTimerRef.current = setTimeout(() => {
      widthReserveTimerRef.current = null
      setReserveExpandedWidth(false)
    }, PANEL_EXIT_FALLBACK_MS)
  }, [])

  const onPanelTransitionEnd = useCallback(
    (event: TransitionEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) return
      if (event.propertyName === 'width') {
        releaseExpandedWidth()
        return
      }
      if (event.propertyName !== 'opacity') return
      setPhase((current) => (current === 'closing' ? 'closed' : current))
    },
    [releaseExpandedWidth],
  )

  const onFabPointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0 || phase === 'opening' || phase === 'open') return
      const rect = event.currentTarget.getBoundingClientRect()
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
        moved: false,
      }
      event.currentTarget.setPointerCapture(event.pointerId)
      setHostDragging(true)
    },
    [open],
  )

  const onFabPointerMove = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      const drag = dragRef.current
      if (!drag || event.pointerId !== drag.pointerId) return
      const dx = event.clientX - drag.startX
      const dy = event.clientY - drag.startY
      if (!drag.moved && dx * dx + dy * dy < 64) return
      drag.moved = true
      setDragPos({
        x: event.clientX - drag.offsetX,
        y: event.clientY - drag.offsetY,
      })
    },
    [],
  )

  const onFabPointerUp = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      const drag = dragRef.current
      if (!drag || event.pointerId !== drag.pointerId) return
      dragRef.current = null
      setHostDragging(false)
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
      if (drag.moved) {
        const next = snapWidgetCorner(event.clientX, event.clientY)
        writeStoredWidgetCorner(publicKey, next)
        setCorner(next)
        setDragPos(null)
        return
      }
      setDragPos(null)
      setPhase('opening')
    },
    [publicKey],
  )

  // Hidden while the panel is on screen, but fades back in *during* the exit
  // transition so the launcher and panel cross-fade instead of queueing.
  const launcherHidden = phase === 'opening' || phase === 'open'

  if (loading) {
    return (
      <WidgetEmbedShell
        className={cn('sapai-widget-root', className)}
        loading
        corner={corner}
      />
    )
  }

  if (error || !widget) {
    return (
      <WidgetEmbedShell
        className={cn('sapai-widget-root', className)}
        error={error ?? 'Widget not found'}
        corner={corner}
      />
    )
  }

  const badgeImageUrl =
    widget.badgeImage?.trim()
      ? widgetPublicMediaPath(publicKey, widget.badgeImage.trim())
      : null
  const hasBadge = Boolean(badgeImageUrl)
  const dragging = Boolean(dragPos)
  const anchorClass = widgetAppAnchorClass(corner)
  const panelVisible = phase === 'open'
  // Grow/shrink from roughly launcher size so open/close reads as expand, not fade.
  const closedScale =
    geometry.panelWidth > 0
      ? Math.min(0.28, WIDGET_LAUNCHER_FRAME_SIZE / geometry.panelWidth)
      : 0.2

  return (
    <div
      className={cn(
        'sapai-widget-root relative h-full w-full overflow-hidden bg-transparent',
        className,
      )}
      style={{
        // Launcher-sized floor so the FAB is never clipped before the loader
        // has reported the host viewport.
        minWidth: WIDGET_LAUNCHER_FRAME_SIZE,
        minHeight: WIDGET_LAUNCHER_FRAME_SIZE,
      }}
    >
      {/* Launcher FAB   visible when closed */}
      <div
        className={cn(
          'z-20 transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none',
          dragging ? 'fixed' : cn('absolute', anchorClass),
          launcherHidden
            ? 'pointer-events-none scale-75 opacity-0'
            : 'pointer-events-auto scale-100 opacity-100',
          dragging && 'duration-0',
        )}
        style={
          dragPos
            ? { left: dragPos.x, top: dragPos.y, right: 'auto', bottom: 'auto' }
            : undefined
        }
      >
        <button
          type="button"
          onPointerDown={onFabPointerDown}
          onPointerMove={onFabPointerMove}
          onPointerUp={onFabPointerUp}
          onPointerCancel={onFabPointerUp}
          className={cn(
            'touch-none select-none transition hover:opacity-90',
            dragging ? 'cursor-grabbing' : 'cursor-grab',
            hasBadge
              ? 'flex max-h-20 max-w-20 items-center justify-center bg-transparent p-0'
              : 'flex size-14 items-center justify-center rounded-full bg-neutral-950 text-white shadow-lg hover:bg-neutral-800',
          )}
          aria-label="Open widget"
          tabIndex={launcherHidden ? -1 : 0}
        >
          {hasBadge ? (
            <img
              src={badgeImageUrl!}
              alt=""
              className="max-h-20 max-w-20 object-contain"
              draggable={false}
            />
          ) : (
            <DefaultBadgeIcon />
          )}
        </button>
      </div>

      {/* Panel   animates open/close; stays mounted for the exit transition */}
      <div
        className={cn(
          'absolute z-10 transition-[opacity,transform,width] duration-300 ease-out motion-reduce:transition-none',
          geometry.fullBleed ? 'inset-0 origin-center' : anchorClass,
          panelVisible
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0',
        )}
        style={{
          ...(geometry.fullBleed
            ? undefined
            : { width: geometry.panelWidth, height: geometry.panelHeight }),
          transform: panelVisible ? 'scale(1)' : `scale(${closedScale})`,
        }}
        onTransitionEnd={onPanelTransitionEnd}
        aria-hidden={!panelVisible}
      >
        <WidgetRuntimeProvider
          publicKey={publicKey}
          darkMode={widget.darkMode ?? false}
          expanded={panelExpanded}
          onExpandedChange={onExpandedChange}
          onClose={handleClose}
          onExit={handleExit}
          sessionId={session.id}
          endedSessionId={session.endedSessionId}
          sessionExpired={session.expired}
          sessionEpoch={sessionEpoch}
          renewSession={renewSession}
          ensureSession={ensureSession}
          startFreshChatSession={startFreshChatSession}
          markSessionEnded={markSessionEnded}
          requestVisitorTokenRefresh={requestVisitorTokenRefresh}
          accessMode={widget.accessMode ?? 'both'}
          loginPrompt={normalizeLoginPrompt(
            widget.loginPrompt ?? defaultLoginPrompt(),
          )}
          visitorAuthMode={session.visitorAuthMode}
          visitor={session.visitor}
          settings={{
            homeSettings: normalizeHomeSettings(widget.homeSettings),
            chatSettings: normalizeChatSettings(widget.chatSettings),
            faqSettings: widget.faqSettings,
            newsSettings: widget.newsSettings,
          }}
        >
          <WidgetPanel
            className={cn('h-full', geometry.fullBleed && 'rounded-none')}
          />
        </WidgetRuntimeProvider>
      </div>
    </div>
  )
}
