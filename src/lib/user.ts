import { apiFetch } from '#/lib/api'

export type DeepseekUsage = {
  percent: number
}

export type DashboardOverviewProject = {
  apiKeyId: string
  label: string
  status: string
  visits: number
  chatUsed: number
}

export type DashboardOverview = {
  from: string
  to: string
  lookbackDays: number
  totals: {
    visits: number
    chatUsed: number
    faqViews: number
    newsViews: number
    involvementRate: number
  }
  projects: DashboardOverviewProject[]
  hottestApiKeyId: string | null
}

export async function getDeepseekUsage() {
  return apiFetch<DeepseekUsage>('/user/deepseek-usage')
}

export async function getDashboardOverview() {
  return apiFetch<DashboardOverview>('/user/dashboard-overview')
}
