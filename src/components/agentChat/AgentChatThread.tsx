import {
  useEffect,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from 'react'
import { ArrowUp } from 'lucide-react'
import AgentMessageBody, {
  type AgentChatImageRenderer,
} from '#/components/agentChat/AgentMessageBody'
import ThoughtLine from '#/components/agentChat/ThoughtLine'
import type { AgentChatMessage } from '#/components/agentChat/useAgentChatThread'
import WidgetMeetingBooking from '#/components/widget/WidgetMeetingBooking'
import WidgetToolLoadingCard from '#/components/widget/WidgetToolLoadingCard'
import type { AgentToolUiEvent } from '#/lib/agent'
import type { MeetingBookingPayload } from '#/lib/meetingTool'
import { cn } from '#/lib/utils'

/** Hide concrete tool titles in the thinking trail (e.g. "Using List Custom…"). */
function displayThoughtSteps(steps: string[]): string[] {
  const out: string[] = []
  for (const step of steps) {
    const trimmed = step.trim()
    if (!trimmed) continue
    const text = /^Using\s+/i.test(trimmed) ? 'Calling tools' : trimmed
    if (out[out.length - 1] === text) continue
    out.push(text)
  }
  return out
}

export type AgentChatThreadProps = {
  messages: AgentChatMessage[]
  streamingMessageId: string | null
  sending: boolean
  draft: string
  onDraftChange: (value: string) => void
  onSend: (text: string) => void
  inputDisabled?: boolean
  placeholder?: string
  error?: string | null
  darkMode?: boolean
  agentLabel?: string
  renderImage: AgentChatImageRenderer
  stickToBottomRef?: MutableRefObject<boolean>
  /** Extra content inside the scroll area after messages (e.g. live-agent offer). */
  belowMessages?: ReactNode
  /** When true, hide the pending tool card (e.g. live-agent offer is showing). */
  hidePendingToolUi?: boolean
  /** Chips above the composer. */
  chips?: ReactNode
  /** Footer under the composer (e.g. privacy note). */
  footer?: ReactNode
  pendingToolUi?: AgentToolUiEvent | null
  meetingBooking?: MeetingBookingPayload | null
  meetingPublicKey?: string | null
  meetingSessionId?: string | null
  onMeetingBooked?: (result: {
    startsAt: string
    timezone: string
  }) => void
  onToolRetry?: () => void
  /** Train-only: select an agent message for influence details. */
  selectedMessageId?: string | null
  onSelectAgentMessage?: (messageId: string) => void
  className?: string
  messagesClassName?: string
  composerClassName?: string
}

export default function AgentChatThread({
  messages,
  streamingMessageId,
  sending,
  draft,
  onDraftChange,
  onSend,
  inputDisabled = false,
  placeholder = 'Ask a question...',
  error = null,
  darkMode = false,
  agentLabel = 'AI Agent',
  renderImage,
  stickToBottomRef,
  belowMessages,
  hidePendingToolUi = false,
  chips,
  footer,
  pendingToolUi = null,
  meetingBooking = null,
  meetingPublicKey = null,
  meetingSessionId = null,
  onMeetingBooked,
  onToolRetry,
  selectedMessageId = null,
  onSelectAgentMessage,
  className,
  messagesClassName,
  composerClassName,
}: AgentChatThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const localStickRef = useRef(true)
  const stickRef = stickToBottomRef ?? localStickRef

  const showMeetingBooking =
    Boolean(meetingBooking) &&
    Boolean(meetingPublicKey) &&
    Boolean(meetingSessionId) &&
    !sending
  const showPendingToolUi =
    Boolean(pendingToolUi) &&
    !showMeetingBooking &&
    !hidePendingToolUi

  useEffect(() => {
    const el = scrollRef.current
    if (!el || !stickRef.current) return
    el.scrollTop = el.scrollHeight
  }, [messages, sending, pendingToolUi, meetingBooking, belowMessages, stickRef])

  return (
    <div className={cn('flex min-h-0 min-w-0 flex-1 flex-col', className)}>
      <div
        ref={scrollRef}
        className={cn(
          'min-h-0 min-w-0 flex-1 space-y-3 overflow-x-hidden overflow-y-auto px-4 py-4',
          messagesClassName,
        )}
        onScroll={(e) => {
          const el = e.currentTarget
          const distanceFromBottom =
            el.scrollHeight - el.scrollTop - el.clientHeight
          stickRef.current = distanceFromBottom < 80
        }}
      >
        {messages
          .filter(
            (message) =>
              message.role === 'user' ||
              message.text.trim() ||
              message.ui != null ||
              (message.thoughtSteps?.length ?? 0) > 0 ||
              streamingMessageId === message.id,
          )
          .map((message) => {
            const isAgent = message.role === 'agent'
            const isStreaming = streamingMessageId === message.id
            const hasBody =
              Boolean(message.text.trim()) || message.ui != null
            const thoughtSteps = displayThoughtSteps(
              message.thoughtSteps ?? [],
            )
            const showThoughtLine =
              isAgent && (isStreaming || thoughtSteps.length > 0)
            const thoughtWorking = isStreaming && !hasBody
            const showBubble =
              !isAgent || hasBody || (isStreaming && !showThoughtLine)
            const canSelect =
              Boolean(onSelectAgentMessage) &&
              isAgent &&
              !isStreaming
            const selected = selectedMessageId === message.id

            return (
              <div
                key={message.id}
                className={cn(
                  'flex w-full min-w-0 flex-col rounded-xl transition',
                  isAgent ? 'items-start' : 'items-end',
                  selected ? 'ring-1 ring-neutral-300 dark:ring-white/20' : '',
                  canSelect ? 'cursor-pointer hover:bg-black/5 dark:hover:bg-white/5' : '',
                )}
                role={canSelect ? 'button' : undefined}
                tabIndex={canSelect ? 0 : undefined}
                aria-pressed={canSelect ? selected : undefined}
                onClick={
                  canSelect
                    ? () => onSelectAgentMessage?.(message.id)
                    : undefined
                }
                onKeyDown={
                  canSelect
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          onSelectAgentMessage?.(message.id)
                        }
                      }
                    : undefined
                }
              >
                {showThoughtLine ? (
                  <div
                    className={cn(
                      'mb-1 px-1',
                      darkMode ? 'text-neutral-300' : 'text-neutral-600',
                    )}
                  >
                    <ThoughtLine
                      working={thoughtWorking}
                      steps={thoughtSteps}
                      label="Thinking…"
                      doneLabel="Thinking"
                      glyph="sparkle"
                      fontSize={14}
                      collapsible
                      collapseOnSettle
                      showTimer={false}
                    />
                  </div>
                ) : null}
                {showBubble ? (
                  <div
                    className={cn(
                      'w-fit min-w-0 max-w-[85%] overflow-x-clip rounded-2xl px-3 py-2 text-xs leading-relaxed wrap-break-word',
                      message.role === 'user'
                        ? darkMode
                          ? 'bg-white text-neutral-950'
                          : 'bg-neutral-900 text-white'
                        : darkMode
                          ? 'bg-neutral-900 text-neutral-50'
                          : 'bg-neutral-100 text-neutral-900',
                    )}
                  >
                    {isAgent ? (
                      <AgentMessageBody
                        text={message.text}
                        streaming={isStreaming}
                        darkMode={darkMode}
                        renderImage={renderImage}
                        ui={message.ui}
                        onUiAction={(actionId) => onSend(actionId)}
                      />
                    ) : (
                      message.text || (sending ? '…' : '')
                    )}
                  </div>
                ) : null}
                {isAgent && hasBody ? (
                  <p
                    className={cn(
                      'mt-1 px-1 text-[10px]',
                      darkMode ? 'text-neutral-500' : 'text-neutral-400',
                    )}
                  >
                    {agentLabel} · AI Agent
                  </p>
                ) : null}
              </div>
            )
          })}

        {showPendingToolUi && pendingToolUi ? (
          <WidgetToolLoadingCard
            kind={pendingToolUi.kind}
            status={pendingToolUi.status}
            topicName={pendingToolUi.topicName}
            message={pendingToolUi.message}
            darkMode={darkMode}
            onRetry={
              pendingToolUi.status === 'error' ? onToolRetry : undefined
            }
          />
        ) : null}

        {showMeetingBooking &&
        meetingBooking &&
        meetingPublicKey &&
        meetingSessionId ? (
          <WidgetMeetingBooking
            publicKey={meetingPublicKey}
            sessionId={meetingSessionId}
            payload={meetingBooking}
            darkMode={darkMode}
            onBooked={(result) => onMeetingBooked?.(result)}
          />
        ) : null}

        {belowMessages}
      </div>

      <div className={cn('shrink-0 px-3 pb-3', composerClassName)}>
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
        {chips}
        <div
          className={cn(
            'flex items-end gap-2 rounded-md border px-3 py-1.5',
            darkMode
              ? 'border-white/10 bg-neutral-950'
              : 'border-neutral-200 bg-white',
            inputDisabled && 'opacity-60',
          )}
        >
          <textarea
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            rows={1}
            disabled={inputDisabled}
            placeholder={placeholder}
            className={cn(
              'sleek-scroll field-sizing-content max-h-32 min-h-8 min-w-0 w-full resize-none overflow-y-auto bg-transparent py-1.5 text-xs leading-5 outline-none placeholder:opacity-50',
              darkMode ? 'text-neutral-50' : 'text-neutral-900',
            )}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                onSend(draft)
              }
            }}
          />
          <button
            type="button"
            disabled={inputDisabled || !draft.trim()}
            onClick={() => onSend(draft)}
            className={cn(
              'mb-0.5 flex size-7 shrink-0 items-center justify-center rounded-full transition',
              !inputDisabled && draft.trim()
                ? darkMode
                  ? 'bg-white text-neutral-950'
                  : 'bg-neutral-900 text-white'
                : darkMode
                  ? 'bg-neutral-800 text-neutral-500'
                  : 'bg-neutral-200 text-neutral-400',
            )}
            aria-label="Send"
          >
            <ArrowUp className="size-3.5" />
          </button>
        </div>
        {footer}
      </div>
    </div>
  )
}
