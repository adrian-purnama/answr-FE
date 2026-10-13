import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  defaultHomeSettings,
  normalizeHomeSettings,
  defaultLoginPrompt,
  normalizeChatSettings,
  normalizeLoginPrompt,
  widgetPublicMediaPath,
  type PublicChatSessionVisitor,
  type WidgetAccessMode,
  type WidgetChatSettings,
  type WidgetFaqSettings,
  type WidgetHomeSettings,
  type WidgetLoginPrompt,
  type WidgetSectionSettings,
} from '#/lib/widget'

export type WidgetTab = 'home' | 'chat' | 'faq' | 'news'

export type WidgetPanelSettings = {
  homeSettings: WidgetHomeSettings
  chatSettings: WidgetChatSettings
  faqSettings: WidgetFaqSettings
  newsSettings: WidgetSectionSettings
}

type ArticleViewState = {
  articleId: string
  topicIds: string[]
}

type NewsViewState = {
  newsId: string
}

type ChatView = 'agent' | 'list' | 'live'

type WidgetRuntimeContextValue = {
  publicKey?: string
  sessionId: string | null
  endedSessionId: string | null
  sessionExpired: boolean
  /** Bumps when a new session starts so the previous chat thread clears immediately. */
  sessionEpoch: number
  renewSession?: () => void | Promise<void>
  /** Returns a live session id, creating one if needed. */
  ensureSession: () => Promise<string>
  /**
   * Replace the current session with a new empty one (no UI epoch bump).
   * Use when the chat UI is greeting-only so backend history matches.
   */
  startFreshChatSession: () => Promise<string>
  /** Mark session ended (overlay); used on TTL, exit, or API expiry. */
  markSessionEnded: () => void
  /** Ask host to remint visitor JWT and wait for successful re-bind. */
  requestVisitorTokenRefresh: () => Promise<boolean>
  settings: WidgetPanelSettings
  homeSettings: WidgetHomeSettings
  chatSettings: WidgetChatSettings
  darkMode: boolean
  forceTab?: WidgetTab
  expanded: boolean
  setExpanded: (expanded: boolean) => void
  onClose?: () => void
  onExit?: () => void | Promise<void>
  activeTab: WidgetTab
  setActiveTab: (tab: WidgetTab) => void
  enabledTabs: WidgetTab[]
  chatView: ChatView
  setChatView: (view: ChatView) => void
  openAgentChat: () => void
  articleView: ArticleViewState | null
  openArticle: (articleId: string, topicIds: string[]) => void
  closeArticle: () => void
  newsView: NewsViewState | null
  openNews: (newsId: string) => void
  closeNews: () => void
  logoUrl?: string
  backgroundUrl?: string
  agentAvatarUrl?: string
  backgroundDim: number
  accessMode: WidgetAccessMode
  loginPrompt: WidgetLoginPrompt
  visitorAuthMode: 'anonymous' | 'authenticated'
  /** Verified visitor identity from the session JWT bind (claims for templates). */
  visitor: PublicChatSessionVisitor | null
  /** True when accessMode requires a visitor JWT that is not yet verified. */
  chatLocked: boolean
  showLoginPrompt: boolean
  hadUserChat: boolean
  setHadUserChat: (value: boolean) => void
  aiFeedbackDone: boolean
  setAiFeedbackDone: (value: boolean) => void
  liveAgentRated: boolean
  setLiveAgentRated: (value: boolean) => void
}

const WidgetRuntimeContext = createContext<WidgetRuntimeContextValue | null>(
  null,
)

export type WidgetRuntimeProviderProps = {
  children: ReactNode
  publicKey?: string
  settings: WidgetPanelSettings
  darkMode?: boolean
  forceTab?: WidgetTab
  expanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  onClose?: () => void
  onExit?: () => void | Promise<void>
  sessionId?: string | null
  endedSessionId?: string | null
  sessionExpired?: boolean
  sessionEpoch?: number
  renewSession?: () => void | Promise<void>
  ensureSession?: () => Promise<string>
  startFreshChatSession?: () => Promise<string>
  markSessionEnded?: () => void
  requestVisitorTokenRefresh?: () => Promise<boolean>
  accessMode?: WidgetAccessMode
  loginPrompt?: WidgetLoginPrompt
  visitorAuthMode?: 'anonymous' | 'authenticated'
  visitor?: PublicChatSessionVisitor | null
}

async function missingEnsureSession(): Promise<string> {
  throw new Error('Chat session is not available')
}

async function missingVisitorRefresh(): Promise<boolean> {
  return false
}

export function WidgetRuntimeProvider({
  children,
  publicKey,
  settings,
  darkMode = false,
  forceTab,
  expanded = false,
  onExpandedChange,
  onClose,
  onExit,
  sessionId = null,
  endedSessionId = null,
  sessionExpired = false,
  sessionEpoch = 0,
  renewSession,
  ensureSession = missingEnsureSession,
  startFreshChatSession = missingEnsureSession,
  markSessionEnded,
  requestVisitorTokenRefresh = missingVisitorRefresh,
  accessMode = 'both',
  loginPrompt: loginPromptProp,
  visitorAuthMode = 'anonymous',
  visitor = null,
}: WidgetRuntimeProviderProps) {
  const homeSettings = normalizeHomeSettings(
    settings.homeSettings ?? defaultHomeSettings(),
  )
  const chatSettings = normalizeChatSettings(settings.chatSettings)
  const loginPrompt = normalizeLoginPrompt(
    loginPromptProp ?? defaultLoginPrompt(),
  )
  const chatLocked =
    accessMode === 'authenticated' && visitorAuthMode !== 'authenticated'
  const showLoginPrompt =
    accessMode === 'both' &&
    loginPrompt.enabled &&
    visitorAuthMode !== 'authenticated'

  const backgroundDim = Math.min(
    100,
    Math.max(0, homeSettings.backgroundDim ?? 0),
  )

  const logoUrl =
    homeSettings.logo && publicKey
      ? widgetPublicMediaPath(publicKey, homeSettings.logo)
      : homeSettings.logo || undefined
  const backgroundUrl =
    homeSettings.backgroundImage && publicKey
      ? widgetPublicMediaPath(publicKey, homeSettings.backgroundImage)
      : homeSettings.backgroundImage || undefined
  const agentAvatarUrl =
    chatSettings.agentProfilePicture && publicKey
      ? widgetPublicMediaPath(publicKey, chatSettings.agentProfilePicture)
      : undefined

  const enabledTabs = useMemo(() => {
    const tabs: WidgetTab[] = ['home', 'chat', 'faq', 'news']
    return tabs.filter((id) => {
      const key =
        id === 'home'
          ? 'homeSettings'
          : id === 'chat'
            ? 'chatSettings'
            : id === 'faq'
              ? 'faqSettings'
              : 'newsSettings'
      return settings[key]?.enabled ?? true
    })
  }, [settings])

  const [activeTab, setActiveTab] = useState<WidgetTab>(
    forceTab ?? enabledTabs[0] ?? 'home',
  )
  const [chatView, setChatView] = useState<ChatView>('agent')
  const [articleView, setArticleView] = useState<ArticleViewState | null>(null)
  const [newsView, setNewsView] = useState<NewsViewState | null>(null)
  const [internalExpanded, setInternalExpanded] = useState(expanded)
  const [hadUserChat, setHadUserChat] = useState(false)
  const [aiFeedbackDone, setAiFeedbackDone] = useState(false)
  const [liveAgentRated, setLiveAgentRated] = useState(false)

  useEffect(() => {
    setHadUserChat(false)
    setAiFeedbackDone(false)
    setLiveAgentRated(false)
  }, [sessionEpoch])

  useEffect(() => {
    setInternalExpanded(expanded)
  }, [expanded])

  useEffect(() => {
    if (forceTab) {
      setActiveTab(forceTab)
      setArticleView(null)
      setNewsView(null)
      return
    }
    if (enabledTabs.length === 0) return
    if (!enabledTabs.includes(activeTab)) {
      setActiveTab(enabledTabs[0])
    }
  }, [activeTab, enabledTabs, forceTab])

  const setExpanded = useCallback(
    (next: boolean) => {
      setInternalExpanded(next)
      onExpandedChange?.(next)
    },
    [onExpandedChange],
  )

  const openAgentChat = useCallback(() => {
    if (!forceTab) setActiveTab('chat')
    setChatView('agent')
  }, [forceTab])

  const openArticle = useCallback(
    (articleId: string, topicIds: string[]) => {
      setNewsView(null)
      setArticleView({ articleId, topicIds })
      setExpanded(true)
    },
    [setExpanded],
  )

  const closeArticle = useCallback(() => {
    setArticleView(null)
    setExpanded(false)
  }, [setExpanded])

  const openNews = useCallback(
    (newsId: string) => {
      setArticleView(null)
      setNewsView({ newsId })
      setExpanded(true)
    },
    [setExpanded],
  )

  const closeNews = useCallback(() => {
    setNewsView(null)
    setExpanded(false)
  }, [setExpanded])

  const markEnded = useCallback(() => {
    markSessionEnded?.()
  }, [markSessionEnded])

  const value = useMemo<WidgetRuntimeContextValue>(
    () => ({
      publicKey,
      sessionId,
      endedSessionId,
      sessionExpired,
      sessionEpoch,
      renewSession,
      ensureSession,
      startFreshChatSession,
      markSessionEnded: markEnded,
      requestVisitorTokenRefresh,
      settings,
      homeSettings,
      chatSettings,
      darkMode,
      forceTab,
      expanded: internalExpanded,
      setExpanded,
      onClose,
      onExit,
      activeTab,
      setActiveTab,
      enabledTabs,
      chatView,
      setChatView,
      openAgentChat,
      articleView,
      openArticle,
      closeArticle,
      newsView,
      openNews,
      closeNews,
      logoUrl,
      backgroundUrl,
      agentAvatarUrl,
      backgroundDim,
      accessMode,
      loginPrompt,
      visitorAuthMode,
      visitor,
      chatLocked,
      showLoginPrompt,
      hadUserChat,
      setHadUserChat,
      aiFeedbackDone,
      setAiFeedbackDone,
      liveAgentRated,
      setLiveAgentRated,
    }),
    [
      publicKey,
      sessionId,
      endedSessionId,
      sessionExpired,
      sessionEpoch,
      renewSession,
      ensureSession,
      startFreshChatSession,
      markEnded,
      requestVisitorTokenRefresh,
      settings,
      homeSettings,
      chatSettings,
      darkMode,
      forceTab,
      internalExpanded,
      setExpanded,
      onClose,
      onExit,
      activeTab,
      enabledTabs,
      chatView,
      openAgentChat,
      articleView,
      openArticle,
      closeArticle,
      newsView,
      openNews,
      closeNews,
      logoUrl,
      backgroundUrl,
      agentAvatarUrl,
      backgroundDim,
      accessMode,
      loginPrompt,
      visitorAuthMode,
      visitor,
      chatLocked,
      showLoginPrompt,
      hadUserChat,
      aiFeedbackDone,
      liveAgentRated,
    ],
  )

  return (
    <WidgetRuntimeContext.Provider value={value}>
      {children}
    </WidgetRuntimeContext.Provider>
  )
}

export function useWidgetRuntime(): WidgetRuntimeContextValue {
  const ctx = useContext(WidgetRuntimeContext)
  if (!ctx) {
    throw new Error('useWidgetRuntime must be used within WidgetRuntimeProvider')
  }
  return ctx
}
