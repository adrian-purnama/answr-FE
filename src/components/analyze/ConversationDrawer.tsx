import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import toast from 'react-hot-toast'
import { ChevronDown, Info, LoaderCircle } from 'lucide-react'
import AgentMessageBody, {
  createAuthImageRenderer,
} from '#/components/agentChat/AgentMessageBody'
import { stripUiMarkers } from '#/components/agentChat/agentChatMarkdown'
import Modal from '#/components/ui/Modal'
import SideDrawer from '#/components/ui/SideDrawer'
import {
  findAnalyticsOption,
  formatAnalyticsType,
  formatGapType,
  getChatAnalyticsConversation,
  listAnalyticsCategories,
  type AnalyticsCategory,
  type ChatAnalyticsConversation,
  type ChatAnalyticsConversationMessage,
} from '#/lib/chatAnalytics'
import { hintClassName } from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

type ConversationDrawerProps = {
  open: boolean
  onClose: () => void
  apiKeyId: string
  sessionId: string | null
  highlightMessageId?: string
}

type FieldHelp = {
  title: string
  body: string
}

const FIELD_HELP = {
  type: {
    title: 'Type',
    body: 'Kind of message   for example a question, greeting, confirmation, or farewell.',
  },
  category: {
    title: 'Category',
    body: 'Business topic bucket for this message, such as Support or Meeting.',
  },
  intent: {
    title: 'Intent',
    body: 'Short label for what the user wanted in this message. Not a Gaps page category.',
  },
  answerable: {
    title: 'Answerable',
    body: 'Whether the agent could answer from available knowledge.',
  },
  gapType: {
    title: 'Gap type',
    body: 'Why this counted as a knowledge or capability gap (missing knowledge, unsupported action, and similar).',
  },
} as const satisfies Record<string, FieldHelp>

function InfoButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      className="inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-[var(--line)] text-[var(--muted)] transition hover:border-[var(--ink)] hover:text-[var(--ink)]"
      aria-label={`About ${label}`}
    >
      <Info className="size-2.5" aria-hidden />
    </button>
  )
}

function MetaRow({
  label,
  onHelp,
  children,
}: {
  label: string
  onHelp: () => void
  children: ReactNode
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1">
        <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">
          {label}
        </p>
        <InfoButton label={label} onClick={onHelp} />
      </div>
      <div className="mt-0.5 text-sm text-[var(--ink)]">{children}</div>
    </div>
  )
}

function MessageAnalysisMeta({
  analysis,
  options,
}: {
  analysis: NonNullable<ChatAnalyticsConversationMessage['analysis']>
  options: AnalyticsCategory[]
}) {
  const [expanded, setExpanded] = useState(false)
  const [help, setHelp] = useState<FieldHelp | null>(null)
  const isGap = analysis.gapDetected === true
  const typeOption = findAnalyticsOption(options, 'type', analysis.type)
  const categoryOption = findAnalyticsOption(
    options,
    'category',
    analysis.categoryId,
  )
  const intentOption = findAnalyticsOption(options, 'intent', analysis.intent)
  const answerableOption = findAnalyticsOption(
    options,
    'answerable',
    analysis.answerable === true
      ? 'answerable'
      : analysis.answerable === false
        ? 'unanswerable'
        : undefined,
  )
  const gapOption = findAnalyticsOption(options, 'gap', analysis.gapType)
  const categoryName = categoryOption?.name
  const typeLabel = formatAnalyticsType(analysis.type)
  const answerableLabel =
    analysis.answerable === true
      ? 'Yes'
      : analysis.answerable === false
        ? 'No'
        : 'Unknown'
  const summaryParts = [
    typeLabel,
    categoryName || 'Uncategorized',
    isGap
      ? analysis.gapType
        ? `Gap: ${formatGapType(analysis.gapType)}`
        : 'Gap'
      : null,
  ].filter(Boolean)

  return (
    <div className="mt-2 rounded border border-[var(--line)]/80 bg-white/50">
      <button
        type="button"
        className="flex w-full items-center gap-1.5 px-2 py-1 text-left transition hover:bg-[var(--surface)]"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
      >
        <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">
          Analysis
        </span>
        {!expanded ? (
          <span
            className={cn(hintClassName, 'min-w-0 flex-1 truncate text-[10px]')}
            title={
              [typeOption?.description, categoryOption?.description, gapOption?.description]
                .filter(Boolean)
                .join(' · ') || undefined
            }
          >
            {summaryParts.join(' · ')}
          </span>
        ) : (
          <span className="flex-1" />
        )}
        <ChevronDown
          className={cn(
            'size-3 shrink-0 text-[var(--muted)] transition',
            expanded && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {expanded ? (
        <div className="space-y-2 border-t border-[var(--line)] px-2 py-1.5">
          <div className="grid gap-1.5 sm:grid-cols-2">
            <MetaRow
              label="Type"
              onHelp={() =>
                setHelp({
                  title: 'Type',
                  body: typeOption?.description || FIELD_HELP.type.body,
                })
              }
            >
              <span className="capitalize text-xs" title={typeOption?.description}>
                {typeLabel}
              </span>
            </MetaRow>
            <MetaRow
              label="Category"
              onHelp={() =>
                setHelp({
                  title: 'Category',
                  body: categoryOption?.description || FIELD_HELP.category.body,
                })
              }
            >
              <span className="text-xs" title={categoryOption?.description}>
                {categoryName || 'Uncategorized'}
              </span>
            </MetaRow>
            {analysis.intent ? (
              <MetaRow
                label="Intent"
                onHelp={() =>
                  setHelp({
                    title: 'Intent',
                    body: intentOption?.description || FIELD_HELP.intent.body,
                  })
                }
              >
                <span
                  className="capitalize text-xs"
                  title={intentOption?.description}
                >
                  {formatAnalyticsType(analysis.intent)}
                </span>
              </MetaRow>
            ) : null}
            <MetaRow
              label="Answerable"
              onHelp={() =>
                setHelp({
                  title: 'Answerable',
                  body:
                    answerableOption?.description || FIELD_HELP.answerable.body,
                })
              }
            >
              <span className="text-xs" title={answerableOption?.description}>
                {answerableLabel}
              </span>
            </MetaRow>
          </div>

          {isGap ? (
            <div className="rounded border border-amber-200/80 bg-amber-50/70 px-2 py-1.5">
              <MetaRow
                label="Gap type"
                onHelp={() =>
                  setHelp({
                    title: 'Gap type',
                    body: gapOption?.description || FIELD_HELP.gapType.body,
                  })
                }
              >
                <span
                  className="capitalize text-xs text-amber-950"
                  title={gapOption?.description}
                >
                  {analysis.gapType
                    ? formatGapType(analysis.gapType)
                    : 'Detected (no specific type)'}
                  {analysis.gapResolved ? ' · resolved' : ''}
                </span>
              </MetaRow>
              {analysis.gapReason ? (
                <p className="mt-1 text-xs leading-snug text-amber-950/90">
                  {analysis.gapReason}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <Modal
        open={help !== null}
        onClose={() => setHelp(null)}
        title={help?.title ?? ''}
      >
        <p className="text-sm text-[var(--ink)]">{help?.body}</p>
      </Modal>
    </div>
  )
}

export default function ConversationDrawer({
  open,
  onClose,
  apiKeyId,
  sessionId,
  highlightMessageId,
}: ConversationDrawerProps) {
  const [loading, setLoading] = useState(false)
  const [conversation, setConversation] =
    useState<ChatAnalyticsConversation | null>(null)
  const [categories, setCategories] = useState<AnalyticsCategory[]>([])
  const highlightRef = useRef<HTMLDivElement | null>(null)
  const renderImage = useMemo(
    () => createAuthImageRenderer(apiKeyId),
    [apiKeyId],
  )
  useEffect(() => {
    if (!open || !sessionId) {
      setConversation(null)
      return
    }

    let cancelled = false
    setLoading(true)
    void (async () => {
      try {
        const [conversationRes, categoriesRes] = await Promise.all([
          getChatAnalyticsConversation(apiKeyId, sessionId),
          listAnalyticsCategories(apiKeyId),
        ])
        if (cancelled) return
        if (!conversationRes.success || !conversationRes.data) {
          toast.error(conversationRes.message || 'Failed to load conversation')
          setConversation(null)
          return
        }
        setConversation(conversationRes.data)
        if (categoriesRes.success && categoriesRes.data) {
          setCategories(categoriesRes.data)
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error
              ? error.message
              : 'Failed to load conversation',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [apiKeyId, open, sessionId])

  useEffect(() => {
    if (!conversation || !highlightMessageId || loading) return
    const frame = window.requestAnimationFrame(() => {
      highlightRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [conversation, highlightMessageId, loading])

  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      label="Conversation"
      size="md"
      statusLabel={
        sessionId ? (
          <span className={hintClassName}>Session {sessionId.slice(-8)}</span>
        ) : null
      }
    >
      {loading ? (
        <div className={cn(hintClassName, 'flex items-center gap-2')}>
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
          Loading conversation…
        </div>
      ) : !conversation || conversation.messages.length === 0 ? (
        <p className={hintClassName}>No messages available in lookback window.</p>
      ) : (
        <div className="space-y-3">
          {conversation.messages.map((message) => {
            const highlighted = message.id === highlightMessageId
            const isUser = message.role === 'user'
            const isGap = message.analysis?.gapDetected === true
            const displayText = stripUiMarkers(message.text)
            return (
              <div
                key={message.id}
                ref={highlighted ? highlightRef : undefined}
                className={cn(
                  'rounded-lg border px-3 py-2.5',
                  isUser
                    ? 'border-[var(--line)] bg-[var(--surface)]'
                    : 'border-transparent bg-transparent',
                  highlighted &&
                    isGap &&
                    'border-l-4 border-l-amber-500 border-[var(--line)] bg-white',
                  highlighted &&
                    !isGap &&
                    'border-l-4 border-l-[var(--ink)] border-[var(--line)] bg-white',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                    {message.role}
                    {highlighted && isGap ? (
                      <span className="ml-2 normal-case tracking-normal text-amber-800">
                        · gap source
                      </span>
                    ) : highlighted ? (
                      <span className="ml-2 normal-case tracking-normal text-[var(--ink)]">
                        · selected
                      </span>
                    ) : null}
                  </span>
                  <span className="text-[11px] text-[var(--muted)]">
                    {new Date(message.createdAt).toLocaleString()}
                  </span>
                </div>

                <div
                  className={cn(
                    'mt-1.5 text-[var(--ink)]',
                    highlighted && 'text-[15px] leading-relaxed',
                  )}
                >
                  <AgentMessageBody
                    text={displayText}
                    streaming={false}
                    darkMode={false}
                    renderImage={renderImage}
                  />
                </div>

                {message.analysis && highlighted ? (
                  <MessageAnalysisMeta
                    analysis={message.analysis}
                    options={categories}
                  />
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </SideDrawer>
  )
}
