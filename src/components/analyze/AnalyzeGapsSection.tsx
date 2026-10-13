import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  BookOpen,
  Check,
  CircleAlert,
  CircleCheck,
  LoaderCircle,
  ScanSearch,
  TriangleAlert,
} from 'lucide-react'
import AnalyzeDateRange from '#/components/analyze/AnalyzeDateRange'
import { useAnalyzeDateRange } from '#/components/analyze/useAnalyzeDateRange'
import AnalyticsExplorer from '#/components/analyze/AnalyticsExplorer'
import ConversationDrawer from '#/components/analyze/ConversationDrawer'
import MetricCard from '#/components/analyze/MetricCard'
import SideDrawer from '#/components/ui/SideDrawer'
import { usePlan } from '#/context/planContext'
import {
  findAnalyticsOption,
  formatAnalyticsType,
  formatGapType,
  getChatAnalyticsSummary,
  isKnowledgeGapType,
  listAnalyticsCategories,
  getChatAnalyticsTrends,
  listChatAnalyticsRecords,
  resolveChatAnalyticsGap,
  type AnalyticsCategory,
  type AnalyticsGapGroup,
  type AnalyticsGapType,
  type ChatAnalyticsRecord,
  type ChatAnalyticsSummary,
  type ChatAnalyticsTrends,
} from '#/lib/chatAnalytics'
import {
  buttonClassName,
  buttonOutlineClassName,
  cardClassName,
  hintClassName,
  projectSectionClassName,
} from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

type AnalyzeGapsSectionProps = {
  apiKeyId: string
}

type GapsDrill = {
  gapType: AnalyticsGapType | null
  label: string
  group: AnalyticsGapGroup
}

type ResolvedFilter = 'all' | 'unresolved' | 'resolved'

const RESOLVED_FILTERS: ResolvedFilter[] = ['all', 'unresolved', 'resolved']

function GapsSkeleton() {
  return (
    <div className={projectSectionClassName}>
      <div className="animate-pulse space-y-2">
        <div className="h-7 w-24 bg-[var(--surface)]" />
        <div className="h-4 w-full max-w-md bg-[var(--surface)]" />
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className={cn(cardClassName, 'animate-pulse px-4 py-4')}>
            <div className="h-3 w-28 bg-[var(--surface)]" />
            <div className="mt-3 h-8 w-16 bg-[var(--surface)]" />
          </div>
        ))}
      </div>
      <div className={cn(cardClassName, 'mt-8 animate-pulse p-5')}>
        <div className="mb-4 h-4 w-36 bg-[var(--surface)]" />
        <div className="grid gap-2 sm:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-[var(--surface)]" />
          ))}
        </div>
      </div>
    </div>
  )
}

function statusCountLabel(
  filter: ResolvedFilter,
  total: number,
  group: AnalyticsGapGroup,
) {
  if (group === 'failure') return `${total} failures`
  if (filter === 'unresolved') return `${total} open`
  if (filter === 'resolved') return `${total} resolved`
  return `${total} gaps`
}

function emptyGapsMessage(filter: ResolvedFilter, group: AnalyticsGapGroup) {
  if (group === 'failure') return 'No failures in this range.'
  if (filter === 'unresolved') {
    return 'No open knowledge gaps in this range.'
  }
  if (filter === 'resolved') {
    return 'No resolved knowledge gaps in this range.'
  }
  return 'No knowledge gaps in this range.'
}

function trendsForGroup(
  trends: ChatAnalyticsTrends,
  group: AnalyticsGapGroup,
): ChatAnalyticsTrends {
  return {
    ...trends,
    series: trends.series.filter((series) =>
      group === 'knowledge'
        ? isKnowledgeGapType(series.key)
        : !isKnowledgeGapType(series.key),
    ),
  }
}

function gapGroupCount(
  byGapType: Record<string, number> | undefined,
  group: AnalyticsGapGroup,
) {
  if (!byGapType) return 0
  let total = 0
  for (const [key, count] of Object.entries(byGapType)) {
    const knowledge = isKnowledgeGapType(key)
    if (group === 'knowledge' ? knowledge : !knowledge) total += count
  }
  return total
}

export default function AnalyzeGapsSection({
  apiKeyId,
}: AnalyzeGapsSectionProps) {
  const { plan } = usePlan()
  const lookbackDays = plan?.analyticsLookbackDays ?? 30
  const { bounds, fromYmd, toYmd, range, setRange } = useAnalyzeDateRange(
    apiKeyId,
    lookbackDays,
  )

  const [options, setOptions] = useState<AnalyticsCategory[]>([])
  const [summary, setSummary] = useState<ChatAnalyticsSummary | null>(null)
  const [trends, setTrends] = useState<ChatAnalyticsTrends | null>(null)
  const [records, setRecords] = useState<ChatAnalyticsRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [drill, setDrill] = useState<GapsDrill | null>(null)
  const [resolvedFilter, setResolvedFilter] =
    useState<ResolvedFilter>('all')
  const [explorerGroup, setExplorerGroup] =
    useState<AnalyticsGapGroup>('knowledge')
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [drawerSessionId, setDrawerSessionId] = useState<string | null>(null)
  const [highlightMessageId, setHighlightMessageId] = useState<
    string | undefined
  >()

  const loadSummary = useCallback(async () => {
    const [summaryRes, trendsRes, optionsRes] = await Promise.all([
      getChatAnalyticsSummary(apiKeyId, range),
      getChatAnalyticsTrends(apiKeyId, {
        ...range,
        dimension: 'gapType',
        limit: 10,
      }),
      listAnalyticsCategories(apiKeyId),
    ])
    if (!summaryRes.success || !summaryRes.data) {
      throw new Error(summaryRes.message || 'Failed to load analytics summary')
    }
    if (!trendsRes.success || !trendsRes.data) {
      throw new Error(trendsRes.message || 'Failed to load gap trends')
    }
    setSummary(summaryRes.data)
    setTrends(trendsRes.data)
    if (optionsRes.success && optionsRes.data) {
      setOptions(optionsRes.data)
    }
  }, [apiKeyId, range])

  const loadRecords = useCallback(
    async (
      nextPage: number,
      nextGapType: AnalyticsGapType | null,
      nextResolvedFilter: ResolvedFilter,
      nextGroup: AnalyticsGapGroup,
    ) => {
      setRecordsLoading(true)
      try {
        const response = await listChatAnalyticsRecords(apiKeyId, {
          ...range,
          page: nextPage,
          pageSize: 20,
          gapDetected: true,
          ...(nextGroup === 'knowledge' && nextResolvedFilter === 'unresolved'
            ? { gapResolved: false }
            : nextGroup === 'knowledge' && nextResolvedFilter === 'resolved'
              ? { gapResolved: true }
              : {}),
          ...(nextGapType
            ? { gapType: nextGapType }
            : { gapGroup: nextGroup }),
        })
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to load gap records')
        }
        setRecords(response.data.items)
        setTotal(response.data.total)
        setPage(response.data.page)
      } finally {
        setRecordsLoading(false)
      }
    },
    [apiKeyId, range],
  )

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void (async () => {
      try {
        await loadSummary()
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error ? error.message : 'Failed to load gaps',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [loadSummary])

  async function openGapsDrawer(
    next: GapsDrill,
    nextResolvedFilter: ResolvedFilter = 'all',
  ) {
    setDrill(next)
    setResolvedFilter(nextResolvedFilter)
    try {
      await loadRecords(1, next.gapType, nextResolvedFilter, next.group)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to load gap records',
      )
    }
  }

  function closeGapsDrawer() {
    setDrill(null)
    setResolvedFilter('all')
    setRecords([])
    setTotal(0)
    setPage(1)
  }

  async function handleResolvedFilterChange(next: ResolvedFilter) {
    if (!drill || next === resolvedFilter) return
    setResolvedFilter(next)
    if (drill.gapType === null) {
      setDrill({
        gapType: null,
        group: drill.group,
        label:
          next === 'resolved'
            ? 'Resolved gaps'
            : next === 'unresolved'
              ? 'Unresolved gaps'
              : 'All gaps',
      })
    }
    try {
      await loadRecords(1, drill.gapType, next, drill.group)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to load gap records',
      )
    }
  }

  async function handleResolve(recordId: string) {
    setResolvingId(recordId)
    try {
      const response = await resolveChatAnalyticsGap(apiKeyId, recordId)
      if (!response.success || !response.data) {
        toast.error(response.message || 'Failed to resolve gap')
        return
      }
      toast.success('Gap resolved')
      await loadSummary()
      if (drill) {
        const nextPage =
          records.length <= 1 && page > 1 ? page - 1 : page
        await loadRecords(nextPage, drill.gapType, resolvedFilter, drill.group)
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to resolve gap',
      )
    } finally {
      setResolvingId(null)
    }
  }

  const pageCount = Math.max(1, Math.ceil(total / 20))
  const drawerOpen = drill !== null
  const unresolvedCount = summary?.gapCount ?? 0
  const resolvedCount = summary?.resolvedGapCount ?? 0
  const totalGapsCount = unresolvedCount + resolvedCount
  const metricsActive =
    drill !== null && drill.gapType === null ? resolvedFilter : null

  if (loading && !summary) {
    return <GapsSkeleton />
  }

  return (
    <div className={projectSectionClassName}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex size-8 items-center justify-center rounded-md bg-[var(--primary)]/10 text-[var(--primary)]">
              <ScanSearch className="size-4" aria-hidden />
            </span>
            <h1 className="text-2xl font-medium text-[var(--ink)]">Gaps</h1>
          </div>
          <p className={cn(hintClassName, 'mt-1')}>
            Resolve knowledge gaps. Failures stay listed on their own.
          </p>
        </div>
        <AnalyzeDateRange
          lookbackDays={lookbackDays}
          min={bounds.min}
          max={bounds.max}
          from={fromYmd}
          to={toYmd}
          onChange={(next) => {
            setRange(next)
            closeGapsDrawer()
          }}
        />
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <MetricCard
          icon={ScanSearch}
          label="Total gaps"
          value={totalGapsCount}
          active={metricsActive === 'all'}
          onClick={() =>
            void openGapsDrawer(
              { gapType: null, label: 'All gaps', group: 'knowledge' },
              'all',
            )
          }
        />
        <MetricCard
          icon={CircleAlert}
          tone="amber"
          label="Unresolved"
          value={unresolvedCount}
          active={metricsActive === 'unresolved'}
          onClick={() =>
            void openGapsDrawer(
              { gapType: null, label: 'Unresolved gaps', group: 'knowledge' },
              'unresolved',
            )
          }
        />
        <MetricCard
          icon={CircleCheck}
          tone="accent"
          label="Resolved"
          value={resolvedCount}
          active={metricsActive === 'resolved'}
          onClick={() =>
            void openGapsDrawer(
              { gapType: null, label: 'Resolved gaps', group: 'knowledge' },
              'resolved',
            )
          }
        />
      </div>

      {trends ? (
        <div className="mt-8 space-y-4">
          <div className="inline-flex flex-wrap gap-1 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-1">
            {(
              [
                {
                  group: 'knowledge' as const,
                  label: 'Knowledge gaps',
                  icon: BookOpen,
                },
                {
                  group: 'failure' as const,
                  label: 'Failures',
                  icon: TriangleAlert,
                },
              ] as const
            ).map((option) => {
              const active = explorerGroup === option.group
              const Icon = option.icon
              return (
                <button
                  key={option.group}
                  type="button"
                  className={cn(
                    'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm',
                    active
                      ? 'bg-white text-[var(--ink)] shadow-sm'
                      : 'text-[var(--muted)] hover:text-[var(--ink)]',
                  )}
                  onClick={() => setExplorerGroup(option.group)}
                >
                  <Icon
                    className={cn(
                      'size-4',
                      active &&
                        (option.group === 'failure'
                          ? 'text-amber-700'
                          : 'text-[var(--primary)]'),
                    )}
                    aria-hidden
                  />
                  {option.label}
                  <span className="tabular-nums text-xs text-[var(--muted)]">
                    {gapGroupCount(summary?.byGapType, option.group)}
                  </span>
                </button>
              )
            })}
          </div>
          <AnalyticsExplorer
            trends={trendsForGroup(trends, explorerGroup)}
            title={explorerGroup === 'knowledge' ? 'Knowledge gaps' : 'Failures'}
            unitLabel={explorerGroup === 'knowledge' ? 'gaps' : 'failures'}
            describe={(key) =>
              findAnalyticsOption(options, 'gap', key)?.description
            }
            activeKey={
              drill?.group === explorerGroup ? (drill.gapType ?? null) : null
            }
            onSelect={(key) =>
              void openGapsDrawer(
                {
                  gapType: key as AnalyticsGapType,
                  label: formatGapType(key),
                  group: explorerGroup,
                },
                'all',
              )
            }
          />
        </div>
      ) : null}

      <SideDrawer
        open={drawerOpen}
        onClose={closeGapsDrawer}
        label={drill?.label ?? 'Gaps'}
        size="md"
        statusLabel={
          recordsLoading ? (
            <span className={cn(hintClassName, 'inline-flex items-center gap-1.5')}>
              <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
              Loading…
            </span>
          ) : (
            <span className={hintClassName}>
              {drill
                ? statusCountLabel(resolvedFilter, total, drill.group)
                : null}
            </span>
          )
        }
      >
        {drill?.group === 'knowledge' ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {RESOLVED_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              className={cn(
                'rounded-md border px-3 py-1.5 text-xs font-medium capitalize',
                resolvedFilter === filter
                  ? 'border-[var(--ink)] bg-[var(--ink)] text-white'
                  : 'border-[var(--line)] bg-white text-[var(--ink)]',
              )}
              onClick={() => void handleResolvedFilterChange(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
        ) : null}

        {records.length === 0 && !recordsLoading ? (
          <div className="py-10 text-center">
            <ScanSearch
              className="mx-auto size-8 text-[var(--muted)]"
              aria-hidden
            />
            <p className={cn(hintClassName, 'mt-3')}>
              {drill
                ? emptyGapsMessage(resolvedFilter, drill.group)
                : emptyGapsMessage(resolvedFilter, 'knowledge')}
            </p>
          </div>
        ) : (
          <ul className="-mx-1 divide-y divide-[var(--line)]">
            {records.map((record) => (
              <li key={record.id} className="flex items-start gap-2 px-2 py-3">
                <button
                  type="button"
                  className="min-w-0 flex-1 flex flex-col gap-1 rounded-md text-left transition hover:bg-[var(--surface)]"
                  onClick={() => {
                    setDrawerSessionId(record.chatSessionId)
                    setHighlightMessageId(record.chatMessageId)
                  }}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-[11px] capitalize',
                        drill?.group === 'knowledge'
                          ? 'bg-amber-50 text-amber-900'
                          : 'bg-[var(--surface)] text-[var(--ink)]',
                      )}
                      title={
                        findAnalyticsOption(options, 'gap', record.gapType)
                          ?.description
                      }
                    >
                      {record.gapType
                        ? formatGapType(record.gapType)
                        : 'gap'}
                    </span>
                    {record.gapResolved ? (
                      <span className="rounded bg-[var(--surface)] px-1.5 py-0.5 text-[11px] text-[var(--muted)]">
                        Resolved
                      </span>
                    ) : null}
                    <span
                      className="text-sm capitalize text-[var(--ink)]"
                      title={
                        findAnalyticsOption(options, 'type', record.type)
                          ?.description
                      }
                    >
                      {formatAnalyticsType(record.type)}
                    </span>
                    {record.categoryName ? (
                      <span
                        className={hintClassName}
                        title={
                          findAnalyticsOption(
                            options,
                            'category',
                            record.categoryId,
                          )?.description
                        }
                      >
                        {record.categoryName}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-[var(--ink)]">
                    {record.gapReason ||
                      record.intent ||
                      'No gap reason provided'}
                  </p>
                  <p className={cn(hintClassName, 'text-xs')}>
                    {new Date(record.messageCreatedAt).toLocaleString()}
                    {record.gapResolved && record.gapResolvedAt
                      ? ` · Resolved ${new Date(record.gapResolvedAt).toLocaleString()}`
                      : null}
                  </p>
                </button>
                {drill?.group === 'knowledge' && !record.gapResolved ? (
                  <button
                    type="button"
                    className={cn(
                      buttonClassName,
                      'inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1.5 text-xs',
                    )}
                    disabled={resolvingId === record.id}
                    onClick={() => void handleResolve(record.id)}
                  >
                    {resolvingId === record.id ? (
                      <LoaderCircle
                        className="size-3.5 animate-spin"
                        aria-hidden
                      />
                    ) : (
                      <Check className="size-3.5" aria-hidden />
                    )}
                    Resolve
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {pageCount > 1 && drill ? (
          <div className="mt-6 flex items-center justify-between gap-3 border-t border-[var(--line)] pt-4">
            <button
              type="button"
              className={buttonOutlineClassName}
              disabled={page <= 1 || recordsLoading}
              onClick={() =>
                void loadRecords(
                  page - 1,
                  drill.gapType,
                  resolvedFilter,
                  drill.group,
                )
              }
            >
              Previous
            </button>
            <span className={hintClassName}>
              Page {page} of {pageCount}
            </span>
            <button
              type="button"
              className={buttonOutlineClassName}
              disabled={page >= pageCount || recordsLoading}
              onClick={() =>
                void loadRecords(
                  page + 1,
                  drill.gapType,
                  resolvedFilter,
                  drill.group,
                )
              }
            >
              Next
            </button>
          </div>
        ) : null}
      </SideDrawer>

      <ConversationDrawer
        open={Boolean(drawerSessionId)}
        onClose={() => {
          setDrawerSessionId(null)
          setHighlightMessageId(undefined)
        }}
        apiKeyId={apiKeyId}
        sessionId={drawerSessionId}
        highlightMessageId={highlightMessageId}
      />
    </div>
  )
}
