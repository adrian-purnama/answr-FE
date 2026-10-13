import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, Headset, Maximize2, Minimize2 } from 'lucide-react'
import type { Socket } from 'socket.io-client'
import WidgetChromeActions from '#/components/widget/WidgetChromeActions'
import { useWidgetRuntime } from '#/components/widget/context/WidgetRuntimeContext'
import {
  connectVisitorLiveAgentSocket,
  emitTicketTyping,
  joinTicketRoom,
  LIVE_AGENT_SOCKET_EVENTS,
} from '#/lib/liveAgentSocket'
import { cn } from '#/lib/utils'
import {
  listPublicLiveAgentTicketMessages,
  postPublicLiveAgentTicketMessage,
  submitPublicLiveAgentTicketRating,
  widgetPublicLiveAgentMediaPath,
  type PublicLiveAgentTicket,
  type PublicLiveAgentTicketMessage,
} from '#/lib/widget'

type LiveChatMessage = {
  id: string
  role: 'visitor' | 'agent' | 'system'
  text: string
}

type WidgetLiveAgentChatProps = {
  ticket: PublicLiveAgentTicket
  onTicketChange: (ticket: PublicLiveAgentTicket | null) => void
  darkMode?: boolean
  expanded: boolean
  onToggleExpanded: () => void
  onBack: () => void
  onThreadChange?: (info: { preview: string }) => void
}

function newId() {
  return `live_${Math.random().toString(36).slice(2, 10)}`
}

export default function WidgetLiveAgentChat({
  ticket,
  onTicketChange,
  darkMode = false,
  expanded,
  onToggleExpanded,
  onBack,
  onThreadChange,
}: WidgetLiveAgentChatProps) {
  const { publicKey, ensureSession, sessionExpired, chatLocked } =
    useWidgetRuntime()
  const [messages, setMessages] = useState<LiveChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [agentTyping, setAgentTyping] = useState(false)
  const [ratingStars, setRatingStars] = useState(0)
  const [ratingFeedback, setRatingFeedback] = useState('')
  const [ratingSubmitting, setRatingSubmitting] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const stickToBottomRef = useRef(true)
  const socketRef = useRef<Socket | null>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ticketRef = useRef(ticket)
  ticketRef.current = ticket

  const contactName = ticket.assignedAgentName?.trim() || 'Live Agent'
  const avatarUrl =
    publicKey &&
    ticket.status === 'claimed' &&
    ticket.assignedAgentProfilePicture?.trim()
      ? widgetPublicLiveAgentMediaPath(
          publicKey,
          ticket.assignedAgentProfilePicture.trim(),
        )
      : null
  const contactSubtitle =
    ticket.status === 'queued'
      ? 'Waiting for an agent'
      : ticket.status === 'claimed'
        ? agentTyping
          ? 'Typing…'
          : 'Online'
        : 'Conversation closed'

  const queueLine =
    ticket.status === 'queued'
      ? `You are #${ticket.queuePosition ?? '…'} in the queue`
      : null

  const appendMessages = useCallback((rows: PublicLiveAgentTicketMessage[]) => {
    setMessages((prev) => {
      const existing = new Set(prev.map((m) => m.id))
      const next = [...prev]
      for (const row of rows) {
        const id = row.id || newId()
        if (existing.has(id)) continue
        next.push({
          id,
          role:
            row.senderType === 'visitor'
              ? 'visitor'
              : row.senderType === 'agent'
                ? 'agent'
                : 'system',
          text: row.text,
        })
        existing.add(id)
      }
      return next
    })
  }, [])

  useEffect(() => {
    const last = [...messages].reverse().find((m) => m.text.trim())
    onThreadChange?.({ preview: last?.text.trim() || 'Live agent chat' })
  }, [messages, onThreadChange])

  useEffect(() => {
    if (!publicKey) return
    let cancelled = false

    async function load() {
      try {
        const sessionId = await ensureSession()
        const response = await listPublicLiveAgentTicketMessages(
          publicKey!,
          sessionId,
          ticket.id,
        )
        if (cancelled) return
        if (response.success && response.data) {
          appendMessages(response.data)
        }
      } catch {
        // ignore
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [appendMessages, ensureSession, publicKey, ticket.id])

  useEffect(() => {
    if (!publicKey || ticket.status === 'closed') {
      socketRef.current?.disconnect()
      socketRef.current = null
      return
    }

    let cancelled = false

    async function connect() {
      const sessionId = await ensureSession()
      if (cancelled) return
      socketRef.current?.disconnect()
      const socket = connectVisitorLiveAgentSocket({
        publicKey: publicKey!,
        sessionId,
      })
      socketRef.current = socket

      socket.on('connect', () => {
        joinTicketRoom(socket, ticket.id)
      })

      socket.on(LIVE_AGENT_SOCKET_EVENTS.QUEUE_POSITION, (payload: unknown) => {
        if (!payload || typeof payload !== 'object') return
        const raw = payload as { ticketId?: string; position?: number }
        if (raw.ticketId !== ticket.id || typeof raw.position !== 'number') return
        onTicketChange({ ...ticketRef.current, queuePosition: raw.position })
      })

      socket.on(LIVE_AGENT_SOCKET_EVENTS.TICKET_CLAIMED, (payload: unknown) => {
        if (!payload || typeof payload !== 'object') return
        const raw = payload as PublicLiveAgentTicket
        if (raw.id !== ticket.id) return
        onTicketChange({ ...ticketRef.current, ...raw })
      })

      socket.on(LIVE_AGENT_SOCKET_EVENTS.TICKET_CLOSED, (payload: unknown) => {
        if (!payload || typeof payload !== 'object') return
        const raw = payload as PublicLiveAgentTicket
        if (raw.id !== ticket.id) return
        onTicketChange({ ...ticketRef.current, ...raw })
      })

      socket.on(LIVE_AGENT_SOCKET_EVENTS.TICKET_MESSAGE, (payload: unknown) => {
        if (!payload || typeof payload !== 'object') return
        const raw = payload as PublicLiveAgentTicketMessage
        if (raw.ticketId !== ticket.id || !raw.text) return
        appendMessages([{ ...raw, id: raw.id || newId() }])
      })

      socket.on(LIVE_AGENT_SOCKET_EVENTS.TICKET_TYPING, (payload: unknown) => {
        if (!payload || typeof payload !== 'object') return
        const raw = payload as { senderType?: string; typing?: boolean }
        if (raw.senderType === 'agent') {
          setAgentTyping(Boolean(raw.typing))
        }
      })
    }

    void connect()

    return () => {
      cancelled = true
      socketRef.current?.disconnect()
      socketRef.current = null
    }
  }, [appendMessages, ensureSession, onTicketChange, publicKey, ticket.id, ticket.status])

  useEffect(() => {
    const el = scrollRef.current
    if (!el || !stickToBottomRef.current) return
    el.scrollTop = el.scrollHeight
  }, [messages, agentTyping])

  async function handleSend() {
    if (!publicKey || sending || sessionExpired || chatLocked) return
    if (ticket.status === 'closed') return
    const trimmed = draft.trim()
    if (!trimmed) return

    stickToBottomRef.current = true
    setDraft('')
    setSending(true)
    setError(null)
    try {
      const sessionId = await ensureSession()
      if (socketRef.current) {
        emitTicketTyping(socketRef.current, ticket.id, false)
      }
      const response = await postPublicLiveAgentTicketMessage(
        publicKey,
        sessionId,
        ticket.id,
        trimmed,
      )
      if (!response.success || !response.data) {
        setError(response.message || 'Failed to send message')
        return
      }
      appendMessages([response.data])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  async function submitRating() {
    if (!publicKey || ratingStars < 1 || ratingSubmitting) return
    setRatingSubmitting(true)
    try {
      const sessionId = await ensureSession()
      const response = await submitPublicLiveAgentTicketRating(
        publicKey,
        sessionId,
        ticket.id,
        { stars: ratingStars, feedback: ratingFeedback },
      )
      if (!response.success || !response.data) {
        setError(response.message || 'Failed to submit rating')
        return
      }
      onTicketChange(response.data.rating ? null : response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit rating')
    } finally {
      setRatingSubmitting(false)
    }
  }

  const needsRating = ticket.status === 'closed' && !ticket.rating
  const inputDisabled =
    chatLocked || sessionExpired || sending || ticket.status === 'closed'

  const chromeBtn = cn(
    'flex size-8 items-center justify-center rounded-full transition',
    darkMode
      ? 'text-neutral-300 hover:bg-white/10 hover:text-white'
      : 'text-neutral-600 hover:bg-black/5 hover:text-neutral-900',
  )

  return (
    <div
      className={cn(
        'flex h-full min-h-0 min-w-0 w-full flex-col overflow-x-hidden',
        darkMode ? 'bg-neutral-950 text-neutral-50' : 'bg-white text-neutral-900',
      )}
    >
      <div
        className={cn(
          'flex shrink-0 items-center gap-2 border-b px-3 py-2.5',
          darkMode ? 'border-white/10' : 'border-neutral-200',
        )}
      >
        <button type="button" className={chromeBtn} onClick={onBack} aria-label="Back">
          <ArrowLeft className="size-4" />
        </button>
        <div
          className={cn(
            'flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full',
            darkMode ? 'bg-sky-900' : 'bg-sky-100',
          )}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <Headset
              className={cn(
                'size-4',
                darkMode ? 'text-sky-100' : 'text-sky-800',
              )}
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{contactName}</p>
          <p
            className={cn(
              'truncate text-[11px]',
              darkMode ? 'text-neutral-400' : 'text-neutral-500',
            )}
          >
            {contactSubtitle}
          </p>
        </div>
        <button
          type="button"
          className={chromeBtn}
          onClick={onToggleExpanded}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? (
            <Minimize2 className="size-4" />
          ) : (
            <Maximize2 className="size-4" />
          )}
        </button>
        <WidgetChromeActions />
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 min-w-0 flex-1 space-y-3 overflow-x-hidden overflow-y-auto px-4 py-4"
        onScroll={(e) => {
          const el = e.currentTarget
          const distanceFromBottom =
            el.scrollHeight - el.scrollTop - el.clientHeight
          stickToBottomRef.current = distanceFromBottom < 80
        }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex flex-col',
              message.role === 'visitor'
                ? 'items-end'
                : message.role === 'system'
                  ? 'items-center'
                  : 'items-start',
            )}
          >
            <div
              className={cn(
                'max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed wrap-break-word',
                message.role === 'visitor'
                  ? darkMode
                    ? 'bg-white text-neutral-950'
                    : 'bg-neutral-900 text-white'
                  : message.role === 'system'
                    ? darkMode
                      ? 'bg-transparent text-neutral-400'
                      : 'bg-transparent text-neutral-500'
                    : darkMode
                      ? 'bg-sky-950 text-sky-50'
                      : 'bg-sky-50 text-sky-950',
              )}
            >
              {message.text}
            </div>
            {message.role === 'agent' ? (
              <p
                className={cn(
                  'mt-1 px-1 text-[10px]',
                  darkMode ? 'text-neutral-500' : 'text-neutral-400',
                )}
              >
                {contactName}
              </p>
            ) : null}
          </div>
        ))}

        {queueLine ? (
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'max-w-[85%] px-3 py-1 text-center text-xs leading-relaxed',
                darkMode ? 'text-neutral-400' : 'text-neutral-500',
              )}
            >
              {queueLine}
            </div>
          </div>
        ) : null}

        {needsRating ? (
          <div
            className={cn(
              'rounded-2xl border p-3 space-y-2',
              darkMode ? 'border-white/10' : 'border-neutral-200',
            )}
          >
            <p className="text-xs font-medium">Rate this conversation</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={cn(
                    'size-8 rounded text-sm font-semibold',
                    ratingStars >= star
                      ? 'bg-amber-400 text-amber-950'
                      : darkMode
                        ? 'bg-neutral-800 text-neutral-300'
                        : 'bg-neutral-100 text-neutral-500',
                  )}
                  onClick={() => setRatingStars(star)}
                >
                  {star}
                </button>
              ))}
            </div>
            <textarea
              value={ratingFeedback}
              onChange={(e) => setRatingFeedback(e.target.value)}
              placeholder="Optional feedback"
              rows={2}
              className={cn(
                'w-full rounded-lg border px-2 py-1.5 text-xs outline-none',
                darkMode
                  ? 'border-white/10 bg-neutral-900 text-neutral-50'
                  : 'border-neutral-200 bg-white text-neutral-900',
              )}
            />
            <button
              type="button"
              disabled={ratingStars < 1 || ratingSubmitting}
              onClick={() => void submitRating()}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium',
                darkMode
                  ? 'bg-white text-neutral-950'
                  : 'bg-neutral-900 text-white',
                'disabled:opacity-50',
              )}
            >
              {ratingSubmitting ? 'Submitting…' : 'Submit rating'}
            </button>
          </div>
        ) : null}
      </div>

      <div className="shrink-0 px-3 pb-3">
        {error ? (
          <p
            className={cn(
              'mb-2 text-center text-[11px]',
              darkMode ? 'text-red-300' : 'text-red-600',
            )}
          >
            {error}
          </p>
        ) : null}
        {!needsRating ? (
          <div
            className={cn(
              'flex items-end gap-2 rounded-full border px-3 py-1.5',
              darkMode ? 'border-white/10 bg-neutral-900' : 'border-neutral-200 bg-white',
            )}
          >
            <textarea
              value={draft}
              disabled={inputDisabled}
              rows={1}
              placeholder={
                ticket.status === 'queued'
                  ? 'Message while you wait…'
                  : 'Message the live agent'
              }
              onChange={(e) => {
                setDraft(e.target.value)
                if (!socketRef.current || ticket.status === 'closed') return
                emitTicketTyping(socketRef.current, ticket.id, true)
                if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
                typingTimerRef.current = setTimeout(() => {
                  if (socketRef.current) {
                    emitTicketTyping(socketRef.current, ticket.id, false)
                  }
                }, 1200)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void handleSend()
                }
              }}
              className={cn(
                'sleek-scroll field-sizing-content max-h-32 min-h-8 min-w-0 flex-1 resize-none overflow-y-auto bg-transparent py-1.5 text-xs leading-5 outline-none',
                darkMode
                  ? 'text-neutral-50 placeholder:text-neutral-500'
                  : 'text-neutral-900 placeholder:text-neutral-400',
              )}
            />
            <button
              type="button"
              disabled={inputDisabled || !draft.trim()}
              onClick={() => void handleSend()}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium',
                darkMode
                  ? 'bg-white text-neutral-950'
                  : 'bg-neutral-900 text-white',
                'disabled:opacity-40',
              )}
            >
              Send
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
