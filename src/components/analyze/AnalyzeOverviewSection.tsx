import { useEffect, useMemo, useState } from 'react'
import {
  BookOpen,
  Bot,
  ChevronRight,
  Eye,
  Headset,
  LayoutGrid,
  Newspaper,
  Star,
} from 'lucide-react'
import AnalyzeDateRange from '#/components/analyze/AnalyzeDateRange'
import MetricCard from '#/components/analyze/MetricCard'
import PriorityMeter from '#/components/analyze/PriorityMeter'
import UsageTreemap from '#/components/analyze/UsageTreemap'
import { useAnalyzeDateRange } from '#/components/analyze/useAnalyzeDateRange'
import SideDrawer from '#/components/ui/SideDrawer'
import { usePlan } from '#/context/planContext'
import {
  getDeepseekUsage,
  type DeepseekUsage,
} from '#/lib/user'
import {
  getWidgetAnalyticsSummary,
  type WidgetAnalyticsSummary,
  type WidgetCsatComment,
  type WidgetCsatSummary,
} from '#/lib/widgetAnalytics'
import {
  buttonOutlineClassName,
  cardClassName,
  hintClassName,
  projectSectionClassName,
} from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

type AnalyzeOverviewSectionProps = {
  apiKeyId: string
}

function StarRow({
  value,
  size = 'size-4',
}: {
  value: number
  size?: string
}) {
  return (
    <span
      className="inline-flex gap-0.5"
      aria-label={`${value} out of 5`}
    >
      {Array.from({ length: 5 }, (_, index) => {
        const filled = value >= index + 1
        const partial = !filled && value > index
        return (
          <Star
            key={index}
            className={cn(
              size,
              filled || partial
                ? 'fill-amber-400 text-amber-500'
                : 'text-[var(--line)]',
            )}
            style={partial ? { opacity: Math.max(0.45, value - index) } : undefined}
            aria-hidden
          />
        )
      })}
    </span>
  )
}

const REVIEW_PAGE_SIZE = 3
const STAR_FILTERS = [5, 4, 3, 2, 1] as const

function commentText(feedback: string) {
  const trimmed = feedback.trim()
  return trimmed || 'No comment.'
}

function starBucket(stars: number) {
  return Math.min(5, Math.max(1, Math.round(stars)))
}

function RatingPreview({
  row,
  onOpen,
}: {
  row: WidgetCsatComment
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-start gap-3 py-3 text-left transition hover:bg-[var(--surface)]"
    >
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <StarRow value={row.stars} size="size-3.5" />
          <span className={cn(hintClassName, 'text-xs')}>
            {new Date(row.submittedAt).toLocaleDateString()}
            {row.agentName ? ` · ${row.agentName}` : ''}
          </span>
        </span>
        <span className="mt-1 line-clamp-2 block text-sm text-[var(--ink)]">
          {commentText(row.feedback)}
        </span>
      </span>
      <ChevronRight className="mt-1 size-4 shrink-0 text-[var(--muted)]" aria-hidden />
    </button>
  )
}

function RatingReviews({ rows }: { rows: WidgetCsatComment[] }) {
  const [starFilter, setStarFilter] = useState<number | null>(null)
  const [page, setPage] = useState(0)
  const [index, setIndex] = useState<number | null>(null)

  const counts = useMemo(() => {
    const map = new Map<number, number>()
    for (const row of rows) {
      const bucket = starBucket(row.stars)
      map.set(bucket, (map.get(bucket) ?? 0) + 1)
    }
    return map
  }, [rows])

  const filtered = useMemo(
    () =>
      starFilter == null
        ? rows
        : rows.filter((row) => starBucket(row.stars) === starFilter),
    [rows, starFilter],
  )

  const pageCount = Math.max(1, Math.ceil(filtered.length / REVIEW_PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const start = safePage * REVIEW_PAGE_SIZE
  const visible = filtered.slice(start, start + REVIEW_PAGE_SIZE)
  const selected = index != null ? filtered[index] : undefined

  useEffect(() => {
    setStarFilter(null)
    setPage(0)
    setIndex(null)
  }, [rows])

  function selectStars(next: number | null) {
    setStarFilter(next)
    setPage(0)
    setIndex(null)
  }

  return (
    <>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className={cn(
            'rounded-md border px-2.5 py-1.5 text-xs',
            starFilter == null
              ? 'border-[var(--primary)]/30 bg-[var(--primary)]/10 text-[var(--primary)]'
              : 'border-[var(--line)] text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)]',
          )}
          onClick={() => selectStars(null)}
        >
          All
        </button>
        {STAR_FILTERS.map((star) => {
          const count = counts.get(star) ?? 0
          const active = starFilter === star
          return (
            <button
              key={star}
              type="button"
              disabled={count === 0}
              aria-label={`${star} stars, ${count} ratings`}
              className={cn(
                'inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs',
                active
                  ? 'border-amber-200 bg-amber-50 text-amber-900'
                  : 'border-[var(--line)] text-[var(--ink)] hover:bg-[var(--surface)]',
                count === 0 && 'cursor-not-allowed opacity-40 hover:bg-transparent',
              )}
              onClick={() => selectStars(star)}
            >
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Star
                  className={cn(
                    'size-3.5',
                    active || count > 0
                      ? 'fill-amber-400 text-amber-500'
                      : 'text-[var(--muted)]',
                  )}
                  aria-hidden
                />
                {star}
              </span>
              <span className="h-3 w-px bg-[var(--line)]" aria-hidden />
              <span className="tabular-nums text-[var(--muted)]">{count}</span>
            </button>
          )
        })}
      </div>
      {filtered.length === 0 ? (
        <p className={cn(hintClassName, 'mt-4 text-xs')}>
          No {starFilter}-star ratings in this range.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-[var(--line)]">
          {visible.map((row, offset) => (
            <li key={`${row.submittedAt}-${start + offset}`}>
              <RatingPreview
                row={row}
                onOpen={() => setIndex(start + offset)}
              />
            </li>
          ))}
        </ul>
      )}
      {filtered.length > REVIEW_PAGE_SIZE ? (
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            className={buttonOutlineClassName}
            disabled={safePage <= 0}
            onClick={() => setPage(safePage - 1)}
          >
            Previous
          </button>
          <span className={cn(hintClassName, 'tabular-nums text-xs')}>
            {safePage + 1} / {pageCount}
          </span>
          <button
            type="button"
            className={buttonOutlineClassName}
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage(safePage + 1)}
          >
            Next
          </button>
        </div>
      ) : null}
      <SideDrawer
        open={selected != null}
        onClose={() => setIndex(null)}
        label={selected ? `${starBucket(selected.stars)}-star rating` : 'Rating'}
        size="md"
        statusLabel={
          selected ? (
            <span className={hintClassName}>
              {index! + 1} of {filtered.length}
            </span>
          ) : null
        }
      >
        {selected && index != null ? (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <StarRow value={selected.stars} />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={buttonOutlineClassName}
                  disabled={index <= 0}
                  onClick={() => setIndex(index - 1)}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className={buttonOutlineClassName}
                  disabled={index >= filtered.length - 1}
                  onClick={() => setIndex(index + 1)}
                >
                  Next
                </button>
              </div>
            </div>
            <p className={cn(hintClassName, 'mt-3 text-xs')}>
              {new Date(selected.submittedAt).toLocaleString()}
              {selected.agentName ? ` · ${selected.agentName}` : ''}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-[var(--ink)]">
              {commentText(selected.feedback)}
            </p>
          </div>
        ) : null}
      </SideDrawer>
    </>
  )
}

function CsatBlock({
  title,
  summary,
  showAgents = false,
  browse = false,
}: {
  title: string
  summary: WidgetCsatSummary
  showAgents?: boolean
  browse?: boolean
}) {
  const hasRatings = summary.ratingCount > 0 && summary.averageStars != null

  return (
    <div className={cn(cardClassName, 'p-5')}>
      <p className="text-sm font-medium text-[var(--ink)]">{title}</p>
      {hasRatings ? (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StarRow value={summary.averageStars ?? 0} />
            <p className="text-sm tabular-nums text-[var(--ink)]">
              {summary.averageStars?.toFixed(1)} from {summary.ratingCount}{' '}
              rating{summary.ratingCount === 1 ? '' : 's'}
            </p>
          </div>
          {showAgents && summary.byAgent.length > 0 ? (
            <ul className="mt-4 space-y-1.5">
              {summary.byAgent.map((agent) => (
                <li
                  key={agent.name}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="min-w-0 truncate">{agent.name}</span>
                  <span className="inline-flex shrink-0 items-center gap-2">
                    <StarRow value={agent.averageStars} size="size-3.5" />
                    <span className={cn(hintClassName, 'tabular-nums')}>
                      {agent.ratingCount}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          {summary.recent.length > 0 ? (
            browse ? (
              <RatingReviews rows={summary.recent} />
            ) : (
            <ul className="mt-4 divide-y divide-[var(--line)]">
              {summary.recent.slice(0, 8).map((row, index) => (
                <li key={`${row.submittedAt}-${index}`} className="py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StarRow value={row.stars} size="size-3.5" />
                    <span className={cn(hintClassName, 'text-xs')}>
                      {new Date(row.submittedAt).toLocaleDateString()}
                      {row.agentName ? ` · ${row.agentName}` : ''}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--ink)]">
                    {commentText(row.feedback)}
                  </p>
                </li>
              ))}
            </ul>
            )
          ) : null}
        </>
      ) : (
        <p className={cn(hintClassName, 'mt-3')}>No ratings in this range.</p>
      )}
    </div>
  )
}

export default function AnalyzeOverviewSection({
  apiKeyId,
}: AnalyzeOverviewSectionProps) {
  const { plan } = usePlan()
  const lookbackDays = plan?.analyticsLookbackDays ?? 30
  const { bounds, fromYmd, toYmd, range, setRange } = useAnalyzeDateRange(
    apiKeyId,
    lookbackDays,
  )
  const [summary, setSummary] = useState<WidgetAnalyticsSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [usage, setUsage] = useState<DeepseekUsage | null>(null)
  const [usageLoading, setUsageLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const response = await getWidgetAnalyticsSummary(apiKeyId, range)
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to load overview')
        }
        if (!cancelled) setSummary(response.data)
      } catch (err) {
        if (!cancelled) {
          setSummary(null)
          setError(err instanceof Error ? err.message : 'Failed to load overview')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [apiKeyId, range])

  useEffect(() => {
    let cancelled = false
    async function loadUsage() {
      setUsageLoading(true)
      try {
        const response = await getDeepseekUsage()
        if (!cancelled) {
          setUsage(response.success && response.data ? response.data : null)
        }
      } catch {
        if (!cancelled) setUsage(null)
      } finally {
        if (!cancelled) setUsageLoading(false)
      }
    }
    void loadUsage()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading && !summary) {
    return (
      <div className={projectSectionClassName}>
        <div className="animate-pulse space-y-2">
          <div className="h-7 w-40 bg-[var(--surface)]" />
          <div className="h-4 w-full max-w-md bg-[var(--surface)]" />
        </div>
      </div>
    )
  }

  return (
    <div className={projectSectionClassName}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex size-8 items-center justify-center rounded-md bg-[var(--primary)]/10 text-[var(--primary)]">
              <LayoutGrid className="size-4" aria-hidden />
            </span>
            <h1 className="text-2xl font-medium text-[var(--ink)]">Overview</h1>
          </div>
          <p className={cn(hintClassName, 'mt-1')}>
            Answers in the widget, before anyone needs a person.
          </p>
        </div>
        <AnalyzeDateRange
          lookbackDays={lookbackDays}
          min={bounds.min}
          max={bounds.max}
          from={fromYmd}
          to={toYmd}
          onChange={setRange}
        />
      </div>
      {error ? (
        <p className={cn(hintClassName, 'mt-4')}>{error}</p>
      ) : null}
      {summary ? (
        <>
          <div
            className={cn(
              'mt-8 grid gap-3 sm:grid-cols-2',
              usageLoading || usage
                ? 'lg:grid-cols-5'
                : 'lg:grid-cols-4',
            )}
          >
            <MetricCard
              icon={Bot}
              tone="accent"
              label="Stayed with the AI"
              value={Math.max(
                0,
                summary.chatUsed - summary.liveAgentRoutedCount,
              )}
              hint="Chats that did not open a ticket"
            />
            <MetricCard
              icon={Headset}
              tone="amber"
              label="Handed to a person"
              value={summary.liveAgentRoutedCount}
              hint={
                summary.liveAgentRoutedCount === 0
                  ? 'None needed a person'
                  : undefined
              }
            />
            <MetricCard
              icon={BookOpen}
              tone="accent"
              label="Read in the widget"
              value={summary.faqViews + summary.newsViews}
              hint="Articles and news"
            />
            <MetricCard
              icon={Eye}
              label="Opened the widget"
              value={summary.visits}
            />
            {usageLoading || usage ? (
              <PriorityMeter
                loading={usageLoading}
                percent={usage?.percent ?? 0}
              />
            ) : null}
          </div>
          <div className="mt-8 grid gap-3 lg:grid-cols-2">
            <UsageTreemap
              icon={BookOpen}
              title="Top FAQ articles"
              empty="No FAQ views yet."
              items={summary.topFaq}
              unitLabel="views"
            />
            <UsageTreemap
              icon={Newspaper}
              title="Top news"
              empty="No news views yet."
              items={summary.topNews}
              unitLabel="views"
            />
          </div>
          <div className="mt-8 grid gap-3 lg:grid-cols-2">
            <CsatBlock title="AI agent" summary={summary.aiAgent} browse />
            <CsatBlock
              title="Live agent"
              summary={summary.liveAgent}
              showAgents
            />
          </div>
        </>
      ) : null}
    </div>
  )
}
