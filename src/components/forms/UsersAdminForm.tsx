import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import toast from 'react-hot-toast'
import { LoaderCircle, Search } from 'lucide-react'
import type {
  AdminUser,
  AdminUserList,
  PlanPeriodSyncResult,
  PlanPeriodSyncStatus,
} from '#/lib/adminUser'
import { formatDurationCountdown } from '#/lib/adminUser'
import { apiFetch } from '#/lib/api'
import { useDebouncedValue } from '#/lib/useDebouncedValue'
import {
  buttonOutlineClassName,
  cardClassName,
  hintClassName,
  inputClassName,
} from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

const PAGE_SIZE = 20

function planExpiryLabel(planExpiresAt: string | null, nowMs: number): string {
  if (!planExpiresAt) return 'Never expires'
  const expiresMs = new Date(planExpiresAt).getTime()
  if (Number.isNaN(expiresMs)) return 'Never expires'
  const remaining = expiresMs - nowMs
  if (remaining <= 0) {
    return `Expired ${new Date(planExpiresAt).toLocaleString()}`
  }
  return `Expires ${new Date(planExpiresAt).toLocaleString()} · in ${formatDurationCountdown(remaining)}`
}

export default function UsersAdminForm() {
  const [emailQuery, setEmailQuery] = useState('')
  const debouncedQuery = useDebouncedValue(emailQuery, 300)
  const [page, setPage] = useState(1)

  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)

  const [planSync, setPlanSync] = useState<PlanPeriodSyncStatus | null>(null)
  const [syncingExpiry, setSyncingExpiry] = useState(false)
  const [msUntilNextSync, setMsUntilNextSync] = useState<number | null>(null)
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    setPage(1)
  }, [debouncedQuery])

  useEffect(() => {
    let cancelled = false
    setSearching(true)

    void (async () => {
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(PAGE_SIZE),
        })
        const q = debouncedQuery.trim()
        if (q) params.set('email', q)

        const response = await apiFetch<AdminUserList>(
          `/admin/users?${params.toString()}`,
        )
        if (!response.success || !response.data) {
          if (!cancelled) toast.error(response.message || 'Failed to load users')
          return
        }
        if (!cancelled) {
          setResults(response.data.items)
          setTotal(response.data.total)
        }
      } catch {
        if (!cancelled) toast.error('Unable to reach the server')
      } finally {
        if (!cancelled) setSearching(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [debouncedQuery, page])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const response = await apiFetch<PlanPeriodSyncStatus>(
          '/admin/plan-period-sync',
        )
        if (!response.success || !response.data) return
        if (!cancelled) {
          setPlanSync(response.data)
          setMsUntilNextSync(response.data.msUntilNext)
        }
      } catch {
        // non-blocking
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (!planSync?.nextRunAt) {
      setMsUntilNextSync(null)
      return
    }
    setMsUntilNextSync(
      Math.max(0, new Date(planSync.nextRunAt).getTime() - nowMs),
    )
  }, [planSync?.nextRunAt, nowMs])

  async function handleRunPlanPeriodSync() {
    setSyncingExpiry(true)
    try {
      const response = await apiFetch<PlanPeriodSyncResult>(
        '/admin/plan-period-sync/run',
        { method: 'POST' },
      )
      if (!response.success || !response.data) {
        toast.error(response.message || 'Failed to run plan period sync')
        return
      }
      setPlanSync(response.data)
      setMsUntilNextSync(response.data.msUntilNext)
      if (response.data.skipped) {
        toast('Sync already running')
      } else {
        toast.success(
          `Sync complete   ${response.data.usersProcessed} user(s), ${response.data.keysResynced} key resync(s)`,
        )
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(PAGE_SIZE),
        })
        const q = debouncedQuery.trim()
        if (q) params.set('email', q)
        const refreshed = await apiFetch<AdminUserList>(
          `/admin/users?${params.toString()}`,
        )
        if (refreshed.success && refreshed.data) {
          setResults(refreshed.data.items)
          setTotal(refreshed.data.total)
        }
      }
    } catch {
      toast.error('Unable to reach the server')
    } finally {
      setSyncingExpiry(false)
    }
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-8">
      <section
        className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm"
        title="Runs every 1–5 minutes"
      >
        <h2 className="text-sm font-medium text-[var(--ink)]">
          Plan sync
        </h2>
        <span className="text-[var(--line)]" aria-hidden>
          |
        </span>
        <p className={hintClassName}>
          Next{' '}
          <span className="text-[var(--ink)]">
            {msUntilNextSync === null
              ? ' '
              : msUntilNextSync === 0
                ? 'due now'
                : formatDurationCountdown(msUntilNextSync)}
          </span>
        </p>
        <span className="text-[var(--line)]" aria-hidden>
          |
        </span>
        <p className={hintClassName}>
          Last{' '}
          {planSync?.lastRunAt
            ? new Date(planSync.lastRunAt).toLocaleString()
            : ' '}
        </p>
        <span className="text-[var(--line)]" aria-hidden>
          |
        </span>
        <button
          type="button"
          disabled={syncingExpiry || planSync?.running}
          onClick={() => void handleRunPlanPeriodSync()}
          className={cn(buttonOutlineClassName, 'px-3 py-1.5 text-sm')}
        >
          {syncingExpiry || planSync?.running ? (
            <>
              <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
              Syncing…
            </>
          ) : (
            'Run sync now'
          )}
        </button>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-medium text-[var(--ink)]">Users</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Search by email.</p>
        </div>

        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--muted)]"
            aria-hidden
          />
          <input
            type="search"
            value={emailQuery}
            onChange={(event) => setEmailQuery(event.target.value)}
            placeholder="Search email…"
            className={cn(inputClassName, 'pl-10')}
            autoComplete="off"
          />
        </div>

        {searching ? (
          <div className={`flex items-center gap-2 py-4 ${hintClassName}`}>
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
            Loading users…
          </div>
        ) : results.length === 0 ? (
          <p className={`${cardClassName} px-4 py-8 text-center ${hintClassName}`}>
            {debouncedQuery.trim()
              ? `No users found for “${debouncedQuery.trim()}”.`
              : 'No users yet.'}
          </p>
        ) : (
          <>
            <ul className="space-y-2">
              {results.map((user) => (
                <li key={user.id}>
                  <Link
                    to="/admin/users/$userId"
                    params={{ userId: user.id }}
                    className={cn(
                      cardClassName,
                      'block w-full px-4 py-3 text-left no-underline transition hover:border-[var(--ink)]',
                    )}
                  >
                    <p className="font-medium text-[var(--ink)]">{user.email}</p>
                    <p className={`mt-0.5 ${hintClassName}`}>
                      Plan: {user.planName ?? 'No plan assigned'}
                      {user.isAdmin ? ' · Admin' : ''}
                      {user.isBlocked ? ' · Blocked' : ''}
                    </p>
                    <p className={`mt-0.5 ${hintClassName}`}>
                      {planExpiryLabel(user.planExpiresAt, nowMs)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>

            {pageCount > 1 ? (
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  className={buttonOutlineClassName}
                  disabled={page <= 1 || searching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <p className={`text-sm ${hintClassName}`}>
                  Page {page} of {pageCount} · {total} total
                </p>
                <button
                  type="button"
                  className={buttonOutlineClassName}
                  disabled={page >= pageCount || searching}
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                >
                  Next
                </button>
              </div>
            ) : (
              <p className={`text-sm ${hintClassName}`}>{total} total</p>
            )}
          </>
        )}
      </section>
    </div>
  )
}
