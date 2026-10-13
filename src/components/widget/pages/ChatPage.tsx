import { useCallback, useEffect, useState } from 'react'
import WidgetChatAgent from '#/components/widget/WidgetChatAgent'
import WidgetChatList from '#/components/widget/WidgetChatList'
import WidgetLiveAgentChat from '#/components/widget/WidgetLiveAgentChat'
import { useWidgetRuntime } from '#/components/widget/context/WidgetRuntimeContext'
import { cn } from '#/lib/utils'
import {
  getActivePublicLiveAgentTicket,
  type PublicLiveAgentTicket,
} from '#/lib/widget'

export default function ChatPage() {
  const {
    publicKey,
    sessionId,
    sessionExpired,
    sessionEpoch,
    chatSettings,
    darkMode,
    expanded,
    setExpanded,
    agentAvatarUrl,
    chatView,
    setChatView,
    setLiveAgentRated,
  } = useWidgetRuntime()
  const [threadPreview, setThreadPreview] = useState<string | null>(null)
  const [hasConversation, setHasConversation] = useState(false)
  const [liveTicket, setLiveTicket] = useState<PublicLiveAgentTicket | null>(
    null,
  )
  const [livePreview, setLivePreview] = useState<string | null>(null)

  const handleThreadChange = useCallback(
    ({
      preview,
      hasUserMessages,
    }: {
      preview: string
      hasUserMessages: boolean
    }) => {
      setHasConversation(hasUserMessages)
      setThreadPreview(hasUserMessages ? preview : null)
    },
    [],
  )

  const handleLiveThreadChange = useCallback(({ preview }: { preview: string }) => {
    setLivePreview(preview)
  }, [])

  const handleLiveAgentStarted = useCallback(
    (ticket: PublicLiveAgentTicket) => {
      setLiveTicket(ticket)
      setLivePreview(ticket.latestMessagePreview || 'Connecting to a live agent…')
      setChatView('live')
      setExpanded(true)
    },
    [setChatView, setExpanded],
  )

  // Restore active / pending-rating live ticket after reload.
  useEffect(() => {
    if (!publicKey || !sessionId || sessionExpired) return
    let cancelled = false
    async function restore() {
      try {
        const response = await getActivePublicLiveAgentTicket(
          publicKey!,
          sessionId!,
        )
        if (cancelled || !response.success || !response.data) return
        const ticket = response.data
        if (ticket.status === 'closed' && ticket.rating) return
        setLiveTicket(ticket)
        setLivePreview(
          ticket.latestMessagePreview ||
            (ticket.status === 'queued'
              ? `Waiting in queue (#${ticket.queuePosition ?? '…'})`
              : 'Live agent chat'),
        )
      } catch {
        // ignore
      }
    }
    void restore()
    return () => {
      cancelled = true
    }
  }, [publicKey, sessionExpired, sessionEpoch, sessionId])

  useEffect(() => {
    setLiveTicket(null)
    setLivePreview(null)
  }, [sessionEpoch])

  if (!chatSettings.enabled) return null

  const showLive =
    Boolean(liveTicket) &&
    (liveTicket!.status === 'queued' ||
      liveTicket!.status === 'claimed' ||
      (liveTicket!.status === 'closed' && !liveTicket!.rating))

  return (
    <div className="relative h-full min-h-0">
      {/* Keep AI agent mounted so the session thread survives list ↔ chat. */}
      <div
        className={cn(
          'h-full min-h-0',
          chatView === 'agent' ? 'block' : 'hidden',
        )}
      >
        <WidgetChatAgent
          chatSettings={chatSettings}
          avatarUrl={agentAvatarUrl}
          darkMode={darkMode}
          expanded={expanded}
          onToggleExpanded={() => setExpanded(!expanded)}
          onBack={() => {
            setChatView('list')
            setExpanded(false)
          }}
          onThreadChange={handleThreadChange}
          onLiveAgentStarted={handleLiveAgentStarted}
        />
      </div>

      {chatView === 'live' && liveTicket && showLive ? (
        <div className="absolute inset-0">
          <WidgetLiveAgentChat
            ticket={liveTicket}
            onTicketChange={(next) => {
              setLiveTicket(next)
              if (!next) {
                setLiveAgentRated(true)
                setLivePreview(null)
                setChatView('list')
                setExpanded(false)
              }
            }}
            darkMode={darkMode}
            expanded={expanded}
            onToggleExpanded={() => setExpanded(!expanded)}
            onBack={() => {
              setChatView('list')
              setExpanded(false)
            }}
            onThreadChange={handleLiveThreadChange}
          />
        </div>
      ) : null}

      {chatView === 'list' ? (
        <div className="absolute inset-0">
          <WidgetChatList
            chatSettings={chatSettings}
            avatarUrl={agentAvatarUrl}
            darkMode={darkMode}
            preview={threadPreview}
            hasConversation={hasConversation}
            liveTicket={showLive ? liveTicket : null}
            livePreview={livePreview}
            onOpenAgent={() => setChatView('agent')}
            onOpenLive={() => {
              if (showLive) {
                setChatView('live')
                setExpanded(true)
              }
            }}
          />
        </div>
      ) : null}
    </div>
  )
}
