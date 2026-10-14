import { apiFetch, apiUpload, type ApiResponseDto } from '#/lib/api'
import {
  VISITOR_TOKEN_REQUEST_MESSAGE_TYPE,
  WIDGET_EDGE_GAP,
  WIDGET_FULL_BLEED_MAX_HEIGHT,
  WIDGET_FULL_BLEED_MAX_WIDTH,
  WIDGET_LAUNCHER_FRAME_SIZE,
  WIDGET_PANEL_EXPANDED_WIDTH,
  WIDGET_PANEL_HEIGHT,
  WIDGET_PANEL_WIDTH,
  WIDGET_FRAME_MESSAGE_TYPE,
  WIDGET_LIFECYCLE_MESSAGE_TYPE,
  isWidgetCorner,
  type VisitorTokenRequestMessage,
  type WidgetCorner,
  type WidgetFrameMessage,
  type WidgetLifecycleMessage,
} from '#/lib/widgetFrameProtocol'

// The wire protocol lives in its own dependency-free module so the host-page
// loader can import it without pulling in the app's API client.
export * from '#/lib/widgetFrameProtocol'

export type WidgetSectionSettings = {
  enabled: boolean
}

export type WidgetChatSettings = {
  enabled: boolean
  initialQuestions: string[]
  enableFollowupQuestions: boolean
  agentProfilePicture: string
  agentDescription: string
  agentInitialMessage: string
  agentName: string
}

export type WidgetMediaType =
  | 'logo'
  | 'homeBackground'
  | 'buttonBackground'
  | 'agentAvatar'
  | 'badge'

export type ButtonTextAlign = 'start' | 'center' | 'end'

export const HOME_SECTION_TYPE_VALUES = [
  'goToChat',
  'latestNews',
  'faq',
  'linkCard',
] as const

export type HomeSectionType = (typeof HOME_SECTION_TYPE_VALUES)[number]

export const DEFAULT_HOME_GREETING = 'How can we help?'

export type HomeGoToChatElement = {
  id: string
  type: 'goToChat'
  label: string
  subtitle?: string
}

export type HomeLatestNewsElement = {
  id: string
  type: 'latestNews'
  title?: string
  limit: number
}

export type HomeFaqEntry = {
  articleId: string
  topicIds: string[]
}

export type WidgetFaqSettings = {
  enabled: boolean
  title?: string
  /** Show a search field above the article list (default true). */
  enableSearch?: boolean
  searchPlaceholder?: string
  entries: HomeFaqEntry[]
}

export type HomeFaqElement = {
  id: string
  type: 'faq'
  title?: string
  /** Show a search field above the article list (default true). */
  enableSearch?: boolean
  searchPlaceholder?: string
  entries: HomeFaqEntry[]
}

export type HomeLinkCardElement = {
  id: string
  type: 'linkCard'
  title?: string
  label: string
  url: string
  openInNewTab?: boolean
}

/** Stacked home sections (array order = display order). */
export type HomeSectionElement =
  | HomeGoToChatElement
  | HomeLatestNewsElement
  | HomeFaqElement
  | HomeLinkCardElement

/** @deprecated Prefer HomeSectionElement */
export type HomeCanvasElement = HomeSectionElement
export type HomeElementType = HomeSectionType

export type WidgetHomeSettings = {
  enabled: boolean
  logo: string
  /** Fixed greeting under the logo. */
  greeting: string
  /** Optional CSS hex color for the greeting (#RGB or #RRGGBB). */
  greetingColor?: string
  backgroundImage: string
  backgroundDim: number
  elements: HomeSectionElement[]
}

export const WIDGET_ACCESS_MODE_VALUES = [
  'authenticated',
  'anonymous',
  'both',
] as const
export type WidgetAccessMode = (typeof WIDGET_ACCESS_MODE_VALUES)[number]

export const VISITOR_JWT_ALGORITHM_VALUES = ['RS256', 'ES256'] as const
export type VisitorJwtAlgorithm =
  (typeof VISITOR_JWT_ALGORITHM_VALUES)[number]

export const DEFAULT_LOGIN_PROMPT_MESSAGE =
  'Log in to get a more personalized answer.'

export type WidgetLoginPrompt = {
  enabled: boolean
  message: string
  /** Optional URL; when set, chat shows a login button that opens it. */
  loginLink: string
}

export type Widget = {
  id: string
  apiKeyId: string
  publicKey: string
  enabled: boolean
  darkMode: boolean
  /** Launcher FAB image media id (uncropped). */
  badgeImage: string
  accessMode: WidgetAccessMode
  loginPrompt: WidgetLoginPrompt
  visitorJwtPublicKeyPem: string
  visitorJwtAlgorithm: VisitorJwtAlgorithm
  visitorJwtIssuer: string
  visitorAuthConfigured: boolean
  allowedDomains: string[]
  homeSettings: WidgetHomeSettings
  chatSettings: WidgetChatSettings
  faqSettings: WidgetFaqSettings
  newsSettings: WidgetSectionSettings
  createdAt: string
  updatedAt: string
}

export type PublicWidget = {
  publicKey: string
  enabled: boolean
  darkMode: boolean
  badgeImage: string
  accessMode: WidgetAccessMode
  loginPrompt: WidgetLoginPrompt
  visitorAuthConfigured: boolean
  visitorJwtAlgorithm: VisitorJwtAlgorithm
  visitorJwtIssuer: string
  allowedDomains: string[]
  homeSettings: WidgetHomeSettings
  chatSettings: WidgetChatSettings
  faqSettings: WidgetFaqSettings
  newsSettings: WidgetSectionSettings
}

export type UpdateWidgetInput = {
  enabled?: boolean
  darkMode?: boolean
  badgeImage?: string
  accessMode?: WidgetAccessMode
  loginPrompt?: Partial<WidgetLoginPrompt>
  visitorJwtPublicKeyPem?: string
  visitorJwtAlgorithm?: VisitorJwtAlgorithm
  visitorJwtIssuer?: string
  allowedDomains?: string[]
  homeSettings?: WidgetHomeSettings
  chatSettings?: Partial<WidgetChatSettings>
  faqSettings?: Partial<WidgetFaqSettings>
  newsSettings?: Partial<WidgetSectionSettings>
}

export function visitorJwtAudience(publicKey: string): string {
  return `sapai:widget:${publicKey}`
}

/** Ask the host page to remint and postMessage a visitor JWT. */
export function requestVisitorTokenFromHost(publicKey: string): void {
  if (typeof window === 'undefined' || window.parent === window) return
  const trimmed = publicKey.trim()
  if (!trimmed) return
  const message: VisitorTokenRequestMessage = {
    type: VISITOR_TOKEN_REQUEST_MESSAGE_TYPE,
    publicKey: trimmed,
  }
  window.parent.postMessage(message, resolveWidgetHostOrigin() ?? '*')
}

/** Client-side JWT exp (ms). Does not verify signature   scheduling only. */
export function readVisitorJwtExpMs(token: string): number | null {
  try {
    const parts = token.split('.')
    if (parts.length < 2 || !parts[1]) return null
    const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    const payload = JSON.parse(json) as { exp?: unknown }
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

/** True when token exists and its exp (if present) is still usable. */
export function isVisitorTokenUsable(
  token: string | null | undefined,
): token is string {
  if (!token?.trim()) return false
  const expMs = readVisitorJwtExpMs(token)
  if (expMs == null) return true
  return expMs > Date.now() + 5_000
}

export type CreateVisitorJwtResult = {
  token: string
  expiresAt: string
  audience: string
  issuer: string
}

/** Mint a visitor JWT for the signed-in host user (session Bearer required). */
export async function createVisitorJwt(
  publicKey: string,
  options?: {
    claims?: Record<string, unknown>
    expiresInSeconds?: number
  },
): Promise<ApiResponseDto<CreateVisitorJwtResult>> {
  return apiFetch<CreateVisitorJwtResult>('/auth/visitor-jwt', {
    method: 'POST',
    body: JSON.stringify({
      publicKey,
      ...(options?.claims ? { claims: options.claims } : {}),
      ...(options?.expiresInSeconds != null
        ? { expiresInSeconds: options.expiresInSeconds }
        : {}),
    }),
  })
}

export function defaultLoginPrompt(): WidgetLoginPrompt {
  return {
    enabled: false,
    message: DEFAULT_LOGIN_PROMPT_MESSAGE,
    loginLink: '',
  }
}

export function normalizeLoginPrompt(
  value: Partial<WidgetLoginPrompt> | undefined | null,
): WidgetLoginPrompt {
  const defaults = defaultLoginPrompt()
  if (!value) return defaults
  return {
    enabled: value.enabled ?? defaults.enabled,
    message: value.message?.trim() || defaults.message,
    loginLink: value.loginLink?.trim() || '',
  }
}

export type WidgetMediaOut = {
  mediaId: string
  type: WidgetMediaType
  url: string
}

export const MAX_WIDGET_MEDIA_BYTES = 5 * 1024 * 1024

export function defaultHomeSettings(): WidgetHomeSettings {
  return {
    enabled: true,
    logo: '',
    greeting: DEFAULT_HOME_GREETING,
    backgroundImage: '',
    backgroundDim: 0,
    elements: [],
  }
}

function isHomeSectionType(type: unknown): type is HomeSectionType {
  return (
    typeof type === 'string' &&
    (HOME_SECTION_TYPE_VALUES as readonly string[]).includes(type)
  )
}

function normalizeHomeSection(raw: unknown): HomeSectionElement | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const record = raw as Record<string, unknown>
  if (!isHomeSectionType(record.type) || typeof record.id !== 'string') {
    return null
  }
  const id = record.id
  switch (record.type) {
    case 'goToChat':
      return {
        id,
        type: 'goToChat',
        label:
          typeof record.label === 'string' && record.label.trim()
            ? record.label
            : 'Ask a question',
        ...(typeof record.subtitle === 'string' && record.subtitle.trim()
          ? { subtitle: record.subtitle }
          : {}),
      }
    case 'latestNews': {
      const limit =
        typeof record.limit === 'number' && Number.isFinite(record.limit)
          ? Math.min(50, Math.max(1, Math.round(record.limit)))
          : 3
      return {
        id,
        type: 'latestNews',
        limit,
        ...(typeof record.title === 'string' ? { title: record.title } : {}),
      }
    }
    case 'faq': {
      const entries = Array.isArray(record.entries)
        ? record.entries
            .filter(
              (entry): entry is { articleId: string; topicIds?: unknown } =>
                Boolean(
                  entry &&
                    typeof entry === 'object' &&
                    typeof (entry as { articleId?: unknown }).articleId ===
                      'string',
                ),
            )
            .map((entry) => ({
              articleId: entry.articleId,
              topicIds: Array.isArray(entry.topicIds)
                ? entry.topicIds.filter(
                    (id): id is string => typeof id === 'string',
                  )
                : [],
            }))
        : []
      return {
        id,
        type: 'faq',
        entries,
        ...(typeof record.title === 'string' ? { title: record.title } : {}),
        ...(typeof record.enableSearch === 'boolean'
          ? { enableSearch: record.enableSearch }
          : {}),
        ...(typeof record.searchPlaceholder === 'string'
          ? { searchPlaceholder: record.searchPlaceholder }
          : {}),
      }
    }
    case 'linkCard':
      return {
        id,
        type: 'linkCard',
        label:
          typeof record.label === 'string' && record.label.trim()
            ? record.label
            : 'Learn more',
        url: typeof record.url === 'string' ? record.url : 'https://',
        ...(typeof record.title === 'string' ? { title: record.title } : {}),
        ...(typeof record.openInNewTab === 'boolean'
          ? { openInNewTab: record.openInNewTab }
          : {}),
      }
  }
}

function migrateGreetingFromLegacyElements(
  elements: unknown[],
  explicitGreeting: unknown,
): string {
  if (typeof explicitGreeting === 'string' && explicitGreeting.trim()) {
    return explicitGreeting.trim()
  }
  for (const raw of elements) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue
    const record = raw as Record<string, unknown>
    if (
      (record.type === 'heading' || record.type === 'paragraph') &&
      typeof record.text === 'string' &&
      record.text.trim()
    ) {
      return record.text.trim()
    }
  }
  return DEFAULT_HOME_GREETING
}

export function normalizeHomeSettings(
  value: WidgetHomeSettings | null | undefined,
): WidgetHomeSettings {
  const defaults = defaultHomeSettings()
  if (!value) return defaults
  const rawElements = Array.isArray(value.elements) ? value.elements : []
  const elements = rawElements
    .map((el) => normalizeHomeSection(el))
    .filter((el): el is HomeSectionElement => el !== null)
  return {
    enabled: value.enabled ?? defaults.enabled,
    logo: value.logo ?? '',
    greeting: migrateGreetingFromLegacyElements(
      rawElements,
      (value as { greeting?: unknown }).greeting,
    ),
    ...(typeof value.greetingColor === 'string' &&
    /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.greetingColor.trim())
      ? { greetingColor: value.greetingColor.trim() }
      : {}),
    backgroundImage: value.backgroundImage ?? '',
    backgroundDim:
      typeof value.backgroundDim === 'number' ? value.backgroundDim : 0,
    elements,
  }
}

export function defaultChatSettings(): WidgetChatSettings {
  return {
    enabled: true,
    initialQuestions: [],
    enableFollowupQuestions: true,
    agentProfilePicture: '',
    agentDescription: 'The team can also help',
    agentInitialMessage: "Hi, you're speaking with our AI Agent.",
    agentName: 'AI Agent',
  }
}

export function normalizeChatSettings(
  value: Partial<WidgetChatSettings> | undefined | null,
): WidgetChatSettings {
  const defaults = defaultChatSettings()
  if (!value) return defaults
  return {
    enabled: value.enabled ?? defaults.enabled,
    initialQuestions: Array.isArray(value.initialQuestions)
      ? value.initialQuestions.filter((q) => typeof q === 'string' && q.trim())
      : defaults.initialQuestions,
    enableFollowupQuestions:
      value.enableFollowupQuestions ?? defaults.enableFollowupQuestions,
    agentProfilePicture:
      value.agentProfilePicture ?? defaults.agentProfilePicture,
    agentDescription: value.agentDescription ?? defaults.agentDescription,
    agentInitialMessage:
      value.agentInitialMessage ?? defaults.agentInitialMessage,
    agentName: value.agentName?.trim() || defaults.agentName,
  }
}

export function defaultFaqSettings(): WidgetFaqSettings {
  return {
    enabled: true,
    title: 'Help',
    enableSearch: true,
    searchPlaceholder: 'Search for help',
    entries: [],
  }
}

export function normalizeFaqSettings(
  value: Partial<WidgetFaqSettings> | undefined | null,
): WidgetFaqSettings {
  const defaults = defaultFaqSettings()
  if (!value) return defaults
  const entries = Array.isArray(value.entries)
    ? value.entries
        .filter(
          (entry): entry is HomeFaqEntry =>
            !!entry &&
            typeof entry === 'object' &&
            typeof entry.articleId === 'string' &&
            entry.articleId.trim().length > 0,
        )
        .map((entry) => ({
          articleId: entry.articleId.trim(),
          topicIds: Array.isArray(entry.topicIds)
            ? entry.topicIds.filter(
                (id): id is string =>
                  typeof id === 'string' && id.trim().length > 0,
              )
            : [],
        }))
    : defaults.entries
  return {
    enabled: value.enabled ?? defaults.enabled,
    ...(typeof value.title === 'string' && value.title.trim()
      ? { title: value.title.trim() }
      : { title: defaults.title }),
    enableSearch: value.enableSearch ?? defaults.enableSearch,
    ...(typeof value.searchPlaceholder === 'string' &&
    value.searchPlaceholder.trim()
      ? { searchPlaceholder: value.searchPlaceholder.trim() }
      : { searchPlaceholder: defaults.searchPlaceholder }),
    entries,
  }
}

export function newHomeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `home_${Math.random().toString(36).slice(2, 10)}`
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

function withApiKey(path: string, apiKeyId: string): string {
  const params = new URLSearchParams({ apiKeyId })
  return `${path}?${params.toString()}`
}

export async function getWidget(apiKeyId: string) {
  return apiFetch<Widget>(withApiKey('/widgets', apiKeyId))
}

export async function updateWidget(apiKeyId: string, body: UpdateWidgetInput) {
  return apiFetch<Widget>(withApiKey('/widgets', apiKeyId), {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export async function uploadWidgetMedia(
  apiKeyId: string,
  type: WidgetMediaType,
  file: File,
) {
  if (file.size > MAX_WIDGET_MEDIA_BYTES) {
    throw new Error('Image must be 5MB or smaller')
  }
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed')
  }
  const formData = new FormData()
  formData.append('file', file)
  const params = new URLSearchParams({ apiKeyId, type })
  return apiUpload<WidgetMediaOut>(`/widgets/media?${params.toString()}`, formData)
}

/** Authenticated media URL for builder preview. */
export function widgetOwnedMediaPath(
  mediaId: string,
  apiKeyId: string,
): string {
  return `${API_BASE_URL}${withApiKey(`/widgets/media/${encodeURIComponent(mediaId)}`, apiKeyId)}`
}

/** Public media URL for embed. */
export function widgetPublicMediaPath(
  publicKey: string,
  mediaId: string,
): string {
  return `${API_BASE_URL}/widgets/public/${encodeURIComponent(publicKey)}/media/${encodeURIComponent(mediaId)}`
}

/** Badge / logo / home background — the chrome that must paint on first open. */
export function publicWidgetChromeImageUrls(
  publicKey: string,
  widget: PublicWidget,
): string[] {
  const home = normalizeHomeSettings(widget.homeSettings)
  const urls: string[] = []
  const badge = widget.badgeImage?.trim()
  if (badge) urls.push(widgetPublicMediaPath(publicKey, badge))
  if (home.logo.trim()) {
    urls.push(widgetPublicMediaPath(publicKey, home.logo.trim()))
  }
  if (home.backgroundImage.trim()) {
    urls.push(widgetPublicMediaPath(publicKey, home.backgroundImage.trim()))
  }
  return urls
}

/** Resolve when images are decoded (or fail / time out). Never rejects. */
export function preloadImageUrls(
  urls: string[],
  timeoutMs = 8000,
): Promise<void> {
  const unique = [...new Set(urls.filter(Boolean))]
  if (unique.length === 0 || typeof Image === 'undefined') {
    return Promise.resolve()
  }
  const loadAll = Promise.all(
    unique.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image()
          img.onload = () => resolve()
          img.onerror = () => resolve()
          img.src = src
        }),
    ),
  ).then(() => undefined)
  const timeout = new Promise<void>((resolve) => {
    setTimeout(resolve, timeoutMs)
  })
  return Promise.race([loadAll, timeout])
}

export function widgetPublicLiveAgentMediaPath(
  publicKey: string,
  mediaId: string,
): string {
  return `${API_BASE_URL}/widgets/public/${encodeURIComponent(publicKey)}/live-agent-media/${encodeURIComponent(mediaId)}`
}

export function resolveWidgetMediaUrl(opts: {
  mediaId: string
  apiKeyId?: string
  publicKey?: string
}): string | null {
  if (!opts.mediaId) return null
  if (opts.publicKey) {
    return widgetPublicMediaPath(opts.publicKey, opts.mediaId)
  }
  if (opts.apiKeyId) {
    return widgetOwnedMediaPath(opts.mediaId, opts.apiKeyId)
  }
  return null
}

/** Unauthenticated public embed config. */
export async function getPublicWidget(
  publicKey: string,
): Promise<ApiResponseDto<PublicWidget>> {
  const response = await fetch(
    `${API_BASE_URL}/widgets/public/${encodeURIComponent(publicKey)}`,
    {
      headers: { 'Content-Type': 'application/json' },
    },
  )

  let body: ApiResponseDto<PublicWidget>
  try {
    body = (await response.json()) as ApiResponseDto<PublicWidget>
  } catch {
    throw new Error('Invalid server response')
  }

  return body
}

export type PublicFaqTopic = {
  id: string
  topicName: string
  enabled: boolean
}

export type PublicFaqArticle = {
  id: string
  title: string
  enabled: boolean
  topics: PublicFaqTopic[]
}

export type PublicFaqContent = {
  articles: PublicFaqArticle[]
}

/** Public FAQ article/topic metadata for home canvas FAQ blocks. */
export async function getPublicWidgetFaqContent(
  publicKey: string,
): Promise<ApiResponseDto<PublicFaqContent>> {
  const response = await fetch(
    `${API_BASE_URL}/widgets/public/${encodeURIComponent(publicKey)}/faq-content`,
    {
      headers: { 'Content-Type': 'application/json' },
    },
  )

  let body: ApiResponseDto<PublicFaqContent>
  try {
    body = (await response.json()) as ApiResponseDto<PublicFaqContent>
  } catch {
    throw new Error('Invalid server response')
  }

  return body
}

export type PublicArticleTopic = {
  id: string
  topicName: string
  enabled: boolean
  topicContent: string
}

export type PublicArticleDetail = {
  id: string
  title: string
  description: string
  enabled: boolean
  topics: PublicArticleTopic[]
}

export async function getPublicWidgetArticle(
  publicKey: string,
  articleId: string,
): Promise<ApiResponseDto<PublicArticleDetail>> {
  const response = await fetch(
    `${API_BASE_URL}/widgets/public/${encodeURIComponent(publicKey)}/articles/${encodeURIComponent(articleId)}`,
    {
      headers: { 'Content-Type': 'application/json' },
    },
  )

  let body: ApiResponseDto<PublicArticleDetail>
  try {
    body = (await response.json()) as ApiResponseDto<PublicArticleDetail>
  } catch {
    throw new Error('Invalid server response')
  }

  return body
}

export function widgetPublicArticleMediaPath(
  publicKey: string,
  mediaId: string,
): string {
  return `${API_BASE_URL}/widgets/public/${encodeURIComponent(publicKey)}/article-media/${encodeURIComponent(mediaId)}`
}

function widgetCornerStorageKey(publicKey: string): string {
  return `sapai-widget-corner:${publicKey}`
}

export function readStoredWidgetCorner(publicKey: string): WidgetCorner {
  if (typeof window === 'undefined') return 'bottom-right'
  const raw = window.localStorage.getItem(widgetCornerStorageKey(publicKey))
  return isWidgetCorner(raw) ? raw : 'bottom-right'
}

export function writeStoredWidgetCorner(
  publicKey: string,
  corner: WidgetCorner,
): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(widgetCornerStorageKey(publicKey), corner)
}

export function snapWidgetCorner(x: number, y: number): WidgetCorner {
  const left = x < window.innerWidth / 2
  const top = y < window.innerHeight / 2
  if (top) return left ? 'top-left' : 'top-right'
  return left ? 'bottom-left' : 'bottom-right'
}

/** Iframe position on the host page. */
export function widgetHostCornerClass(corner: WidgetCorner): string {
  switch (corner) {
    case 'top-left':
      return 'top-0 left-0'
    case 'top-right':
      return 'top-0 right-0'
    case 'bottom-left':
      return 'bottom-0 left-0'
    default:
      return 'bottom-0 right-0'
  }
}

/** FAB/panel anchor inside the embed. */
export function widgetAppAnchorClass(corner: WidgetCorner): string {
  switch (corner) {
    case 'top-left':
      return 'top-4 left-4 origin-top-left'
    case 'top-right':
      return 'top-4 right-4 origin-top-right'
    case 'bottom-left':
      return 'bottom-4 left-4 origin-bottom-left'
    default:
      return 'bottom-4 right-4 origin-bottom-right'
  }
}

export function widgetShellAlignClass(corner: WidgetCorner): string {
  switch (corner) {
    case 'top-left':
      return 'items-start justify-start'
    case 'top-right':
      return 'items-start justify-end'
    case 'bottom-left':
      return 'items-end justify-start'
    default:
      return 'items-end justify-end'
  }
}

/** Viewport assumed until the loader reports the real host viewport. */
export const WIDGET_FALLBACK_VIEWPORT = { width: 1024, height: 768 } as const

export type WidgetGeometry = {
  /** Size the iframe must be for the current phase. */
  frameWidth: number
  frameHeight: number
  /**
   * Size of the panel itself. Stays at its open size even while closed so the
   * panel never reflows to the launcher-sized frame mid-animation.
   */
  panelWidth: number
  panelHeight: number
  fullBleed: boolean
}

/**
 * Single source of truth for the widget's dimensions, derived from the host
 * viewport the loader reports rather than from the iframe's own viewport
 * (which the host controls and which changes as the frame resizes).
 */
export function widgetGeometry(options: {
  open: boolean
  expanded: boolean
  /** Keep the wide iframe only while the panel width is animating. */
  reserveExpandedWidth?: boolean
  viewportWidth: number
  viewportHeight: number
}): WidgetGeometry {
  const {
    open,
    expanded,
    reserveExpandedWidth = false,
    viewportWidth,
    viewportHeight,
  } = options
  const fullBleed =
    viewportWidth < WIDGET_FULL_BLEED_MAX_WIDTH ||
    viewportHeight < WIDGET_FULL_BLEED_MAX_HEIGHT

  if (fullBleed) {
    return {
      frameWidth: open ? viewportWidth : WIDGET_LAUNCHER_FRAME_SIZE,
      frameHeight: open ? viewportHeight : WIDGET_LAUNCHER_FRAME_SIZE,
      panelWidth: viewportWidth,
      panelHeight: viewportHeight,
      fullBleed: open,
    }
  }

  const gap = WIDGET_EDGE_GAP * 2
  const panelWidth = Math.min(
    expanded ? WIDGET_PANEL_EXPANDED_WIDTH : WIDGET_PANEL_WIDTH,
    viewportWidth - gap,
  )
  const panelHeight = Math.min(WIDGET_PANEL_HEIGHT, viewportHeight - gap)
  // Wide frame only while expanded, or for the width transition, so a settled
  // narrow panel does not leave a transparent iframe over the host page.
  const framePanelWidth = Math.min(
    expanded || reserveExpandedWidth
      ? WIDGET_PANEL_EXPANDED_WIDTH
      : WIDGET_PANEL_WIDTH,
    viewportWidth - gap,
  )

  return {
    frameWidth: open ? framePanelWidth + gap : WIDGET_LAUNCHER_FRAME_SIZE,
    frameHeight: open ? panelHeight + gap : WIDGET_LAUNCHER_FRAME_SIZE,
    panelWidth,
    panelHeight,
    fullBleed: false,
  }
}

function isHttpOrigin(value: string): boolean {
  try {
    const url = new URL(value)
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      `${url.origin}` === value
    )
  } catch {
    return false
  }
}

function originOf(value: string): string | null {
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

/**
 * Origin of the page that embedded us.
 *
 * Prefer the loader's `hostOrigin` query param (always matches the page that
 * posts host-env). Fall back to `document.referrer` when the param is missing.
 * Returns null when the widget is not framed.
 */
export function resolveWidgetHostOrigin(): string | null {
  if (typeof window === 'undefined' || window.parent === window) return null

  try {
    const claimed = new URL(window.location.href).searchParams
      .get('hostOrigin')
      ?.trim()
    if (claimed && isHttpOrigin(claimed)) return claimed
  } catch {
    // fall through to referrer
  }

  return document.referrer ? originOf(document.referrer) : null
}

export function postWidgetFrame(
  message: Omit<WidgetFrameMessage, 'type'>,
): void {
  if (typeof window === 'undefined' || window.parent === window) return
  const payload: WidgetFrameMessage = {
    type: WIDGET_FRAME_MESSAGE_TYPE,
    ...message,
  }
  // `*` — a wrong hostOrigin target silently drops the message and the
  // loader never re-sends viewport size (widget stays hidden until resize).
  window.parent.postMessage(payload, '*')
}

export function postWidgetLifecycle(
  message: Omit<WidgetLifecycleMessage, 'type'>,
): void {
  if (typeof window === 'undefined' || window.parent === window) return
  const payload: WidgetLifecycleMessage = {
    type: WIDGET_LIFECYCLE_MESSAGE_TYPE,
    ...message,
  }
  window.parent.postMessage(payload, '*')
}


/** Normalize an allowlist entry or browser host to host[:port]. */
export function normalizeEmbedDomain(value: string): string {
  let domain = value.trim().toLowerCase()
  domain = domain.replace(/^https?:\/\//, '')
  domain = domain.split('/')[0] ?? domain
  return domain
}

/**
 * True when the current page host is listed in allowedDomains.
 * Empty allowlist blocks all hosts (domains must be registered).
 */
export function isEmbedHostAllowed(
  allowedDomains: string[],
  host: string = typeof window !== 'undefined' ? window.location.host : '',
): boolean {
  if (!host || allowedDomains.length === 0) return false
  const current = normalizeEmbedDomain(host)
  const hostname = current.split(':')[0] ?? current
  return allowedDomains.some((entry) => {
    const allowed = normalizeEmbedDomain(entry)
    return allowed === current || allowed === hostname
  })
}

/** Strip dangerous SVG constructs before rendering. */
export function sanitizeSvgMarkup(markup: string): string {
  return markup
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<foreignObject[\s\S]*?>[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '')
}

export type PublicChatSessionVisitor = {
  sub: string
  claims: Record<string, unknown>
}

/**
 * Personalize copy with visitor JWT claims.
 * Supports `{{claims.field}}` or `{{claims.field || "fallback"}}` (single quotes OK).
 * Missing/empty claim → fallback (or empty string).
 */
export function resolveVisitorTemplate(
  template: string,
  visitor: PublicChatSessionVisitor | null | undefined,
): string {
  return template.replace(
    /\{\{\s*claims\.([A-Za-z0-9_]+)\s*(?:\|\|\s*(?:"([^"]*)"|'([^']*)'))?\s*\}\}/g,
    (_match, field: string, doubleQuoted?: string, singleQuoted?: string) => {
      const fallback = doubleQuoted ?? singleQuoted ?? ''
      const raw = visitor?.claims?.[field]
      if (raw === null || raw === undefined) return fallback
      const text = String(raw).trim()
      return text.length > 0 ? text : fallback
    },
  )
}

export type PublicChatSession = {
  id: string
  expiredAt: string
  visitorAuthMode: 'anonymous' | 'authenticated'
  visitor: PublicChatSessionVisitor | null
  /** ISO expiry of the bound visitor JWT; null when anonymous. */
  tokenExp?: string | null
}

export type PublicChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAt: string
}

export type PublicChatMessages = {
  messages: PublicChatMessage[]
}

export type StoredWidgetChatSession = {
  id: string
  expiredAt: string
}

function widgetSessionStorageKey(publicKey: string): string {
  return `sapai_widget_session_${publicKey}`
}

export function readStoredWidgetChatSession(
  publicKey: string,
): StoredWidgetChatSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(widgetSessionStorageKey(publicKey))
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredWidgetChatSession
    if (
      typeof parsed?.id !== 'string' ||
      typeof parsed?.expiredAt !== 'string' ||
      !parsed.id ||
      !parsed.expiredAt
    ) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function writeStoredWidgetChatSession(
  publicKey: string,
  session: StoredWidgetChatSession,
): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(
    widgetSessionStorageKey(publicKey),
    JSON.stringify(session),
  )
}

export function clearStoredWidgetChatSession(publicKey: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(widgetSessionStorageKey(publicKey))
}

const VISIT_COOLDOWN_MS = 30 * 60 * 1000

export function recordPublicWidgetVisit(publicKey: string): void {
  if (typeof window === 'undefined') return
  const trimmed = publicKey.trim()
  if (!trimmed) return
  const storageKey = `sapai-widget-visit:${trimmed}`
  const last = Number(window.localStorage.getItem(storageKey) ?? 0)
  if (Number.isFinite(last) && Date.now() - last < VISIT_COOLDOWN_MS) return
  window.localStorage.setItem(storageKey, String(Date.now()))
  void fetch(`${API_BASE_URL}/widgets/public/${encodeURIComponent(trimmed)}/visit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }).catch(() => undefined)
}

export type WidgetAiFeedbackTrigger = 'resolved' | 'session_end'

export async function submitPublicAiFeedback(
  publicKey: string,
  sessionId: string,
  input: { stars: number; feedback?: string; trigger: WidgetAiFeedbackTrigger },
) {
  const response = await fetch(
    `${API_BASE_URL}/widgets/public/${encodeURIComponent(publicKey)}/chat-sessions/${encodeURIComponent(sessionId)}/rating`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
  )
  return (await response.json()) as ApiResponseDto<{
    chatSessionId: string
    stars: number
    submitted: true
  }>
}

export async function createPublicChatSession(
  publicKey: string,
  options?: { visitorToken?: string },
): Promise<ApiResponseDto<PublicChatSession>> {
  const response = await fetch(
    `${API_BASE_URL}/widgets/public/${encodeURIComponent(publicKey)}/chat-sessions`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        options?.visitorToken
          ? { visitorToken: options.visitorToken }
          : {},
      ),
    },
  )

  let body: ApiResponseDto<PublicChatSession>
  try {
    body = (await response.json()) as ApiResponseDto<PublicChatSession>
  } catch {
    throw new Error('Invalid server response')
  }

  return body
}

export async function bindPublicVisitorIdentity(
  publicKey: string,
  sessionId: string,
  visitorToken: string,
): Promise<ApiResponseDto<PublicChatSession>> {
  const response = await fetch(
    `${API_BASE_URL}/widgets/public/${encodeURIComponent(publicKey)}/chat-sessions/${encodeURIComponent(sessionId)}/identity`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorToken }),
    },
  )

  let body: ApiResponseDto<PublicChatSession>
  try {
    body = (await response.json()) as ApiResponseDto<PublicChatSession>
  } catch {
    throw new Error('Invalid server response')
  }

  return body
}

export async function getPublicChatSession(
  publicKey: string,
  sessionId: string,
): Promise<ApiResponseDto<PublicChatSession>> {
  const response = await fetch(
    `${API_BASE_URL}/widgets/public/${encodeURIComponent(publicKey)}/chat-sessions/${encodeURIComponent(sessionId)}`,
    {
      headers: { 'Content-Type': 'application/json' },
    },
  )

  let body: ApiResponseDto<PublicChatSession>
  try {
    body = (await response.json()) as ApiResponseDto<PublicChatSession>
  } catch {
    throw new Error('Invalid server response')
  }

  return body
}

export async function getPublicChatSessionMessages(
  publicKey: string,
  sessionId: string,
): Promise<ApiResponseDto<PublicChatMessages>> {
  const response = await fetch(
    `${API_BASE_URL}/widgets/public/${encodeURIComponent(publicKey)}/chat-sessions/${encodeURIComponent(sessionId)}/messages`,
    {
      headers: { 'Content-Type': 'application/json' },
    },
  )

  let body: ApiResponseDto<PublicChatMessages>
  try {
    body = (await response.json()) as ApiResponseDto<PublicChatMessages>
  } catch {
    throw new Error('Invalid server response')
  }

  return body
}

export async function deletePublicChatSession(
  publicKey: string,
  sessionId: string,
): Promise<ApiResponseDto<null>> {
  const response = await fetch(
    `${API_BASE_URL}/widgets/public/${encodeURIComponent(publicKey)}/chat-sessions/${encodeURIComponent(sessionId)}`,
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    },
  )

  let body: ApiResponseDto<null>
  try {
    body = (await response.json()) as ApiResponseDto<null>
  } catch {
    throw new Error('Invalid server response')
  }

  return body
}

export async function createOwnedChatSession(apiKeyId: string) {
  return apiFetch<PublicChatSession>(
    withApiKey('/widgets/chat-sessions', apiKeyId),
    { method: 'POST' },
  )
}

export async function bindOwnedVisitorIdentity(
  apiKeyId: string,
  sessionId: string,
  visitorToken: string,
) {
  return apiFetch<PublicChatSession>(
    withApiKey(
      `/widgets/chat-sessions/${encodeURIComponent(sessionId)}/identity`,
      apiKeyId,
    ),
    {
      method: 'POST',
      body: JSON.stringify({ visitorToken }),
    },
  )
}

export async function getOwnedChatSession(apiKeyId: string, sessionId: string) {
  return apiFetch<PublicChatSession>(
    withApiKey(
      `/widgets/chat-sessions/${encodeURIComponent(sessionId)}`,
      apiKeyId,
    ),
  )
}

export async function deleteOwnedChatSession(
  apiKeyId: string,
  sessionId: string,
) {
  return apiFetch<null>(
    withApiKey(
      `/widgets/chat-sessions/${encodeURIComponent(sessionId)}`,
      apiKeyId,
    ),
    { method: 'DELETE' },
  )
}

export type LiveAgentTicketStatus = 'queued' | 'claimed' | 'closed'

export type PublicLiveAgentTicket = {
  id: string
  apiKeyId: string
  publicKey: string
  chatSessionId: string
  visitorAuthMode: 'anonymous' | 'authenticated'
  visitorSub: string | null
  status: LiveAgentTicketStatus
  assignedAgentId: string | null
  assignedAgentName: string | null
  assignedAgentProfilePicture: string | null
  latestMessagePreview: string
  queuedAt: string
  claimedAt: string | null
  closedAt: string | null
  rating: { stars: number; feedback: string; submittedAt: string } | null
  queuePosition?: number | null
  createdAt: string
  updatedAt: string
}

export type PublicLiveAgentTicketMessage = {
  id: string
  ticketId: string
  senderType: 'visitor' | 'agent' | 'system'
  senderId: string
  text: string
  createdAt: string
}

export async function createPublicLiveAgentTicket(
  publicKey: string,
  sessionId: string,
) {
  const response = await fetch(
    `${API_BASE_URL}/widgets/public/${encodeURIComponent(publicKey)}/live-agent-tickets`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    },
  )
  return (await response.json()) as ApiResponseDto<PublicLiveAgentTicket>
}

export async function getActivePublicLiveAgentTicket(
  publicKey: string,
  sessionId: string,
) {
  const response = await fetch(
    `${API_BASE_URL}/widgets/public/${encodeURIComponent(publicKey)}/live-agent-tickets/active?sessionId=${encodeURIComponent(sessionId)}`,
  )
  return (await response.json()) as ApiResponseDto<PublicLiveAgentTicket | null>
}

export async function listPublicLiveAgentTicketMessages(
  publicKey: string,
  sessionId: string,
  ticketId: string,
) {
  const response = await fetch(
    `${API_BASE_URL}/widgets/public/${encodeURIComponent(publicKey)}/live-agent-tickets/${encodeURIComponent(ticketId)}/messages?sessionId=${encodeURIComponent(sessionId)}`,
  )
  return (await response.json()) as ApiResponseDto<
    PublicLiveAgentTicketMessage[]
  >
}

export async function postPublicLiveAgentTicketMessage(
  publicKey: string,
  sessionId: string,
  ticketId: string,
  text: string,
) {
  const response = await fetch(
    `${API_BASE_URL}/widgets/public/${encodeURIComponent(publicKey)}/live-agent-tickets/${encodeURIComponent(ticketId)}/messages?sessionId=${encodeURIComponent(sessionId)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    },
  )
  return (await response.json()) as ApiResponseDto<PublicLiveAgentTicketMessage>
}

export async function submitPublicLiveAgentTicketRating(
  publicKey: string,
  sessionId: string,
  ticketId: string,
  input: { stars: number; feedback?: string },
) {
  const response = await fetch(
    `${API_BASE_URL}/widgets/public/${encodeURIComponent(publicKey)}/live-agent-tickets/${encodeURIComponent(ticketId)}/rating?sessionId=${encodeURIComponent(sessionId)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
  )
  return (await response.json()) as ApiResponseDto<PublicLiveAgentTicket>
}
