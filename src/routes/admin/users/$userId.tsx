import { type FormEvent, useEffect, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import toast from 'react-hot-toast'
import { LoaderCircle } from 'lucide-react'
import PasswordInput from '#/components/forms/PasswordInput'
import PlanCombobox from '#/components/ui/plan-combobox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { UtcDateTimePicker } from '#/components/ui/utc-datetime-picker'
import type {
  AddPlanPeriodsResult,
  AdminInvoice,
  AdminUser,
  AdminUserDetail,
  CurrentPeriodQuota,
  PlanPeriodsPreview,
  UserPlanPeriod,
  UserPlanTimeline,
} from '#/lib/adminUser'
import {
  formatDurationCountdown,
  fromUtcDatetimeLocalValue,
  toUtcDatetimeLocalValue,
} from '#/lib/adminUser'
import { apiFetch } from '#/lib/api'
import type { Plan } from '#/lib/plan'
import {
  buttonClassName,
  buttonOutlineClassName,
  cardClassName,
  hintClassName,
} from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/admin/users/$userId')({
  component: AdminUserDetailPage,
})

const NEVER_UNTIL = '9999-01-01T00:00:00.000Z'
/** One period at a time (PeopleSoft-style record navigator). */
const PERIOD_PAGE_SIZE = 1

type EffectiveMode = 'now' | 'after_last' | 'custom'

type AdminUserTab = 'plan' | 'billing' | 'usage' | 'account' | 'projects'

const ADMIN_USER_TABS: Array<{ id: AdminUserTab; label: string }> = [
  { id: 'plan', label: 'Plan' },
  { id: 'billing', label: 'Billing' },
  { id: 'usage', label: 'Usage' },
  { id: 'account', label: 'Account' },
  { id: 'projects', label: 'Projects' },
]

function utcNowLocalValue(): string {
  return toUtcDatetimeLocalValue(new Date().toISOString())
}

/** Short UTC datetime for admin pickers (e.g. 4 Oct 2026, 09:54 UTC). */
function formatUtcDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const day = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
  const time = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  })
  return `${day}, ${time} UTC`
}

function AdminUserDetailPage() {
  const { userId } = Route.useParams()
  const [detail, setDetail] = useState<AdminUserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<Plan[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [timeline, setTimeline] = useState<UserPlanTimeline | null>(null)
  const [timelineLoading, setTimelineLoading] = useState(true)
  const [periodPage, setPeriodPage] = useState(1)
  const [jumpedToCurrent, setJumpedToCurrent] = useState(false)
  const [currentQuota, setCurrentQuota] = useState<CurrentPeriodQuota | null>(
    null,
  )

  const [planId, setPlanId] = useState('')
  const [effectiveMode, setEffectiveMode] = useState<EffectiveMode>('now')
  const [effectiveLocal, setEffectiveLocal] = useState('')
  const [untilLocal, setUntilLocal] = useState('')
  const [neverExpires, setNeverExpires] = useState(false)
  const [preserveRemainder, setPreserveRemainder] = useState(false)
  const [preview, setPreview] = useState<PlanPeriodsPreview | null>(null)
  const [savingPeriod, setSavingPeriod] = useState(false)

  const [adjustAmount, setAdjustAmount] = useState<Record<string, string>>({})
  const [adjustReason, setAdjustReason] = useState<Record<string, string>>({})
  const [adjustingId, setAdjustingId] = useState<string | null>(null)

  const [invoices, setInvoices] = useState<AdminInvoice[]>([])
  const [invoiceType, setInvoiceType] = useState<
    'plan_purchase' | 'token_topup'
  >('token_topup')
  const [invoicePlanId, setInvoicePlanId] = useState('')
  const [invoiceAmount, setInvoiceAmount] = useState('')
  const [invoiceStartMode, setInvoiceStartMode] = useState<
    'immediate' | 'after_current'
  >('after_current')
  const [invoiceTargetPeriodId, setInvoiceTargetPeriodId] = useState('')
  const [invoiceTokens, setInvoiceTokens] = useState('')
  const [creatingInvoice, setCreatingInvoice] = useState(false)
  const [pendingConflictId, setPendingConflictId] = useState<string | null>(
    null,
  )
  const [markPaidNote, setMarkPaidNote] = useState<Record<string, string>>({})
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null)
  const [showInvoiceHistory, setShowInvoiceHistory] = useState(false)
  const [activeTab, setActiveTab] = useState<AdminUserTab>('plan')

  const [password, setPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  async function refreshDetail() {
    const refreshed = await apiFetch<AdminUserDetail>(`/admin/users/${userId}`)
    if (refreshed.success && refreshed.data) setDetail(refreshed.data)
  }

  async function refreshCurrentQuota() {
    const response = await apiFetch<CurrentPeriodQuota | null>(
      `/admin/users/${userId}/current-period-quota`,
    )
    if (response.success) setCurrentQuota(response.data)
  }

  async function refreshTimeline(page = periodPage) {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PERIOD_PAGE_SIZE),
    })
    const response = await apiFetch<UserPlanTimeline>(
      `/admin/users/${userId}/plan-periods?${params.toString()}`,
    )
    if (response.success && response.data) {
      setTimeline(response.data)
      setPeriodPage(response.data.page)
    }
  }

  function goToPeriodPage(next: number) {
    if (!timeline) return
    const maxPage = Math.max(1, timeline.total)
    setPeriodPage(Math.min(maxPage, Math.max(1, next)))
  }

  async function refreshInvoices() {
    const response = await apiFetch<AdminInvoice[]>(
      `/admin/users/${userId}/invoices`,
    )
    if (response.success && response.data) setInvoices(response.data)
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void (async () => {
      try {
        const response = await apiFetch<AdminUserDetail>(`/admin/users/${userId}`)
        if (!response.success || !response.data) {
          if (!cancelled) toast.error(response.message || 'Failed to load user')
          return
        }
        if (!cancelled) {
          setDetail(response.data)
          if (response.data.currentPeriodId) {
            setInvoiceTargetPeriodId((prev) => prev || response.data!.currentPeriodId!)
          }
        }
      } catch {
        if (!cancelled) toast.error('Unable to reach the server')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    setJumpedToCurrent(false)
    setPeriodPage(1)
    setInvoiceTargetPeriodId('')
  }, [userId])

  useEffect(() => {
    let cancelled = false
    setTimelineLoading(true)
    void (async () => {
      try {
        const params = new URLSearchParams({
          page: String(periodPage),
          pageSize: String(PERIOD_PAGE_SIZE),
        })
        const response = await apiFetch<UserPlanTimeline>(
          `/admin/users/${userId}/plan-periods?${params.toString()}`,
        )
        if (!response.success || !response.data) {
          if (!cancelled) toast.error(response.message || 'Failed to load timeline')
          return
        }
        if (cancelled) return
        setTimeline(response.data)
        setInvoiceTargetPeriodId((prev) => {
          if (prev) {
            const stillOpen = response.data.openPeriods.some((p) => p.id === prev)
            if (stillOpen) return prev
          }
          const current =
            response.data.openPeriods.find((p) => p.isCurrent) ??
            response.data.openPeriods[0]
          return current?.id ?? ''
        })
        if (
          response.data.total > 0 &&
          response.data.page > response.data.total
        ) {
          setPeriodPage(response.data.total)
          return
        }
        if (
          !jumpedToCurrent &&
          response.data.currentPeriodPage != null &&
          response.data.currentPeriodPage !== response.data.page
        ) {
          setJumpedToCurrent(true)
          setPeriodPage(response.data.currentPeriodPage)
          return
        }
        if (!jumpedToCurrent) setJumpedToCurrent(true)
      } catch {
        if (!cancelled) toast.error('Unable to load plan timeline')
      } finally {
        if (!cancelled) setTimelineLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, periodPage, jumpedToCurrent])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const [quotaRes, invoiceRes] = await Promise.all([
          apiFetch<CurrentPeriodQuota | null>(
            `/admin/users/${userId}/current-period-quota`,
          ),
          apiFetch<AdminInvoice[]>(`/admin/users/${userId}/invoices`),
        ])
        if (!cancelled && quotaRes.success) setCurrentQuota(quotaRes.data)
        if (!cancelled && invoiceRes.success && invoiceRes.data) {
          setInvoices(invoiceRes.data)
        }
      } catch {
        /* non-fatal */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const response = await apiFetch<Plan[]>('/admin/plans')
        if (!response.success || !response.data) {
          toast.error(response.message || 'Failed to load plans')
          return
        }
        if (!cancelled) setPlans(response.data)
      } catch {
        toast.error('Unable to load plans')
      } finally {
        if (!cancelled) setPlansLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const latestPeriod = timeline?.latestPeriod ?? null
  const afterLastAvailable =
    latestPeriod !== null && !latestPeriod.neverExpires
  const afterLastLocal = afterLastAvailable
    ? toUtcDatetimeLocalValue(latestPeriod.untilDate)
    : ''
  const viewedPeriod = timeline?.periods[0] ?? null
  const periodTotal = timeline?.total ?? 0
  const periodIndex = timeline?.page ?? 1

  useEffect(() => {
    if (effectiveMode !== 'after_last') return
    if (afterLastAvailable && afterLastLocal) {
      setEffectiveLocal(afterLastLocal)
    }
  }, [effectiveMode, afterLastAvailable, afterLastLocal])

  function applyEffectiveMode(mode: EffectiveMode) {
    setEffectiveMode(mode)
    setPreview(null)
    if (mode === 'now') {
      setEffectiveLocal(utcNowLocalValue())
      return
    }
    if (mode === 'after_last') {
      if (!afterLastAvailable || !afterLastLocal) {
        toast.error(
          latestPeriod?.neverExpires
            ? 'Last period never expires   cannot continue after it'
            : 'No prior period to continue from',
        )
        return
      }
      setEffectiveLocal(afterLastLocal)
      return
    }
    // custom: keep current value (or seed now if empty)
    if (!effectiveLocal) setEffectiveLocal(utcNowLocalValue())
  }

  function buildPeriodBody(preserve: boolean) {
    if (!planId) {
      toast.error('Select a plan')
      return null
    }

    if (!neverExpires && !untilLocal) {
      toast.error('Pick an until date (UTC), or enable never expires')
      return null
    }

    const untilDate = neverExpires
      ? NEVER_UNTIL
      : fromUtcDatetimeLocalValue(untilLocal)
    if (Number.isNaN(new Date(untilDate).getTime())) {
      toast.error('Invalid until date')
      return null
    }

    if (effectiveMode === 'now') {
      setEffectiveLocal(utcNowLocalValue())
      return {
        periods: [
          {
            planId,
            untilDate,
            effectiveMode: 'now' as const,
          },
        ],
        preserveRemainder: preserve,
      }
    }

    let effectiveDate: string
    if (effectiveMode === 'after_last') {
      if (!afterLastAvailable || !afterLastLocal) {
        toast.error(
          latestPeriod?.neverExpires
            ? 'Last period never expires — cannot continue after it'
            : 'No prior period to continue from',
        )
        return null
      }
      effectiveDate = fromUtcDatetimeLocalValue(afterLastLocal)
      setEffectiveLocal(afterLastLocal)
    } else {
      if (!effectiveLocal) {
        toast.error('Pick an effective date (UTC)')
        return null
      }
      effectiveDate = fromUtcDatetimeLocalValue(effectiveLocal)
    }

    if (Number.isNaN(new Date(effectiveDate).getTime())) {
      toast.error('Invalid effective date')
      return null
    }
    return {
      periods: [
        {
          planId,
          effectiveDate,
          untilDate,
          effectiveMode: 'absolute' as const,
        },
      ],
      preserveRemainder: preserve,
    }
  }

  async function handlePreview() {
    const body = buildPeriodBody(preserveRemainder)
    if (!body) return
    setSavingPeriod(true)
    try {
      const response = await apiFetch<PlanPeriodsPreview>(
        `/admin/users/${userId}/plan-periods/preview`,
        { method: 'POST', body: JSON.stringify(body) },
      )
      if (!response.success || !response.data) {
        toast.error(response.message || 'Preview failed')
        return
      }
      setPreview(response.data)
      if (response.data.truncatedPeriodHadTokenAdjustments) {
        toast(
          'Truncating a period that has token adjustments — those tokens stay on the truncated period',
        )
      } else if (response.data.remainder) {
        toast('Remainder detected — choose whether to keep the old plan')
      } else {
        toast.success('Preview OK')
      }
    } catch {
      toast.error('Unable to reach the server')
    } finally {
      setSavingPeriod(false)
    }
  }

  async function handleAddPeriod() {
    const body = buildPeriodBody(preserveRemainder)
    if (!body) return
    setSavingPeriod(true)
    try {
      const response = await apiFetch<AddPlanPeriodsResult>(
        `/admin/users/${userId}/plan-periods`,
        {
          method: 'POST',
          body: JSON.stringify(body),
        },
      )
      if (!response.success) {
        toast.error(response.message || 'Failed to add period')
        return
      }
      if (response.data?.truncatedPeriodHadTokenAdjustments) {
        toast(
          'Plan period added — token adjustments remain on the truncated period',
        )
      } else {
        toast.success('Plan period added')
      }
      setPreview(null)
      setEffectiveMode('now')
      setEffectiveLocal(utcNowLocalValue())
      setUntilLocal('')
      setNeverExpires(false)
      setPreserveRemainder(false)
      const nextPage = response.data?.timeline.currentPeriodPage ?? periodPage
      setJumpedToCurrent(true)
      if (nextPage === periodPage) {
        await refreshTimeline(nextPage)
      } else {
        setPeriodPage(nextPage)
      }
      await refreshCurrentQuota()
      await refreshDetail()
    } catch {
      toast.error('Unable to reach the server')
    } finally {
      setSavingPeriod(false)
    }
  }

  async function handleRemovePeriod(periodId: string) {
    setSavingPeriod(true)
    try {
      const response = await apiFetch(
        `/admin/users/${userId}/plan-periods/${periodId}`,
        { method: 'DELETE' },
      )
      if (!response.success) {
        toast.error(response.message || 'Failed to remove period')
        return
      }
      toast.success('Future period removed')
      await refreshTimeline()
      await refreshDetail()
      await refreshCurrentQuota()
    } catch {
      toast.error('Unable to reach the server')
    } finally {
      setSavingPeriod(false)
    }
  }

  async function handleAdjustTokens(period: UserPlanPeriod) {
    const amount = Number.parseInt(adjustAmount[period.id] ?? '', 10)
    const reason = (adjustReason[period.id] ?? '').trim()
    if (!Number.isFinite(amount) || amount === 0) {
      toast.error('Amount must be a non-zero integer')
      return
    }
    if (!reason) {
      toast.error('Reason is required')
      return
    }
    setAdjustingId(period.id)
    try {
      const response = await apiFetch<UserPlanPeriod>(
        `/admin/users/${userId}/periods/${period.id}/token-adjustments`,
        {
          method: 'POST',
          body: JSON.stringify({ amount, reason }),
        },
      )
      if (!response.success) {
        toast.error(response.message || 'Adjustment failed')
        return
      }
      const applied = response.data?.deepseekTokenAdjustments?.at(-1)?.appliedAmount
      toast.success(
        `${applied != null && applied >= 0 ? '+' : ''}${applied ?? amount} tokens per window`,
      )
      setAdjustAmount((prev) => ({ ...prev, [period.id]: '' }))
      setAdjustReason((prev) => ({ ...prev, [period.id]: '' }))
      await refreshTimeline()
      await refreshCurrentQuota()
      await refreshDetail()
    } catch {
      toast.error('Unable to reach the server')
    } finally {
      setAdjustingId(null)
    }
  }

  async function handleCreateInvoice(expirePendingAndContinue = false) {
    if (invoiceType === 'plan_purchase' && invoiceStartMode === 'immediate') {
      const currentId = timeline?.currentPeriodId ?? detail?.currentPeriodId
      const current =
        (viewedPeriod && viewedPeriod.id === currentId
          ? viewedPeriod
          : null) ??
        timeline?.openPeriods.find((p) => p.id === currentId) ??
        null
      if (current && !current.neverExpires) {
        const remainingMs =
          new Date(current.untilDate).getTime() - Date.now()
        const remainingDays = Math.max(
          0,
          Math.ceil(remainingMs / (24 * 60 * 60 * 1000)),
        )
        const ok = window.confirm(
          `Start immediately will truncate the current period (${current.planName ?? current.id}), about ${remainingDays} day(s) remaining. Continue?`,
        )
        if (!ok) return
      }
    }
    const resolvedTargetPeriodId =
      invoiceTargetPeriodId ||
      detail?.currentPeriodId ||
      timeline?.currentPeriodId ||
      ''

    if (invoiceType === 'token_topup') {
      if (!resolvedTargetPeriodId) {
        toast.error('Select a target period')
        return
      }
      const tokens = Number.parseInt(invoiceTokens, 10)
      if (!Number.isFinite(tokens) || tokens === 0) {
        toast.error('Tokens per window must be a non-zero integer')
        return
      }
    } else if (!invoicePlanId) {
      toast.error('Select a plan')
      return
    }

    const amountRaw = invoiceAmount.trim()
    const amount =
      amountRaw === ''
        ? undefined
        : Number.parseInt(amountRaw, 10)
    if (amount !== undefined && (!Number.isFinite(amount) || amount < 0)) {
      toast.error('Amount must be a non-negative integer')
      return
    }

    setCreatingInvoice(true)
    try {
      const body: Record<string, unknown> = {
        type: invoiceType,
        expirePendingAndContinue,
      }
      if (amount !== undefined) body.amount = amount
      if (invoiceType === 'plan_purchase') {
        body.planId = invoicePlanId
        body.startMode = invoiceStartMode
      } else {
        body.targetPeriodId = resolvedTargetPeriodId
        body.deepseekTokens = Number.parseInt(invoiceTokens, 10)
        // Admin picker lists all open periods (current + upcoming).
        body.allowFuturePeriod = true
      }

      const response = await apiFetch<AdminInvoice>(
        `/admin/users/${userId}/invoices`,
        { method: 'POST', body: JSON.stringify(body) },
      )
      if (
        !response.success &&
        response.data &&
        typeof response.data === 'object' &&
        'pendingInvoiceId' in response.data
      ) {
        const conflictId = String(
          (response.data as { pendingInvoiceId: string }).pendingInvoiceId,
        )
        setPendingConflictId(conflictId)
        toast.error(response.message || 'Pending invoice exists')
        return
      }
      if (!response.success || !response.data) {
        toast.error(response.message || 'Failed to create invoice')
        return
      }
      setPendingConflictId(null)
      toast.success(
        response.data.amount === 0
          ? 'Invoice created (amount 0 — mark paid manually)'
          : 'Invoice created',
      )
      await refreshInvoices()
    } catch {
      toast.error('Unable to reach the server')
    } finally {
      setCreatingInvoice(false)
    }
  }

  async function handleMarkPaid(invoiceId: string) {
    const note = (markPaidNote[invoiceId] ?? '').trim()
    if (!note) {
      toast.error('Note is required')
      return
    }
    setMarkingPaidId(invoiceId)
    try {
      const response = await apiFetch<AdminInvoice>(
        `/admin/invoices/${invoiceId}/mark-paid`,
        { method: 'POST', body: JSON.stringify({ note }) },
      )
      if (!response.success) {
        toast.error(response.message || 'Failed to mark paid')
        await refreshInvoices()
        return
      }
      const paid = response.data
      if (paid?.status === 'paid' && !paid.effectAppliedAt) {
        toast.error(
          'Invoice is paid but the effect was not applied — fix the issue and retry Mark paid',
        )
      } else if (paid?.type === 'token_topup') {
        toast.success(
          'Invoice marked paid — tokens added to the period (see Usage for current window)',
        )
      } else {
        toast.success('Invoice marked paid')
      }
      await refreshInvoices()
      await refreshTimeline()
      await refreshCurrentQuota()
      await refreshDetail()
    } catch {
      toast.error('Unable to reach the server')
    } finally {
      setMarkingPaidId(null)
    }
  }

  async function handlePasswordSubmit(event: FormEvent) {
    event.preventDefault()
    if (!detail) return
    if (!password || password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setSavingPassword(true)
    try {
      const response = await apiFetch<AdminUser>(`/admin/users/${detail.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ password }),
      })
      if (!response.success) {
        toast.error(response.message || 'Failed to update password')
        return
      }
      setPassword('')
      toast.success('Password updated')
    } catch {
      toast.error('Unable to reach the server')
    } finally {
      setSavingPassword(false)
    }
  }

  const expiresMs = detail?.planExpiresAt
    ? new Date(detail.planExpiresAt).getTime()
    : null
  const remainingMs =
    expiresMs !== null && !Number.isNaN(expiresMs) ? expiresMs - nowMs : null

  return (
    <main className="mx-auto mt-8 mb-12 w-full max-w-3xl px-6 py-10 text-[var(--ink)] sm:mt-12">
      <div className="mb-8">
        <Link
          to="/admin/users"
          className={`${hintClassName} no-underline transition hover:text-[var(--ink)]`}
        >
          ← Users
        </Link>
        <h1 className="mt-3 text-2xl font-medium tracking-tight">
          {detail?.email ?? 'User'}
        </h1>
        {detail ? (
          <p className={`mt-2 ${hintClassName}`}>
            Plan: {detail.planName ?? 'No plan assigned'}
            {detail.planExpiresAt
              ? ` · Until ${new Date(detail.planExpiresAt).toISOString()} (UTC)`
              : ' · Never expires'}
            {remainingMs !== null
              ? remainingMs > 0
                ? ` · in ${formatDurationCountdown(remainingMs)}`
                : ' · expired'
              : ''}
            {detail.isAdmin ? ' · Admin' : ''}
            {detail.isBlocked ? ' · Blocked' : ''}
          </p>
        ) : null}
      </div>

      {loading ? (
        <div className={`flex items-center gap-2 ${hintClassName}`}>
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
          Loading user…
        </div>
      ) : !detail ? (
        <p className={hintClassName}>This user could not be loaded.</p>
      ) : (
        <div className="space-y-6">
          <div
            className="flex flex-wrap gap-x-1 gap-y-2 border-b border-[var(--line)]"
            role="tablist"
            aria-label="User admin sections"
          >
            {ADMIN_USER_TABS.map((tab) => {
              const selected = activeTab === tab.id
              const pendingCount =
                tab.id === 'billing'
                  ? invoices.filter((inv) => inv.status === 'pending').length
                  : 0
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  id={`admin-user-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    '-mb-px border-b-2 px-3 py-2 text-sm font-medium transition',
                    selected
                      ? 'border-[var(--ink)] text-[var(--ink)]'
                      : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]',
                  )}
                >
                  {tab.label}
                  {pendingCount > 0 ? (
                    <span className="ml-1.5 text-xs tabular-nums text-[var(--muted)]">
                      ({pendingCount})
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>

          {activeTab === 'plan' ? (
          <section
            className="space-y-4"
            role="tabpanel"
            aria-labelledby="admin-user-tab-plan"
          >
              <div>
                <h2 className="text-base font-medium text-[var(--ink)]">
                  Plan timeline
                </h2>
                <p className={`mt-1 ${hintClassName}`}>
                  Free admin grants live here. All dates are UTC. Half-open
                  ranges [start, end).
                </p>
              </div>

              {timelineLoading && !timeline ? (
                <p className={hintClassName}>Loading timeline…</p>
              ) : !viewedPeriod || periodTotal === 0 ? (
                <p className={hintClassName}>No periods yet.</p>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className={hintClassName}>
                      {timeline?.previousCount ?? 0} previous ·{' '}
                      {timeline?.upcomingCount ?? 0} upcoming
                      {timeline?.currentPeriodId
                        ? viewedPeriod.id === timeline.currentPeriodId
                          ? ' · viewing active'
                          : ' · active elsewhere'
                        : ' · no active period'}
                      {(timeline?.gaps.length ?? 0) > 0
                        ? ` · ${timeline!.gaps.length} gap${timeline!.gaps.length === 1 ? '' : 's'}`
                        : ''}
                    </p>
                    <div
                      className="flex flex-wrap items-center gap-1.5 text-sm"
                      role="navigation"
                      aria-label="Plan period navigator"
                    >
                      <button
                        type="button"
                        className={cn(
                          'px-1.5 py-0.5 text-[var(--ink)] underline-offset-2 hover:underline disabled:pointer-events-none disabled:opacity-40',
                        )}
                        disabled={periodIndex <= 1 || timelineLoading}
                        onClick={() => goToPeriodPage(1)}
                      >
                        First
                      </button>
                      <button
                        type="button"
                        className={cn(
                          buttonOutlineClassName,
                          'min-w-8 px-2 py-1',
                        )}
                        disabled={periodIndex <= 1 || timelineLoading}
                        aria-label="Previous period"
                        onClick={() => goToPeriodPage(periodIndex - 1)}
                      >
                        ‹
                      </button>
                      <span className="min-w-[4.5rem] text-center tabular-nums text-[var(--ink)]">
                        {periodIndex} of {periodTotal}
                      </span>
                      <button
                        type="button"
                        className={cn(
                          buttonOutlineClassName,
                          'min-w-8 px-2 py-1',
                        )}
                        disabled={
                          periodIndex >= periodTotal || timelineLoading
                        }
                        aria-label="Next period"
                        onClick={() => goToPeriodPage(periodIndex + 1)}
                      >
                        ›
                      </button>
                      <button
                        type="button"
                        className={cn(
                          'px-1.5 py-0.5 text-[var(--ink)] underline-offset-2 hover:underline disabled:pointer-events-none disabled:opacity-40',
                        )}
                        disabled={
                          periodIndex >= periodTotal || timelineLoading
                        }
                        onClick={() => goToPeriodPage(periodTotal)}
                      >
                        Last
                      </button>
                      {timeline?.currentPeriodPage != null &&
                      timeline.currentPeriodPage !== periodIndex ? (
                        <button
                          type="button"
                          className={cn(
                            'ml-1 px-1.5 py-0.5 text-[var(--ink)] underline-offset-2 hover:underline',
                          )}
                          disabled={timelineLoading}
                          onClick={() =>
                            goToPeriodPage(timeline.currentPeriodPage!)
                          }
                        >
                          Active
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {(() => {
                    const period = viewedPeriod
                    const isCurrent = timeline?.currentPeriodId === period.id
                    const isFuture =
                      new Date(period.effectiveDate).getTime() > nowMs
                    const untilMs = new Date(period.untilDate).getTime()
                    const periodRemaining = untilMs - nowMs
                    const windowLabel =
                      period.windowCount == null
                        ? 'open-ended windows'
                        : `${period.windowCount} window${period.windowCount === 1 ? '' : 's'}`
                    return (
                      <div
                        className={cn(
                          cardClassName,
                          'space-y-3 px-4 py-3',
                          isCurrent && 'border-[var(--ink)]',
                        )}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 text-sm">
                            <p className="font-medium text-[var(--ink)]">
                              {period.planName ?? period.planId}
                              {isCurrent ? ' · current' : ''}
                              {period.source === 'default_sync'
                                ? ' · default sync'
                                : ''}
                            </p>
                            <p className={hintClassName}>
                              {period.effectiveDate} →{' '}
                              {period.neverExpires
                                ? 'never'
                                : period.untilDate}{' '}
                              (UTC)
                              {isCurrent &&
                              !period.neverExpires &&
                              periodRemaining > 0
                                ? ` · in ${formatDurationCountdown(periodRemaining)}`
                                : ''}
                            </p>
                            <p className={hintClassName}>
                              {period.deepseekQuotaPerPeriod.toLocaleString()}{' '}
                              tokens per window · {windowLabel}
                              {period.quotaWindowDays != null
                                ? ` · ${period.quotaWindowDays}d windows`
                                : ' · whole-period window'}
                            </p>
                          </div>
                          {isFuture ? (
                            <button
                              type="button"
                              className={buttonOutlineClassName}
                              disabled={savingPeriod}
                              onClick={() => void handleRemovePeriod(period.id)}
                            >
                              Remove
                            </button>
                          ) : null}
                        </div>

                        <div className="space-y-2 border-t border-[var(--line)] pt-3">
                          <p className="text-xs font-medium text-[var(--ink)]">
                            Adjust tokens per window
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <input
                              type="number"
                              className="w-28 rounded-[var(--radius-sm)] border border-[var(--line)] bg-white px-2 py-1.5 text-sm"
                              placeholder="+/- amount"
                              value={adjustAmount[period.id] ?? ''}
                              onChange={(e) =>
                                setAdjustAmount((prev) => ({
                                  ...prev,
                                  [period.id]: e.target.value,
                                }))
                              }
                            />
                            <input
                              type="text"
                              className="min-w-[12rem] flex-1 rounded-[var(--radius-sm)] border border-[var(--line)] bg-white px-2 py-1.5 text-sm"
                              placeholder="Reason"
                              value={adjustReason[period.id] ?? ''}
                              onChange={(e) =>
                                setAdjustReason((prev) => ({
                                  ...prev,
                                  [period.id]: e.target.value,
                                }))
                              }
                            />
                            <button
                              type="button"
                              className={buttonOutlineClassName}
                              disabled={adjustingId === period.id}
                              onClick={() => void handleAdjustTokens(period)}
                            >
                              {adjustingId === period.id
                                ? 'Saving…'
                                : 'Apply'}
                            </button>
                          </div>
                          {(period.deepseekTokenAdjustments?.length ?? 0) >
                          0 ? (
                            <ul className="space-y-1 text-xs">
                              {[...(period.deepseekTokenAdjustments ?? [])]
                                .reverse()
                                .slice(0, 8)
                                .map((adj, idx) => (
                                  <li
                                    key={`${adj.createdAt}-${idx}`}
                                    className={hintClassName}
                                  >
                                    {adj.appliedAmount >= 0 ? '+' : ''}
                                    {adj.appliedAmount.toLocaleString()} tokens
                                    per window
                                    {adj.appliedAmount !== adj.requestedAmount
                                      ? ` (requested ${adj.requestedAmount})`
                                      : ''}{' '}
                                    · {adj.source} · {adj.reason}
                                  </li>
                                ))}
                            </ul>
                          ) : (
                            <p className={hintClassName}>No adjustments yet.</p>
                          )}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              <div className="space-y-4 border-t border-[var(--line)] pt-6">
                <h3 className="text-sm font-medium text-[var(--ink)]">
                  Add period
                </h3>
                <div>
                  <label
                    htmlFor="period-plan"
                    className="mb-1.5 block text-sm text-[var(--ink)]"
                  >
                    Plan
                  </label>
                  {plansLoading ? (
                    <p className={hintClassName}>Loading plans…</p>
                  ) : (
                    <PlanCombobox
                      id="period-plan"
                      plans={plans}
                      value={planId}
                      onValueChange={setPlanId}
                      disabled={plans.length === 0}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-[var(--ink)]">Effective (UTC)</p>
                  <div
                    className="flex flex-wrap gap-2"
                    role="group"
                    aria-label="Effective date mode"
                  >
                    {(
                      [
                        { id: 'now' as const, label: 'Now' },
                        {
                          id: 'after_last' as const,
                          label: 'After last',
                          disabled: !afterLastAvailable,
                          title: latestPeriod?.neverExpires
                            ? 'Last period never expires'
                            : !latestPeriod
                              ? 'No prior period'
                              : `Starts at end of ${latestPeriod.planName ?? 'last period'}`,
                        },
                        { id: 'custom' as const, label: 'Custom' },
                      ] as const
                    ).map((opt) => {
                      const disabled =
                        savingPeriod ||
                        ('disabled' in opt && Boolean(opt.disabled))
                      const selected = effectiveMode === opt.id
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={disabled}
                          aria-pressed={selected}
                          title={'title' in opt ? opt.title : undefined}
                          onClick={() => applyEffectiveMode(opt.id)}
                          className={cn(
                            'inline-flex items-center justify-center rounded-[var(--radius-sm)] border px-3 py-1.5 text-sm font-semibold transition-colors',
                            'disabled:pointer-events-none disabled:opacity-50',
                            selected
                              ? 'border-black bg-black text-white'
                              : 'border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--ink)]',
                          )}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                  {effectiveMode === 'now' ? (
                    <p className={hintClassName}>
                      Uses the current UTC time when you preview or add.
                    </p>
                  ) : null}
                  {effectiveMode === 'after_last' && afterLastAvailable ? (
                    <p className={hintClassName}>
                      Continues from{' '}
                      {latestPeriod!.planName ?? 'last period'} ending{' '}
                      {latestPeriod!.untilDate}   no gap.
                    </p>
                  ) : null}
                  {effectiveMode === 'custom' ? (
                    <UtcDateTimePicker
                      id="period-effective"
                      value={effectiveLocal}
                      onChange={(next) => {
                        setEffectiveLocal(next)
                        setPreview(null)
                      }}
                      disabled={savingPeriod}
                      showNow
                    />
                  ) : null}
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-[var(--ink)]">
                      Never expires
                    </p>
                    <p className={`mt-0.5 ${hintClassName}`}>
                      On uses the far-future UTC sentinel.
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`text-sm ${hintClassName}`}>
                      {neverExpires ? 'On' : 'Off'}
                    </span>
                    <label
                      htmlFor="period-never"
                      className="relative inline-flex cursor-pointer"
                    >
                      <input
                        id="period-never"
                        type="checkbox"
                        className="peer sr-only"
                        checked={neverExpires}
                        onChange={(e) => {
                          setNeverExpires(e.target.checked)
                          setPreview(null)
                          if (e.target.checked) setUntilLocal('')
                        }}
                      />
                      <span
                        className={cn(
                          'block h-6 w-11 rounded-full border border-[var(--line)] bg-[var(--surface)] transition',
                          'peer-checked:border-[var(--ink)] peer-checked:bg-[var(--ink)]',
                        )}
                        aria-hidden
                      />
                      <span
                        className={cn(
                          'pointer-events-none absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition',
                          'peer-checked:translate-x-5',
                        )}
                        aria-hidden
                      />
                    </label>
                  </div>
                </div>
                {!neverExpires ? (
                  <div>
                    <label
                      htmlFor="period-until"
                      className="mb-1.5 block text-sm text-[var(--ink)]"
                    >
                      Until exclusive (UTC)
                    </label>
                    <UtcDateTimePicker
                      id="period-until"
                      value={untilLocal}
                      onChange={(next) => {
                        setUntilLocal(next)
                        setPreview(null)
                      }}
                      disabled={savingPeriod}
                    />
                  </div>
                ) : null}

                {preview?.truncatedPeriodHadTokenAdjustments ? (
                  <p className={`rounded-[var(--radius-sm)] border border-[var(--line)] px-3 py-2 text-sm text-[var(--ink)]`}>
                    This will truncate a period that already has token
                    adjustments. Those tokens stay on the truncated period —
                    they are not moved to the new period. Top up or Adjust
                    tokens on the new current period afterward if needed.
                  </p>
                ) : null}
                {preview?.remainder ? (
                  <label className="flex items-start gap-3 text-sm text-[var(--ink)]">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={preserveRemainder}
                      onChange={(e) => setPreserveRemainder(e.target.checked)}
                    />
                    <span>
                      Keep {preview.remainder.planName ?? 'previous plan'} for
                      the remaining time ({preview.remainder.effectiveDate} →{' '}
                      {preview.remainder.untilDate} UTC)
                    </span>
                  </label>
                ) : null}

                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    className={buttonOutlineClassName}
                    disabled={savingPeriod || plansLoading}
                    onClick={() => void handlePreview()}
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    className={buttonClassName}
                    disabled={savingPeriod || plansLoading}
                    onClick={() => void handleAddPeriod()}
                  >
                    {savingPeriod ? (
                      <>
                        <LoaderCircle
                          className="size-4 animate-spin"
                          aria-hidden
                        />
                        Saving…
                      </>
                    ) : (
                      'Add period'
                    )}
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          {activeTab === 'account' ? (
          <form
            className="space-y-6"
            role="tabpanel"
            aria-labelledby="admin-user-tab-account"
            onSubmit={(event) => void handlePasswordSubmit(event)}
          >
            <div>
              <h2 className="text-base font-medium text-[var(--ink)]">
                Password
              </h2>
              <p className={`mt-1 ${hintClassName}`}>
                Set a new password for this account.
              </p>
            </div>
            <div>
              <label
                htmlFor="user-password"
                className="mb-1.5 block text-sm text-[var(--ink)]"
              >
                New password
              </label>
              <PasswordInput
                id="user-password"
                value={password}
                onChange={setPassword}
                placeholder="Leave blank to keep current password"
                autoComplete="new-password"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingPassword || !password}
                className={buttonClassName}
              >
                {savingPassword ? 'Saving…' : 'Update password'}
              </button>
            </div>
          </form>
          ) : null}

          {activeTab === 'usage' ? (
          <section
            className="space-y-3"
            role="tabpanel"
            aria-labelledby="admin-user-tab-usage"
          >
            <h2 className="text-base font-medium text-[var(--ink)]">
              Deepseek tokens
            </h2>
            <p className={hintClassName}>
              Current period allowance (snapshotted on the period, plus later
              top-ups / adjustments). Usage is for the active quota window
              {currentQuota?.quotaWindowDays != null
                ? ` (${currentQuota.quotaWindowDays}d each)`
                : ' (whole period)'}
              .
            </p>
            {(currentQuota?.deepseekWindow ?? detail.deepseekWindow) ==
            null ? (
              <p className={hintClassName}>No active plan period.</p>
            ) : (
              (() => {
                const win =
                  currentQuota?.deepseekWindow ?? detail.deepseekWindow!
                const periodToken =
                  currentQuota?.deepseekQuotaPerPeriod ??
                  detail.deepseekQuotaPerPeriod
                const adjustments =
                  currentQuota?.deepseekTokenAdjustments ?? []
                const adjSum = adjustments.reduce(
                  (sum, a) => sum + a.appliedAmount,
                  0,
                )
                const opening = periodToken - adjSum
                const remaining = Math.max(0, periodToken - win.totalTokens)
                const planListQuota =
                  plans.find(
                    (p) =>
                      p.id ===
                      (currentQuota?.planId ?? detail.planId ?? ''),
                  )?.deepseekQuotaPerPeriod ?? null
                const fmt = (n: number) => n.toLocaleString()
                const fmtSigned = (n: number) =>
                  `${n >= 0 ? '+' : '−'}${Math.abs(n).toLocaleString()}`
                const fmtWhen = (iso: string | null) =>
                  iso ? new Date(iso).toLocaleString() : '—'

                const Line = ({
                  label,
                  value,
                  strong,
                  muted,
                }: {
                  label: string
                  value: string
                  strong?: boolean
                  muted?: boolean
                }) => (
                  <div
                    className={cn(
                      'flex items-baseline justify-between gap-4 py-1.5 text-sm tabular-nums',
                      strong && 'font-semibold',
                      muted && 'text-[var(--muted)]',
                    )}
                  >
                    <span className={strong ? 'text-[var(--ink)]' : undefined}>
                      {label}
                    </span>
                    <span className="text-right text-[var(--ink)]">
                      {value}
                    </span>
                  </div>
                )

                return (
                  <div className="space-y-4">
                    <div
                      className={cn(
                        cardClassName,
                        'space-y-1 px-4 py-3 font-mono text-[13px]',
                      )}
                    >
                      <p className="mb-2 font-sans text-sm font-medium text-[var(--ink)]">
                        {currentQuota?.planName ?? detail.planName ?? 'Period'}{' '}
                        · token statement
                      </p>

                      <Line
                        label="Opening (plan snapshot)"
                        value={fmt(opening)}
                        muted
                      />
                      {adjustments.map((a, i) => (
                        <Line
                          key={`${a.createdAt}-${i}`}
                          label={`${a.appliedAmount >= 0 ? '+' : '−'} ${
                            a.source === 'invoice' ? 'Invoice' : 'Admin'
                          }${a.reason ? ` · ${a.reason}` : ''}`}
                          value={fmtSigned(a.appliedAmount)}
                          muted
                        />
                      ))}
                      <div className="border-t border-[var(--line)] pt-1.5">
                        <Line
                          label="Period token"
                          value={fmt(periodToken)}
                          strong
                        />
                      </div>

                      <div className="mt-2 border-t border-dashed border-[var(--line)] pt-2">
                        <Line
                          label="− Input tokens"
                          value={`−${fmt(win.inputTokens)}`}
                        />
                        <Line
                          label="− Output tokens"
                          value={`−${fmt(win.outputTokens)}`}
                        />
                        <Line
                          label="Total used"
                          value={`−${fmt(win.totalTokens)}`}
                          muted
                        />
                      </div>

                      <div className="border-t border-[var(--line)] pt-1.5">
                        <Line
                          label="Remaining"
                          value={fmt(remaining)}
                          strong
                        />
                      </div>

                      <div className="mt-3 space-y-1 border-t border-[var(--line)] pt-2 font-sans text-xs text-[var(--muted)]">
                        <p>
                          Window{' '}
                          {win.windowIndex + 1}
                          {currentQuota?.windowCount != null
                            ? ` of ${currentQuota.windowCount}`
                            : ''}
                          : {fmtWhen(win.windowStart)} →{' '}
                          {fmtWhen(win.windowEnd)}
                        </p>
                        {periodToken === 0 ? (
                          <p>
                            Period allowance is 0
                            {planListQuota != null && planListQuota > 0
                              ? ` (plan list price is now ${fmt(planListQuota)} — this period was snapshotted at 0; use Adjust tokens or a token invoice, or recreate the period)`
                              : ' (set DeepSeek tokens on the plan, then add a new period or adjust tokens)'}
                            .
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )
              })()
            )}
          </section>
          ) : null}

          {activeTab === 'billing' ? (
          <section
            className="space-y-5"
            role="tabpanel"
            aria-labelledby="admin-user-tab-billing"
          >
            <div>
              <h2 className="text-base font-medium text-[var(--ink)]">
                Billing / invoices
              </h2>
              <p className={`mt-1 ${hintClassName}`}>
                Use this when the user should pay (or you need a payment
                record). To grant a plan for free, use Add period on the Plan
                tab. Token top-ups credit a specific period document — replace
                the active plan before creating a top-up if the new period
                should receive the tokens.
              </p>
            </div>

            {(() => {
              const stuck = invoices.filter((inv) => {
                if (inv.status !== 'paid') return false
                if (!inv.effectAppliedAt) return true
                const t = new Date(inv.effectAppliedAt).getTime()
                return !Number.isFinite(t) || t <= 0
              })
              if (stuck.length === 0) return null
              return (
                <div
                  className={cn(
                    cardClassName,
                    'space-y-2 border-[var(--ink)] px-4 py-3 text-sm',
                  )}
                >
                  <p className="font-medium text-[var(--ink)]">
                    Paid invoices with effect not applied
                  </p>
                  <p className={hintClassName}>
                    Status is paid but tokens/plan were not granted. Fix the
                    underlying issue (e.g. add a current period), then retry
                    Mark paid.
                  </p>
                  <ul className="space-y-2">
                    {stuck.map((inv) => (
                      <li
                        key={inv.id}
                        className="flex flex-wrap items-center gap-2"
                      >
                        <span className="text-[var(--ink)]">
                          {inv.type === 'token_topup'
                            ? inv.deepseekTokens != null
                              ? `Token top-up (+${inv.deepseekTokens.toLocaleString()} tokens)`
                              : 'Token top-up'
                            : `Plan purchase · ${inv.planName ?? 'Plan'}`}
                        </span>
                        <input
                          type="text"
                          className="min-w-[10rem] flex-1 rounded-[var(--radius-sm)] border border-[var(--line)] bg-white px-2 py-1 text-sm"
                          placeholder="Note (required)"
                          value={markPaidNote[inv.id] ?? ''}
                          onChange={(e) =>
                            setMarkPaidNote((prev) => ({
                              ...prev,
                              [inv.id]: e.target.value,
                            }))
                          }
                        />
                        <button
                          type="button"
                          className={buttonOutlineClassName}
                          disabled={markingPaidId === inv.id}
                          onClick={() => void handleMarkPaid(inv.id)}
                        >
                          {markingPaidId === inv.id
                            ? 'Retrying…'
                            : 'Retry Mark paid'}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })()}

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ['token_topup', 'Add tokens (invoice)'],
                      ['plan_purchase', 'Charge for a plan (invoice)'],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={invoiceType === id}
                      className={cn(
                        'rounded-[var(--radius-sm)] border px-3 py-1.5 text-sm font-semibold',
                        invoiceType === id
                          ? 'border-black bg-black text-white'
                          : 'border-[var(--line)] bg-white',
                      )}
                      onClick={() => setInvoiceType(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className={hintClassName}>
                  {invoiceType === 'token_topup'
                    ? 'Adds +N tokens per window to the selected period after mark-paid. Does not create periods.'
                    : 'Creates a paid plan period after payment. Prefer Add period on Plan tab if no charge.'}
                </p>
              </div>

              {invoiceType === 'plan_purchase' ? (
                <div>
                  <label
                    htmlFor="invoice-plan"
                    className="mb-1.5 block text-sm text-[var(--ink)]"
                  >
                    Plan to charge for
                  </label>
                  <PlanCombobox
                    id="invoice-plan"
                    plans={plans}
                    value={invoicePlanId}
                    onValueChange={setInvoicePlanId}
                    disabled={plans.length === 0}
                  />
                </div>
              ) : null}

              <div>
                <label
                  htmlFor="invoice-amount"
                  className="mb-1.5 block text-sm text-[var(--ink)]"
                >
                  Charge amount (IDR)
                </label>
                <input
                  id="invoice-amount"
                  type="number"
                  min={0}
                  className="w-full rounded-[var(--radius-sm)] border border-[var(--line)] bg-white px-3 py-2 text-sm"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  placeholder={
                    invoiceType === 'token_topup'
                      ? 'Required, or 0 for mark-paid only'
                      : 'Leave blank for plan list price'
                  }
                />
                <p className={`mt-1 ${hintClassName}`}>
                  {invoiceType === 'token_topup'
                    ? 'Plan for the receipt is taken from the period you top up. Enter 0 for no Midtrans — mark paid manually later.'
                    : 'Blank uses the plan list price. Enter 0 for no Midtrans checkout — mark paid manually later.'}
                </p>
              </div>

              {invoiceType === 'token_topup' ? (
                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="invoice-target-period"
                      className="mb-1.5 block text-sm text-[var(--ink)]"
                    >
                      Period to top up
                    </label>
                    {(() => {
                      const openPeriods = timeline?.openPeriods ?? []
                      const selectedId =
                        invoiceTargetPeriodId ||
                        detail.currentPeriodId ||
                        ''
                      const selected =
                        openPeriods.find((p) => p.id === selectedId) ?? null
                      return (
                        <Select
                          value={selectedId || undefined}
                          onValueChange={setInvoiceTargetPeriodId}
                        >
                          <SelectTrigger
                            id="invoice-target-period"
                            className={cn(
                              'h-auto min-h-10 w-full items-center gap-3 whitespace-normal py-2.5',
                              'data-[size=default]:h-auto',
                              '[&>span]:min-w-0 [&>span]:flex-1 [&>span]:whitespace-normal',
                            )}
                          >
                            <SelectValue placeholder="Select period">
                              {selected ? (
                                <span className="flex flex-col gap-0.5 text-left">
                                  <span className="font-medium text-[var(--ink)]">
                                    {selected.isCurrent
                                      ? 'Current'
                                      : 'Upcoming'}{' '}
                                    · {selected.planName ?? selected.planId}
                                  </span>
                                  <span className="text-xs text-[var(--muted)]">
                                    from{' '}
                                    {formatUtcDateTime(selected.effectiveDate)}
                                  </span>
                                  <span className="text-xs text-[var(--muted)]">
                                    ends{' '}
                                    {selected.neverExpires
                                      ? 'never'
                                      : formatUtcDateTime(selected.untilDate)}
                                  </span>
                                </span>
                              ) : null}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="z-[80]">
                            {openPeriods.map((p) => (
                              <SelectItem
                                key={p.id}
                                value={p.id}
                                className="items-start py-2 whitespace-normal"
                              >
                                <span className="flex flex-col gap-0.5 text-left">
                                  <span className="font-medium">
                                    {p.isCurrent ? 'Current' : 'Upcoming'} ·{' '}
                                    {p.planName ?? p.planId}
                                  </span>
                                  <span className="text-xs text-[var(--muted)]">
                                    from {formatUtcDateTime(p.effectiveDate)}
                                  </span>
                                  <span className="text-xs text-[var(--muted)]">
                                    ends{' '}
                                    {p.neverExpires
                                      ? 'never'
                                      : formatUtcDateTime(p.untilDate)}
                                  </span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )
                    })()}
                    <p className={`mt-1 ${hintClassName}`}>
                      All open periods. Tokens credit the selected period.
                    </p>
                  </div>
                  <div>
                    <label
                      htmlFor="invoice-tokens"
                      className="mb-1.5 block text-sm text-[var(--ink)]"
                    >
                      Tokens per window to add
                    </label>
                    <input
                      id="invoice-tokens"
                      type="number"
                      className="w-full rounded-[var(--radius-sm)] border border-[var(--line)] bg-white px-3 py-2 text-sm"
                      placeholder="e.g. 50000"
                      value={invoiceTokens}
                      onChange={(e) => setInvoiceTokens(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-[var(--ink)]">When plan starts</p>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ['after_current', 'After current period'],
                        ['immediate', 'Start immediately'],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={invoiceStartMode === id}
                        className={cn(
                          'rounded-[var(--radius-sm)] border px-3 py-1.5 text-sm font-semibold',
                          invoiceStartMode === id
                            ? 'border-black bg-black text-white'
                            : 'border-[var(--line)] bg-white',
                        )}
                        onClick={() => setInvoiceStartMode(id)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <p className={hintClassName}>
                    {invoiceStartMode === 'immediate'
                      ? 'Truncates the active period when paid. Confirm before creating.'
                      : 'Stacks after the user’s current (or latest) period ends.'}
                  </p>
                </div>
              )}

              {pendingConflictId ? (
                <div className="space-y-2 rounded-[var(--radius-sm)] border border-[var(--line)] px-3 py-3 text-sm">
                  <p className="text-[var(--ink)]">
                    This user already has an unpaid invoice. Expire it to
                    create a new one.
                  </p>
                  <p className={hintClassName}>
                    Invoice id: {pendingConflictId}
                  </p>
                  <button
                    type="button"
                    className={buttonOutlineClassName}
                    disabled={creatingInvoice}
                    onClick={() => void handleCreateInvoice(true)}
                  >
                    Expire unpaid invoice and continue
                  </button>
                </div>
              ) : null}

              <button
                type="button"
                className={buttonClassName}
                disabled={creatingInvoice || plansLoading}
                onClick={() => void handleCreateInvoice(false)}
              >
                {creatingInvoice
                  ? 'Creating…'
                  : invoiceType === 'token_topup'
                    ? 'Create token invoice'
                    : 'Create plan invoice'}
              </button>
            </div>

            {(() => {
              const pending = invoices.filter((inv) => inv.status === 'pending')
              const history = invoices.filter((inv) => inv.status !== 'pending')
              const invoiceHeading = (inv: AdminInvoice) =>
                inv.type === 'token_topup'
                  ? inv.deepseekTokens != null
                    ? `Token top-up (+${inv.deepseekTokens.toLocaleString()} tokens)`
                    : 'Token top-up'
                  : `Plan purchase · ${inv.planName ?? 'Plan'}`

              return (
                <div className="space-y-3 border-t border-[var(--line)] pt-5">
                  <h3 className="text-sm font-medium text-[var(--ink)]">
                    Unpaid invoices
                  </h3>
                  {pending.length === 0 ? (
                    <p className={hintClassName}>No unpaid invoices.</p>
                  ) : (
                    <ul className="space-y-3">
                      {pending.map((inv) => (
                        <li
                          key={inv.id}
                          className={cn(
                            cardClassName,
                            'space-y-2 px-4 py-3 text-sm',
                          )}
                        >
                          <p className="font-medium text-[var(--ink)]">
                            {invoiceHeading(inv)}
                          </p>
                          <p className={hintClassName}>
                            Charge {inv.amount.toLocaleString()} IDR
                            {inv.amount === 0
                              ? ' · no Midtrans — mark paid when ready'
                              : ''}
                            {inv.type === 'token_topup' &&
                            inv.deepseekTokens != null
                              ? ` · +${inv.deepseekTokens.toLocaleString()} tokens per window`
                              : ''}
                            {inv.type === 'plan_purchase' && inv.startMode
                              ? inv.startMode === 'immediate'
                                ? ' · starts immediately when paid'
                                : ' · starts after current period'
                              : ''}
                          </p>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <input
                              type="text"
                              className="min-w-[12rem] flex-1 rounded-[var(--radius-sm)] border border-[var(--line)] bg-white px-2 py-1.5 text-sm"
                              placeholder="Note (required to mark paid)"
                              value={markPaidNote[inv.id] ?? ''}
                              onChange={(e) =>
                                setMarkPaidNote((prev) => ({
                                  ...prev,
                                  [inv.id]: e.target.value,
                                }))
                              }
                            />
                            <button
                              type="button"
                              className={buttonOutlineClassName}
                              disabled={markingPaidId === inv.id}
                              onClick={() => void handleMarkPaid(inv.id)}
                            >
                              {markingPaidId === inv.id
                                ? 'Marking…'
                                : 'Mark paid'}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  {history.length > 0 ? (
                    <div className="space-y-2 pt-1">
                      <button
                        type="button"
                        className={cn(
                          'text-sm text-[var(--ink)] underline-offset-2 hover:underline',
                        )}
                        onClick={() =>
                          setShowInvoiceHistory((open) => !open)
                        }
                      >
                        {showInvoiceHistory
                          ? 'Hide history'
                          : `Show history (${history.length})`}
                      </button>
                      {showInvoiceHistory ? (
                        <ul className="space-y-2">
                          {history.map((inv) => (
                            <li
                              key={inv.id}
                              className="border-b border-[var(--line)] py-2 text-sm last:border-b-0"
                            >
                              <p className="text-[var(--ink)]">
                                {invoiceHeading(inv)} · {inv.status}
                              </p>
                              <p className={hintClassName}>
                                {inv.amount.toLocaleString()} IDR
                                {inv.paidAt
                                  ? ` · paid ${new Date(inv.paidAt).toLocaleString()}`
                                  : ''}
                                {inv.manualPaidNote
                                  ? ` · note: ${inv.manualPaidNote}`
                                  : ''}
                              </p>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )
            })()}
          </section>
          ) : null}

          {activeTab === 'projects' ? (
          <section
            className="space-y-6"
            role="tabpanel"
            aria-labelledby="admin-user-tab-projects"
          >
            <h2 className="text-base font-medium text-[var(--ink)]">Projects</h2>
            {detail.projects.length === 0 ? (
              <p className={hintClassName}>No owned projects.</p>
            ) : (
              detail.projects.map((project) => (
                <article
                  key={project.id}
                  className={cn(cardClassName, 'space-y-2 p-4')}
                >
                  <h3 className="text-sm font-medium text-[var(--ink)]">
                    {project.label}
                  </h3>
                  <p className={hintClassName}>
                    Articles {project.articles.length} · Guidance{' '}
                    {project.guidanceCount} · Snippets {project.snippetCount}
                  </p>
                </article>
              ))
            )}
          </section>
          ) : null}
        </div>
      )}
    </main>
  )
}
