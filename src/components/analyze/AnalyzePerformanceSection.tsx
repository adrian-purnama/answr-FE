import { useCallback, useEffect, useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import {
  CircleCheck,
  CircleHelp,
  CircleX,
  Gauge,
  LoaderCircle,
  MessageSquare,
  MessagesSquare,
  MessageSquareWarning,
  Pencil,
  Plus,
  ScanSearch,
  Tags,
  Target,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import AnalyzeDateRange from '#/components/analyze/AnalyzeDateRange'
import { useAnalyzeDateRange } from '#/components/analyze/useAnalyzeDateRange'
import AnalyticsExplorer from '#/components/analyze/AnalyticsExplorer'
import ConversationDrawer from '#/components/analyze/ConversationDrawer'
import MetricCard from '#/components/analyze/MetricCard'
import SideDrawer from '#/components/ui/SideDrawer'
import { usePlan } from '#/context/planContext'
import {
  createAnalyticsCategory,
  deleteAnalyticsCategory,
  findAnalyticsOption,
  formatAnalyticsType,
  getChatAnalyticsSummary,
  getChatAnalyticsTrends,
  listAnalyticsCategories,
  listChatAnalyticsRecords,
  updateAnalyticsCategory,
  type AnalyticsCategory,
  type ChatAnalyticsRecord,
  type ChatAnalyticsSummary,
  type ChatAnalyticsTrends,
} from '#/lib/chatAnalytics'
import {
  buttonClassName,
  buttonOutlineClassName,
  cardClassName,
  hintClassName,
  inputClassName,
  projectSectionClassName,
} from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

type AnalyzePerformanceSectionProps = {
  apiKeyId: string
}

type RecordsDrill =
  | { kind: 'all'; label: string }
  | { kind: 'answerable'; label: string }
  | { kind: 'unanswerable'; label: string }
  | { kind: 'category'; categoryId: string; label: string }

type OptionDimension = NonNullable<AnalyticsCategory['dimension']>

const OPTION_SECTIONS: Array<{
  dimension: OptionDimension
  title: string
  hint: string
  emptyText: string
  placeholder: string
  icon: LucideIcon
}> = [
  {
    dimension: 'category',
    title: 'Categories',
    hint: 'If you remove them all, new chats are labeled Uncategorized.',
    emptyText: 'No categories. New chats are labeled Uncategorized.',
    placeholder: 'Trigger condition, such as invoices, payments, refunds',
    icon: Tags,
  },
  {
    dimension: 'type',
    title: 'Message types',
    hint: 'If you remove them all, new chats are labeled query.',
    emptyText: 'No message types. New chats are labeled query.',
    placeholder: 'Trigger condition, such as the user agrees or says yes',
    icon: MessageSquare,
  },
  {
    dimension: 'intent',
    title: 'Intents',
    hint: 'If you remove them all, new chats are not given an intent.',
    emptyText: 'No intents. New chats are not given an intent.',
    placeholder: 'Trigger condition, such as the user wants something done',
    icon: Target,
  },
  {
    dimension: 'gap',
    title: 'Gap types',
    hint: 'If you remove them all, new chats are not marked with a gap.',
    emptyText: 'No gap types. New chats are not marked with a gap.',
    placeholder: 'Trigger condition, such as the agent lacks the information',
    icon: ScanSearch,
  },
  {
    dimension: 'answerable',
    title: 'Answerable',
    hint: 'If you remove them all, the answerable flag is left unset.',
    emptyText: 'No answerable options. New chats leave answerable unset.',
    placeholder: 'Trigger condition, such as the agent fully handled the request',
    icon: CircleHelp,
  },
]

function PerformanceSkeleton() {
  return (
    <div className={projectSectionClassName}>
      <div className="animate-pulse space-y-2">
        <div className="h-7 w-40 bg-[var(--surface)]" />
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
      <div className={cn(cardClassName, 'mt-8 animate-pulse p-5')}>
        <div className="mb-3 h-4 w-40 bg-[var(--surface)]" />
        <div className="h-3 w-3/4 max-w-sm bg-[var(--surface)]" />
        <div className="mt-4 flex flex-wrap gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-7 w-20 bg-[var(--surface)]" />
          ))}
        </div>
      </div>
    </div>
  )
}

function OptionEditor({
  apiKeyId,
  title,
  hint,
  emptyText,
  placeholder,
  dimension,
  options,
  onChanged,
  onOpen,
  embedded = false,
}: {
  apiKeyId: string
  title: string
  hint: string
  emptyText: string
  placeholder: string
  dimension: OptionDimension
  options: AnalyticsCategory[]
  onChanged: () => Promise<void>
  onOpen?: (option: AnalyticsCategory) => void
  embedded?: boolean
}) {
  const [name, setName] = useState('')
  const [trigger, setTrigger] = useState('')
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editTrigger, setEditTrigger] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    if (!name.trim() || !trigger.trim()) {
      toast.error('Name and trigger condition are required')
      return
    }
    setCreating(true)
    try {
      const response = await createAnalyticsCategory(apiKeyId, {
        name: name.trim(),
        description: trigger.trim(),
        dimension,
      })
      if (!response.success || !response.data) {
        toast.error(response.message || 'Failed to create option')
        return
      }
      setName('')
      setTrigger('')
      toast.success('Saved')
      await onChanged()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create option')
    } finally {
      setCreating(false)
    }
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    if (!editingId) return
    if (!editName.trim() || !editTrigger.trim()) {
      toast.error('Name and trigger condition are required')
      return
    }
    setSavingId(editingId)
    try {
      const response = await updateAnalyticsCategory(apiKeyId, editingId, {
        name: editName.trim(),
        description: editTrigger.trim(),
      })
      if (!response.success || !response.data) {
        toast.error(response.message || 'Failed to update option')
        return
      }
      setEditingId(null)
      toast.success('Saved')
      await onChanged()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update option')
    } finally {
      setSavingId(null)
    }
  }

  async function handleDelete(option: AnalyticsCategory) {
    setSavingId(option.id)
    try {
      const response = await deleteAnalyticsCategory(apiKeyId, option.id)
      if (!response.success) {
        toast.error(response.message || 'Failed to delete option')
        return
      }
      if (editingId === option.id) setEditingId(null)
      toast.success('Deleted')
      await onChanged()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete option')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className={embedded ? undefined : cn(cardClassName, 'mt-8 p-4 sm:p-5')}>
      {embedded ? null : (
        <>
          <h2 className="text-sm font-medium text-[var(--ink)]">{title}</h2>
          <p className={cn(hintClassName, 'mt-1 text-xs')}>{hint}</p>
        </>
      )}
      <form
        className={cn(
          'flex flex-col gap-2 sm:flex-row sm:items-center',
          !embedded && 'mt-4',
        )}
        onSubmit={handleCreate}
      >
        <input
          className={cn(inputClassName, 'min-w-0 sm:max-w-48')}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Name"
        />
        <input
          className={cn(inputClassName, 'min-w-0 flex-1')}
          value={trigger}
          onChange={(event) => setTrigger(event.target.value)}
          placeholder={placeholder}
        />
        <button
          type="submit"
          className={cn(
            buttonClassName,
            'inline-flex shrink-0 items-center justify-center gap-2',
          )}
          disabled={creating}
        >
          {creating ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
          ) : (
            <Plus className="size-4" aria-hidden />
          )}
          Add
        </button>
      </form>
      {options.length === 0 ? (
        <p className={cn(hintClassName, 'mt-4 text-xs')}>{emptyText}</p>
      ) : (
        <ul className="mt-4 divide-y divide-[var(--line)]">
          {options.map((option) => {
            const busy = savingId === option.id
            if (editingId === option.id) {
              return (
                <li key={option.id} className="py-3">
                  <form
                    className="flex flex-col gap-2 sm:flex-row sm:items-center"
                    onSubmit={handleSave}
                  >
                    <input
                      className={cn(inputClassName, 'min-w-0 sm:max-w-48')}
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      aria-label="Name"
                    />
                    <input
                      className={cn(inputClassName, 'min-w-0 flex-1')}
                      value={editTrigger}
                      onChange={(event) => setEditTrigger(event.target.value)}
                      aria-label="Trigger condition"
                    />
                    <div className="flex shrink-0 gap-2">
                      <button type="submit" className={buttonClassName} disabled={busy}>
                        Save
                      </button>
                      <button
                        type="button"
                        className={buttonOutlineClassName}
                        disabled={busy}
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </li>
              )
            }
            return (
              <li
                key={option.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <button
                  type="button"
                  className="min-w-0 text-left"
                  onClick={() => onOpen?.(option)}
                  disabled={!onOpen}
                >
                  <span className="block text-sm font-medium text-[var(--ink)]">
                    {option.name}
                  </span>
                  <span className={cn(hintClassName, 'mt-0.5 block text-xs')}>
                    {option.description || option.name}
                  </span>
                </button>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    aria-label={`Edit ${option.name}`}
                    title="Edit"
                    className={cn(
                      buttonOutlineClassName,
                      'inline-flex items-center px-2',
                    )}
                    disabled={busy}
                    onClick={() => {
                      setEditingId(option.id)
                      setEditName(option.name)
                      setEditTrigger(option.description ?? '')
                    }}
                  >
                    <Pencil className="size-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${option.name}`}
                    title="Delete"
                    className={cn(
                      buttonOutlineClassName,
                      'inline-flex items-center px-2',
                    )}
                    disabled={busy}
                    onClick={() => void handleDelete(option)}
                  >
                    {busy ? (
                      <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
                    ) : (
                      <Trash2 className="size-3.5" aria-hidden />
                    )}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default function AnalyzePerformanceSection({
  apiKeyId,
}: AnalyzePerformanceSectionProps) {
  const { plan } = usePlan()
  const lookbackDays = plan?.analyticsLookbackDays ?? 30
  const { bounds, fromYmd, toYmd, range, setRange } = useAnalyzeDateRange(
    apiKeyId,
    lookbackDays,
  )

  const [summary, setSummary] = useState<ChatAnalyticsSummary | null>(null)
  const [trends, setTrends] = useState<ChatAnalyticsTrends | null>(null)
  const [categories, setCategories] = useState<AnalyticsCategory[]>([])
  const [records, setRecords] = useState<ChatAnalyticsRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [drill, setDrill] = useState<RecordsDrill | null>(null)
  const [conversationSessionId, setConversationSessionId] = useState<
    string | null
  >(null)
  const [highlightMessageId, setHighlightMessageId] = useState<
    string | undefined
  >()
  const [labelDimension, setLabelDimension] =
    useState<OptionDimension>('category')

  const loadSummary = useCallback(async () => {
    const [summaryRes, trendsRes, categoriesRes] = await Promise.all([
      getChatAnalyticsSummary(apiKeyId, range),
      getChatAnalyticsTrends(apiKeyId, {
        ...range,
        dimension: 'category',
        limit: 10,
      }),
      listAnalyticsCategories(apiKeyId),
    ])
    if (!summaryRes.success || !summaryRes.data) {
      throw new Error(summaryRes.message || 'Failed to load analytics summary')
    }
    if (!trendsRes.success || !trendsRes.data) {
      throw new Error(trendsRes.message || 'Failed to load analytics trends')
    }
    if (!categoriesRes.success || !categoriesRes.data) {
      throw new Error(categoriesRes.message || 'Failed to load categories')
    }
    setSummary(summaryRes.data)
    setTrends(trendsRes.data)
    setCategories(categoriesRes.data)
  }, [apiKeyId, range])

  const loadRecords = useCallback(
    async (nextPage: number, filter: RecordsDrill) => {
      setRecordsLoading(true)
      try {
        const response = await listChatAnalyticsRecords(apiKeyId, {
          ...range,
          page: nextPage,
          pageSize: 20,
          ...(filter.kind === 'answerable'
            ? { answerable: true }
            : filter.kind === 'unanswerable'
              ? { answerable: false }
              : filter.kind === 'category'
                ? { categoryId: filter.categoryId }
                : {}),
        })
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to load records')
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
            error instanceof Error ? error.message : 'Failed to load analytics',
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

  async function openRecordsDrawer(next: RecordsDrill) {
    setDrill(next)
    try {
      await loadRecords(1, next)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to load records',
      )
    }
  }

  function closeRecordsDrawer() {
    setDrill(null)
    setRecords([])
    setTotal(0)
    setPage(1)
  }

  const pageCount = Math.max(1, Math.ceil(total / 20))
  const drawerOpen = drill !== null
  const labelSection =
    OPTION_SECTIONS.find((item) => item.dimension === labelDimension) ??
    OPTION_SECTIONS[0]!

  if (loading && !summary) {
    return <PerformanceSkeleton />
  }

  return (
    <div className={projectSectionClassName}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex size-8 items-center justify-center rounded-md bg-[var(--primary)]/10 text-[var(--primary)]">
              <Gauge className="size-4" aria-hidden />
            </span>
            <h1 className="text-2xl font-medium text-[var(--ink)]">Performance</h1>
          </div>
          <p className={cn(hintClassName, 'mt-1')}>
            Where chats cluster, and when volume spikes.
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
            closeRecordsDrawer()
          }}
        />
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <MetricCard
          icon={MessagesSquare}
          label="Analyzed messages"
          value={summary?.totalMessages ?? 0}
          active={drill?.kind === 'all'}
          onClick={() =>
            void openRecordsDrawer({
              kind: 'all',
              label: 'Analyzed messages',
            })
          }
        />
        <MetricCard
          icon={CircleCheck}
          tone="accent"
          label="Answerable"
          value={summary?.answerableCount ?? 0}
          active={drill?.kind === 'answerable'}
          onClick={() =>
            void openRecordsDrawer({
              kind: 'answerable',
              label: 'Answerable messages',
            })
          }
        />
        <MetricCard
          icon={CircleX}
          tone="amber"
          label="Unanswerable"
          value={summary?.unanswerableCount ?? 0}
          active={drill?.kind === 'unanswerable'}
          onClick={() =>
            void openRecordsDrawer({
              kind: 'unanswerable',
              label: 'Unanswerable messages',
            })
          }
        />
      </div>

      {trends ? (
        <div className="mt-8">
          <AnalyticsExplorer
            trends={trends}
            title="Category explorer"
            unitLabel="messages"
            activeKey={
              drill?.kind === 'category' ? drill.categoryId : null
            }
            describe={(key) =>
              findAnalyticsOption(categories, 'category', key)?.description
            }
            onSelect={(key, label) =>
              void openRecordsDrawer({
                kind: 'category',
                categoryId: key,
                label,
              })
            }
          />
        </div>
      ) : null}

      <div className={cn(cardClassName, 'mt-8 p-4 sm:p-5')}>
        <div className="flex flex-wrap gap-1">
          {OPTION_SECTIONS.map((item) => {
            const active = item.dimension === labelDimension
            const Icon = item.icon
            return (
              <button
                key={item.dimension}
                type="button"
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm',
                  active
                    ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                    : 'text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)]',
                )}
                onClick={() => setLabelDimension(item.dimension)}
              >
                <Icon className="size-3.5" aria-hidden />
                {item.title}
              </button>
            )
          })}
        </div>
        <p className={cn(hintClassName, 'mt-3 text-xs')}>{labelSection.hint}</p>
        <div className="mt-4">
          <OptionEditor
            key={labelSection.dimension}
            embedded
            apiKeyId={apiKeyId}
            title={labelSection.title}
            hint={labelSection.hint}
            emptyText={labelSection.emptyText}
            placeholder={labelSection.placeholder}
            dimension={labelSection.dimension}
            options={categories.filter(
              (option) =>
                (option.dimension ?? 'category') === labelSection.dimension,
            )}
            onChanged={loadSummary}
            onOpen={
              labelSection.dimension === 'category'
                ? (option) =>
                    void openRecordsDrawer({
                      kind: 'category',
                      categoryId: option.id,
                      label: option.name,
                    })
                : undefined
            }
          />
        </div>
      </div>

      <SideDrawer
        open={drawerOpen}
        onClose={closeRecordsDrawer}
        label={drill?.label ?? 'Messages'}
        size="md"
        statusLabel={
          recordsLoading ? (
            <span className={cn(hintClassName, 'inline-flex items-center gap-1.5')}>
              <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
              Loading…
            </span>
          ) : (
            <span className={hintClassName}>{total} chats</span>
          )
        }
      >
        {records.length === 0 && !recordsLoading ? (
          <div className="py-10 text-center">
            <MessageSquareWarning
              className="mx-auto size-8 text-[var(--muted)]"
              aria-hidden
            />
            <p className={cn(hintClassName, 'mt-3')}>
              No matching chats in this range.
            </p>
          </div>
        ) : (
          <ul className="-mx-1 divide-y divide-[var(--line)]">
            {records.map((record) => (
              <li key={record.id}>
                <button
                  type="button"
                  className="flex w-full flex-col gap-1 rounded-md px-2 py-3 text-left transition hover:bg-[var(--surface)]"
                  onClick={() => {
                    setConversationSessionId(record.chatSessionId)
                    setHighlightMessageId(record.chatMessageId)
                  }}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="text-sm font-medium capitalize text-[var(--ink)]"
                      title={
                        findAnalyticsOption(categories, 'type', record.type)
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
                            categories,
                            'category',
                            record.categoryId,
                          )?.description
                        }
                      >
                        {record.categoryName}
                      </span>
                    ) : null}
                    {record.answerable === false ? (
                      <span
                        className="rounded bg-red-50 px-1.5 py-0.5 text-[11px] text-red-800"
                        title={
                          findAnalyticsOption(
                            categories,
                            'answerable',
                            'unanswerable',
                          )?.description
                        }
                      >
                        unanswerable
                      </span>
                    ) : null}
                    {record.answerable === true ? (
                      <span
                        className="rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] text-emerald-900"
                        title={
                          findAnalyticsOption(
                            categories,
                            'answerable',
                            'answerable',
                          )?.description
                        }
                      >
                        answerable
                      </span>
                    ) : null}
                  </div>
                  <p
                    className="text-sm text-[var(--ink)]"
                    title={
                      findAnalyticsOption(categories, 'intent', record.intent)
                        ?.description
                    }
                  >
                    {record.intent || 'No intent labeled'}
                  </p>
                  <p className={cn(hintClassName, 'text-xs')}>
                    {new Date(record.messageCreatedAt).toLocaleString()}
                  </p>
                </button>
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
              onClick={() => void loadRecords(page - 1, drill)}
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
              onClick={() => void loadRecords(page + 1, drill)}
            >
              Next
            </button>
          </div>
        ) : null}
      </SideDrawer>

      <ConversationDrawer
        open={Boolean(conversationSessionId)}
        onClose={() => {
          setConversationSessionId(null)
          setHighlightMessageId(undefined)
        }}
        apiKeyId={apiKeyId}
        sessionId={conversationSessionId}
        highlightMessageId={highlightMessageId}
      />
    </div>
  )
}
