import { useEffect, useState } from 'react'
import {
  useWidgetRuntime,
  type WidgetTab,
} from '#/components/widget/context/WidgetRuntimeContext'
import { WIDGET_TAB_META } from '#/components/widget/constants/widgetTabs'
import WidgetArticleReader from '#/components/widget/WidgetArticleReader'
import WidgetNewsReader from '#/components/widget/WidgetNewsReader'
import WidgetChromeActions from '#/components/widget/WidgetChromeActions'
import WidgetRatingPrompt from '#/components/widget/WidgetRatingPrompt'
import ChatPage from '#/components/widget/pages/ChatPage'
import FaqPage from '#/components/widget/pages/FaqPage'
import HomePage from '#/components/widget/pages/HomePage'
import NewsPage from '#/components/widget/pages/NewsPage'
import PlaceholderView from '#/components/widget/pages/PlaceholderView'
import { cn } from '#/lib/utils'
import { submitPublicAiFeedback } from '#/lib/widget'

function PageForTab({ tab }: { tab: WidgetTab }) {
  switch (tab) {
    case 'home':
      return <HomePage />
    case 'faq':
      return <FaqPage />
    case 'news':
      return <NewsPage />
    case 'chat':
      // Chat is mounted separately so it survives tab switches.
      return null
  }
}

export default function WidgetPanel({ className }: { className?: string }) {
  const {
    publicKey,
    darkMode,
    expanded,
    setExpanded,
    activeTab,
    setActiveTab,
    enabledTabs,
    chatView,
    setChatView,
    articleView,
    closeArticle,
    newsView,
    closeNews,
    chatSettings,
    backgroundUrl,
    backgroundDim,
    sessionExpired,
    endedSessionId,
    sessionEpoch,
    renewSession,
    hadUserChat,
    aiFeedbackDone,
    setAiFeedbackDone,
    liveAgentRated,
  } = useWidgetRuntime()
  const [ratingStars, setRatingStars] = useState(0)
  const [ratingFeedback, setRatingFeedback] = useState('')
  const [ratingSubmitting, setRatingSubmitting] = useState(false)
  const [ratingError, setRatingError] = useState<string | null>(null)
  const [ratingSkipped, setRatingSkipped] = useState(false)

  useEffect(() => {
    setRatingStars(0)
    setRatingFeedback('')
    setRatingError(null)
    setRatingSkipped(false)
  }, [sessionEpoch])

  const askEndRating =
    sessionExpired &&
    hadUserChat &&
    !aiFeedbackDone &&
    !liveAgentRated &&
    !ratingSkipped &&
    Boolean(publicKey && endedSessionId)

  const showArticle = Boolean(articleView && publicKey)
  const showNews = Boolean(newsView && publicKey)
  const chatEnabled = chatSettings.enabled
  const showAgentChat =
    !showArticle &&
    !showNews &&
    activeTab === 'chat' &&
    chatEnabled &&
    (chatView === 'agent' || chatView === 'live')

  const hideChrome = showArticle || showNews || showAgentChat
  const showTopChrome = !hideChrome && activeTab !== 'chat'
  const showChatLayer = chatEnabled && !showArticle && !showNews

  const panelStyle =
    backgroundUrl && !showArticle && !showNews && !showAgentChat
      ? {
          backgroundImage: `url(${backgroundUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
      : undefined

  const navTabs = WIDGET_TAB_META.filter((tab) => enabledTabs.includes(tab.id))

  return (
    <div
      className={cn(
        'relative flex h-full min-h-0 min-w-0 w-full flex-col overflow-hidden rounded-[1.75rem] shadow-2xl ring-1 transition-[width,max-width]',
        darkMode
          ? 'bg-neutral-950 ring-white/10'
          : 'bg-neutral-100 ring-black/10',
        className,
      )}
      style={panelStyle}
      data-expanded={expanded ? 'true' : 'false'}
    >
      {backgroundUrl && backgroundDim > 0 && !showArticle && !showNews && !showAgentChat ? (
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{ backgroundColor: `rgba(0,0,0,${backgroundDim / 100})` }}
          aria-hidden
        />
      ) : null}

      {showTopChrome ? (
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-end px-4 pt-3">
          <WidgetChromeActions variant="overlay" />
        </div>
      ) : null}

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        {showNews && newsView && publicKey ? (
          <WidgetNewsReader
            publicKey={publicKey}
            newsId={newsView.newsId}
            darkMode={darkMode}
            expanded={expanded}
            onToggleExpanded={() => setExpanded(!expanded)}
            onBack={closeNews}
          />
        ) : showArticle && articleView && publicKey ? (
          <WidgetArticleReader
            publicKey={publicKey}
            articleId={articleView.articleId}
            topicIds={articleView.topicIds}
            darkMode={darkMode}
            expanded={expanded}
            onToggleExpanded={() => setExpanded(!expanded)}
            onBack={closeArticle}
          />
        ) : (
          <>
            <div
              className={cn(
                'relative min-h-0 flex-1',
                showAgentChat ? 'overflow-hidden' : 'overflow-y-auto',
                activeTab === 'chat' ? '' : 'pt-12',
              )}
            >
              {/* Keep chat mounted across Home/FAQ/News so the session thread survives. */}
              {showChatLayer ? (
                <div
                  className={cn(
                    'h-full min-h-0',
                    activeTab === 'chat' ? 'block' : 'hidden',
                  )}
                >
                  <ChatPage />
                </div>
              ) : null}

              {activeTab !== 'chat' ? <PageForTab tab={activeTab} /> : null}

              {navTabs.length === 0 ? (
                <PlaceholderView
                  title="No sections enabled"
                  darkMode={darkMode}
                />
              ) : null}
            </div>

            {navTabs.length > 0 && !hideChrome ? (
              <nav
                className={cn(
                  'shrink-0 border-t px-2 pt-2 pb-3 backdrop-blur-sm',
                  darkMode
                    ? 'border-white/10 bg-neutral-950/95'
                    : 'border-neutral-200/80 bg-white/95',
                )}
              >
                <ul
                  className="grid gap-1"
                  style={{
                    gridTemplateColumns: `repeat(${navTabs.length}, minmax(0, 1fr))`,
                  }}
                >
                  {navTabs.map(({ id, label, Icon }) => {
                    const isActive = activeTab === id
                    return (
                      <li key={id}>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab(id)
                            if (id === 'chat') setChatView('agent')
                          }}
                          className={cn(
                            'flex w-full flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[11px] font-medium transition',
                            isActive
                              ? darkMode
                                ? 'text-white'
                                : 'text-neutral-900'
                              : darkMode
                                ? 'text-neutral-500 hover:text-neutral-300'
                                : 'text-neutral-400 hover:text-neutral-600',
                          )}
                          aria-current={isActive ? 'page' : undefined}
                          aria-label={label}
                        >
                          <Icon
                            className="size-5"
                            strokeWidth={isActive ? 2.25 : 1.75}
                            fill={
                              isActive && id === 'home' ? 'currentColor' : 'none'
                            }
                          />
                          {label}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </nav>
            ) : null}
          </>
        )}
      </div>

      {sessionExpired ? (
        <div
          className={cn(
            'absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 px-6 text-center backdrop-blur-sm',
            darkMode ? 'bg-neutral-950/90' : 'bg-white/90',
          )}
        >
          <div>
            <p
              className={cn(
                'text-base font-semibold',
                darkMode ? 'text-white' : 'text-neutral-900',
              )}
            >
              Session ended
            </p>
            <p
              className={cn(
                'mt-1 max-w-xs text-sm',
                darkMode ? 'text-neutral-400' : 'text-neutral-600',
              )}
            >
              {askEndRating
                ? 'How was this conversation?'
                : 'Your chat session has ended. Start a new one to continue.'}
            </p>
          </div>
          {askEndRating ? (
            <WidgetRatingPrompt
              darkMode={darkMode}
              submitting={ratingSubmitting}
              stars={ratingStars}
              feedback={ratingFeedback}
              onStars={setRatingStars}
              onFeedback={setRatingFeedback}
              error={ratingError}
              onSubmit={() => {
                void (async () => {
                  if (!publicKey || !endedSessionId || ratingStars < 1) return
                  setRatingSubmitting(true)
                  setRatingError(null)
                  try {
                    const response = await submitPublicAiFeedback(
                      publicKey,
                      endedSessionId,
                      {
                        stars: ratingStars,
                        feedback: ratingFeedback,
                        trigger: 'session_end',
                      },
                    )
                    if (!response.success) {
                      setRatingError(response.message || 'Failed to submit rating')
                      return
                    }
                    setAiFeedbackDone(true)
                  } catch (err) {
                    setRatingError(
                      err instanceof Error
                        ? err.message
                        : 'Failed to submit rating',
                    )
                  } finally {
                    setRatingSubmitting(false)
                  }
                })()
              }}
              onSkip={() => setRatingSkipped(true)}
            />
          ) : renewSession ? (
            <button
              type="button"
              onClick={() => void renewSession()}
              className={cn(
                'rounded-full px-5 py-2.5 text-sm font-semibold transition',
                darkMode
                  ? 'bg-white text-neutral-950 hover:bg-neutral-200'
                  : 'bg-neutral-950 text-white hover:bg-neutral-800',
              )}
            >
              Start new session
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
