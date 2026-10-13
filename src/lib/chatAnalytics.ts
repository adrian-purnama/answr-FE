import { apiFetch } from '#/lib/api'

export const MESSAGE_ANALYTICS_TYPES = [
  'query',
  'answer',
  'confirmation',
  'rejection',
  'clarification',
  'greeting',
  'acknowledgement',
  'farewell',
  'filler',
  'instruction',
  'tool_related',
] as const

export type MessageAnalyticsType = (typeof MESSAGE_ANALYTICS_TYPES)[number]

export const ANALYTICS_GAP_TYPES = [
  'missing_knowledge',
  'unsupported_action',
  'ambiguous_request',
  'tool_failure',
  'insufficient_context',
] as const

export type AnalyticsGapType = (typeof ANALYTICS_GAP_TYPES)[number]

/** Resolvable on the gaps page. Any other slug is a failure. */
export const KNOWLEDGE_GAP_TYPES = [
  'missing_knowledge',
  'insufficient_context',
] as const

export const FAILURE_GAP_TYPES = [
  'tool_failure',
  'unsupported_action',
  'ambiguous_request',
] as const

export type AnalyticsGapGroup = 'knowledge' | 'failure'

const KNOWLEDGE_GAP_TYPE_SET = new Set<string>(KNOWLEDGE_GAP_TYPES)

export function isKnowledgeGapType(gapType: string | undefined | null): boolean {
  return typeof gapType === 'string' && KNOWLEDGE_GAP_TYPE_SET.has(gapType)
}

export type AnalyticsCategory = {
  id: string
  name: string
  slug: string
  description?: string
  dimension?: 'category' | 'type' | 'gap' | 'answerable' | 'intent'
  isSystem: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type ChatAnalyticsRecord = {
  id: string
  chatMessageId: string
  chatSessionId: string
  conversationId: string
  userId: string
  apiKeyId: string
  categoryId: string
  categoryName?: string
  type: MessageAnalyticsType
  intent?: string
  answerable: boolean | null
  confidence: number
  gapDetected: boolean
  gapType?: AnalyticsGapType
  gapReason?: string
  gapResolved: boolean
  gapResolvedAt?: string
  messageRole: string
  messageCreatedAt: string
  createdAt: string
  updatedAt: string
}

export type ChatAnalyticsSummary = {
  from: string
  to: string
  lookbackDays: number
  totalMessages: number
  answerableCount: number
  unanswerableCount: number
  gapCount: number
  resolvedGapCount: number
  byType: Record<string, number>
  byCategoryId: Record<string, number>
  byGapType: Record<string, number>
}

export type ChatAnalyticsRecordsPage = {
  items: ChatAnalyticsRecord[]
  total: number
  page: number
  pageSize: number
}

export type ChatAnalyticsConversationMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  createdAt: string
  analysis?: {
    categoryId?: string
    type: string
    intent?: string
    answerable: boolean | null
    confidence: number
    gapDetected: boolean
    gapType?: string
    gapReason?: string
    gapResolved?: boolean
  } | null
}

export type ChatAnalyticsConversation = {
  chatSessionId: string
  conversationId: string
  messages: ChatAnalyticsConversationMessage[]
}

export type ChatAnalyticsTrendSeries = {
  key: string
  label: string
  total: number
  sharePercent: number
  points: number[]
}

export type ChatAnalyticsTrends = {
  from: string
  to: string
  lookbackDays: number
  dimension: 'category' | 'gapType' | 'type'
  dates: string[]
  totalMessages: number
  series: ChatAnalyticsTrendSeries[]
}

function withApiKey(path: string, apiKeyId: string) {
  const sep = path.includes('?') ? '&' : '?'
  return `${path}${sep}apiKeyId=${encodeURIComponent(apiKeyId)}`
}

function appendParam(
  params: URLSearchParams,
  key: string,
  value: string | number | boolean | undefined,
) {
  if (value === undefined || value === '') return
  params.set(key, String(value))
}

export type AnalyticsRangeQuery = {
  from?: string
  to?: string
}

export type AnalyticsTrendsQuery = AnalyticsRangeQuery & {
  dimension?: 'category' | 'gapType' | 'type'
  limit?: number
}

export type AnalyticsRecordsQuery = AnalyticsRangeQuery & {
  categoryId?: string
  type?: MessageAnalyticsType
  answerable?: boolean
  gapDetected?: boolean
  gapResolved?: boolean
  gapType?: AnalyticsGapType
  gapGroup?: AnalyticsGapGroup
  chatSessionId?: string
  page?: number
  pageSize?: number
}

export async function getChatAnalyticsSummary(
  apiKeyId: string,
  query: AnalyticsRangeQuery = {},
) {
  const params = new URLSearchParams()
  appendParam(params, 'from', query.from)
  appendParam(params, 'to', query.to)
  const qs = params.toString()
  return apiFetch<ChatAnalyticsSummary>(
    withApiKey(`/chat-analytics/summary${qs ? `?${qs}` : ''}`, apiKeyId),
  )
}

export async function getChatAnalyticsTrends(
  apiKeyId: string,
  query: AnalyticsTrendsQuery = {},
) {
  const params = new URLSearchParams()
  appendParam(params, 'from', query.from)
  appendParam(params, 'to', query.to)
  appendParam(params, 'dimension', query.dimension)
  appendParam(params, 'limit', query.limit)
  const qs = params.toString()
  return apiFetch<ChatAnalyticsTrends>(
    withApiKey(`/chat-analytics/trends${qs ? `?${qs}` : ''}`, apiKeyId),
  )
}

export async function listChatAnalyticsRecords(
  apiKeyId: string,
  query: AnalyticsRecordsQuery = {},
) {
  const params = new URLSearchParams()
  appendParam(params, 'from', query.from)
  appendParam(params, 'to', query.to)
  appendParam(params, 'categoryId', query.categoryId)
  appendParam(params, 'type', query.type)
  appendParam(params, 'answerable', query.answerable)
  appendParam(params, 'gapDetected', query.gapDetected)
  appendParam(params, 'gapResolved', query.gapResolved)
  appendParam(params, 'gapType', query.gapType)
  appendParam(params, 'gapGroup', query.gapGroup)
  appendParam(params, 'chatSessionId', query.chatSessionId)
  appendParam(params, 'page', query.page)
  appendParam(params, 'pageSize', query.pageSize)
  const qs = params.toString()
  return apiFetch<ChatAnalyticsRecordsPage>(
    withApiKey(`/chat-analytics/records${qs ? `?${qs}` : ''}`, apiKeyId),
  )
}

export async function getChatAnalyticsRecord(apiKeyId: string, id: string) {
  return apiFetch<ChatAnalyticsRecord>(
    withApiKey(`/chat-analytics/records/${encodeURIComponent(id)}`, apiKeyId),
  )
}

export async function resolveChatAnalyticsGap(apiKeyId: string, id: string) {
  return apiFetch<ChatAnalyticsRecord>(
    withApiKey(
      `/chat-analytics/records/${encodeURIComponent(id)}/resolve`,
      apiKeyId,
    ),
    { method: 'POST' },
  )
}

export async function getChatAnalyticsConversation(
  apiKeyId: string,
  sessionId: string,
) {
  return apiFetch<ChatAnalyticsConversation>(
    withApiKey(
      `/chat-analytics/conversations/${encodeURIComponent(sessionId)}`,
      apiKeyId,
    ),
  )
}

export async function listAnalyticsCategories(apiKeyId: string) {
  return apiFetch<AnalyticsCategory[]>(
    withApiKey('/chat-analytics/categories', apiKeyId),
  )
}

export async function createAnalyticsCategory(
  apiKeyId: string,
  input: {
    name: string
    slug?: string
    description: string
    dimension?: 'category' | 'type' | 'gap' | 'answerable' | 'intent'
  },
) {
  return apiFetch<AnalyticsCategory>('/chat-analytics/categories', {
    method: 'POST',
    body: JSON.stringify({ ...input, apiKeyId }),
  })
}

export async function updateAnalyticsCategory(
  apiKeyId: string,
  id: string,
  input: { name?: string; description?: string },
) {
  return apiFetch<AnalyticsCategory>(
    withApiKey(
      `/chat-analytics/categories/${encodeURIComponent(id)}`,
      apiKeyId,
    ),
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  )
}

export async function deleteAnalyticsCategory(apiKeyId: string, id: string) {
  return apiFetch<null>(
    withApiKey(
      `/chat-analytics/categories/${encodeURIComponent(id)}`,
      apiKeyId,
    ),
    { method: 'DELETE' },
  )
}

export function findAnalyticsOption(
  options: AnalyticsCategory[],
  dimension: NonNullable<AnalyticsCategory['dimension']>,
  key: string | undefined | null,
): AnalyticsCategory | undefined {
  if (!key) return undefined
  const needle = key.trim().toLowerCase()
  return options.find((option) => {
    if ((option.dimension ?? 'category') !== dimension) return false
    if (dimension === 'category' && option.id === key) return true
    return (
      option.slug === needle || option.name.trim().toLowerCase() === needle
    )
  })
}

export function formatAnalyticsType(type: string) {
  return type.replaceAll('_', ' ')
}

export function formatGapType(type: string) {
  return type.replaceAll('_', ' ')
}

function utcYmd(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function lookbackBoundsYmd(lookbackDays: number): {
  min: string
  max: string
} {
  const maxDate = new Date()
  const minDate = new Date(maxDate)
  minDate.setUTCHours(0, 0, 0, 0)
  minDate.setUTCDate(minDate.getUTCDate() - (Math.max(1, lookbackDays) - 1))
  return { min: utcYmd(minDate), max: utcYmd(maxDate) }
}

export function isoRangeFromYmd(
  fromYmd: string,
  toYmd: string,
): { from: string; to: string } {
  const from = new Date(`${fromYmd}T00:00:00.000Z`)
  const to =
    toYmd >= utcYmd(new Date())
      ? new Date()
      : new Date(`${toYmd}T23:59:59.999Z`)
  return { from: from.toISOString(), to: to.toISOString() }
}

export function clampYmdRange(
  fromYmd: string,
  toYmd: string,
  min: string,
  max: string,
): { from: string; to: string } {
  const clamp = (value: string) => {
    if (value < min) return min
    if (value > max) return max
    return value
  }
  const from = clamp(fromYmd)
  let to = clamp(toYmd)
  if (from > to) to = from
  return { from, to }
}

