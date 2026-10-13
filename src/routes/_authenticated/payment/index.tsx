import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Download } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import BrandMark from '#/components/BrandMark'
import PlanTimelineMap from '#/components/plan/PlanTimelineMap'
import { usePlan } from '#/context/planContext'
import { apiFetch } from '#/lib/api'
import { formatUtcDate } from '#/lib/duration'
import {
  downloadInvoicePdf,
  formatIdr,
  type Invoice,
  type MidtransClientConfig,
} from '#/lib/invoice'
import { pageHead } from '#/lib/seo'
import {
  buttonClassNameFull,
  buttonOutlineClassName,
  hintClassName,
} from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/_authenticated/payment/')({
  component: PaymentPage,
  head: () =>
    pageHead({
      title: 'Payment',
      path: '/payment',
      noIndex: true,
    }),
})

const SNAP_SCRIPT_ID = 'midtrans-snap-js'

function loadSnapScript(snapJsUrl: string, clientKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(SNAP_SCRIPT_ID)
    if (existing) {
      if (window.snap) {
        resolve()
        return
      }
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener(
        'error',
        () => reject(new Error('Failed to load Snap')),
        { once: true },
      )
      return
    }

    const script = document.createElement('script')
    script.id = SNAP_SCRIPT_ID
    script.src = snapJsUrl
    script.setAttribute('data-client-key', clientKey)
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Snap'))
    document.body.appendChild(script)
  })
}

async function pollUntilPaid(
  signal: AbortSignal,
  build: 'development' | 'production' = 'production',
): Promise<Invoice | null> {
  const deadline = Date.now() + 60_000
  const baseDelay = build === 'development' ? 3000 : 5000
  const maxDelay = build === 'development' ? 5000 : 8000
  let delay = baseDelay
  while (Date.now() < deadline) {
    if (signal.aborted) return null
    const res = await apiFetch<Invoice | null>('/payment/invoices/active')
    if (res.success && res.data?.status === 'paid') {
      return res.data
    }
    await new Promise((r) => setTimeout(r, delay))
    delay = Math.min(delay + 500, maxDelay)
  }
  return null
}

function PaymentPage() {
  const navigate = useNavigate()
  const {
    plan,
    planExpiresAt,
    neverExpires,
    timeline,
    nextPeriod,
    refreshPlan,
  } = usePlan()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState<string>('Preparing checkout…')
  const [expiresIn, setExpiresIn] = useState<string>('')
  const [expired, setExpired] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const snapStarted = useRef(false)
  const pollAbort = useRef<AbortController | null>(null)
  const buildRef = useRef<'development' | 'production'>('production')

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  function startConfirmPoll() {
    setStatusMsg('Payment received. Confirming…')
    pollAbort.current?.abort()
    const ac = new AbortController()
    pollAbort.current = ac
    void (async () => {
      const paid = await pollUntilPaid(ac.signal, buildRef.current)
      if (ac.signal.aborted) return
      if (paid) {
        await refreshPlan()
        await navigate({ to: '/dashboard' })
      } else {
        setStatusMsg(
          'Payment is still confirming. Check your dashboard shortly.',
        )
      }
    })()
  }

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const invRes = await apiFetch<Invoice | null>(
          '/payment/invoices/active',
        )
        if (cancelled) return
        if (!invRes.success || !invRes.data) {
          await navigate({ to: '/pricing' })
          return
        }
        if (
          invRes.data.status === 'pending' &&
          new Date(invRes.data.expiresAt).getTime() <= Date.now()
        ) {
          await navigate({ to: '/pricing' })
          return
        }
        if (invRes.data.status === 'paid') {
          await refreshPlan()
          await navigate({ to: '/dashboard' })
          return
        }
        if (!invRes.data.snapToken) {
          setError('Checkout session is missing. Please try again from pricing.')
          return
        }
        setInvoice(invRes.data)

        const cfgRes = await apiFetch<MidtransClientConfig>(
          '/payment/midtrans/client-config',
        )
        if (cancelled) return
        if (!cfgRes.success || !cfgRes.data) {
          setError(cfgRes.message || 'Failed to load payment config')
          return
        }
        buildRef.current = cfgRes.data.build ?? 'production'

        await loadSnapScript(cfgRes.data.snapJsUrl, cfgRes.data.clientKey)
        if (cancelled || snapStarted.current) return
        snapStarted.current = true
        setStatusMsg('Complete payment in the checkout window.')

        window.snap?.pay(invRes.data.snapToken, {
          onSuccess: () => {
            startConfirmPoll()
          },
          onPending: () => {
            setStatusMsg('Payment pending. Waiting for confirmation…')
            startConfirmPoll()
          },
          onError: () => {
            setStatusMsg('Payment failed. You can try again from pricing.')
          },
          onClose: () => {
            setStatusMsg(
              'Checkout closed. Your invoice is still active until it expires.',
            )
          },
        })
      } catch {
        if (!cancelled) {
          setError('Unable to start payment. Please try again.')
        }
      }
    })()

    return () => {
      cancelled = true
      pollAbort.current?.abort()
    }
  }, [navigate, refreshPlan])

  useEffect(() => {
    if (!invoice?.expiresAt) return
    const tick = () => {
      const ms = new Date(invoice.expiresAt).getTime() - Date.now()
      if (ms <= 0) {
        setExpired(true)
        setExpiresIn('Expired')
        return
      }
      const totalSec = Math.floor(ms / 1000)
      const m = Math.floor(totalSec / 60)
      const s = totalSec % 60
      setExpiresIn(`${m}:${String(s).padStart(2, '0')}`)
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [invoice?.expiresAt])

  async function handleExportPdf() {
    if (!invoice) return
    setExporting(true)
    try {
      await downloadInvoicePdf(invoice.id)
    } catch {
      setStatusMsg('Could not export invoice PDF. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  if (error) {
    return (
      <main className="mx-auto mt-8 mb-12 w-full max-w-lg px-6 py-10 text-[var(--ink)]">
        <p className="text-sm text-red-600">{error}</p>
        <Link
          to="/pricing"
          className={cn(buttonClassNameFull, 'mt-6 inline-block text-center no-underline')}
        >
          Back to pricing
        </Link>
      </main>
    )
  }

  if (!invoice) {
    return (
      <main className="mx-auto mt-8 mb-12 w-full max-w-lg px-6 py-10">
        <p className={hintClassName}>Loading payment…</p>
      </main>
    )
  }

  return (
    <main className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -10%, var(--accent-paper), transparent 55%), linear-gradient(180deg, var(--paper) 0%, #ffffff 45%)',
        }}
      />
      <div className="mx-auto max-w-lg px-6 py-8 sm:py-10">
        <div className="flex items-center justify-between gap-4">
          <BrandMark variant="dark" size="sm" />

          <p className="nojegaye text-sm tracking-wide text-[var(--accent)]">
            Payment
          </p>
        </div>
        <p className={`mt-4 ${hintClassName}`}>{statusMsg}</p>

        {invoice.simulatedPeriod ? (
          <div className="mt-6 space-y-3 rounded-[var(--radius-md)] border border-[var(--line)] bg-white p-6 sm:p-8">
            <div>
              <p className="text-sm font-medium text-[var(--ink)]">
                After payment
              </p>
              <p className={`mt-1 text-sm ${hintClassName}`}>
                {invoice.simulatedPeriod.planName} will be added from{' '}
                <span className="text-[var(--ink)]">
                  {formatUtcDate(invoice.simulatedPeriod.effectiveDate)}
                </span>{' '}
                to{' '}
                <span className="text-[var(--ink)]">
                  {formatUtcDate(invoice.simulatedPeriod.untilDate)}
                </span>
                .
              </p>
            </div>
            {plan ? (
              <PlanTimelineMap
                plan={plan}
                planExpiresAt={planExpiresAt}
                neverExpires={neverExpires}
                timeline={timeline}
                nextPeriod={nextPeriod}
                nowMs={nowMs}
                pendingPurchase={{
                  label: invoice.simulatedPeriod.planName,
                  effectiveDate: invoice.simulatedPeriod.effectiveDate,
                  untilDate: invoice.simulatedPeriod.untilDate,
                }}
              />
            ) : null}
          </div>
        ) : null}

        {expired ? (
          <div className="mt-8 text-center">
            <p className="text-sm text-red-600">
              This invoice has expired. Start again from pricing.
            </p>
            <Link
              to="/pricing"
              className={cn(
                buttonClassNameFull,
                'mt-4 inline-block text-center no-underline',
              )}
            >
              Back to pricing
            </Link>
          </div>
        ) : (
          <button
            type="button"
            className={cn(buttonClassNameFull, 'mt-8 w-full py-3')}
            onClick={() => {
              if (!invoice.snapToken || !window.snap) return
              window.snap.pay(invoice.snapToken, {
                onSuccess: () => {
                  startConfirmPoll()
                },
                onPending: () => {
                  setStatusMsg('Payment pending. Waiting for confirmation…')
                  startConfirmPoll()
                },
                onError: () =>
                  setStatusMsg('Payment failed. You can try again.'),
                onClose: () =>
                  setStatusMsg('Checkout closed. Invoice remains active.'),
              })
            }}
          >
            Open checkout
          </button>
        )}

        <div className="mt-8 space-y-3 rounded-[var(--radius-md)] border border-[var(--line)] bg-white p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-[var(--ink)]">Invoice</p>
            <button
              type="button"
              className={cn(
                buttonOutlineClassName,
                'inline-flex h-8 items-center gap-1.5 px-3 text-xs',
              )}
              disabled={exporting}
              onClick={() => void handleExportPdf()}
            >
              <Download className="size-3.5" aria-hidden />
              {exporting ? 'Exporting…' : 'Export to PDF'}
            </button>
          </div>
          <div className="flex justify-between text-sm">
            <span className={hintClassName}>Plan</span>
            <span className="font-medium text-[var(--ink)]">
              {invoice.planName}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className={hintClassName}>Invoice</span>
            <span className="font-mono text-xs text-[var(--ink)]">
              {invoice.id}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className={hintClassName}>Amount</span>
            <span className="font-semibold text-[var(--ink)]">
              {formatIdr(invoice.amount)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className={hintClassName}>Status</span>
            <span className="capitalize text-[var(--ink)]">{invoice.status}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className={hintClassName}>Expires in</span>
            <span className={expired ? 'text-red-600' : 'text-[var(--ink)]'}>
              {expiresIn || ' '}
            </span>
          </div>
        </div>
      </div>
    </main>
  )
}
