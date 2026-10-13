import { useCallback, useEffect, useRef, useState } from 'react'
import {
  newAgentChatMessageId,
  stripUiMarkers,
} from '#/components/agentChat/agentChatMarkdown'
import type {
  AgentInfluence,
  AgentSseUiEvent,
  AgentToolUiEvent,
  LiveAgentOffer,
  PublicWidgetChatResult,
} from '#/lib/agent'
import type { MeetingBookingPayload } from '#/lib/meetingTool'
import type { ContentFormat } from '#/uiDesc/types'

export type AgentChatMessage = {
  id: string
  role: 'agent' | 'user'
  text: string
  contentFormat?: ContentFormat
  /** JSON UI description (validated at render time). */
  ui?: unknown
  influence?: AgentInfluence | null
  /** Milliseconds from send until first token / tool UI / done. */
  timeToFirstMs?: number
  /** Visitor-facing progress steps from status SSE events. */
  thoughtSteps?: string[]
}

export type AgentChatStreamFn = (options: {
  message: string
  signal: AbortSignal
  onToken: (text: string) => void
  onStatus?: (step: string) => void
  onToolUi: (event: AgentToolUiEvent) => void
  onUi?: (event: AgentSseUiEvent) => void
  onDone?: (result: PublicWidgetChatResult) => void
  onFollowupQuestions?: (questions: string[]) => void
}) => Promise<PublicWidgetChatResult>

export type AgentChatStreamResultExtras = {
  followupQuestions?: string[]
  liveAgentOffer?: LiveAgentOffer | null
  /** Drop empty streaming agent bubble when a card replaces it. */
  clearEmptyAgentMessage?: boolean
}

/** How the shared hook should apply a stream failure. */
export type AgentChatErrorHandling =
  | { action: 'default' }
  /** Caller already cleaned up (e.g. session ended). */
  | { action: 'ignore' }
  | {
      action: 'custom'
      errorMessage: string
      agentFallback?: string
    }

const INTERRUPTED_REPLY =
  'Sorry, the reply was interrupted. Please send your question again.'

export type UseAgentChatThreadOptions = {
  /** When false, send is a no-op. */
  canSend?: boolean
  stream: AgentChatStreamFn
  /** Persist influence from `done` onto the agent message (test panel). */
  storeInfluence?: boolean
  /**
   * Called after a successful stream. Return extras for follow-ups / live offer.
   * Throwing or returning is fine; session errors should be handled in onError.
   */
  onResult?: (
    result: PublicWidgetChatResult,
    ctx: { agentMessageId: string },
  ) => AgentChatStreamResultExtras | void
  /**
   * Map a stream error to how the hook should update UI.
   * Must not call setError/setMessages from the hook   return instructions instead
   * (avoids TDZ when the callback is created in the same render as the hook).
   */
  onError?: (
    error: Error,
    ctx: { agentMessageId: string },
  ) => AgentChatErrorHandling | void | Promise<AgentChatErrorHandling | void>
}

export function useAgentChatThread(options: UseAgentChatThreadOptions) {
  const {
    canSend = true,
    stream,
    storeInfluence = false,
    onResult,
    onError,
  } = options

  const [messages, setMessages] = useState<AgentChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null,
  )
  const [error, setError] = useState<string | null>(null)
  const [meetingBooking, setMeetingBooking] =
    useState<MeetingBookingPayload | null>(null)
  const [pendingToolUi, setPendingToolUi] = useState<AgentToolUiEvent | null>(
    null,
  )
  const [followupQuestions, setFollowupQuestions] = useState<string[]>([])
  const [liveAgentOffer, setLiveAgentOffer] = useState<LiveAgentOffer | null>(
    null,
  )

  const abortRef = useRef<AbortController | null>(null)
  const stickToBottomRef = useRef(true)
  const streamRef = useRef(stream)
  const onResultRef = useRef(onResult)
  const onErrorRef = useRef(onError)

  streamRef.current = stream
  onResultRef.current = onResult
  onErrorRef.current = onError

  const abortInFlight = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
  }, [])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const resetThread = useCallback(
    (nextMessages: AgentChatMessage[] = []) => {
      abortInFlight()
      setMessages(nextMessages)
      setDraft('')
      setSending(false)
      setStreamingMessageId(null)
      setError(null)
      setMeetingBooking(null)
      setPendingToolUi(null)
      setFollowupQuestions([])
      setLiveAgentOffer(null)
      stickToBottomRef.current = true
    },
    [abortInFlight],
  )

  const appendAgentMessage = useCallback((text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: newAgentChatMessageId(),
        role: 'agent',
        text,
      },
    ])
  }, [])

  const appendAgentUiMessage = useCallback(
    (options: { text: string; ui: unknown; contentFormat?: ContentFormat }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: newAgentChatMessageId(),
          role: 'agent',
          text: options.text,
          contentFormat: options.contentFormat ?? 'ui',
          ui: options.ui,
        },
      ])
    },
    [],
  )

  const applySuccessfulResult = useCallback(
    (result: PublicWidgetChatResult, agentId: string) => {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === agentId
            ? {
                ...message,
                text: stripUiMarkers(message.text),
                ...(storeInfluence ? { influence: result.influence } : {}),
              }
            : message,
        ),
      )

      const extras = onResultRef.current?.(result, {
        agentMessageId: agentId,
      })

      if (extras?.followupQuestions?.length) {
        setFollowupQuestions(extras.followupQuestions)
      }
      if (extras?.liveAgentOffer) {
        setPendingToolUi(null)
        setLiveAgentOffer(extras.liveAgentOffer)
      }

      const clearEmpty =
        extras?.clearEmptyAgentMessage ||
        Boolean(extras?.liveAgentOffer) ||
        Boolean(result.meetingBooking)

      if (clearEmpty) {
        setMessages((prev) =>
          prev.filter(
            (message) => !(message.id === agentId && !message.text.trim()),
          ),
        )
      }

      if (result.meetingBooking) {
        setPendingToolUi(null)
        setMeetingBooking(result.meetingBooking)
      } else if (!extras?.liveAgentOffer) {
        setPendingToolUi((prev) => (prev?.status === 'loading' ? null : prev))
      }
    },
    [storeInfluence],
  )

  const send = useCallback(
    async (text: string) => {
      if (!canSend || sending) return

      const trimmed = text.trim()
      if (!trimmed) return

      const userId = newAgentChatMessageId()
      const agentId = newAgentChatMessageId()
      stickToBottomRef.current = true
      setDraft('')
      setError(null)
      setFollowupQuestions([])
      setLiveAgentOffer(null)
      setMeetingBooking(null)
      setPendingToolUi(null)
      setSending(true)
      setStreamingMessageId(agentId)
      setMessages((prev) => [
        ...prev,
        { id: userId, role: 'user', text: trimmed },
        {
          id: agentId,
          role: 'agent',
          text: '',
          // Show the first step immediately so the thinking dropdown isn't blank
          // while waiting for the first status SSE event.
          thoughtSteps: ['Reading the question'],
        },
      ])

      const controller = new AbortController()
      abortRef.current?.abort()
      abortRef.current = controller
      let replyCompleted = false
      const startedAt = performance.now()
      let firstResponseRecorded = false

      const markTimeToFirst = () => {
        if (firstResponseRecorded) return
        firstResponseRecorded = true
        const timeToFirstMs = Math.round(performance.now() - startedAt)
        setMessages((prev) =>
          prev.map((message) =>
            message.id === agentId
              ? { ...message, timeToFirstMs }
              : message,
          ),
        )
      }

      const appendThoughtStep = (step: string) => {
        const trimmedStep = step.trim()
        if (!trimmedStep) return
        // Do not persist concrete MCP tool titles in the thinking trail.
        const safeStep = /^Using\s+/i.test(trimmedStep)
          ? 'Calling tools'
          : trimmedStep
        setMessages((prev) =>
          prev.map((message) => {
            if (message.id !== agentId) return message
            const prior = message.thoughtSteps ?? []
            if (prior[prior.length - 1] === safeStep) return message
            return {
              ...message,
              thoughtSteps: [...prior, safeStep],
            }
          }),
        )
      }

      try {
        const result = await streamRef.current({
          message: trimmed,
          signal: controller.signal,
          onToken: (token) => {
            if (token) markTimeToFirst()
            setMessages((prev) =>
              prev.map((message) =>
                message.id === agentId
                  ? {
                      ...message,
                      text: stripUiMarkers(message.text + token),
                    }
                  : message,
              ),
            )
          },
          onStatus: (step) => {
            appendThoughtStep(step)
          },
          onToolUi: (ui) => {
            markTimeToFirst()
            setPendingToolUi(ui)
            if (ui.status === 'error') {
              setMeetingBooking(null)
              setLiveAgentOffer(null)
            }
          },
          onUi: (event) => {
            markTimeToFirst()
            setMessages((prev) =>
              prev.map((message) =>
                message.id === agentId
                  ? {
                      ...message,
                      contentFormat: event.format,
                      ui: event.payload,
                    }
                  : message,
              ),
            )
          },
          onDone: (doneResult) => {
            if (controller.signal.aborted) return
            markTimeToFirst()
            replyCompleted = true
            applySuccessfulResult(doneResult, agentId)
            // Unlock input while optional follow-up suggestions still generate.
            setSending(false)
            setStreamingMessageId(null)
          },
          onFollowupQuestions: (questions) => {
            if (controller.signal.aborted) return
            if (questions.length > 0) {
              setFollowupQuestions(questions)
            }
          },
        })

        if (controller.signal.aborted) return

        // Fallback for stream wrappers that do not forward onDone.
        if (!replyCompleted) {
          markTimeToFirst()
          applySuccessfulResult(result, agentId)
        }
      } catch (err) {
        if (
          controller.signal.aborted ||
          (err instanceof DOMException && err.name === 'AbortError')
        ) {
          return
        }

        const error =
          err instanceof Error ? err : new Error('Failed to send message')
        const handling =
          (await onErrorRef.current?.(error, {
            agentMessageId: agentId,
          })) ?? { action: 'default' as const }

        if (handling.action === 'ignore') return

        if (handling.action === 'custom') {
          const message = handling.errorMessage
          setError(message)
          setPendingToolUi((prev) =>
            prev ? { ...prev, status: 'error', message } : prev,
          )
          // Always replace stubs   never leave a truncated partial as an "answer".
          setMessages((prev) =>
            prev.map((item) =>
              item.id === agentId
                ? {
                    ...item,
                    text: handling.agentFallback || INTERRUPTED_REPLY,
                  }
                : item,
            ),
          )
          return
        }

        const message = error.message || 'Failed to send message'
        setError(message)
        setPendingToolUi((prev) =>
          prev ? { ...prev, status: 'error', message } : prev,
        )
        setMessages((prev) =>
          prev.map((item) =>
            item.id === agentId
              ? {
                  ...item,
                  text: INTERRUPTED_REPLY,
                }
              : item,
          ),
        )
      } finally {
        const stillMine = abortRef.current === controller
        if (stillMine) {
          abortRef.current = null
        }
        // If a newer turn aborted this one, leave sending/streaming to the new turn.
        if (!controller.signal.aborted || stillMine) {
          setSending(false)
          setStreamingMessageId(null)
        }
      }
    },
    [applySuccessfulResult, canSend, sending],
  )

  return {
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
    abortInFlight,
    resetThread,
    appendAgentMessage,
    appendAgentUiMessage,
    send,
  }
}
