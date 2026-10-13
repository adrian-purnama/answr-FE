import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  Headset,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import AgentChatThread from '#/components/agentChat/AgentChatThread'
import { createPublicImageRenderer } from '#/components/agentChat/AgentMessageBody'
import { newAgentChatMessageId } from '#/components/agentChat/agentChatMarkdown'
import { useAgentChatThread } from '#/components/agentChat/useAgentChatThread'
import WidgetChromeActions from '#/components/widget/WidgetChromeActions'
import WidgetRatingPrompt from '#/components/widget/WidgetRatingPrompt'
import { useWidgetRuntime } from '#/components/widget/context/WidgetRuntimeContext'
import {
  streamPublicWidgetChat,
  type LiveAgentOffer,
} from '#/lib/agent'
import { cn } from '#/lib/utils'
import {
  createPublicLiveAgentTicket,
  submitPublicAiFeedback,
  getPublicChatSessionMessages,
  resolveVisitorTemplate,
  type PublicChatSessionVisitor,
  type PublicLiveAgentTicket,
  type WidgetChatSettings,
} from '#/lib/widget'

type WidgetChatAgentProps = {
  chatSettings: WidgetChatSettings
  avatarUrl?: string
  darkMode?: boolean
  expanded: boolean
  onToggleExpanded: () => void
  onBack: () => void
  onThreadChange?: (info: {
    preview: string
    hasUserMessages: boolean
  }) => void
  onLiveAgentStarted?: (ticket: PublicLiveAgentTicket) => void
}

function greetingText(
  chatSettings: WidgetChatSettings,
  visitor: PublicChatSessionVisitor | null | undefined,
) {
  const raw =
    chatSettings.agentInitialMessage?.trim() ||
    "Hi, you're speaking with our AI Agent."
  return resolveVisitorTemplate(raw, visitor)
}

export default function WidgetChatAgent({
  chatSettings,
  avatarUrl,
  darkMode = false,
  expanded,
  onToggleExpanded,
  onBack,
  onThreadChange,
  onLiveAgentStarted,
}: WidgetChatAgentProps) {
  const {
    publicKey,
    sessionId,
    endedSessionId,
    chatLocked,
    showLoginPrompt,
    loginPrompt,
    sessionExpired,
    sessionEpoch,
    ensureSession,
    markSessionEnded,
    requestVisitorTokenRefresh,
    visitor,
    setHadUserChat,
    aiFeedbackDone,
    setAiFeedbackDone,
    liveAgentRated,
  } = useWidgetRuntime()

  const resolvedGreeting = useMemo(
    () => greetingText(chatSettings, visitor),
    [chatSettings, visitor],
  )

  const [liveCreating, setLiveCreating] = useState(false)
  const [showAiRating, setShowAiRating] = useState(false)
  const [ratingStars, setRatingStars] = useState(0)
  const [ratingFeedback, setRatingFeedback] = useState('')
  const [ratingSubmitting, setRatingSubmitting] = useState(false)
  const [ratingError, setRatingError] = useState<string | null>(null)
  const loadedHistoryForSessionRef = useRef<string | null>(null)

  const canSend = Boolean(publicKey) && !chatLocked && !sessionExpired

  const {
    messages,
    setMessages,
    draft,
    setDraft,
    sending,
    streamingMessageId,
    error,
    setError,
    meetingBooking,
    setMeetingBooking,
    pendingToolUi,
    followupQuestions,
    setFollowupQuestions,
    liveAgentOffer,
    setLiveAgentOffer,
    stickToBottomRef,
    resetThread,
    appendAgentMessage,
    send,
  } = useAgentChatThread({
    canSend,
    stream: useCallback(
      async ({
        message,
        signal,
        onToken,
        onStatus,
        onToolUi,
        onUi,
        onDone,
        onFollowupQuestions,
      }) => {
        if (!publicKey) {
          throw new Error('Widget is not ready')
        }

        async function streamOnce(activeSessionId: string) {
          return streamPublicWidgetChat({
            publicKey: publicKey!,
            sessionId: activeSessionId,
            message,
            signal,
            onToken,
            onStatus,
            onToolUi,
            onUi,
            onDone,
            onFollowupQuestions,
          })
        }

        const ensuredSessionId = await ensureSession()
        if (signal.aborted) {
          throw new DOMException('Aborted', 'AbortError')
        }

        try {
          return await streamOnce(ensuredSessionId)
        } catch (firstErr) {
          const firstMessage =
            firstErr instanceof Error ? firstErr.message : ''
          if (
            firstMessage === 'Visitor token expired' ||
            firstMessage === 'Visitor authentication required'
          ) {
            const refreshed = await requestVisitorTokenRefresh()
            if (!refreshed || signal.aborted) throw firstErr
            const retrySessionId = await ensureSession()
            if (signal.aborted) {
              throw new DOMException('Aborted', 'AbortError')
            }
            return await streamOnce(retrySessionId)
          }
          throw firstErr
        }
      },
      [ensureSession, publicKey, requestVisitorTokenRefresh],
    ),
    onResult: useCallback(
      (result) => {
        const extras: {
          followupQuestions?: string[]
          liveAgentOffer?: LiveAgentOffer | null
          clearEmptyAgentMessage?: boolean
        } = {}
        if (chatSettings.enableFollowupQuestions) {
          extras.followupQuestions = result.followupQuestions
        }
        if (result.liveAgentOffer) {
          extras.liveAgentOffer = result.liveAgentOffer
          extras.clearEmptyAgentMessage = true
        }
        if (result.meetingBooking) {
          extras.clearEmptyAgentMessage = true
        }
        if (result.requestFeedback && !result.liveAgentOffer) {
          extras.clearEmptyAgentMessage = true
          setShowAiRating(true)
        }
        return extras
      },
      [chatSettings.enableFollowupQuestions],
    ),
    onError: useCallback(
      (err) => {
        const message = err.message || 'Failed to send message'

        if (
          message === 'Chat session expired' ||
          message === 'Chat session not found'
        ) {
          markSessionEnded()
          return { action: 'ignore' as const }
        }

        if (
          message === 'Visitor token expired' ||
          message === 'Visitor authentication required'
        ) {
          return {
            action: 'custom' as const,
            errorMessage:
              showLoginPrompt || chatLocked
                ? loginPrompt.message ||
                  'Please sign in to continue chatting.'
                : 'Session authentication expired. Please refresh or sign in again.',
            agentFallback: 'Something went wrong. Try again.',
          }
        }

        return { action: 'default' as const }
      },
      [
        chatLocked,
        loginPrompt.message,
        markSessionEnded,
        showLoginPrompt,
      ],
    ),
  })

  const renderImage = useMemo(
    () => (publicKey ? createPublicImageRenderer(publicKey) : () => null),
    [publicKey],
  )

  useEffect(() => {
    loadedHistoryForSessionRef.current = null
    resetThread([
      {
        id: newAgentChatMessageId(),
        role: 'agent',
        text: resolvedGreeting,
      },
    ])
    // eslint-disable-next-line react-hooks/exhaustive-deps -- full reset only on renew
  }, [sessionEpoch])

  useEffect(() => {
    setShowAiRating(false)
    setRatingStars(0)
    setRatingFeedback('')
    setRatingError(null)
  }, [sessionEpoch])

  // Restore persisted turns after session bootstrap / reload.
  useEffect(() => {
    if (!publicKey || !sessionId || sessionExpired) return
    if (loadedHistoryForSessionRef.current === sessionId) return

    let cancelled = false

    async function loadHistory() {
      try {
        let response = await getPublicChatSessionMessages(
          publicKey!,
          sessionId!,
        )
        if (
          !response.success &&
          (response.message === 'Visitor token expired' ||
            response.message === 'Visitor authentication required')
        ) {
          const refreshed = await requestVisitorTokenRefresh()
          if (refreshed && !cancelled) {
            response = await getPublicChatSessionMessages(
              publicKey!,
              sessionId!,
            )
          } else if (!cancelled) {
            return
          }
        }
        if (cancelled) return
        loadedHistoryForSessionRef.current = sessionId
        if (!response.success || !response.data?.messages?.length) return

        const mapped = response.data.messages
          .filter((message) => message.text.trim())
          .map((message) => ({
            id: message.id,
            role: (message.role === 'assistant' ? 'agent' : 'user') as
              | 'agent'
              | 'user',
            text: message.text,
          }))

        if (!mapped.some((message) => message.role === 'user')) return
        setMessages(mapped)
      } catch {
        // Do not lock the session id on network/auth failure   allow retry.
      }
    }

    void loadHistory()
    return () => {
      cancelled = true
    }
  }, [
    publicKey,
    requestVisitorTokenRefresh,
    sessionExpired,
    sessionEpoch,
    sessionId,
    setMessages,
  ])

  // Update greeting copy only while the thread is still greeting-only.
  useEffect(() => {
    setMessages((prev) => {
      if (prev.some((message) => message.role === 'user')) return prev
      if (prev.length === 1 && prev[0]?.role === 'agent') {
        if (prev[0].text === resolvedGreeting) return prev
        return [{ ...prev[0], text: resolvedGreeting }]
      }
      return prev
    })
  }, [resolvedGreeting, setMessages])

  useEffect(() => {
    const hasUserMessages = messages.some((message) => message.role === 'user')
    const last = messages[messages.length - 1]
    const preview = hasUserMessages
      ? (last?.text.trim() ||
          [...messages]
            .reverse()
            .find((message) => message.text.trim())
            ?.text.trim() ||
          '')
      : ''
    onThreadChange?.({ preview, hasUserMessages })
    if (hasUserMessages) setHadUserChat(true)
  }, [messages, onThreadChange, setHadUserChat])

  const requestLiveAgent = useCallback(async () => {
    if (!publicKey || liveCreating) return
    setLiveCreating(true)
    setError(null)
    try {
      const ensuredSessionId = await ensureSession()
      const response = await createPublicLiveAgentTicket(
        publicKey,
        ensuredSessionId,
      )
      if (!response.success || !response.data) {
        setError(response.message || 'Failed to request live agent')
        return
      }
      setLiveAgentOffer(null)
      setFollowupQuestions([])
      onLiveAgentStarted?.(response.data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to request live agent',
      )
    } finally {
      setLiveCreating(false)
    }
  }, [
    ensureSession,
    liveCreating,
    onLiveAgentStarted,
    publicKey,
    setError,
    setFollowupQuestions,
    setLiveAgentOffer,
  ])

  async function submitAiRating() {
    const ratingSessionId = sessionId ?? endedSessionId
    if (!publicKey || !ratingSessionId || ratingStars < 1 || ratingSubmitting) {
      return
    }
    setRatingSubmitting(true)
    setRatingError(null)
    try {
      const response = await submitPublicAiFeedback(publicKey, ratingSessionId, {
        stars: ratingStars,
        feedback: ratingFeedback,
        trigger: 'resolved',
      })
      if (!response.success) {
        setRatingError(response.message || 'Failed to submit rating')
        return
      }
      setShowAiRating(false)
      setAiFeedbackDone(true)
    } catch (err) {
      setRatingError(err instanceof Error ? err.message : 'Failed to submit rating')
    } finally {
      setRatingSubmitting(false)
    }
  }

  const agentName = chatSettings.agentName || 'AI Agent'
  const description =
    chatSettings.agentDescription?.trim() || 'The team can also help'
  const inputDisabled = chatLocked || sessionExpired || sending
  const hasUserMessages = messages.some((message) => message.role === 'user')
  const initialQuestions = chatSettings.initialQuestions.filter((q) => q.trim())
  const chipQuestions =
    !hasUserMessages
      ? initialQuestions
      : chatSettings.enableFollowupQuestions
        ? followupQuestions
        : []
  const showChips =
    !chatLocked &&
    !sessionExpired &&
    !sending &&
    chipQuestions.length > 0
  const showOffer = Boolean(liveAgentOffer) && !sending
  const showResolvedRating =
    showAiRating && !showOffer && !aiFeedbackDone && !liveAgentRated

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
            'flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg',
            darkMode ? 'bg-neutral-800' : 'bg-neutral-200',
          )}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-xs font-bold opacity-70">
              {agentName.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{agentName}</p>
          <p
            className={cn(
              'truncate text-[11px]',
              darkMode ? 'text-neutral-400' : 'text-neutral-500',
            )}
          >
            {description}
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

      {chatLocked || showLoginPrompt ? (
        <div
          className={cn(
            'flex shrink-0 gap-2 border-b px-4 py-2.5 text-xs leading-relaxed',
            darkMode
              ? 'border-white/10 bg-neutral-900 text-neutral-200'
              : 'border-neutral-200 bg-neutral-50 text-neutral-700',
          )}
        >
          <p>
            {chatLocked
              ? 'Sign in on this site to chat. Waiting for a visitor token from the host page.'
              : loginPrompt.message}
          </p>
          {showLoginPrompt && loginPrompt.loginLink.trim() ? (
            <a
              href={loginPrompt.loginLink.trim()}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'inline-flex w-fit items-center justify-center rounded-sm px-3 py-1.5 text-xs font-medium transition',
                darkMode
                  ? 'bg-white text-neutral-950 hover:bg-neutral-200'
                  : 'bg-neutral-900 text-white hover:bg-neutral-800',
              )}
            >
              Log in
            </a>
          ) : null}
        </div>
      ) : null}

      <AgentChatThread
        messages={messages}
        streamingMessageId={streamingMessageId}
        sending={sending}
        draft={draft}
        onDraftChange={setDraft}
        onSend={(text) => void send(text)}
        inputDisabled={inputDisabled}
        placeholder={
          chatLocked
            ? 'Authentication required…'
            : sessionExpired
              ? 'Session ended…'
              : sending
                ? 'Waiting for reply…'
                : 'Ask a question...'
        }
        error={error}
        darkMode={darkMode}
        agentLabel={agentName}
        renderImage={renderImage}
        stickToBottomRef={stickToBottomRef}
        hidePendingToolUi={showOffer}
        pendingToolUi={pendingToolUi}
        meetingBooking={meetingBooking}
        meetingPublicKey={publicKey}
        meetingSessionId={sessionId}
        onMeetingBooked={(result) => {
          setMeetingBooking(null)
          appendAgentMessage(
            `Your meeting has been arranged successfully for ${new Date(result.startsAt).toLocaleString(undefined, { timeZone: result.timezone })}.`,
          )
        }}
        onToolRetry={() => {
          const lastUser = [...messages]
            .reverse()
            .find((m) => m.role === 'user')
          if (lastUser?.text) void send(lastUser.text)
        }}
        belowMessages={
          showOffer ? (
            <div
              className={cn(
                'w-full max-w-[92%] rounded-2xl border p-4 shadow-sm',
                darkMode
                  ? 'border-sky-500/30 bg-sky-950/40'
                  : 'border-sky-200 bg-sky-50',
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-full',
                    darkMode
                      ? 'bg-sky-900 text-sky-100'
                      : 'bg-sky-100 text-sky-800',
                  )}
                >
                  <Headset className="size-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1 space-y-3">
                  <div>
                    <p
                      className={cn(
                        'text-sm font-semibold',
                        darkMode ? 'text-sky-50' : 'text-sky-950',
                      )}
                    >
                      Talk to a live agent
                    </p>
                    <p
                      className={cn(
                        'mt-1 text-xs leading-relaxed',
                        darkMode ? 'text-sky-100/80' : 'text-sky-900/80',
                      )}
                    >
                      {liveAgentOffer?.message ||
                        'Would you like to talk to a live agent?'}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={liveCreating}
                    onClick={() => void requestLiveAgent()}
                    className={cn(
                      'inline-flex w-full items-center justify-center rounded-full px-3 py-2 text-xs font-medium transition',
                      darkMode
                        ? 'bg-white text-neutral-950 hover:bg-neutral-200'
                        : 'bg-sky-900 text-white hover:bg-sky-800',
                      'disabled:opacity-50',
                    )}
                  >
                    {liveCreating ? 'Connecting…' : 'Talk to a live agent'}
                  </button>
                </div>
              </div>
            </div>
          ) : showResolvedRating ? (
            <WidgetRatingPrompt
              darkMode={darkMode}
              submitting={ratingSubmitting}
              stars={ratingStars}
              feedback={ratingFeedback}
              onStars={setRatingStars}
              onFeedback={setRatingFeedback}
              onSubmit={() => void submitAiRating()}
              onSkip={() => {
                setShowAiRating(false)
                setAiFeedbackDone(true)
              }}
              error={ratingError}
            />
          ) : null
        }
        chips={
          showChips ? (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {chipQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  className={cn(
                    'rounded-full px-2.5 py-1 text-left text-[11px] font-medium transition',
                    darkMode
                      ? 'bg-neutral-900 text-neutral-100 ring-1 ring-white/10 hover:bg-neutral-800'
                      : 'bg-white text-neutral-800 ring-1 ring-neutral-200 hover:bg-neutral-50',
                  )}
                  onClick={() => void send(question)}
                >
                  {question}
                </button>
              ))}
            </div>
          ) : null
        }
        footer={
          <p
            className={cn(
              'mt-2 text-center text-[10px]',
              darkMode ? 'text-neutral-500' : 'text-neutral-400',
            )}
          >
            By chatting with us, you agree to our{' '}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              Privacy Policy
            </a>
          </p>
        }
      />
    </div>
  )
}
