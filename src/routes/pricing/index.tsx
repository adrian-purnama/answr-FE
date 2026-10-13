import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import BrandMark from '#/components/BrandMark'
import { getToken } from '#/context/authContext'
import { apiFetch } from '#/lib/api'
import { formatIdr, type Invoice } from '#/lib/invoice'
import type { Plan } from '#/lib/plan'
import { pageHead } from '#/lib/seo'
import { buttonClassNameFull, hintClassName } from '#/lib/ui-classes'
import { cn } from '#/lib/utils'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/pricing/')({
  component: PricingPage,
  head: () =>
    pageHead({
      title: 'Pricing',
      description:
        'Choose an answr plan for AI chat, knowledge training, and embeddable widgets.',
      path: '/pricing',
    }),
})

const CONTACT_EMAIL = 'hello@answr.com'
/** Rough IDR→USD rate for a small approximate conversion on pricing cards. */
const APPROX_IDR_PER_USD = 16_000

function formatNumber(value: number): string {
  return value.toLocaleString()
}

function formatApproxUsd(idr: number): string {
  const usd = idr / APPROX_IDR_PER_USD
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: usd < 10 ? 2 : 0,
  }).format(usd)
}

function planHighlights(plan: Plan): string[] {
  const lines = [
    `${formatNumber(plan.maxApiKeys)} API key${plan.maxApiKeys === 1 ? '' : 's'}`,
    `${formatNumber(plan.maxRequestsPerMinute)} requests / minute`,
    `${formatNumber(plan.maxArticles ?? 10)} articles`,
    `${formatNumber(plan.analyticsLookbackDays ?? 30)}-day analytics lookback`,
  ]

  if (plan.liveAgent) {
    lines.push(
      `Live agent${(plan.maxLiveAgents ?? 0) > 0 ? ` (${formatNumber(plan.maxLiveAgents ?? 0)})` : ''}`,
    )
  }
  if (plan.meetingTool) lines.push('Meeting booking')
  if (plan.leadCapture) lines.push('Lead capture')
  if (plan.whatsApp) lines.push('WhatsApp')

  return lines
}

function isPurchasable(plan: Plan): boolean {
  return Number.isInteger(plan.pricePerMonth) && plan.pricePerMonth > 0
}

function PricingPage() {
  const navigate = useNavigate()
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [upgrading, setUpgrading] = useState(false)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const response = await apiFetch<Plan[]>('/plans/pricing')
        if (!response.success || !response.data) {
          if (!cancelled) setError(response.message || 'Failed to load plans')
          return
        }
        // Prefer a purchasable plan for the Upgrade CTA; fall back to default/first.
        const next =
          response.data.find((item) => isPurchasable(item)) ??
          response.data.find((item) => item.isDefaultPlan) ??
          response.data[0] ??
          null
        if (!cancelled) setPlan(next)
      } catch {
        if (!cancelled) setError('Unable to reach the server. Please try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  async function handleUpgrade() {
    if (!plan || upgrading) return
    if (!isPurchasable(plan)) {
      toast.error('This plan is not available for online purchase.')
      return
    }
    if (!getToken()) {
      await navigate({
        to: '/login',
        search: { redirect: '/pricing' },
      })
      return
    }

    setUpgrading(true)
    try {
      const response = await apiFetch<Invoice>('/payment/invoices', {
        method: 'POST',
        body: JSON.stringify({ planId: plan.id }),
      })
      if (!response.success || !response.data) {
        toast.error(response.message || 'Failed to start checkout')
        return
      }
      await navigate({ to: '/payment' })
    } catch {
      toast.error('Unable to reach the server. Please try again.')
    } finally {
      setUpgrading(false)
    }
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

      <div className="mx-auto max-w-5xl px-6 py-14 sm:py-20">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-sm grotesk tracking-wide text-[var(--accent)]">
            Pricing
          </p>
          <h1 className="mt-3 grotesk text-4xl tracking-tight text-[var(--primary)] sm:text-5xl">
            One plan. Or yours.
          </h1>
          <p className={`mx-auto mt-4 max-w-md ${hintClassName}`}>
            Start with a clear monthly plan, or tell us what you need and we
            will shape it with you.
          </p>
        </div>

        {loading ? (
          <p className={`mt-16 text-center ${hintClassName}`}>Loading…</p>
        ) : error ? (
          <p className="mt-16 text-center text-sm text-red-600">{error}</p>
        ) : (
          <div className="mt-14 grid gap-6 sm:grid-cols-2 sm:gap-8">
            {plan ? (
              <article className="flex flex-col rounded-[var(--radius-md)] border border-[var(--line)] bg-white p-8 sm:p-10">
                <p className={`text-xs font-semibold uppercase tracking-wider ${hintClassName}`}>
                  Standard
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--ink)]">
                  {plan.name}
                </h2>
                <p className={`mt-2 ${hintClassName}`}>{plan.description}</p>

                <div className="mt-8">
                  <p className="flex items-baseline gap-1">
                    <span className="grotesk text-5xl tracking-tight text-[var(--primary)]">
                      {formatIdr(plan.priceLabel)}
                    </span>
                    <span className={hintClassName}>/mo</span>
                  </p>
                  <p className={`mt-1 text-xs ${hintClassName}`}>
                    ≈ {formatApproxUsd(plan.priceLabel)}/mo
                  </p>
                  {plan.pricePerMonth !== plan.priceLabel ? (
                    <p className={`mt-1 text-xs ${hintClassName}`}>
                      Billed at {formatIdr(plan.pricePerMonth)}/mo
                    </p>
                  ) : null}
                  {plan.priceNote ? (
                    <p className={`mt-2 ${hintClassName}`}>{plan.priceNote}</p>
                  ) : null}
                </div>

                <ul className="mt-8 flex-1 space-y-2.5 text-sm text-[var(--ink)]">
                  {planHighlights(plan).map((line) => (
                    <li key={line} className="flex gap-2.5">
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]"
                        aria-hidden
                      />
                      {line}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  disabled={upgrading || !isPurchasable(plan)}
                  onClick={() => void handleUpgrade()}
                  className={cn(
                    buttonClassNameFull,
                    'mt-10 block w-full py-3 text-center disabled:opacity-60',
                  )}
                >
                  {upgrading ? 'Starting checkout…' : 'Upgrade Now'}
                </button>
              </article>
            ) : (
              <article className="flex flex-col justify-center rounded-[var(--radius-md)] border border-[var(--line)] bg-white p-8 sm:p-10">
                <p className={`text-center ${hintClassName}`}>
                  No public plan is available yet. Reach out and we will set you
                  up.
                </p>
              </article>
            )}

            <article className="flex flex-col rounded-[var(--radius-md)] bg-[var(--primary)] p-8 text-[var(--paper)] sm:p-10">
              <div className="mb-6">
                <BrandMark
                  variant="light"
                  size="md"
                  showWordmark={false}
                  logoClassName="sm:h-20"
                />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                Custom
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Tailor your needs
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                Higher limits, extra seats, or a setup that fits your stack  
                tell us what you are building and we will put a plan together.
              </p>

              <ul className="mt-8 flex-1 space-y-2.5 text-sm text-white/85">
                <li className="flex gap-2.5">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]"
                    aria-hidden
                  />
                  Limits sized to your traffic
                </li>
                <li className="flex gap-2.5">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]"
                    aria-hidden
                  />
                  Live agent, meetings, and lead capture as needed
                </li>
                <li className="flex gap-2.5">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]"
                    aria-hidden
                  />
                  Direct support while you roll out
                </li>
                <li className="flex gap-2.5">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]"
                    aria-hidden
                  />
                  Onboarding training and support
                </li>
                <li className="flex gap-2.5">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]"
                    aria-hidden
                  />
                  Custom Data Retention
                </li>
              </ul>

              <a
                href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Custom plan inquiry')}`}
                className="mt-10 block rounded-[var(--radius-sm)] border border-white/30 bg-[var(--paper)] px-4 py-3 text-center text-sm font-semibold text-[var(--primary)] no-underline transition hover:bg-[var(--accent-paper)]"
              >
                Contact us
              </a>
              <p className="mt-3 text-center text-xs text-white/45">
                {CONTACT_EMAIL}
              </p>
            </article>
          </div>
        )}
      </div>
    </main>
  )
}
