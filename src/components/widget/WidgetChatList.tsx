import { Headset, MessageSquareText } from 'lucide-react'
import WidgetChromeActions from '#/components/widget/WidgetChromeActions'
import { cn } from '#/lib/utils'
import {
  widgetPublicLiveAgentMediaPath,
  type PublicLiveAgentTicket,
  type WidgetChatSettings,
} from '#/lib/widget'

type WidgetChatListProps = {
  chatSettings: WidgetChatSettings
  avatarUrl?: string
  darkMode?: boolean
  /** Latest line from the active bot session thread (if any). */
  preview?: string | null
  hasConversation?: boolean
  liveTicket?: PublicLiveAgentTicket | null
  livePreview?: string | null
  onOpenAgent: () => void
  onOpenLive?: () => void
}

export default function WidgetChatList({
  chatSettings,
  avatarUrl,
  darkMode = false,
  preview = null,
  hasConversation = false,
  liveTicket = null,
  livePreview = null,
  onOpenAgent,
  onOpenLive,
}: WidgetChatListProps) {
  const agentName = chatSettings.agentName || 'AI Agent'
  const fallbackPreview =
    chatSettings.agentInitialMessage?.trim() ||
    'Start a conversation with the agent'
  const threadPreview = hasConversation
    ? preview?.trim() || 'Conversation in progress'
    : fallbackPreview

  const showLiveContact = Boolean(
    liveTicket &&
      (liveTicket.status === 'queued' ||
        liveTicket.status === 'claimed' ||
        (liveTicket.status === 'closed' && !liveTicket.rating)),
  )
  const liveName =
    liveTicket?.assignedAgentName?.trim() || 'Live Agent'
  const liveAvatarUrl =
    liveTicket?.status === 'claimed' &&
    liveTicket.publicKey &&
    liveTicket.assignedAgentProfilePicture?.trim()
      ? widgetPublicLiveAgentMediaPath(
          liveTicket.publicKey,
          liveTicket.assignedAgentProfilePicture.trim(),
        )
      : null
  const liveThreadPreview =
    livePreview?.trim() ||
    liveTicket?.latestMessagePreview?.trim() ||
    (liveTicket?.status === 'queued'
      ? `Waiting in queue (#${liveTicket.queuePosition ?? '…'})`
      : liveTicket?.status === 'closed'
        ? 'Rate this conversation'
        : 'Live agent chat')

  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col',
        darkMode ? 'bg-neutral-950 text-neutral-50' : 'bg-white text-neutral-900',
      )}
    >
      <div className="flex shrink-0 items-center justify-between px-4 pt-4 pb-3">
        <h2 className="text-lg font-semibold tracking-tight">Messages</h2>
        <WidgetChromeActions />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <button
          type="button"
          onClick={onOpenAgent}
          className={cn(
            'flex w-full items-center gap-3 px-4 py-3 text-left transition',
            darkMode ? 'hover:bg-white/5' : 'hover:bg-neutral-50',
          )}
        >
          <div
            className={cn(
              'flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full',
              darkMode ? 'bg-neutral-800' : 'bg-neutral-200',
            )}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="size-full object-cover" />
            ) : (
              <MessageSquareText className="size-5 opacity-70" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-sm font-semibold">{agentName}</p>
              <span
                className={cn(
                  'shrink-0 text-[11px]',
                  darkMode ? 'text-neutral-500' : 'text-neutral-400',
                )}
              >
                {hasConversation ? 'Now' : ''}
              </span>
            </div>
            <p
              className={cn(
                'mt-0.5 truncate text-xs',
                darkMode ? 'text-neutral-400' : 'text-neutral-500',
              )}
            >
              {threadPreview}
            </p>
            <p
              className={cn(
                'mt-0.5 text-[10px] font-medium uppercase tracking-wide',
                darkMode ? 'text-neutral-500' : 'text-neutral-400',
              )}
            >
              AI Agent
            </p>
          </div>
        </button>

        {showLiveContact ? (
          <button
            type="button"
            onClick={onOpenLive}
            className={cn(
              'flex w-full items-center gap-3 px-4 py-3 text-left transition',
              darkMode ? 'hover:bg-white/5' : 'hover:bg-neutral-50',
            )}
          >
            <div
              className={cn(
                'relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full',
                darkMode ? 'bg-sky-900' : 'bg-sky-100',
              )}
            >
              {liveAvatarUrl ? (
                <img
                  src={liveAvatarUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <Headset
                  className={cn(
                    'size-5',
                    darkMode ? 'text-sky-100' : 'text-sky-800',
                  )}
                />
              )}
              {liveTicket?.status === 'claimed' ? (
                <span className="absolute right-0.5 bottom-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-neutral-950" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-sm font-semibold">{liveName}</p>
                <span
                  className={cn(
                    'shrink-0 text-[11px]',
                    darkMode ? 'text-neutral-500' : 'text-neutral-400',
                  )}
                >
                  Now
                </span>
              </div>
              <p
                className={cn(
                  'mt-0.5 truncate text-xs',
                  darkMode ? 'text-neutral-400' : 'text-neutral-500',
                )}
              >
                {liveThreadPreview}
              </p>
              <p
                className={cn(
                  'mt-0.5 text-[10px] font-medium uppercase tracking-wide',
                  darkMode ? 'text-sky-400' : 'text-sky-700',
                )}
              >
                Live Agent
              </p>
            </div>
          </button>
        ) : null}

        {!hasConversation && !showLiveContact ? (
          <div className="flex flex-col items-center px-6 pt-10 pb-6 text-center">
            <div
              className={cn(
                'mb-4 flex size-14 items-center justify-center rounded-2xl',
                darkMode ? 'bg-neutral-900' : 'bg-neutral-100',
              )}
            >
              <MessageSquareText
                className={cn(
                  'size-7',
                  darkMode ? 'text-neutral-200' : 'text-neutral-700',
                )}
              />
            </div>
            <p className="text-base font-semibold">No messages</p>
            <p
              className={cn(
                'mt-1 max-w-[220px] text-sm',
                darkMode ? 'text-neutral-400' : 'text-neutral-500',
              )}
            >
              Messages from the team will be shown here
            </p>
            <button
              type="button"
              onClick={onOpenAgent}
              className={cn(
                'mt-8 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition',
                darkMode
                  ? 'bg-white text-neutral-950 hover:bg-neutral-200'
                  : 'bg-neutral-950 text-white hover:bg-neutral-800',
              )}
            >
              Ask a question
              <span
                className={cn(
                  'flex size-5 items-center justify-center rounded-full text-xs',
                  darkMode ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-950',
                )}
              >
                ?
              </span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
