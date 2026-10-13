import { useEffect, useState } from 'react'
import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { Download } from 'lucide-react'
import toast from 'react-hot-toast'
import PriorityMeter from '#/components/analyze/PriorityMeter'
import PlanTimelineMap from '#/components/plan/PlanTimelineMap'
import { useAuth } from '#/context/authContext'
import { usePlan } from '#/context/planContext'
import { apiFetch } from '#/lib/api'
import { formatDurationCountdown, formatUtcDate } from '#/lib/duration'
import {
  downloadInvoicePdf,
  formatIdr,
  type Invoice,
  type InvoiceList,
} from '#/lib/invoice'
import { getDeepseekUsage, type DeepseekUsage } from '#/lib/user'
import {
  buttonClassName,
  buttonOutlineClassName,
  cardClassName,
  hintClassName,
} from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/_authenticated/profile')({
  component: ProfilePage,
})

const INVOICE_PAGE_SIZE = 5

function invoiceMeta(invoice: Invoice, nowMs: number): string {
  if (invoice.status === 'pending') {
    const expiresMs = new Date(invoice.expiresAt).getTime()
    if (expiresMs > nowMs) {
      return `Checkout expires ${formatUtcDate(invoice.expiresAt)}`
    }
    return 'Expired checkout'
  }
  if (invoice.status === 'paid' && invoice.paidAt) {
    return `Paid ${formatUtcDate(invoice.paidAt)}`
  }
  return invoice.status
}

function ProfilePage() {
  const { user } = useAuth()
  const {
    plan,
    planExpiresAt,
    neverExpires,
    timeline,
    nextPeriod,
    isLoading,
  } = usePlan()
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [usage, setUsage] = useState<DeepseekUsage | null>(null)
  const [usageLoading, setUsageLoading] = useState(true)
  const [resetLoading, setResetLoading] = useState(false)
  const [openInvoice, setOpenInvoice] = useState<Invoice | null>(null)
  const [invoicePage, setInvoicePage] = useState(1)
  const [invoiceList, setInvoiceList] = useState<InvoiceList | null>(null)
  const [invoicesLoading, setInvoicesLoading] = useState(true)
  const [exportingId, setExportingId] = useState<string | null>(null)
  const [invoiceMissing, setInvoiceMissing] = useState(false)

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    let cancelled = false
    setUsageLoading(true)
    void (async () => {
      try {
        const response = await getDeepseekUsage()
        if (!cancelled && response.success && response.data) {
          setUsage(response.data)
        }
      } catch {
        // non-blocking
      } finally {
        if (!cancelled) setUsageLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const response = await apiFetch<Invoice | null>(
          '/payment/invoices/active',
        )
        if (cancelled) return
        if (
          response.success &&
          response.data?.status === 'pending' &&
          new Date(response.data.expiresAt).getTime() > Date.now()
        ) {
          setOpenInvoice(response.data)
        } else {
          setOpenInvoice(null)
        }
      } catch {
        if (!cancelled) setOpenInvoice(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setInvoicesLoading(true)
    void (async () => {
      try {
        const params = new URLSearchParams({
          page: String(invoicePage),
          pageSize: String(INVOICE_PAGE_SIZE),
        })
        const response = await apiFetch<InvoiceList>(
          `/payment/invoices?${params.toString()}`,
        )
        if (cancelled) return
        if (response.success && response.data) {
          setInvoiceList(response.data)
        } else {
          setInvoiceList(null)
        }
      } catch {
        if (!cancelled) setInvoiceList(null)
      } finally {
        if (!cancelled) setInvoicesLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [invoicePage])

  if (invoiceMissing) {
    throw notFound()
  }

  async function handleExportPdf(invoiceId: string) {
    setExportingId(invoiceId)
    try {
      await downloadInvoicePdf(invoiceId)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to export invoice'
      if (message === 'Invoice not found') {
        setInvoiceMissing(true)
        return
      }
      toast.error(message)
    } finally {
      setExportingId(null)
    }
  }

  const expiresMs = planExpiresAt ? new Date(planExpiresAt).getTime() : null
  const remainingMs =
    expiresMs !== null && !Number.isNaN(expiresMs) ? expiresMs - nowMs : null
  const invoicePageCount = invoiceList
    ? Math.max(1, Math.ceil(invoiceList.total / invoiceList.pageSize))
    : 1

  async function handleResetPassword() {
    const email = user?.email?.trim()
    if (!email) {
      toast.error('No email on this account')
      return
    }

    setResetLoading(true)
    try {
      const response = await apiFetch<{ email: string }>('/auth/otp', {
        method: 'POST',
        body: JSON.stringify({ email, isResetPassword: true }),
      })

      if (!response.success) {
        toast.error(response.message || 'Failed to send reset link')
        return
      }

      toast.success(response.message || 'Reset link sent   check your inbox')
    } catch {
      toast.error('Unable to reach the server. Please try again.')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <main className="mx-auto mb-12 mt-6 w-full max-w-3xl px-4 py-6 text-[var(--ink)] sm:mt-8 sm:px-6 sm:py-8">
      <h1 className="text-xl font-medium text-[var(--ink)]">Profile</h1>
      <p className={cn('mt-1 text-sm', hintClassName)}>
        Your account, plan schedule, and priority usage.
      </p>

      {openInvoice ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--accent)]/30 pb-5">
          <div>
            <p className={cn('text-sm', hintClassName)}>
              <span className="font-medium text-[var(--ink)]">Open invoice</span>
              <span className="mx-1.5 text-[var(--line)]">·</span>
              {openInvoice.planName} · {formatIdr(openInvoice.amount)} ·
              checkout expires {formatUtcDate(openInvoice.expiresAt)}
            </p>
            {openInvoice.simulatedPeriod ? (
              <p className={cn('mt-1 text-sm', hintClassName)}>
                After payment:{' '}
                <span className="text-[var(--ink)]">
                  {formatUtcDate(openInvoice.simulatedPeriod.effectiveDate)}
                </span>
                {' → '}
                <span className="text-[var(--ink)]">
                  {formatUtcDate(openInvoice.simulatedPeriod.untilDate)}
                </span>
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={cn(
                buttonOutlineClassName,
                'inline-flex h-8 items-center gap-1.5 px-3 text-xs',
              )}
              disabled={exportingId === openInvoice.id}
              onClick={() => void handleExportPdf(openInvoice.id)}
            >
              <Download className="size-3.5" aria-hidden />
              {exportingId === openInvoice.id ? 'Exporting…' : 'Export to PDF'}
            </button>
            <Link
              to="/payment/$id"
              params={{ id: openInvoice.id }}
              className={cn(buttonClassName, 'text-sm no-underline')}
            >
              Continue payment
            </Link>
          </div>
        </div>
      ) : null}

      <section className={cn(cardClassName, 'mt-6 space-y-4 p-5')}>
        <h2 className="text-sm font-medium text-[var(--ink)]">Account</h2>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-[var(--muted)]">Email</p>
            <p className="mt-1 text-sm text-[var(--ink)]">{user?.email ?? ' '}</p>
          </div>
          <button
            type="button"
            disabled={resetLoading || !user?.email}
            onClick={() => void handleResetPassword()}
            className={cn(buttonOutlineClassName, 'text-sm')}
          >
            {resetLoading ? 'Sending…' : 'Reset password'}
          </button>
        </div>
      </section>

      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
        {plan && !isLoading ? (
          <section className={cn(cardClassName, 'space-y-4 p-5')}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-medium text-[var(--ink)]">
                  Plan map
                </h2>
                <p className={cn('mt-1 text-sm', hintClassName)}>
                  <span
                    className="font-medium text-[var(--ink)]"
                    style={{ color: plan.accentColor }}
                  >
                    {plan.name}
                  </span>
                  {neverExpires || !planExpiresAt
                    ? ' · never expires'
                    : remainingMs !== null
                      ? remainingMs > 0
                        ? ` · until ${formatUtcDate(planExpiresAt)} · in ${formatDurationCountdown(remainingMs)}`
                        : ` · expired ${formatUtcDate(planExpiresAt)}`
                      : ''}
                </p>
              </div>
              <Link
                to="/pricing"
                className={cn(
                  hintClassName,
                  'text-sm no-underline hover:text-[var(--ink)]',
                )}
              >
                Pricing →
              </Link>
            </div>
            <p className={cn('text-sm', hintClassName)}>
              {nextPeriod
                ? 'Current period and scheduled future periods.'
                : neverExpires || !planExpiresAt
                  ? 'Your plan continues without an end date.'
                  : 'On the way to expiry   default applies after unless a period is scheduled.'}
            </p>
            <PlanTimelineMap
              plan={plan}
              planExpiresAt={planExpiresAt}
              neverExpires={neverExpires}
              timeline={timeline}
              nextPeriod={nextPeriod}
              nowMs={nowMs}
              pendingPurchase={
                openInvoice?.simulatedPeriod
                  ? {
                      label: openInvoice.simulatedPeriod.planName,
                      effectiveDate: openInvoice.simulatedPeriod.effectiveDate,
                      untilDate: openInvoice.simulatedPeriod.untilDate,
                    }
                  : null
              }
            />
          </section>
        ) : (
          <section className={cn(cardClassName, 'space-y-4 p-5')}>
            <h2 className="text-sm font-medium text-[var(--ink)]">Plan map</h2>
            <p className={cn('text-sm', hintClassName)}>
              {isLoading ? 'Loading plan…' : 'No plan assigned.'}
            </p>
          </section>
        )}

        <PriorityMeter
          loading={usageLoading}
          percent={usage?.percent ?? 0}
        />

      </div>

      <section className={cn(cardClassName, 'mt-4 space-y-4 p-5')}>
        <div>
          <h2 className="text-sm font-medium text-[var(--ink)]">Invoices</h2>
          <p className={cn('mt-1 text-sm', hintClassName)}>
            Open checkouts and previously paid invoices.
          </p>
        </div>

        {invoicesLoading ? (
          <p className={cn('text-sm', hintClassName)}>Loading invoices…</p>
        ) : !invoiceList || invoiceList.items.length === 0 ? (
          <p className={cn('text-sm', hintClassName)}>No invoices yet.</p>
        ) : (
          <>
            <ul className="divide-y divide-[var(--line)]">
              {invoiceList.items.map((invoice) => {
                const isOpenPending =
                  invoice.status === 'pending' &&
                  new Date(invoice.expiresAt).getTime() > nowMs
                return (
                  <li
                    key={invoice.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--ink)]">
                        {invoice.planName}
                        <span className="mx-1.5 font-normal text-[var(--line)]">
                          ·
                        </span>
                        <span className="font-normal">
                          {formatIdr(invoice.amount)}
                        </span>
                      </p>
                      <p className={cn('mt-0.5 text-sm capitalize', hintClassName)}>
                        {invoice.status}
                        <span className="mx-1.5 normal-case text-[var(--line)]">
                          ·
                        </span>
                        <span className="normal-case">
                          {invoiceMeta(invoice, nowMs)}
                        </span>
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className={cn(
                          buttonOutlineClassName,
                          'inline-flex h-8 items-center gap-1.5 px-3 text-xs',
                        )}
                        disabled={exportingId === invoice.id}
                        onClick={() => void handleExportPdf(invoice.id)}
                      >
                        <Download className="size-3.5" aria-hidden />
                        {exportingId === invoice.id
                          ? 'Exporting…'
                          : 'Export to PDF'}
                      </button>
                      {isOpenPending ? (
                        <Link
                          to="/payment/$id"
                          params={{ id: invoice.id }}
                          className={cn(buttonClassName, 'text-sm no-underline')}
                        >
                          Continue payment
                        </Link>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ul>

            {invoicePageCount <= 1 ? (
              <p className={cn('text-sm', hintClassName)}>
                {invoiceList.total} total
              </p>
            ) : (
              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  className={cn(buttonOutlineClassName, 'text-sm')}
                  disabled={invoicePage <= 1 || invoicesLoading}
                  onClick={() => setInvoicePage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <p className={cn('text-sm', hintClassName)}>
                  Page {invoicePage} of {invoicePageCount} ·{' '}
                  {invoiceList.total} total
                </p>
                <button
                  type="button"
                  className={cn(buttonOutlineClassName, 'text-sm')}
                  disabled={invoicePage >= invoicePageCount || invoicesLoading}
                  onClick={() =>
                    setInvoicePage((p) => Math.min(invoicePageCount, p + 1))
                  }
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>

    </main>
  )
}
