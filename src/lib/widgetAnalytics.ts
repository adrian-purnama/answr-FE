import { apiFetch } from '#/lib/api'

export type WidgetUsageNamedCount = {
  id: string
  label: string
  count: number
}

export type WidgetCsatComment = {
  stars: number
  feedback: string
  agentName?: string
  submittedAt: string
}

export type WidgetCsatSummary = {
  averageStars: number | null
  ratingCount: number
  recent: WidgetCsatComment[]
  byAgent: Array<{ name: string; averageStars: number; ratingCount: number }>
}

export type WidgetAnalyticsSummary = {
  from: string
  to: string
  lookbackDays: number
  visits: number
  chatUsed: number
  involvementRate: number
  faqViews: number
  newsViews: number
  aiResolvedCount: number
  liveAgentRoutedCount: number
  topFaq: WidgetUsageNamedCount[]
  topNews: WidgetUsageNamedCount[]
  aiAgent: WidgetCsatSummary
  liveAgent: WidgetCsatSummary
}

function withApiKey(path: string, apiKeyId: string) {
  const sep = path.includes('?') ? '&' : '?'
  return `${path}${sep}apiKeyId=${encodeURIComponent(apiKeyId)}`
}

export async function getWidgetAnalyticsSummary(
  apiKeyId: string,
  query: { from?: string; to?: string } = {},
) {
  const params = new URLSearchParams()
  if (query.from) params.set('from', query.from)
  if (query.to) params.set('to', query.to)
  const qs = params.toString()
  return apiFetch<WidgetAnalyticsSummary>(
    withApiKey(`/widget-analytics/summary${qs ? `?${qs}` : ''}`, apiKeyId),
  )
}
