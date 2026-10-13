import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  CircleDot,
  Clock3,
  Hand,
  Headset,
  IdCard,
  Inbox,
  LogOut,
  PanelRightOpen,
  Send,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import type { Socket } from 'socket.io-client'
import AgentMessageBody from '#/components/agentChat/AgentMessageBody'
import SideDrawer from '#/components/ui/SideDrawer'
import {
  buttonClassName,
  buttonOutlineClassName,
  cardClassName,
  hintClassName,
} from '#/lib/ui-classes'
import {
  claimAgentTicket,
  clearAgentToken,
  closeAgentTicket,
  getAgentTicket,
  listAgentTicketMessages,
  listAgentTickets,
  postAgentTicketMessage,
  type LiveAgentMe,
  type LiveAgentTicket,
  type LiveAgentTicketMessage,
  type LiveAgentTicketStatus,
} from '#/lib/liveAgent'
import {
  connectAgentLiveAgentSocket,
  emitTicketTyping,
  joinTicketRoom,
  LIVE_AGENT_SOCKET_EVENTS,
} from '#/lib/liveAgentSocket'
import { cn } from '#/lib/utils'

type LiveAgentDashboardProps = {
  agent: LiveAgentMe
}

type StatusFilter = LiveAgentTicketStatus | 'all'

type TicketCounts = {
  queued: number
  claimed: number
  closed: number
}

const EMPTY_COUNTS: TicketCounts = { queued: 0, claimed: 0, closed: 0 }

function waitingLabel(queuedAt: string): string {
  const ms = Date.now() - new Date(queuedAt).getTime()
  const minutes = Math.max(0, Math.floor(ms / 60000))
  if (minutes < 1) return '<1m'
  if (minutes < 60) return `${minutes}m`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

function formatMessageTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function statusBadgeClass(status: LiveAgentTicketStatus): string {
  if (status === 'queued') {
    return 'border-[var(--ink)]/20 bg-[var(--surface)] text-[var(--ink)]'
  }
  if (status === 'claimed') {
    return 'border-[var(--ink)] bg-[var(--ink)] text-white'
  }
  return 'border-[var(--line)] bg-white text-[var(--muted)]'
}

function StatusIcon({ status }: { status: LiveAgentTicketStatus }) {
  if (status === 'queued') {
    return <Clock3 className="size-3" aria-hidden />
  }
  if (status === 'claimed') {
    return <CheckCircle2 className="size-3" aria-hidden />
  }
  return <XCircle className="size-3" aria-hidden />
}

function countForFilter(counts: TicketCounts, status: StatusFilter): number {
  if (status === 'all') {
    return counts.queued + counts.claimed + counts.closed
  }
  return counts[status]
}

function formatClaimValue(value: unknown): string {
  if (value == null) return '—'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

const noopLiveAgentImageRenderer = () => null

export default function LiveAgentDashboard({ agent }: LiveAgentDashboardProps) {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState<LiveAgentTicket[]>([])
  const [counts, setCounts] = useState<TicketCounts>(EMPTY_COUNTS)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('queued')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selected, setSelected] = useState<LiveAgentTicket | null>(null)
  const [messages, setMessages] = useState<LiveAgentTicketMessage[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [visitorTyping, setVisitorTyping] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const stickToBottomRef = useRef(true)

  const loadTickets = useCallback(async () => {
    const statuses: LiveAgentTicketStatus[] = ['queued', 'claimed', 'closed']
    const [listResponse, ...countResponses] = await Promise.all([
      listAgentTickets(statusFilter),
      ...statuses.map((status) =>
        status === statusFilter && statusFilter !== 'all'
          ? Promise.resolve(null)
          : listAgentTickets(status),
      ),
    ])

    if (!listResponse.success || !listResponse.data) {
      setError(listResponse.message || 'Failed to load tickets')
      return
    }
    setTickets(listResponse.data)

    const next: TicketCounts = { ...EMPTY_COUNTS }
    statuses.forEach((status, index) => {
      if (status === statusFilter && statusFilter !== 'all') {
        next[status] = listResponse.data!.length
        return
      }
      const response = countResponses[index]
      next[status] =
        response && response.success && response.data ? response.data.length : 0
    })
    setCounts(next)
  }, [statusFilter])

  const openTicket = useCallback(async (ticketId: string) => {
    setSelectedId(ticketId)
    setSelected(null)
    setMessages([])
    setError(null)
    setVisitorTyping(false)
    setDetailsOpen(false)
    stickToBottomRef.current = true
    const [ticketResponse, messagesResponse] = await Promise.all([
      getAgentTicket(ticketId),
      listAgentTicketMessages(ticketId),
    ])
    if (!ticketResponse.success || !ticketResponse.data) {
      setError(ticketResponse.message || 'Failed to load ticket')
      setSelectedId(null)
      return
    }
    setSelected(ticketResponse.data)
    if (messagesResponse.success && messagesResponse.data) {
      setMessages(messagesResponse.data)
    } else {
      setMessages([])
    }
    if (socketRef.current) {
      joinTicketRoom(socketRef.current, ticketId)
    }
  }, [])

  const closeChatView = useCallback(() => {
    setSelectedId(null)
    setSelected(null)
    setMessages([])
    setDraft('')
    setVisitorTyping(false)
    setDetailsOpen(false)
    setError(null)
  }, [])

  useEffect(() => {
    const socket = connectAgentLiveAgentSocket()
    socketRef.current = socket

    const refresh = () => {
      void loadTickets()
    }

    socket.on(LIVE_AGENT_SOCKET_EVENTS.QUEUE_UPDATED, refresh)
    socket.on(LIVE_AGENT_SOCKET_EVENTS.TICKET_CREATED, refresh)
    socket.on(LIVE_AGENT_SOCKET_EVENTS.TICKET_CLAIMED, (payload: unknown) => {
      refresh()
      if (!payload || typeof payload !== 'object') return
      const ticket = payload as LiveAgentTicket
      setSelected((prev) => (prev?.id === ticket.id ? { ...prev, ...ticket } : prev))
    })
    socket.on(LIVE_AGENT_SOCKET_EVENTS.TICKET_CLOSED, (payload: unknown) => {
      refresh()
      if (!payload || typeof payload !== 'object') return
      const ticket = payload as LiveAgentTicket
      setSelected((prev) => (prev?.id === ticket.id ? { ...prev, ...ticket } : prev))
    })
    socket.on(LIVE_AGENT_SOCKET_EVENTS.TICKET_MESSAGE, (payload: unknown) => {
      if (!payload || typeof payload !== 'object') return
      const message = payload as LiveAgentTicketMessage
      setMessages((prev) => {
        if (!selectedId || message.ticketId !== selectedId) return prev
        if (prev.some((row) => row.id === message.id)) return prev
        return [...prev, message]
      })
      void loadTickets()
    })
    socket.on(LIVE_AGENT_SOCKET_EVENTS.TICKET_TYPING, (payload: unknown) => {
      if (!payload || typeof payload !== 'object') return
      const raw = payload as {
        ticketId?: string
        senderType?: string
        typing?: boolean
      }
      if (raw.ticketId !== selectedId || raw.senderType !== 'visitor') return
      setVisitorTyping(Boolean(raw.typing))
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [loadTickets, selectedId])

  useEffect(() => {
    let cancelled = false
    async function boot() {
      setLoading(true)
      try {
        await loadTickets()
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void boot()
    return () => {
      cancelled = true
    }
  }, [loadTickets])

  useEffect(() => {
    const el = scrollRef.current
    if (!el || !stickToBottomRef.current) return
    el.scrollTop = el.scrollHeight
  }, [messages, visitorTyping, selectedId])

  async function handleLogout() {
    clearAgentToken()
    socketRef.current?.disconnect()
    await navigate({ to: '/liveagent/login' })
  }

  async function handleClaim(ticketId: string) {
    setBusy(true)
    setError(null)
    try {
      const response = await claimAgentTicket(ticketId)
      if (!response.success || !response.data) {
        setError(response.message || 'Failed to claim ticket')
        await loadTickets()
        return
      }
      await loadTickets()
      await openTicket(ticketId)
    } finally {
      setBusy(false)
    }
  }

  async function handleSend() {
    if (!selectedId || !draft.trim() || busy) return
    setBusy(true)
    try {
      if (socketRef.current) {
        emitTicketTyping(socketRef.current, selectedId, false)
      }
      const response = await postAgentTicketMessage(selectedId, draft.trim())
      if (!response.success || !response.data) {
        setError(response.message || 'Failed to send message')
        return
      }
      setDraft('')
      stickToBottomRef.current = true
      setMessages((prev) =>
        prev.some((row) => row.id === response.data!.id)
          ? prev
          : [...prev, response.data!],
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleClose() {
    if (!selectedId || busy) return
    setBusy(true)
    try {
      const response = await closeAgentTicket(selectedId)
      if (!response.success || !response.data) {
        setError(response.message || 'Failed to close ticket')
        return
      }
      setSelected(response.data)
      await loadTickets()
    } finally {
      setBusy(false)
    }
  }

  const canMessage =
    selected?.status === 'claimed' && selected.assignedAgentId != null

  const visitorClaimEntries = useMemo(() => {
    if (!selected?.visitorClaims) return []
    return Object.entries(selected.visitorClaims).filter(
      ([key]) => key.trim().length > 0,
    )
  }, [selected?.visitorClaims])

  const filterOptions: StatusFilter[] = ['queued', 'claimed', 'closed', 'all']
  const showChatPane = Boolean(selectedId)
  const showListPane = !selectedId

  const filterTabs = (
    <div className="flex shrink-0 flex-wrap gap-2">
      {filterOptions.map((status) => {
        const count = countForFilter(counts, status)
        const active = statusFilter === status
        return (
          <button
            key={status}
            type="button"
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition',
              active
                ? 'border-[var(--ink)] bg-[var(--ink)] text-white'
                : 'border-[var(--line)] bg-white text-[var(--ink)] hover:bg-[var(--surface)]',
            )}
            onClick={() => setStatusFilter(status)}
          >
            {status === 'queued' ? (
              <Clock3 className="size-3.5" aria-hidden />
            ) : status === 'claimed' ? (
              <CheckCircle2 className="size-3.5" aria-hidden />
            ) : status === 'closed' ? (
              <XCircle className="size-3.5" aria-hidden />
            ) : (
              <Inbox className="size-3.5" aria-hidden />
            )}
            {status}
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] tabular-nums',
                active
                  ? 'bg-white/15 text-white'
                  : 'bg-[var(--surface)] text-[var(--muted)]',
              )}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )

  const ticketList = (
    <div
      className={cn(
        cardClassName,
        'flex min-h-0 flex-1 flex-col overflow-hidden',
      )}
    >
      {loading ? (
        <p className={cn(hintClassName, 'p-8')}>Loading tickets…</p>
      ) : tickets.length === 0 ? (
        <div className="flex flex-1 flex-col items-start justify-center gap-3 p-8">
          <Headset className="size-8 text-[var(--muted)]" aria-hidden />
          <div>
            <p className="text-base font-medium">No tickets yet</p>
            <p className={cn(hintClassName, 'mt-1')}>
              Incoming helpdesk tickets will appear here.
            </p>
          </div>
        </div>
      ) : (
        <ul className="min-h-0 flex-1 divide-y divide-[var(--line)] overflow-y-auto">
          {tickets.map((ticket) => {
            const active = ticket.id === selectedId
            return (
              <li key={ticket.id} className="flex items-stretch gap-0">
                <button
                  type="button"
                  className={cn(
                    'flex min-w-0 flex-1 flex-col gap-1.5 px-4 py-3.5 text-left transition',
                    active
                      ? 'bg-[var(--surface)]'
                      : 'hover:bg-[var(--surface)]',
                  )}
                  onClick={() => void openTicket(ticket.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-[var(--ink)]">
                      {ticket.visitorSub || 'Anonymous visitor'}
                    </span>
                    <span
                      className={cn(
                        'inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize',
                        statusBadgeClass(ticket.status),
                      )}
                    >
                      <StatusIcon status={ticket.status} />
                      {ticket.status}
                    </span>
                  </div>
                  <p className="truncate text-xs text-[var(--muted)]">
                    {ticket.latestMessagePreview || 'No messages yet'}
                  </p>
                  <p className="text-[11px] text-[var(--muted)]">
                    Waiting {waitingLabel(ticket.queuedAt)}
                    {ticket.queuePosition ? ` · #${ticket.queuePosition}` : ''}
                    {ticket.assignedAgentName
                      ? ` · ${ticket.assignedAgentName}`
                      : ''}
                  </p>
                </button>
                {ticket.status === 'queued' ? (
                  <div className="flex items-center pr-3">
                    <button
                      type="button"
                      className={cn(
                        buttonClassName,
                        'inline-flex h-8 items-center gap-1 px-3 text-xs',
                      )}
                      disabled={busy}
                      onClick={(event) => {
                        event.stopPropagation()
                        void handleClaim(ticket.id)
                      }}
                    >
                      <Hand className="size-3.5" aria-hidden />
                      Claim
                    </button>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )

  const hasDetails =
    Boolean(selected) &&
    (visitorClaimEntries.length > 0 ||
      selected?.visitorAuthMode === 'authenticated' ||
      (selected?.aiContext?.length ?? 0) > 0)

  const conversationPane = (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
      <div className="flex shrink-0 items-center gap-2 border-b border-[var(--line)] px-4 py-3">
        <button
          type="button"
          className="inline-flex size-9 items-center justify-center rounded-full text-[var(--ink)] transition hover:bg-[var(--surface)] md:hidden"
          onClick={closeChatView}
          aria-label="Back to queue"
        >
          <ArrowLeft className="size-4" aria-hidden />
        </button>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--ink)]">
          <Headset className="size-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--ink)]">
            {selected?.visitorSub || 'Anonymous visitor'}
          </p>
          {selected ? (
            <p className={cn(hintClassName, 'flex flex-wrap items-center gap-1.5 truncate text-[11px]')}>
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium capitalize',
                  statusBadgeClass(selected.status),
                )}
              >
                <StatusIcon status={selected.status} />
                {selected.status}
              </span>
              {selected.visitorAuthMode === 'authenticated' ? (
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="size-3" aria-hidden />
                  authenticated
                </span>
              ) : (
                <span>anonymous</span>
              )}
              <span>· session {selected.chatSessionId.slice(-6)}</span>
              {selected.assignedAgentName ? (
                <span>· {selected.assignedAgentName}</span>
              ) : null}
            </p>
          ) : (
            <p className={cn(hintClassName, 'text-[11px]')}>Loading ticket…</p>
          )}
        </div>
        {hasDetails ? (
          <button
            type="button"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[var(--ink)] transition hover:bg-[var(--surface)]"
            onClick={() => setDetailsOpen(true)}
            aria-label="Open visitor details"
            title="Visitor details"
          >
            <PanelRightOpen className="size-4" aria-hidden />
          </button>
        ) : null}
        {selected?.status === 'claimed' ? (
          <button
            type="button"
            className={cn(
              buttonOutlineClassName,
              'inline-flex h-8 shrink-0 items-center gap-1.5 px-2.5 text-xs',
            )}
            disabled={busy}
            onClick={() => void handleClose()}
          >
            <XCircle className="size-3.5" aria-hidden />
            Close
          </button>
        ) : null}
        {selected?.status === 'queued' ? (
          <button
            type="button"
            className={cn(
              buttonClassName,
              'inline-flex h-8 shrink-0 items-center gap-1.5 px-2.5 text-xs',
            )}
            disabled={busy || !selectedId}
            onClick={() => {
              if (selectedId) void handleClaim(selectedId)
            }}
          >
            <Hand className="size-3.5" aria-hidden />
            Claim
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="shrink-0 border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-4"
        onScroll={(event) => {
          const el = event.currentTarget
          const distanceFromBottom =
            el.scrollHeight - el.scrollTop - el.clientHeight
          stickToBottomRef.current = distanceFromBottom < 80
        }}
      >
        <div className="mx-auto flex w-full max-w-lg flex-col gap-3">
          {!selected ? (
            <p className={cn(hintClassName, 'py-8 text-center text-sm')}>
              Loading conversation…
            </p>
          ) : messages.length === 0 ? (
            <p className={cn(hintClassName, 'py-8 text-center text-sm')}>
              No messages yet. Say hello when you are ready.
            </p>
          ) : null}

          {messages.map((message) => {
            const isAgent = message.senderType === 'agent'
            const isVisitor = message.senderType === 'visitor'
            const isSystem = message.senderType === 'system'
            return (
              <div
                key={message.id}
                className={cn(
                  'flex flex-col',
                  isAgent
                    ? 'items-end'
                    : isSystem
                      ? 'items-center'
                      : 'items-start',
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed wrap-break-word',
                    isAgent && 'bg-[var(--ink)] text-white',
                    isVisitor &&
                      'border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)]',
                    isSystem &&
                      'max-w-full bg-transparent px-2 py-1 text-center text-xs text-[var(--muted)]',
                  )}
                >
                  {isAgent ? (
                    <div className="prose-invert">
                      <AgentMessageBody
                        text={message.text}
                        streaming={false}
                        darkMode
                        renderImage={noopLiveAgentImageRenderer}
                      />
                    </div>
                  ) : (
                    message.text
                  )}
                </div>
                {!isSystem ? (
                  <p className="mt-1 px-1 text-[10px] text-[var(--muted)]">
                    {isAgent ? 'You' : 'Visitor'}
                    {message.createdAt
                      ? ` · ${formatMessageTime(message.createdAt)}`
                      : ''}
                  </p>
                ) : null}
              </div>
            )
          })}

          {visitorTyping ? (
            <div className="flex items-start">
              <p className="inline-flex items-center gap-1.5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2 text-xs text-[var(--muted)]">
                <CircleDot className="size-3 animate-pulse" aria-hidden />
                Visitor is typing…
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {canMessage ? (
        <div className="shrink-0 border-t border-[var(--line)] bg-white px-4 py-3">
          <div className="mx-auto flex w-full max-w-lg items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)]/40 px-3 py-2">
            <input
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
              value={draft}
              placeholder="Message the visitor"
              onChange={(event) => {
                setDraft(event.target.value)
                if (!selectedId || !socketRef.current) return
                emitTicketTyping(socketRef.current, selectedId, true)
                if (typingTimerRef.current) {
                  clearTimeout(typingTimerRef.current)
                }
                typingTimerRef.current = setTimeout(() => {
                  if (socketRef.current && selectedId) {
                    emitTicketTyping(socketRef.current, selectedId, false)
                  }
                }, 1200)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  void handleSend()
                }
              }}
            />
            <button
              type="button"
              className={cn(
                buttonClassName,
                'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs',
              )}
              disabled={busy || !draft.trim()}
              onClick={() => void handleSend()}
            >
              <Send className="size-3.5" aria-hidden />
              Send
            </button>
          </div>
        </div>
      ) : selectedId ? (
        <div className="shrink-0 border-t border-[var(--line)] px-4 py-3">
          <p className={cn(hintClassName, 'mx-auto max-w-lg text-center text-xs')}>
            {!selected
              ? 'Loading…'
              : selected.status === 'queued'
                ? 'Claim this ticket to reply.'
                : 'This conversation is closed.'}
          </p>
        </div>
      ) : null}
    </div>
  )

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--line)] bg-white px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--ink)]">
            <Headset className="size-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className={hintClassName}>Live agent desk</p>
            <h1 className="truncate text-lg font-medium text-[var(--ink)] sm:text-xl">
              {agent.name}
            </h1>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--ink)]"
          onClick={() => void handleLogout()}
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="size-4" aria-hidden />
        </button>
      </div>

      {error && !selectedId ? (
        <p className="shrink-0 border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600 sm:px-6">
          {error}
        </p>
      ) : null}

      <div className="flex min-h-0 flex-1">
        <aside
          className={cn(
            'min-h-0 w-full flex-col border-[var(--line)] bg-[var(--paper)] md:flex md:w-[22rem] md:shrink-0 md:border-r lg:w-96',
            showListPane ? 'flex' : 'hidden',
            showChatPane && 'md:flex',
          )}
        >
          <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
            {filterTabs}
            {ticketList}
          </div>
        </aside>

        <section
          className={cn(
            'min-h-0 min-w-0 flex-1 flex-col',
            showChatPane ? 'flex' : 'hidden md:flex',
          )}
        >
          {showChatPane ? (
            conversationPane
          ) : (
            <div className="hidden h-full flex-1 flex-col items-center justify-center gap-3 bg-white p-8 text-center md:flex">
              <div className="flex size-14 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--ink)]">
                <Inbox className="size-7" aria-hidden />
              </div>
              <p className="text-base font-medium text-[var(--ink)]">
                Select a ticket
              </p>
              <p className={cn(hintClassName, 'max-w-xs')}>
                Pick a conversation from the queue to chat with the visitor.
              </p>
            </div>
          )}
        </section>
      </div>

      <SideDrawer
        open={detailsOpen && Boolean(selected)}
        onClose={() => setDetailsOpen(false)}
        label="Visitor details"
        size="md"
        statusLabel={
          selected ? (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize',
                statusBadgeClass(selected.status),
              )}
            >
              <StatusIcon status={selected.status} />
              {selected.status}
            </span>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-8">
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-[var(--muted)]">
                <IdCard className="size-4" aria-hidden />
                <h2 className="text-sm font-semibold text-[var(--ink)]">
                  Visitor claims
                </h2>
              </div>
              {visitorClaimEntries.length > 0 ? (
                <dl className="space-y-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3">
                  {visitorClaimEntries.map(([key, value]) => (
                    <div
                      key={key}
                      className="grid grid-cols-[minmax(0,8rem)_1fr] gap-2 text-sm"
                    >
                      <dt className="truncate font-medium text-[var(--ink)]">
                        {key}
                      </dt>
                      <dd className="min-w-0 wrap-break-word text-[var(--muted)]">
                        {formatClaimValue(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className={cn(hintClassName, 'text-sm')}>
                  {selected.visitorAuthMode === 'authenticated'
                    ? `Authenticated${selected.visitorSub ? ` as ${selected.visitorSub}` : ''} — no extra JWT claims on this session.`
                    : 'Anonymous visitor — no JWT claims.'}
                </p>
              )}
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2 text-[var(--muted)]">
                <Bot className="size-4" aria-hidden />
                <h2 className="text-sm font-semibold text-[var(--ink)]">
                  Earlier with AI
                  {selected.aiContext?.length
                    ? ` (${selected.aiContext.length})`
                    : ''}
                </h2>
              </div>
              {selected.aiContext && selected.aiContext.length > 0 ? (
                <ul className="space-y-2.5">
                  {selected.aiContext.map((turn, index) => {
                    const isVisitorTurn = turn.role === 'user'
                    return (
                      <li
                        key={`${turn.createdAt}-${index}`}
                        className={cn(
                          'flex flex-col',
                          isVisitorTurn ? 'items-start' : 'items-end',
                        )}
                      >
                        <div
                          className={cn(
                            'max-w-[90%] rounded-2xl px-3 py-2 text-xs leading-relaxed wrap-break-word',
                            isVisitorTurn
                              ? 'border border-[var(--line)] bg-white text-[var(--ink)]'
                              : 'bg-[var(--ink)] text-white',
                          )}
                        >
                          {isVisitorTurn ? (
                            turn.text
                          ) : (
                            <AgentMessageBody
                              text={turn.text}
                              streaming={false}
                              darkMode
                              renderImage={noopLiveAgentImageRenderer}
                            />
                          )}
                        </div>
                        <p className="mt-1 px-1 text-[10px] text-[var(--muted)]">
                          {isVisitorTurn ? 'Visitor' : 'AI'}
                        </p>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className={cn(hintClassName, 'text-sm')}>
                  No prior AI conversation on this ticket.
                </p>
              )}
            </section>
          </div>
        ) : null}
      </SideDrawer>
    </div>
  )
}
