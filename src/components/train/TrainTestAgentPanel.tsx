import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import {
  BookOpen,
  Bot,
  ChevronDown,
  FileText,
  FunctionSquare,
  LogOut,
  MessageSquare,
  MessagesSquare,
  PanelRightClose,
  PanelRightOpen,
  Tags,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import AgentChatThread from '#/components/agentChat/AgentChatThread'
import { createAuthImageRenderer } from '#/components/agentChat/AgentMessageBody'
import { useAgentChatThread } from '#/components/agentChat/useAgentChatThread'
import { useAuth } from '#/context/authContext'
import {
  influenceVisibleSourceCount,
  mergeInfluences,
  streamTestAgentChat,
  type AgentInfluence,
} from '#/lib/agent'
import {
  buttonClassName,
  hintClassName,
} from '#/lib/ui-classes'
import { cn } from '#/lib/utils'
import {
  createOwnedChatSession,
  deleteOwnedChatSession,
  getWidget,
  bindOwnedVisitorIdentity,
  createVisitorJwt,
  type PublicChatSessionVisitor,
} from '#/lib/widget'

function formatTimeToFirst(ms: number | undefined | null): string | null {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return null
  if (ms < 1000) return `${Math.round(ms)}ms to first response`
  const seconds = ms / 1000
  const rounded =
    seconds >= 10 ? Math.round(seconds) : Math.round(seconds * 10) / 10
  return `${rounded}s to first response`
}

type TrainTestAgentPanelProps = {
  apiKeyId: string
}

type SessionState = {
  id: string | null
  expiredAt: string | null
  expired: boolean
}

function InfluenceSection({
  title,
  count,
  icon: Icon,
  emptyLabel,
  children,
  defaultOpen = true,
}: {
  title: string
  count: number
  icon: typeof Tags
  emptyLabel: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen && count > 0)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="-mx-1 flex w-[calc(100%+0.5rem)] items-center gap-1.5 rounded-md px-1 py-1 text-left transition hover:bg-[var(--bg)]/60"
        aria-expanded={open}
      >
        <ChevronDown
          className={cn(
            'size-3 shrink-0 text-[var(--muted)] transition',
            open ? '' : '-rotate-90',
          )}
          aria-hidden
        />
        <Icon className="size-3.5 shrink-0 text-[var(--muted)]" aria-hidden />
        <span className="min-w-0 flex-1 text-[11px] font-semibold tracking-wide text-[var(--ink)]">
          {title}
          <span className="ml-1.5 font-normal text-[var(--muted)]">{count}</span>
        </span>
      </button>
      {open ? (
        <div className="ml-[0.4375rem] border-l border-[var(--line)] pl-3.5">
          {count === 0 ? (
            <p className="py-0.5 text-[11px] text-[var(--muted)]">{emptyLabel}</p>
          ) : (
            children
          )}
        </div>
      ) : null}
    </div>
  )
}

function ToolCallDetails({
  arguments: toolArgs,
  result,
}: {
  arguments?: Record<string, unknown>
  result?: unknown
}) {
  const [paramsOpen, setParamsOpen] = useState(true)
  const [resultOpen, setResultOpen] = useState(true)

  const hasParams = toolArgs !== undefined
  const hasResult = result !== undefined
  if (!hasParams && !hasResult) return null

  function formatJson(value: unknown): string {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }

  return (
    <div className="mt-1 space-y-1.5">
      {hasParams ? (
        <div>
          <button
            type="button"
            onClick={() => setParamsOpen((prev) => !prev)}
            className="text-[10px] font-medium text-[var(--muted)] transition hover:text-[var(--ink)]"
          >
            {paramsOpen ? 'Hide parameters' : 'Show parameters'}
          </button>
          {paramsOpen ? (
            <pre className="mt-0.5 max-h-40 overflow-auto text-[10px] leading-snug break-words whitespace-pre-wrap text-[var(--ink)]">
              {formatJson(toolArgs)}
            </pre>
          ) : null}
        </div>
      ) : null}
      {hasResult ? (
        <div>
          <button
            type="button"
            onClick={() => setResultOpen((prev) => !prev)}
            className="text-[10px] font-medium text-[var(--muted)] transition hover:text-[var(--ink)]"
          >
            {resultOpen ? 'Hide result' : 'Show result'}
          </button>
          {resultOpen ? (
            <pre className="mt-0.5 max-h-48 overflow-auto text-[10px] leading-snug break-words whitespace-pre-wrap text-[var(--ink)]">
              {formatJson(result)}
            </pre>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function InfluenceDetails({
  influence,
  emptyLabel = 'No retrieved sources for this reply.',
  onOpenTopic,
  onOpenArticle,
  onOpenGuidance,
}: {
  influence: AgentInfluence | null | undefined
  emptyLabel?: string
  onOpenTopic: (topic: { id: string; articleId: string }) => void
  onOpenArticle: (articleId: string) => void
  onOpenGuidance: (guidanceId: string) => void
}) {
  const count = influence ? influenceVisibleSourceCount(influence) : 0

  if (!influence || count === 0) {
    return <p className="text-[11px] text-[var(--muted)]">{emptyLabel}</p>
  }

  return (
    <div className="space-y-3 text-[11px]">
      <InfluenceSection
        title="Topics"
        count={influence.topics.length}
        icon={Tags}
        emptyLabel="No topics"
        defaultOpen={influence.topics.length > 0}
      >
        <ul className="space-y-0.5 py-0.5">
          {influence.topics.map((topic) => (
            <li key={topic.id}>
              <button
                type="button"
                onClick={() =>
                  onOpenTopic({ id: topic.id, articleId: topic.articleId })
                }
                className="-mx-1 block w-[calc(100%+0.5rem)] rounded-md px-1 py-1 text-left break-words text-[var(--ink)] transition hover:bg-[var(--bg)]/70 hover:underline"
              >
                {topic.name}
              </button>
            </li>
          ))}
        </ul>
      </InfluenceSection>

      <InfluenceSection
        title="Articles"
        count={influence.articles.length}
        icon={FileText}
        emptyLabel="No articles"
        defaultOpen={influence.articles.length > 0}
      >
        <ul className="space-y-0.5 py-0.5">
          {influence.articles.map((article) => (
            <li key={article.id}>
              <button
                type="button"
                onClick={() => onOpenArticle(article.id)}
                className="-mx-1 block w-[calc(100%+0.5rem)] rounded-md px-1 py-1 text-left break-words text-[var(--ink)] transition hover:bg-[var(--bg)]/70 hover:underline"
              >
                {article.title}
              </button>
            </li>
          ))}
        </ul>
      </InfluenceSection>

      <InfluenceSection
        title="Guidance"
        count={influence.guidances.length}
        icon={BookOpen}
        emptyLabel="No guidance"
        defaultOpen={influence.guidances.length > 0}
      >
        <ul className="space-y-0.5 py-0.5">
          {influence.guidances.map((guidance) => (
            <li key={guidance.id}>
              <button
                type="button"
                onClick={() => onOpenGuidance(guidance.id)}
                className="-mx-1 block w-[calc(100%+0.5rem)] rounded-md px-1 py-1 text-left break-words text-[var(--ink)] transition hover:bg-[var(--bg)]/70 hover:underline"
              >
                {guidance.name}
              </button>
            </li>
          ))}
        </ul>
      </InfluenceSection>

      <InfluenceSection
        title="Tools"
        count={
          (influence.tools?.length ?? 0) +
          (influence.declaredTools?.length ?? 0)
        }
        icon={FunctionSquare}
        emptyLabel="No tools"
        defaultOpen={
          (influence.tools?.length ?? 0) +
            (influence.declaredTools?.length ?? 0) >
          0
        }
      >
        <div className="space-y-2 py-0.5">
          {(influence.declaredTools?.length ?? 0) > 0 ? (
            <div>
              <p className="px-1 text-[10px] font-medium tracking-wide text-[var(--muted)] uppercase">
                Declared
              </p>
              <ul className="space-y-0.5">
                {influence.declaredTools.map((tool) => (
                  <li
                    key={`declared:${tool.name}:${tool.alias}`}
                    className="rounded-md px-1 py-1 break-words text-[var(--ink)]"
                  >
                    <span className="font-medium">{tool.name}</span>
                    {tool.alias ? (
                      <span className="text-[var(--muted)]">
                        {' '}
                        → {tool.alias}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {(influence.tools?.length ?? 0) > 0 ? (
            <div>
              <p className="px-1 text-[10px] font-medium tracking-wide text-[var(--muted)] uppercase">
                Called
              </p>
              <ul className="space-y-1">
                {(influence.tools ?? []).map((tool) => (
                  <li
                    key={`called:${tool.name}:${tool.alias}`}
                    className="rounded-md px-1 py-1 break-words text-[var(--ink)]"
                  >
                    <div>
                      <span className="font-medium">{tool.name}</span>
                      {tool.alias ? (
                        <span className="text-[var(--muted)]">
                          {' '}
                          → {tool.alias}
                        </span>
                      ) : null}
                      <span
                        className={
                          tool.ok ? 'text-emerald-700' : 'text-red-600'
                        }
                      >
                        {tool.ok
                          ? ' ok'
                          : ` failed${tool.error ? `: ${tool.error}` : ''}`}
                      </span>
                    </div>
                    {tool.arguments !== undefined ||
                    tool.result !== undefined ? (
                      <ToolCallDetails
                        arguments={tool.arguments}
                        result={tool.result}
                      />
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </InfluenceSection>
    </div>
  )
}

export default function TrainTestAgentPanel({
  apiKeyId,
}: TrainTestAgentPanelProps) {
  const navigate = useNavigate()
  const { id: projectId } = useParams({
    from: '/_authenticated/project/$id',
  })
  const { isAdmin } = useAuth()
  const [open, setOpen] = useState(false)
  const [starting, setStarting] = useState(false)
  const [session, setSession] = useState<SessionState>({
    id: null,
    expiredAt: null,
    expired: false,
  })
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null,
  )
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [visitorTokenDraft, setVisitorTokenDraft] = useState('')
  const [visitorBound, setVisitorBound] = useState<PublicChatSessionVisitor | null>(
    null,
  )
  const [visitorBusy, setVisitorBusy] = useState(false)
  const expireTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sessionIdRef = useRef<string | null>(null)
  const markExpiredRef = useRef<() => Promise<void>>(async () => undefined)
  const visitorTokenDraftRef = useRef(visitorTokenDraft)
  visitorTokenDraftRef.current = visitorTokenDraft

  const hasSession = Boolean(session.id) && !session.expired
  const canSend = hasSession

  const {
    messages,
    draft,
    setDraft,
    sending,
    streamingMessageId,
    error,
    setError,
    meetingBooking,
    setMeetingBooking,
    pendingToolUi,
    stickToBottomRef,
    abortInFlight,
    resetThread,
    appendAgentMessage,
    send,
  } = useAgentChatThread({
    canSend,
    storeInfluence: true,
    stream: async ({
      message,
      signal,
      onToken,
      onStatus,
      onToolUi,
      onUi,
      onDone,
      onFollowupQuestions,
    }) => {
      const sessionId = sessionIdRef.current
      if (!sessionId) {
        throw new Error('No active test session')
      }
      return streamTestAgentChat({
        apiKeyId,
        sessionId,
        message,
        signal,
        onToken,
        onStatus,
        onToolUi,
        onUi,
        onDone,
        onFollowupQuestions,
      })
    },
    onResult: (result) => {
      if (result.meetingBooking) {
        return { clearEmptyAgentMessage: true }
      }
      return undefined
    },
    onError: async (err) => {
      const message = err.message || 'Failed to send message'
      if (
        message === 'Chat session expired' ||
        message === 'Chat session not found'
      ) {
        await markExpiredRef.current()
        return { action: 'ignore' as const }
      }
      return { action: 'default' as const }
    },
  })

  const renderImage = useMemo(
    () => createAuthImageRenderer(apiKeyId),
    [apiKeyId],
  )

  useEffect(() => {
    sessionIdRef.current = session.id
  }, [session.id])

  useEffect(() => {
    let cancelled = false
    void getWidget(apiKeyId).then((response) => {
      if (cancelled) return
      if (response.success && response.data?.publicKey) {
        setPublicKey(response.data.publicKey)
      } else {
        setPublicKey(null)
      }
    })
    return () => {
      cancelled = true
    }
  }, [apiKeyId])

  const clearExpireTimer = useCallback(() => {
    if (expireTimerRef.current) {
      clearTimeout(expireTimerRef.current)
      expireTimerRef.current = null
    }
  }, [])

  const clearSessionLocal = useCallback(() => {
    abortInFlight()
    clearExpireTimer()
    sessionIdRef.current = null
    setSession({ id: null, expiredAt: null, expired: false })
    setVisitorBound(null)
    resetThread()
    setDetailsOpen(false)
    setSelectedMessageId(null)
  }, [abortInFlight, clearExpireTimer, resetThread])

  const applyVisitorToken = useCallback(
    async (token: string, sessionId: string) => {
      const trimmed = token.trim()
      if (!trimmed) {
        toast.error('Paste a visitor JWT first')
        return false
      }
      setVisitorBusy(true)
      try {
        const response = await bindOwnedVisitorIdentity(
          apiKeyId,
          sessionId,
          trimmed,
        )
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to bind visitor token')
        }
        setVisitorBound(response.data.visitor ?? null)
        if (response.data.expiredAt) {
          setSession((prev) => ({
            ...prev,
            expiredAt: response.data!.expiredAt,
          }))
        }
        toast.success(
          response.data.visitor?.sub
            ? `Visitor bound (${response.data.visitor.sub})`
            : 'Visitor bound',
        )
        return true
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Failed to bind visitor token',
        )
        return false
      } finally {
        setVisitorBusy(false)
      }
    },
    [apiKeyId],
  )

  const mintVisitorToken = useCallback(async () => {
    if (!publicKey) {
      toast.error('Widget public key not loaded yet')
      return
    }
    setVisitorBusy(true)
    try {
      const response = await createVisitorJwt(publicKey, {
        claims: { apiKeyId },
      })
      if (!response.success || !response.data?.token) {
        throw new Error(response.message || 'Failed to mint visitor JWT')
      }
      setVisitorTokenDraft(response.data.token)
      toast.success('Visitor JWT minted')
      const sessionId = sessionIdRef.current
      if (sessionId) {
        await applyVisitorToken(response.data.token, sessionId)
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to mint visitor JWT',
      )
    } finally {
      setVisitorBusy(false)
    }
  }, [apiKeyId, applyVisitorToken, publicKey])

  const clearVisitorToken = useCallback(() => {
    setVisitorTokenDraft('')
    setVisitorBound(null)
    toast.success('Cleared local visitor token (start a new session to drop bound identity)')
  }, [])

  const endSession = useCallback(async () => {
    const id = sessionIdRef.current
    if (id) {
      try {
        await deleteOwnedChatSession(apiKeyId, id)
      } catch {
        // best-effort
      }
    }
    clearSessionLocal()
  }, [apiKeyId, clearSessionLocal])

  const markExpired = useCallback(async () => {
    abortInFlight()
    const id = sessionIdRef.current
    if (id) {
      try {
        await deleteOwnedChatSession(apiKeyId, id)
      } catch {
        // best-effort
      }
    }
    clearExpireTimer()
    sessionIdRef.current = null
    setSession((prev) => ({
      ...prev,
      id: null,
      expiredAt: null,
      expired: true,
    }))
    setVisitorBound(null)
    resetThread()
    setDetailsOpen(false)
    setSelectedMessageId(null)
  }, [abortInFlight, apiKeyId, clearExpireTimer, resetThread])

  markExpiredRef.current = markExpired

  const startTest = useCallback(async () => {
    setStarting(true)
    setError(null)
    abortInFlight()
    try {
      if (sessionIdRef.current) {
        try {
          await deleteOwnedChatSession(apiKeyId, sessionIdRef.current)
        } catch {
          // ignore
        }
      }
      clearExpireTimer()
      const response = await createOwnedChatSession(apiKeyId)
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create session')
      }
      setSession({
        id: response.data.id,
        expiredAt: response.data.expiredAt,
        expired: false,
      })
      resetThread()
      setDetailsOpen(true)
      setSelectedMessageId(null)
      setVisitorBound(null)
      const pendingToken = visitorTokenDraftRef.current.trim()
      if (pendingToken) {
        await applyVisitorToken(pendingToken, response.data.id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start test')
      clearSessionLocal()
      setSession({ id: null, expiredAt: null, expired: false })
    } finally {
      setStarting(false)
    }
  }, [
    abortInFlight,
    apiKeyId,
    applyVisitorToken,
    clearExpireTimer,
    clearSessionLocal,
    resetThread,
    setError,
  ])

  useEffect(() => {
    clearExpireTimer()
    if (!session.id || !session.expiredAt || session.expired) return

    const expiresMs = Date.parse(session.expiredAt)
    if (Number.isNaN(expiresMs)) return

    const remaining = expiresMs - Date.now()
    if (remaining <= 0) {
      void markExpired()
      return
    }

    expireTimerRef.current = setTimeout(() => {
      void markExpired()
    }, remaining)

    return clearExpireTimer
  }, [
    clearExpireTimer,
    markExpired,
    session.expired,
    session.expiredAt,
    session.id,
  ])

  useEffect(() => {
    return () => {
      abortInFlight()
      const id = sessionIdRef.current
      if (id) {
        void deleteOwnedChatSession(apiKeyId, id).catch(() => undefined)
      }
      clearExpireTimer()
    }
  }, [abortInFlight, apiKeyId, clearExpireTimer])

  function handleClosePanel() {
    setOpen(false)
  }

  function handleExitPanel() {
    void endSession()
  }

  const conversationInfluence = useMemo(
    () =>
      mergeInfluences(
        messages
          .filter((message) => message.role === 'agent')
          .map((message) => message.influence),
      ),
    [messages],
  )

  const selectedMessage = useMemo(
    () =>
      selectedMessageId
        ? (messages.find((message) => message.id === selectedMessageId) ?? null)
        : null,
    [messages, selectedMessageId],
  )

  const detailsInfluence = selectedMessage?.influence ?? conversationInfluence
  const detailsMode = selectedMessage ? 'message' : 'session'

  const lastTimeToFirstMs = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const message = messages[i]
      if (message?.role === 'agent' && message.timeToFirstMs != null) {
        return message.timeToFirstMs
      }
    }
    return null
  }, [messages])

  const conversationSourceSummary = useMemo(() => {
    const parts = [
      `${conversationInfluence.topics.length} topics`,
      `${conversationInfluence.articles.length} articles`,
      `${conversationInfluence.guidances.length} guidance`,
    ]
    const ttfr = formatTimeToFirst(lastTimeToFirstMs)
    if (ttfr) parts.push(ttfr)
    return parts.join(' · ')
  }, [conversationInfluence, lastTimeToFirstMs])

  const messageSourceSummary = useMemo(() => {
    const parts = [
      `${selectedMessage?.influence?.topics.length ?? 0} topics`,
      `${selectedMessage?.influence?.articles.length ?? 0} articles`,
      `${selectedMessage?.influence?.guidances.length ?? 0} guidance`,
    ]
    const ttfr = formatTimeToFirst(selectedMessage?.timeToFirstMs)
    if (ttfr) parts.push(ttfr)
    return parts.join(' · ')
  }, [selectedMessage])

  function handleSelectMessage(messageId: string) {
    setSelectedMessageId(messageId)
    setDetailsOpen(true)
  }

  function handleShowSessionInfluence() {
    setSelectedMessageId(null)
    setDetailsOpen(true)
  }

  function openArticleEditor(articleId: string, topicId?: string) {
    void navigate({
      to: '/project/$id/train/article',
      params: { id: projectId },
      search: {
        articleId,
        ...(topicId ? { topicId } : {}),
      },
    })
  }

  function openGuidanceEditor(guidanceId: string) {
    void navigate({
      to: '/project/$id/train/guidance',
      params: { id: projectId },
      search: { guidanceId },
    })
  }

  function handleOpenTopic(topic: { id: string; articleId: string }) {
    if (!topic.articleId) {
      toast.error('Could not find the article for this topic')
      return
    }
    openArticleEditor(topic.articleId, topic.id)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'flex h-full w-10 shrink-0 flex-col items-center gap-2 border-l border-[var(--line)] bg-[var(--surface)] py-4 text-[var(--muted)] transition hover:bg-[var(--bg)] hover:text-[var(--ink)]',
        )}
        aria-label="Open test agent"
        title="Test agent"
      >
        <Bot className="size-4 shrink-0" />
        <span
          className="text-[10px] font-semibold tracking-wide uppercase"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          Test agent
        </span>
      </button>
    )
  }

  return (
    <aside
      className={cn(
        'relative flex h-full min-h-0 max-w-full shrink-0 flex-col overflow-hidden border-l border-[var(--line)] bg-[var(--surface)] transition-[width]',
        detailsOpen ? 'w-[44rem]' : 'w-96',
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--line)] px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-[var(--bg)] ring-1 ring-[var(--line)]">
            <MessageSquare className="size-3.5 text-[var(--muted)]" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-[var(--ink)]">
              Test agent
            </h2>
            <p className="truncate text-[11px] text-[var(--muted)]">
              {hasSession
                ? sending
                  ? 'Typing…'
                  : visitorBound
                    ? `Online · visitor ${visitorBound.sub}`
                    : 'Online · anonymous'
                : 'Idle'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {hasSession ? (
            <button
              type="button"
              onClick={() =>
                setDetailsOpen((prev) => {
                  if (prev) setSelectedMessageId(null)
                  return !prev
                })
              }
              className="flex size-8 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[var(--bg)] hover:text-[var(--ink)]"
              aria-label={detailsOpen ? 'Hide influence details' : 'Show influence details'}
              title={detailsOpen ? 'Hide details' : 'Show details'}
            >
              {detailsOpen ? (
                <PanelRightClose className="size-4" />
              ) : (
                <PanelRightOpen className="size-4" />
              )}
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleExitPanel}
            className="flex size-8 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[var(--bg)] hover:text-[var(--ink)]"
            aria-label="End session"
            title="End session"
          >
            <LogOut className="size-4" />
          </button>
          <button
            type="button"
            onClick={handleClosePanel}
            className="flex size-8 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[var(--bg)] hover:text-[var(--ink)]"
            aria-label="Close test agent"
            title="Close"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {hasSession ? (
        <p
          className={cn(
            hintClassName,
            'shrink-0 truncate border-b border-[var(--line)] px-3 py-1.5 text-[10px]',
          )}
          title={session.id ?? undefined}
        >
          Session {session.id}
        </p>
      ) : null}

      <div className="relative flex min-h-0 flex-1 flex-row bg-[var(--bg)]/40">
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          {!hasSession && !session.expired ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-[var(--surface)] ring-1 ring-[var(--line)]">
                <Bot className="size-7 text-[var(--muted)]" />
              </div>
              <p className={hintClassName}>
                Start a test session to chat against this project&apos;s training
                data.
              </p>
              {error ? (
                <p className="text-sm text-red-600">{error}</p>
              ) : null}
              <button
                type="button"
                className={buttonClassName}
                disabled={starting}
                onClick={() => void startTest()}
              >
                {starting ? 'Starting…' : 'Start test'}
              </button>
            </div>
          ) : null}

          {hasSession ? (
            <AgentChatThread
              messages={messages}
              streamingMessageId={streamingMessageId}
              sending={sending}
              draft={draft}
              onDraftChange={setDraft}
              onSend={(text) => void send(text)}
              inputDisabled={sending}
              placeholder={
                sending ? 'Waiting for reply…' : 'Ask a question...'
              }
              error={error}
              darkMode={false}
              agentLabel="Test agent"
              renderImage={renderImage}
              stickToBottomRef={stickToBottomRef}
              pendingToolUi={pendingToolUi}
              meetingBooking={meetingBooking}
              meetingPublicKey={publicKey}
              meetingSessionId={session.id}
              selectedMessageId={selectedMessageId}
              onSelectAgentMessage={handleSelectMessage}
              onMeetingBooked={(booked) => {
                setMeetingBooking(null)
                appendAgentMessage(
                  `Your meeting has been arranged successfully for ${new Date(booked.startsAt).toLocaleString(undefined, { timeZone: booked.timezone })}.`,
                )
              }}
              onToolRetry={() => {
                const lastUser = [...messages]
                  .reverse()
                  .find((m) => m.role === 'user')
                if (lastUser?.text) void send(lastUser.text)
              }}
              className="bg-white text-neutral-900"
              belowMessages={
                messages.length === 0 && !sending && !pendingToolUi && !meetingBooking ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <Bot className="size-6 text-neutral-400" />
                    <p className="max-w-[16rem] text-[11px] text-neutral-500">
                      Say hello   replies stream here like a live chat.
                    </p>
                  </div>
                ) : null
              }
            />
          ) : null}

          {session.expired ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[var(--surface)]/95 px-6 text-center backdrop-blur-sm">
              <p className="text-sm font-semibold text-[var(--ink)]">
                Session expired
              </p>
              <p className={hintClassName}>
                The test session timed out. Start a new one to continue.
              </p>
              {error ? (
                <p className="text-sm text-red-600">{error}</p>
              ) : null}
              <button
                type="button"
                className={buttonClassName}
                disabled={starting}
                onClick={() => void startTest()}
              >
                {starting ? 'Starting…' : 'Start test'}
              </button>
            </div>
          ) : null}
        </div>

        {hasSession && detailsOpen ? (
          <div className="flex w-80 shrink-0 flex-col border-l border-[var(--line)] bg-[var(--surface)]">
            <div className="flex shrink-0 items-start justify-between gap-2 border-b border-[var(--line)] px-3 py-2.5">
              <div className="flex min-w-0 items-start gap-2">
                <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center bg-[var(--bg)]">
                  {detailsMode === 'session' ? (
                    <MessagesSquare
                      className="size-5 text-[var(--muted)]"
                      aria-hidden
                    />
                  ) : (
                    <MessageSquare
                      className="size-5 text-[var(--muted)]"
                      aria-hidden
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--ink)]">
                    {detailsMode === 'session'
                      ? 'Session influence'
                      : 'Message influence'}
                  </p>
                  <p className="truncate text-[10px] text-[var(--muted)]">
                    {detailsMode === 'session'
                      ? conversationSourceSummary
                      : selectedMessage
                        ? messageSourceSummary
                        : 'No sources'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDetailsOpen(false)
                  setSelectedMessageId(null)
                }}
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[var(--bg)] hover:text-[var(--ink)]"
                aria-label="Close details"
                title="Close details"
              >
                <X className="size-3.5" />
              </button>
            </div>

            {detailsMode === 'message' ? (
              <div className="shrink-0 border-b border-[var(--line)] px-3 py-2">
                <button
                  type="button"
                  onClick={handleShowSessionInfluence}
                  className="inline-flex items-center gap-1.5 text-[10px] font-medium text-[var(--muted)] transition hover:text-[var(--ink)]"
                >
                  <MessagesSquare className="size-3" aria-hidden />
                  Back to session influence
                </button>
              </div>
            ) : null}

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
              <div className="mb-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-medium tracking-wide text-[var(--muted)] uppercase">
                    Visitor JWT
                  </p>
                  <span
                    className={cn(
                      'truncate text-[10px]',
                      visitorBound ? 'text-emerald-700' : 'text-[var(--muted)]',
                    )}
                    title={visitorBound?.sub}
                  >
                    {visitorBound
                      ? `auth · ${visitorBound.sub.slice(0, 8)}…`
                      : 'anonymous'}
                  </span>
                </div>
                <input
                  type="text"
                  value={visitorTokenDraft}
                  onChange={(event) => setVisitorTokenDraft(event.target.value)}
                  spellCheck={false}
                  placeholder={
                    isAdmin ? 'Paste JWT or Mint' : 'Paste visitor JWT'
                  }
                  className="w-full rounded-md border border-[var(--line)] bg-[var(--bg)]/40 px-2 py-1 font-mono text-[10px] text-[var(--ink)] outline-none focus:ring-1 focus:ring-[var(--ink)]/20"
                />
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    className={cn(buttonClassName, 'px-1.5 py-0.5 text-[10px]')}
                    disabled={visitorBusy || !hasSession}
                    onClick={() => {
                      const id = sessionIdRef.current
                      if (!id) return
                      void applyVisitorToken(visitorTokenDraft, id)
                    }}
                  >
                    Apply
                  </button>
                  {isAdmin ? (
                    <button
                      type="button"
                      className={cn(
                        buttonClassName,
                        'px-1.5 py-0.5 text-[10px]',
                      )}
                      disabled={visitorBusy || !publicKey}
                      onClick={() => void mintVisitorToken()}
                    >
                      Mint
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className={cn(
                      buttonClassName,
                      'bg-transparent px-1.5 py-0.5 text-[10px] text-[var(--muted)] ring-1 ring-[var(--line)]',
                    )}
                    disabled={visitorBusy}
                    onClick={clearVisitorToken}
                  >
                    Clear
                  </button>
                </div>
              </div>

              <InfluenceDetails
                key={
                  detailsMode === 'session'
                    ? 'session'
                    : `message-${selectedMessageId ?? 'none'}`
                }
                influence={detailsInfluence}
                emptyLabel={
                  detailsMode === 'session'
                    ? 'No sources yet   send a message that retrieves training knowledge.'
                    : 'No retrieved sources for this reply.'
                }
                onOpenTopic={handleOpenTopic}
                onOpenArticle={(articleId) => openArticleEditor(articleId)}
                onOpenGuidance={openGuidanceEditor}
              />
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  )
}
