import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { useAuth } from '#/context/authContext'
import { usePlan } from '#/context/planContext'
import { formatDurationCountdown, formatUtcDate } from '#/lib/duration'
import { hintClassName } from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

const HIDE_UNTIL_KEY = 'sapai_plan_expiry_banner_hide_until'
const HIDE_MS = 24 * 60 * 60 * 1000

function readHideUntil(): number | null {
  try {
    const raw = localStorage.getItem(HIDE_UNTIL_KEY)
    if (!raw) return null
    const ms = Date.parse(raw)
    return Number.isFinite(ms) ? ms : null
  } catch {
    return null
  }
}

export default function PlanExpiryBanner() {
  const { isAuthenticated } = useAuth()
  const { plan, planExpiresAt, headingToExpiry, isLoading } = usePlan()
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [dismissed, setDismissed] = useState(() => {
    const hideUntil = readHideUntil()
    return hideUntil !== null && Date.now() < hideUntil
  })

  useEffect(() => {
    if (!headingToExpiry || dismissed) return
    const id = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [headingToExpiry, dismissed])

  if (
    isLoading ||
    !isAuthenticated ||
    !headingToExpiry ||
    !plan ||
    !planExpiresAt ||
    dismissed
  ) {
    return null
  }

  const expiresMs = new Date(planExpiresAt).getTime()
  const remaining = expiresMs - nowMs
  const expired = remaining <= 0

  function handleDismiss() {
    const hideUntil = new Date(Date.now() + HIDE_MS).toISOString()
    try {
      localStorage.setItem(HIDE_UNTIL_KEY, hideUntil)
    } catch {
      // ignore quota / private mode
    }
    setDismissed(true)
  }

  return (
    <div
      className="border-b border-amber-300/70 bg-amber-50 px-4 py-2.5 text-sm text-amber-950"
      role="status"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p>
          Your <span className="font-medium">{plan.name}</span> plan{' '}
          {expired ? (
            <>has expired</>
          ) : (
            <>
              expires{' '}
              <span className="font-medium">
                {formatUtcDate(planExpiresAt)}
              </span>
              {' · in '}
              <span className="font-medium tabular-nums">
                {formatDurationCountdown(remaining)}
              </span>
            </>
          )}
          .
        </p>
        <div className="flex items-center gap-3">
          <p className={cn(hintClassName, 'text-amber-900/80')}>
            <Link
              to="/profile"
              className="font-medium text-amber-950 underline-offset-2 hover:underline"
            >
              View plan
            </Link>
            {' · '}
            <Link
              to="/pricing"
              className="font-medium text-amber-950 underline-offset-2 hover:underline"
            >
              Pricing
            </Link>
          </p>
          <button
            type="button"
            onClick={handleDismiss}
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-amber-900/70 transition hover:bg-amber-100 hover:text-amber-950"
            aria-label="Dismiss for 24 hours"
            title="Dismiss for 24 hours"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}
