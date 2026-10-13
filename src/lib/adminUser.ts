export type AdminUser = {
  id: string
  email: string
  planId: string | null
  planName: string | null
  /** ISO timestamp, or null when the plan never expires. */
  planExpiresAt: string | null
  isAdmin: boolean
  isBlocked: boolean
}

export type AdminUserList = {
  items: AdminUser[]
  page: number
  pageSize: number
  total: number
}

export type PlanPeriodSyncStatus = {
  nextRunAt: string | null
  lastRunAt: string | null
  msUntilNext: number | null
  intervalMs: number
  running: boolean
}

export type PlanPeriodSyncResult = PlanPeriodSyncStatus & {
  usersProcessed: number
  keysResynced: number
  skipped: boolean
}

export type DeepseekTokenAdjustment = {
  requestedAmount: number
  appliedAmount: number
  reason: string
  source: 'admin' | 'invoice'
  invoiceId: string | null
  adminUserId: string | null
  createdAt: string
}

export type UserPlanPeriod = {
  id: string
  userId: string
  planId: string
  planName: string | null
  effectiveDate: string
  untilDate: string
  neverExpires: boolean
  source: 'manual' | 'default_sync'
  createdAt: string | null
  createdBy: string | null
  deepseekQuotaPerPeriod: number
  quotaWindowDays: number | null
  windowCount: number | null
  deepseekTokenAdjustments: DeepseekTokenAdjustment[]
}

export type PlanPeriodGap = {
  effectiveDate: string
  untilDate: string
}

export type UserPlanTimeline = {
  periods: UserPlanPeriod[]
  gaps: PlanPeriodGap[]
  currentPeriodId: string | null
  page: number
  pageSize: number
  total: number
  previousCount: number
  upcomingCount: number
  currentPeriodPage: number | null
  latestPeriod: {
    id: string
    planName: string | null
    untilDate: string
    neverExpires: boolean
  } | null
  openPeriods: Array<{
    id: string
    planId: string
    planName: string | null
    effectiveDate: string
    untilDate: string
    neverExpires: boolean
    isCurrent: boolean
  }>
}

export type PlanPeriodsPreview = {
  wouldTruncate: boolean
  remainder: {
    planId: string
    planName: string | null
    effectiveDate: string
    untilDate: string
  } | null
  wouldCreateGaps: PlanPeriodGap[]
  normalizedPeriods: Array<{
    planId: string
    effectiveDate: string
    untilDate: string
    effectiveMode?: 'now' | 'absolute'
  }>
  truncatedPeriodHadTokenAdjustments: boolean
}

export type AddPlanPeriodsResult = {
  periods: UserPlanPeriod[]
  truncatedPeriodId: string | null
  remainderCreated: boolean
  timeline: UserPlanTimeline
  truncatedPeriodHadTokenAdjustments: boolean
}

export type CurrentPeriodQuota = {
  periodId: string
  planId: string
  planName: string | null
  deepseekQuotaPerPeriod: number
  quotaWindowDays: number | null
  windowCount: number | null
  deepseekWindow: {
    windowIndex: number
    inputTokens: number
    outputTokens: number
    totalTokens: number
    windowStart: string | null
    windowEnd: string | null
  } | null
  deepseekTokenAdjustments: DeepseekTokenAdjustment[]
}

export type AdminInvoice = {
  id: string
  userId: string
  /** Null for token_topup (not a plan sale). */
  planId: string | null
  /** Null for token_topup (not a plan sale). */
  planName: string | null
  type: 'plan_purchase' | 'token_topup'
  listPrice: number
  amount: number
  status: string
  startMode: 'immediate' | 'after_current' | null
  targetPeriodId: string | null
  deepseekTokens: number | null
  createdByAdminId: string | null
  manualPaidNote: string | null
  snapToken: string | null
  expiresAt: string
  paidAt: string | null
  activatedAt: string | null
  effectAppliedAt: string | null
  midtransTransactionStatus: string | null
  createdAt: string
  updatedAt: string
  simulatedPeriod: {
    planId: string
    planName: string
    effectiveDate: string
    untilDate: string
  } | null
}

export { formatDurationCountdown } from '#/lib/duration'

/** Format ISO as UTC datetime-local value (YYYY-MM-DDTHH:mm). */
export function toUtcDatetimeLocalValue(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`
}

/** Parse UTC datetime-local into ISO string. */
export function fromUtcDatetimeLocalValue(local: string): string {
  if (!local) return ''
  const [datePart, timePart = '00:00'] = local.split('T')
  const [y, m, d] = datePart.split('-').map(Number)
  const [hh, mm] = timePart.split(':').map(Number)
  return new Date(Date.UTC(y!, m! - 1, d!, hh ?? 0, mm ?? 0, 0, 0)).toISOString()
}

export type AdminUserDetail = AdminUser & {
  accountCreatedAt: string
  deepseekQuotaPerPeriod: number
  deepseekWindow: {
    windowIndex: number
    inputTokens: number
    outputTokens: number
    totalTokens: number
    windowStart: string | null
    windowEnd: string | null
  } | null
  currentPeriodId: string | null
  currentPeriodWindowCount: number | null
  projects: AdminUserProject[]
  sharedProjects: Array<{ id: string; label: string }>
}

export type AdminUserProject = {
  id: string
  label: string
  articles: Array<{ id: string; title: string; topicCount: number }>
  guidanceCount: number
  snippetCount: number
  batches: Array<{ id: string; name: string; questionCount: number }>
  liveAgentCount: number
  mcpCount: number
  meetingTopicCount: number
  leadCount: number | null
}
