import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  BookOpen,
  CheckSquare,
  ChevronDown,
  FileText,
  FunctionSquare,
  LoaderCircle,
  Pencil,
  Play,
  Plus,
  Square,
  Tags,
  Trash2,
} from 'lucide-react'
import AgentMessageBody, {
  createAuthImageRenderer,
} from '#/components/agentChat/AgentMessageBody'
import { stripUiMarkers } from '#/components/agentChat/agentChatMarkdown'
import Modal from '#/components/ui/Modal'
import SideDrawer from '#/components/ui/SideDrawer'
import { usePlan } from '#/context/planContext'
import {
  addBatchTestQuestion,
  createBatchTestGroup,
  deleteBatchTestGroup,
  deleteBatchTestQuestions,
  getBatchTestGroup,
  getBatchTestProgress,
  listBatchTestGroups,
  runBatchTestQuestions,
  setBatchTestRating,
  updateBatchTestGroup,
  updateBatchTestQuestion,
  type BatchTestGroup,
  type BatchTestGroupDetail,
  type BatchTestQuestion,
  type BatchTestRating,
} from '#/lib/batchTest'
import {
  buttonClassName,
  buttonOutlineClassName,
  cardClassName,
  hintClassName,
  inputClassName,
  projectSectionClassName,
} from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

type BatchTestSectionProps = {
  apiKeyId: string
  projectId: string
  groupId?: string
}

function statusLabel(status: string) {
  switch (status) {
    case 'queued':
      return 'Queued'
    case 'running':
      return 'Running'
    case 'pending':
      return 'Pending'
    case 'completed':
      return 'Completed'
    case 'failed':
      return 'Failed'
    default:
      return 'Idle'
  }
}

function groupSummaryLine(group: BatchTestGroup): string {
  const parts = [
    `${group.questionCount} question${group.questionCount === 1 ? '' : 's'}`,
  ]
  if (group.runStatus === 'running' || group.runStatus === 'queued') {
    parts.push(
      `${group.progress.completed + group.progress.failed}/${group.progress.total}`,
    )
  }
  const summary = group.summary
  if (summary.answerable > 0) parts.push(`${summary.answerable} answerable`)
  if (summary.notAnswerable > 0) {
    parts.push(`${summary.notAnswerable} not answerable`)
  }
  if (summary.good > 0) parts.push(`${summary.good} good`)
  if (summary.passable > 0) parts.push(`${summary.passable} passable`)
  if (summary.poor > 0) parts.push(`${summary.poor} poor`)
  return parts.join(' · ')
}

function ChipDot({ className }: { className: string }) {
  return (
    <span
      className={cn('size-1.5 shrink-0 rounded-full', className)}
      aria-hidden
    />
  )
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === 'completed'
      ? 'bg-emerald-50 text-emerald-800'
      : status === 'failed'
        ? 'bg-red-50 text-red-800'
        : status === 'running' || status === 'queued' || status === 'pending'
          ? 'bg-amber-50 text-amber-900'
          : 'bg-[var(--surface)] text-[var(--muted)]'

  const dot =
    status === 'completed'
      ? 'bg-emerald-600'
      : status === 'failed'
        ? 'bg-red-600'
        : status === 'running' || status === 'queued' || status === 'pending'
          ? 'bg-amber-500'
          : 'bg-[var(--muted)]'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
        tone,
      )}
    >
      <ChipDot className={dot} />
      {statusLabel(status)}
    </span>
  )
}

function AnswerabilityChip({
  answerability,
}: {
  answerability: 'answerable' | 'not_answerable'
}) {
  const answerable = answerability === 'answerable'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
        answerable
          ? 'bg-emerald-50 text-emerald-800'
          : 'bg-rose-50 text-rose-800',
      )}
    >
      <ChipDot className={answerable ? 'bg-emerald-600' : 'bg-rose-600'} />
      {answerable ? 'Answerable' : 'Not answerable'}
    </span>
  )
}

function RatingChip({ rating }: { rating: BatchTestRating | null }) {
  const tone =
    rating === 'good'
      ? 'bg-emerald-50 text-emerald-800'
      : rating === 'passable'
        ? 'bg-amber-50 text-amber-900'
        : rating === 'poor'
          ? 'bg-rose-50 text-rose-800'
          : 'bg-[var(--surface)] text-[var(--muted)]'

  const dot =
    rating === 'good'
      ? 'bg-emerald-600'
      : rating === 'passable'
        ? 'bg-amber-500'
        : rating === 'poor'
          ? 'bg-rose-600'
          : 'bg-[var(--muted)]'

  const label =
    rating === 'good'
      ? 'Good'
      : rating === 'passable'
        ? 'Passable'
        : rating === 'poor'
          ? 'Poor'
          : 'Unrated'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
        tone,
      )}
    >
      <ChipDot className={dot} />
      {label}
    </span>
  )
}

const poorSuggestionLinkClassName =
  'inline-flex items-center rounded border border-[var(--line)] bg-[var(--surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--ink)] transition hover:bg-[var(--bg)]'

const toolbarOutlineBtnClassName =
  'inline-flex items-center gap-1 rounded-md border border-[var(--line)] bg-transparent px-2 py-1 text-[11px] font-medium text-[var(--ink)] transition hover:bg-[var(--surface)] disabled:pointer-events-none disabled:opacity-40'

const toolbarPrimaryBtnClassName =
  'inline-flex items-center gap-1 rounded-md bg-[var(--ink)] px-2 py-1 text-[11px] font-medium text-white transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-40'

const filterChipClassName =
  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition'

type StatusFilter = BatchTestQuestion['status']
type AnswerabilityFilter = 'answerable' | 'not_answerable'
type RatingFilter = BatchTestRating | 'unrated'

const STATUS_FILTERS: StatusFilter[] = [
  'idle',
  'pending',
  'running',
  'completed',
  'failed',
]
const ANSWERABILITY_FILTERS: AnswerabilityFilter[] = [
  'answerable',
  'not_answerable',
]
const RATING_FILTERS: RatingFilter[] = ['unrated', 'good', 'passable', 'poor']

function toggleFilterValue<T extends string>(prev: Set<T>, value: T): Set<T> {
  const next = new Set(prev)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  return next
}

function IconAction({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-md text-[var(--muted)] transition',
        'hover:bg-[var(--surface)] hover:text-[var(--ink)] disabled:pointer-events-none disabled:opacity-30',
      )}
    >
      {children}
    </button>
  )
}

function InfluenceSection({
  title,
  count,
  icon: Icon,
  emptyLabel,
  children,
  defaultOpen = true,
}: {
  title: string
  count: number
  icon: typeof Tags
  emptyLabel: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen && count > 0)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="-mx-1 flex w-[calc(100%+0.5rem)] items-center gap-1.5 rounded-md px-1 py-1 text-left transition hover:bg-[var(--bg)]/60"
        aria-expanded={open}
      >
        <ChevronDown
          className={cn(
            'size-3 shrink-0 text-[var(--muted)] transition',
            open ? '' : '-rotate-90',
          )}
          aria-hidden
        />
        <Icon className="size-3.5 shrink-0 text-[var(--muted)]" aria-hidden />
        <span className="min-w-0 flex-1 text-[11px] font-semibold tracking-wide text-[var(--ink)]">
          {title}
          <span className="ml-1.5 font-normal text-[var(--muted)]">{count}</span>
        </span>
      </button>
      {open ? (
        <div className="ml-[0.4375rem] border-l border-[var(--line)] pl-3.5">
          {count === 0 ? (
            <p className="py-0.5 text-[11px] text-[var(--muted)]">{emptyLabel}</p>
          ) : (
            children
          )}
        </div>
      ) : null}
    </div>
  )
}

function QuestionResultDetails({
  question,
  onOpenTopic,
  onOpenArticle,
  onOpenGuidance,
}: {
  question: BatchTestQuestion
  onOpenTopic: (topic: { id: string; articleId: string }) => void
  onOpenArticle: (articleId: string) => void
  onOpenGuidance: (guidanceId: string) => void
}) {
  const guidance =
    question.guidanceUsed.length > 0
      ? question.guidanceUsed
      : question.guidanceDeclared
  const toolCount =
    question.toolsDeclared.length + question.toolsCalled.length

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-[var(--line)] px-4 py-3">
        <p className="text-sm font-semibold text-[var(--ink)]">References</p>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3 text-[11px]">
        <InfluenceSection
          title="Topics"
          count={question.references.topics.length}
          icon={Tags}
          emptyLabel="No topics"
          defaultOpen={question.references.topics.length > 0}
        >
          <ul className="space-y-0.5 py-0.5">
            {question.references.topics.map((topic) => (
              <li key={topic.id}>
                <button
                  type="button"
                  onClick={() =>
                    onOpenTopic({ id: topic.id, articleId: topic.articleId })
                  }
                  className="-mx-1 block w-[calc(100%+0.5rem)] rounded-md px-1 py-1 text-left break-words text-[var(--ink)] transition hover:bg-[var(--bg)]/70 hover:underline"
                >
                  {topic.name}
                </button>
              </li>
            ))}
          </ul>
        </InfluenceSection>

        <InfluenceSection
          title="Articles"
          count={question.references.articles.length}
          icon={FileText}
          emptyLabel="No articles"
          defaultOpen={question.references.articles.length > 0}
        >
          <ul className="space-y-0.5 py-0.5">
            {question.references.articles.map((article) => (
              <li key={article.id}>
                <button
                  type="button"
                  onClick={() => onOpenArticle(article.id)}
                  className="-mx-1 block w-[calc(100%+0.5rem)] rounded-md px-1 py-1 text-left break-words text-[var(--ink)] transition hover:bg-[var(--bg)]/70 hover:underline"
                >
                  {article.title}
                </button>
              </li>
            ))}
          </ul>
        </InfluenceSection>

        <InfluenceSection
          title="Guidance"
          count={guidance.length}
          icon={BookOpen}
          emptyLabel="No guidance"
          defaultOpen={guidance.length > 0}
        >
          <ul className="space-y-0.5 py-0.5">
            {guidance.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onOpenGuidance(item.id)}
                  className="-mx-1 block w-[calc(100%+0.5rem)] rounded-md px-1 py-1 text-left break-words text-[var(--ink)] transition hover:bg-[var(--bg)]/70 hover:underline"
                >
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
        </InfluenceSection>

        <InfluenceSection
          title="Tools"
          count={toolCount}
          icon={FunctionSquare}
          emptyLabel="No tools"
          defaultOpen={toolCount > 0}
        >
          <div className="space-y-2 py-0.5">
            {question.toolsDeclared.length > 0 ? (
              <div>
                <p className="px-1 text-[10px] font-medium tracking-wide text-[var(--muted)] uppercase">
                  Declared
                </p>
                <ul className="space-y-0.5">
                  {question.toolsDeclared.map((tool) => (
                    <li
                      key={`declared:${tool.name}:${tool.alias}`}
                      className="rounded-md px-1 py-1 break-words text-[var(--ink)]"
                    >
                      <span className="font-medium">{tool.name}</span>
                      {tool.alias ? (
                        <span className="text-[var(--muted)]">
                          {' '}
                          → {tool.alias}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {question.toolsCalled.length > 0 ? (
              <div>
                <p className="px-1 text-[10px] font-medium tracking-wide text-[var(--muted)] uppercase">
                  Called
                </p>
                <ul className="space-y-0.5">
                  {question.toolsCalled.map((tool) => (
                    <li
                      key={`called:${tool.name}:${tool.alias}:${tool.ok}`}
                      className="rounded-md px-1 py-1 break-words text-[var(--ink)]"
                    >
                      <span className="font-medium">{tool.name}</span>
                      {tool.alias ? (
                        <span className="text-[var(--muted)]">
                          {' '}
                          → {tool.alias}
                        </span>
                      ) : null}
                      <span
                        className={
                          tool.ok ? 'text-emerald-700' : 'text-red-600'
                        }
                      >
                        {tool.ok
                          ? ' ok'
                          : ` failed${tool.error ? `: ${tool.error}` : ''}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </InfluenceSection>
      </div>
    </div>
  )
}

const RATING_BUTTON_CLASS: Record<
  BatchTestRating,
  { base: string; selected: string }
> = {
  good: {
    base: 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100',
    selected:
      'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-600',
  },
  passable: {
    base: 'border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100',
    selected: 'border-amber-500 bg-amber-500 text-white hover:bg-amber-500',
  },
  poor: {
    base: 'border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100',
    selected: 'border-rose-600 bg-rose-600 text-white hover:bg-rose-600',
  },
}

export default function BatchTestSection({
  apiKeyId,
  projectId,
  groupId,
}: BatchTestSectionProps) {
  const navigate = useNavigate()
  const { plan } = usePlan()
  const maxGroups = plan?.batchTestGroupAmount ?? 5
  const maxQuestions = plan?.questionsPerBatchTestGroup ?? 50

  const [groups, setGroups] = useState<BatchTestGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<BatchTestGroupDetail | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState('')
  const [addQuestionOpen, setAddQuestionOpen] = useState(false)
  const [questionDraft, setQuestionDraft] = useState('')
  const [editQuestion, setEditQuestion] = useState<BatchTestQuestion | null>(
    null,
  )
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [deleteGroupOpen, setDeleteGroupOpen] = useState(false)
  const [deleteSelectedOpen, setDeleteSelectedOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [statusFilters, setStatusFilters] = useState<Set<StatusFilter>>(
    () => new Set(),
  )
  const [answerabilityFilters, setAnswerabilityFilters] = useState<
    Set<AnswerabilityFilter>
  >(() => new Set())
  const [ratingFilters, setRatingFilters] = useState<Set<RatingFilter>>(
    () => new Set(),
  )

  const setGroupSearch = useCallback(
    (nextGroupId: string | undefined) => {
      void navigate({
        to: '/project/$id/test',
        params: { id: projectId },
        search: nextGroupId ? { groupId: nextGroupId } : {},
        replace: true,
      })
    },
    [navigate, projectId],
  )

  const renderImage = useMemo(
    () => createAuthImageRenderer(apiKeyId),
    [apiKeyId],
  )

  function openArticleEditor(articleId: string, topicId?: string) {
    void navigate({
      to: '/project/$id/train/article',
      params: { id: projectId },
      search: {
        articleId,
        ...(topicId ? { topicId } : {}),
      },
    })
  }

  function openGuidanceEditor(guidanceId: string) {
    void navigate({
      to: '/project/$id/train/guidance',
      params: { id: projectId },
      search: { guidanceId },
    })
  }

  function handleOpenTopic(topic: { id: string; articleId: string }) {
    if (!topic.articleId) {
      toast.error('Could not find the article for this topic')
      return
    }
    openArticleEditor(topic.articleId, topic.id)
  }

  const loadGroups = useCallback(async () => {
    const response = await listBatchTestGroups(apiKeyId)
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to load batch test groups')
    }
    setGroups(response.data)
  }, [apiKeyId])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void loadGroups()
      .catch((error: unknown) => {
        toast.error(
          error instanceof Error ? error.message : 'Failed to load groups',
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [loadGroups])

  const listRunActive = groups.some(
    (group) => group.runStatus === 'queued' || group.runStatus === 'running',
  )

  useEffect(() => {
    if (groupId || !listRunActive) return
    const timer = window.setInterval(() => {
      void loadGroups().catch(() => undefined)
    }, 2000)
    return () => window.clearInterval(timer)
  }, [groupId, listRunActive, loadGroups])

  const refreshDetail = useCallback(
    async (groupId: string) => {
      const response = await getBatchTestProgress(apiKeyId, groupId)
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to load group')
      }
      const progress = response.data
      setDetail((prev) => {
        if (!prev || prev.id !== groupId) {
          return prev
        }
        return {
          ...prev,
          runStatus: progress.runStatus,
          progress: progress.progress,
          lastRunAt: progress.lastRunAt,
          latestRunId: progress.latestRunId,
          questionCount: progress.questions.length,
          questions: progress.questions,
        }
      })
    },
    [apiKeyId],
  )

  const openGroup = useCallback(
    async (targetGroupId: string) => {
      setBusy(true)
      try {
        const response = await getBatchTestGroup(apiKeyId, targetGroupId)
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to open group')
        }
        setDetail(response.data)
        setSelected(new Set())
        setActiveQuestionId(null)
        setStatusFilters(new Set())
        setAnswerabilityFilters(new Set())
        setRatingFilters(new Set())
        setFiltersOpen(false)
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to open group',
        )
        setDetail(null)
        setGroupSearch(undefined)
      } finally {
        setBusy(false)
      }
    },
    [apiKeyId, setGroupSearch],
  )

  useEffect(() => {
    if (!groupId) {
      setDetail(null)
      setActiveQuestionId(null)
      return
    }
    if (detail?.id === groupId) return
    void openGroup(groupId)
  }, [detail?.id, groupId, openGroup])

  const isRunning =
    detail?.runStatus === 'queued' || detail?.runStatus === 'running'

  useEffect(() => {
    if (!detail || !isRunning) return
    const groupId = detail.id
    const timer = window.setInterval(() => {
      void refreshDetail(groupId).catch(() => undefined)
    }, 2000)
    return () => window.clearInterval(timer)
  }, [detail, isRunning, refreshDetail])

  const activeQuestion = useMemo(
    () => detail?.questions.find((q) => q.id === activeQuestionId) ?? null,
    [activeQuestionId, detail?.questions],
  )

  const filteredQuestions = useMemo(() => {
    if (!detail) return []
    return detail.questions.filter((question) => {
      if (statusFilters.size > 0 && !statusFilters.has(question.status)) {
        return false
      }
      if (answerabilityFilters.size > 0) {
        if (
          !question.answerability ||
          !answerabilityFilters.has(question.answerability)
        ) {
          return false
        }
      }
      if (ratingFilters.size > 0) {
        const ratingKey: RatingFilter = question.rating ?? 'unrated'
        if (!ratingFilters.has(ratingKey)) return false
      }
      return true
    })
  }, [answerabilityFilters, detail, ratingFilters, statusFilters])

  const allFilteredSelected =
    filteredQuestions.length > 0 &&
    filteredQuestions.every((q) => selected.has(q.id))

  const activeFilterCount =
    statusFilters.size + answerabilityFilters.size + ratingFilters.size

  const atGroupLimit = groups.length >= maxGroups
  const atQuestionLimit = (detail?.questions.length ?? 0) >= maxQuestions

  async function handleCreateGroup() {
    const name = createName.trim()
    if (!name) {
      toast.error('Name is required')
      return
    }
    setBusy(true)
    try {
      const response = await createBatchTestGroup(apiKeyId, name)
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create group')
      }
      toast.success('Group created')
      setCreateOpen(false)
      setCreateName('')
      await loadGroups()
      setGroupSearch(response.data.id)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create group',
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleRenameGroup() {
    if (!detail) return
    const name = renameValue.trim()
    if (!name) {
      toast.error('Name is required')
      return
    }
    setBusy(true)
    try {
      const response = await updateBatchTestGroup(apiKeyId, detail.id, name)
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to rename group')
      }
      setDetail((prev) =>
        prev ? { ...prev, name: response.data!.name } : prev,
      )
      await loadGroups()
      setRenameOpen(false)
      toast.success('Group renamed')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to rename group',
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteGroup() {
    if (!detail) return
    setBusy(true)
    try {
      const response = await deleteBatchTestGroup(apiKeyId, detail.id)
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete group')
      }
      toast.success('Group deleted')
      setDeleteGroupOpen(false)
      setDetail(null)
      setGroupSearch(undefined)
      await loadGroups()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete group',
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleAddQuestion() {
    if (!detail) return
    const text = questionDraft.trim()
    if (!text) {
      toast.error('Question is required')
      return
    }
    setBusy(true)
    try {
      const response = await addBatchTestQuestion(apiKeyId, detail.id, text)
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to add question')
      }
      toast.success('Question added')
      setAddQuestionOpen(false)
      setQuestionDraft('')
      await openGroup(detail.id)
      await loadGroups()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to add question',
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleEditQuestion() {
    if (!detail || !editQuestion) return
    const text = questionDraft.trim()
    if (!text) {
      toast.error('Question is required')
      return
    }
    setBusy(true)
    try {
      const response = await updateBatchTestQuestion(
        apiKeyId,
        detail.id,
        editQuestion.id,
        text,
      )
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update question')
      }
      toast.success('Question updated')
      setEditQuestion(null)
      setQuestionDraft('')
      await openGroup(detail.id)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update question',
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteSelected() {
    if (!detail || selected.size === 0) return
    setBusy(true)
    try {
      const response = await deleteBatchTestQuestions(apiKeyId, detail.id, [
        ...selected,
      ])
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete questions')
      }
      toast.success('Questions deleted')
      setDeleteSelectedOpen(false)
      setSelected(new Set())
      setActiveQuestionId(null)
      await openGroup(detail.id)
      await loadGroups()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete questions',
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleRunSelected() {
    if (!detail || selected.size === 0) return
    setBusy(true)
    try {
      const response = await runBatchTestQuestions(apiKeyId, detail.id, [
        ...selected,
      ])
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to start run')
      }
      setDetail(response.data)
      toast.success('Batch run started')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to start run',
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleRating(rating: BatchTestRating) {
    if (!detail || !activeQuestion) return
    setBusy(true)
    try {
      const response = await setBatchTestRating(
        apiKeyId,
        detail.id,
        activeQuestion.id,
        rating,
      )
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to save rating')
      }
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              questions: prev.questions.map((q) =>
                q.id === response.data!.id ? response.data! : q,
              ),
            }
          : prev,
      )
      toast.success('Rating saved')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save rating',
      )
    } finally {
      setBusy(false)
    }
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (!detail) return
    if (allFilteredSelected) {
      setSelected((prev) => {
        const next = new Set(prev)
        for (const q of filteredQuestions) next.delete(q.id)
        return next
      })
      return
    }
    setSelected((prev) => {
      const next = new Set(prev)
      for (const q of filteredQuestions) next.add(q.id)
      return next
    })
  }

  if (groupId && !detail) {
    return (
      <div className={cn(projectSectionClassName, 'min-w-0 max-w-full')}>
        <div className={cn(cardClassName, 'p-6 text-[var(--muted)]')}>
          Loading group…
        </div>
      </div>
    )
  }

  if (detail && groupId) {
    return (
      <div className={cn(projectSectionClassName, 'min-w-0 max-w-full')}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <button
              type="button"
              className={cn(toolbarOutlineBtnClassName, 'mb-3')}
              onClick={() => {
                setGroupSearch(undefined)
                void loadGroups()
              }}
            >
              <ArrowLeft className="size-3" />
              All groups
            </button>
            <h1 className="text-2xl font-medium text-[var(--ink)]">
              {detail.name}
            </h1>
            <p className={cn(hintClassName, 'mt-1')}>
              {detail.questions.length}/{maxQuestions} questions
              {isRunning
                ? ` · Running ${detail.progress.completed + detail.progress.failed}/${detail.progress.total}`
                : detail.lastRunAt
                  ? ` · Last run ${new Date(detail.lastRunAt).toLocaleString()}`
                  : null}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              className={toolbarOutlineBtnClassName}
              disabled={busy || isRunning}
              onClick={() => {
                setRenameValue(detail.name)
                setRenameOpen(true)
              }}
            >
              <Pencil className="size-3" />
              Rename
            </button>
            <button
              type="button"
              className={toolbarOutlineBtnClassName}
              disabled={busy || isRunning}
              onClick={() => setDeleteGroupOpen(true)}
            >
              <Trash2 className="size-3" />
              Delete
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            className={toolbarOutlineBtnClassName}
            disabled={busy || filteredQuestions.length === 0}
            onClick={toggleSelectAll}
          >
            {allFilteredSelected ? (
              <CheckSquare className="size-3" />
            ) : (
              <Square className="size-3" />
            )}
            Select all
          </button>
          <button
            type="button"
            className={toolbarPrimaryBtnClassName}
            disabled={busy || isRunning || selected.size === 0}
            onClick={() => void handleRunSelected()}
          >
            {isRunning ? (
              <LoaderCircle className="size-3 animate-spin" />
            ) : (
              <Play className="size-3" />
            )}
            Run selected
          </button>
          <button
            type="button"
            className={toolbarOutlineBtnClassName}
            disabled={busy || isRunning || selected.size === 0}
            onClick={() => setDeleteSelectedOpen(true)}
          >
            <Trash2 className="size-3" />
            Delete selected
          </button>
          <button
            type="button"
            className={toolbarPrimaryBtnClassName}
            disabled={busy || isRunning || atQuestionLimit}
            onClick={() => {
              setQuestionDraft('')
              setAddQuestionOpen(true)
            }}
          >
            <Plus className="size-3" />
            Add question
          </button>
        </div>

        <div className="mt-3">
          <button
            type="button"
            className={toolbarOutlineBtnClassName}
            onClick={() => setFiltersOpen((prev) => !prev)}
            aria-expanded={filtersOpen}
          >
            <ChevronDown
              className={cn(
                'size-3 transition',
                filtersOpen ? '' : '-rotate-90',
              )}
              aria-hidden
            />
            Filters
            {activeFilterCount > 0 ? (
              <span className="rounded-full bg-[var(--ink)] px-1.5 py-px text-[10px] font-semibold text-white">
                {activeFilterCount}
              </span>
            ) : null}
          </button>

          {filtersOpen ? (
            <div className="mt-2 space-y-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-medium text-[var(--muted)]">
                  Status
                </span>
                {STATUS_FILTERS.map((status) => {
                  const active = statusFilters.has(status)
                  return (
                    <button
                      key={status}
                      type="button"
                      className={cn(
                        filterChipClassName,
                        active
                          ? 'border-[var(--ink)] bg-[var(--ink)] text-white'
                          : 'border-[var(--line)] text-[var(--muted)] hover:bg-[var(--surface)]',
                      )}
                      onClick={() =>
                        setStatusFilters((prev) =>
                          toggleFilterValue(prev, status),
                        )
                      }
                    >
                      {statusLabel(status)}
                    </button>
                  )
                })}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-medium text-[var(--muted)]">
                  Answerable
                </span>
                {ANSWERABILITY_FILTERS.map((value) => {
                  const active = answerabilityFilters.has(value)
                  return (
                    <button
                      key={value}
                      type="button"
                      className={cn(
                        filterChipClassName,
                        active
                          ? 'border-[var(--ink)] bg-[var(--ink)] text-white'
                          : 'border-[var(--line)] text-[var(--muted)] hover:bg-[var(--surface)]',
                      )}
                      onClick={() =>
                        setAnswerabilityFilters((prev) =>
                          toggleFilterValue(prev, value),
                        )
                      }
                    >
                      {value === 'answerable' ? 'Answerable' : 'Not answerable'}
                    </button>
                  )
                })}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-medium text-[var(--muted)]">
                  Rating
                </span>
                {RATING_FILTERS.map((value) => {
                  const active = ratingFilters.has(value)
                  const label =
                    value === 'unrated'
                      ? 'Unrated'
                      : value === 'good'
                        ? 'Good'
                        : value === 'passable'
                          ? 'Passable'
                          : 'Poor'
                  return (
                    <button
                      key={value}
                      type="button"
                      className={cn(
                        filterChipClassName,
                        active
                          ? 'border-[var(--ink)] bg-[var(--ink)] text-white'
                          : 'border-[var(--line)] text-[var(--muted)] hover:bg-[var(--surface)]',
                      )}
                      onClick={() =>
                        setRatingFilters((prev) =>
                          toggleFilterValue(prev, value),
                        )
                      }
                    >
                      {label}
                    </button>
                  )
                })}
                {activeFilterCount > 0 ? (
                  <button
                    type="button"
                    className="text-[11px] font-medium text-[var(--muted)] underline-offset-2 hover:text-[var(--ink)] hover:underline"
                    onClick={() => {
                      setStatusFilters(new Set())
                      setAnswerabilityFilters(new Set())
                      setRatingFilters(new Set())
                    }}
                  >
                    Clear filters
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        {atQuestionLimit ? (
          <p className={cn(hintClassName, 'mt-2')}>
            Plan limit reached ({maxQuestions} questions per group).
          </p>
        ) : null}

        <div className="mt-5 min-w-0 max-w-full">
          {detail.questions.length === 0 ? (
            <div className="border-b border-[var(--line)] px-1 py-8">
              <p className="text-[var(--ink)]">No questions yet.</p>
              <p className={cn(hintClassName, 'mt-1')}>
                Add independent test questions, then select and run them.
              </p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="border-b border-[var(--line)] px-1 py-8">
              <p className="text-[var(--ink)]">No questions match filters.</p>
              <p className={cn(hintClassName, 'mt-1')}>
                Clear or adjust status, answerable, and rating filters.
              </p>
            </div>
          ) : (
            <ul className="min-w-0 max-w-full">
              {filteredQuestions.map((question) => {
                const checked = selected.has(question.id)
                return (
                  <li key={question.id} className="min-w-0 max-w-full">
                    <div
                      className={cn(
                        'group flex min-w-0 max-w-full items-center gap-3 border-b border-[var(--line)] px-1 py-4 transition',
                        'hover:bg-[var(--surface)]/60',
                      )}
                    >
                      <input
                        type="checkbox"
                        className="shrink-0"
                        checked={checked}
                        disabled={isRunning}
                        onChange={() => toggleSelected(question.id)}
                        aria-label={`Select question ${question.questionText}`}
                      />
                      <button
                        type="button"
                        className="w-0 min-w-0 flex-1 overflow-hidden text-left"
                        onClick={() => setActiveQuestionId(question.id)}
                      >
                        <span className="flex min-w-0 max-w-full items-center gap-2">
                          <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-[var(--ink)]">
                            {question.questionText}
                          </span>
                          <span className="flex shrink-0 items-center gap-1.5">
                            <StatusPill status={question.status} />
                            {question.answerability ? (
                              <AnswerabilityChip
                                answerability={question.answerability}
                              />
                            ) : null}
                            {question.status === 'completed' ? (
                              <RatingChip rating={question.rating} />
                            ) : null}
                          </span>
                        </span>
                        {question.error ? (
                          <span className="mt-1 block truncate text-xs text-red-700">
                            {question.error}
                          </span>
                        ) : null}
                      </button>
                      <IconAction
                        label="Edit question"
                        disabled={busy || isRunning}
                        onClick={() => {
                          setEditQuestion(question)
                          setQuestionDraft(question.questionText)
                        }}
                      >
                        <Pencil className="size-4" aria-hidden />
                      </IconAction>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <SideDrawer
          open={Boolean(activeQuestion)}
          onClose={() => setActiveQuestionId(null)}
          label="Question result"
          statusLabel={
            activeQuestion ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <StatusPill status={activeQuestion.status} />
                {activeQuestion.answerability ? (
                  <AnswerabilityChip
                    answerability={activeQuestion.answerability}
                  />
                ) : null}
                {activeQuestion.status === 'completed' ? (
                  <RatingChip rating={activeQuestion.rating} />
                ) : null}
              </div>
            ) : null
          }
          details={
            activeQuestion ? (
              <QuestionResultDetails
                question={activeQuestion}
                onOpenTopic={handleOpenTopic}
                onOpenArticle={(articleId) => openArticleEditor(articleId)}
                onOpenGuidance={openGuidanceEditor}
              />
            ) : null
          }
        >
          {activeQuestion ? (
            <div className="space-y-8">
              <section>
                <p className="text-xs font-medium tracking-wide text-[var(--muted)] uppercase">
                  Question
                </p>
                <h2 className="mt-2 text-xl font-medium leading-snug text-[var(--ink)]">
                  {activeQuestion.questionText}
                </h2>
              </section>

              <section>
                <p className="text-xs font-medium tracking-wide text-[var(--muted)] uppercase">
                  Answer
                </p>
                {activeQuestion.error ? (
                  <p className="mt-2 text-sm text-red-700">
                    {activeQuestion.error}
                  </p>
                ) : activeQuestion.answer ? (
                  <div className="mt-2 text-[var(--ink)]">
                    <AgentMessageBody
                      text={stripUiMarkers(activeQuestion.answer)}
                      streaming={false}
                      darkMode={false}
                      renderImage={renderImage}
                    />
                  </div>
                ) : (
                  <p className={cn(hintClassName, 'mt-2')}>No answer yet.</p>
                )}
              </section>

              {activeQuestion.execution.startedAt ? (
                <dl className="grid gap-2 border-t border-[var(--line)] pt-4 text-xs text-[var(--muted)] sm:grid-cols-2">
                  <div>
                    <dt className="font-medium tracking-wide uppercase">
                      Started
                    </dt>
                    <dd className="mt-0.5 text-[var(--ink)]">
                      {new Date(
                        activeQuestion.execution.startedAt,
                      ).toLocaleString()}
                    </dd>
                  </div>
                  {activeQuestion.execution.finishedAt ? (
                    <div>
                      <dt className="font-medium tracking-wide uppercase">
                        Finished
                      </dt>
                      <dd className="mt-0.5 text-[var(--ink)]">
                        {new Date(
                          activeQuestion.execution.finishedAt,
                        ).toLocaleString()}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              ) : null}

              {activeQuestion.status === 'completed' ? (
                <section className="space-y-3 border-t border-[var(--line)] pt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-medium tracking-wide text-[var(--muted)] uppercase">
                      Rating
                    </p>
                    <RatingChip rating={activeQuestion.rating} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(['good', 'passable', 'poor'] as const).map((rating) => {
                      const selected = activeQuestion.rating === rating
                      const tones = RATING_BUTTON_CLASS[rating]
                      return (
                        <button
                          key={rating}
                          type="button"
                          className={cn(
                            'inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium capitalize transition',
                            selected ? tones.selected : tones.base,
                            'disabled:pointer-events-none disabled:opacity-40',
                          )}
                          disabled={busy}
                          onClick={() => void handleRating(rating)}
                        >
                          {rating}
                        </button>
                      )
                    })}
                  </div>
                  {activeQuestion.rating === 'poor' ? (
                    <div className="space-y-1.5">
                      <p className="text-[11px] text-[var(--muted)]">
                        Suggestions
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        <Link
                          to="/project/$id/train/article"
                          params={{ id: projectId }}
                          search={{
                            view: 'snippets',
                            batchQuestionId: activeQuestion.id,
                            batchPrompt: activeQuestion.questionText,
                          }}
                          className={poorSuggestionLinkClassName}
                        >
                          Add snippet
                        </Link>
                        <Link
                          to="/project/$id/train/article"
                          params={{ id: projectId }}
                          search={{
                            view: 'articles',
                            batchQuestionId: activeQuestion.id,
                            batchPrompt: activeQuestion.questionText,
                          }}
                          className={poorSuggestionLinkClassName}
                        >
                          Add article
                        </Link>
                        <Link
                          to="/project/$id/train/article"
                          params={{ id: projectId }}
                          search={{
                            view: 'articles',
                            batchQuestionId: activeQuestion.id,
                            batchPrompt: activeQuestion.questionText,
                            ...(activeQuestion.references.articles[0]
                              ? {
                                  articleId:
                                    activeQuestion.references.articles[0].id,
                                }
                              : {}),
                          }}
                          className={poorSuggestionLinkClassName}
                        >
                          Update article
                        </Link>
                      </div>
                    </div>
                  ) : null}
                </section>
              ) : null}
            </div>
          ) : null}
        </SideDrawer>

        <Modal
          open={addQuestionOpen}
          onClose={() => setAddQuestionOpen(false)}
          title="Add question"
        >
          <textarea
            className={cn(inputClassName, 'min-h-28')}
            value={questionDraft}
            onChange={(e) => setQuestionDraft(e.target.value)}
            placeholder="What should the agent answer?"
          />
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              className={buttonOutlineClassName}
              onClick={() => setAddQuestionOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={buttonClassName}
              disabled={busy}
              onClick={() => void handleAddQuestion()}
            >
              Add
            </button>
          </div>
        </Modal>

        <Modal
          open={Boolean(editQuestion)}
          onClose={() => setEditQuestion(null)}
          title="Edit question"
        >
          <textarea
            className={cn(inputClassName, 'min-h-28')}
            value={questionDraft}
            onChange={(e) => setQuestionDraft(e.target.value)}
          />
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              className={buttonOutlineClassName}
              onClick={() => setEditQuestion(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={buttonClassName}
              disabled={busy}
              onClick={() => void handleEditQuestion()}
            >
              Save
            </button>
          </div>
        </Modal>

        <Modal
          open={renameOpen}
          onClose={() => setRenameOpen(false)}
          title="Rename group"
        >
          <input
            className={inputClassName}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
          />
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              className={buttonOutlineClassName}
              onClick={() => setRenameOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={buttonClassName}
              disabled={busy}
              onClick={() => void handleRenameGroup()}
            >
              Save
            </button>
          </div>
        </Modal>

        <Modal
          open={deleteGroupOpen}
          onClose={() => setDeleteGroupOpen(false)}
          title="Delete group"
        >
          <p className="text-sm text-[var(--ink)]">
            Delete{' '}
            <span className="font-medium">&ldquo;{detail.name}&rdquo;</span> and
            all of its questions? This cannot be undone.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              className={buttonOutlineClassName}
              disabled={busy}
              onClick={() => setDeleteGroupOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={cn(buttonClassName, 'bg-rose-700 hover:opacity-90')}
              disabled={busy}
              onClick={() => void handleDeleteGroup()}
            >
              Delete group
            </button>
          </div>
        </Modal>

        <Modal
          open={deleteSelectedOpen}
          onClose={() => setDeleteSelectedOpen(false)}
          title="Delete questions"
        >
          <p className="text-sm text-[var(--ink)]">
            Delete {selected.size} selected question
            {selected.size === 1 ? '' : 's'}? This cannot be undone.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              className={buttonOutlineClassName}
              disabled={busy}
              onClick={() => setDeleteSelectedOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={cn(buttonClassName, 'bg-rose-700 hover:opacity-90')}
              disabled={busy}
              onClick={() => void handleDeleteSelected()}
            >
              Delete
            </button>
          </div>
        </Modal>
      </div>
    )
  }

  return (
    <div className={cn(projectSectionClassName, 'min-w-0 max-w-full')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium text-[var(--ink)]">
            Batch Testing
          </h1>
          <p className={cn(hintClassName, 'mt-1')}>
            Create groups of independent questions and run them through the real
            agent pipeline.
          </p>
        </div>
        <button
          type="button"
          className={cn(buttonClassName, 'inline-flex items-center gap-2')}
          disabled={busy || atGroupLimit}
          onClick={() => {
            setCreateName('')
            setCreateOpen(true)
          }}
        >
          <Plus className="size-4" />
          New group
        </button>
      </div>
      {atGroupLimit ? (
        <p className={cn(hintClassName, 'mt-2')}>
          Plan limit reached ({maxGroups} batch test groups).
        </p>
      ) : null}

      <ul className="mt-6 min-w-0 max-w-full">
        {loading ? (
          <li className={cn(cardClassName, 'p-6 text-[var(--muted)]')}>
            Loading…
          </li>
        ) : groups.length === 0 ? (
          <li className={cn(cardClassName, 'p-6')}>
            <p className="text-[var(--ink)]">No batch test groups yet.</p>
            <p className={cn(hintClassName, 'mt-1')}>
              Create a group such as “Customer Support Regression Tests”.
            </p>
          </li>
        ) : (
          groups.map((group) => (
            <li key={group.id} className="min-w-0 max-w-full">
              <button
                type="button"
                className="flex w-full min-w-0 items-center gap-3 border-b border-[var(--line)] px-1 py-4 text-left transition hover:bg-[var(--surface)]/60"
                onClick={() => setGroupSearch(group.id)}
              >
                <span className="min-w-0 flex-1">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-[var(--ink)]">
                      {group.name}
                    </span>
                    <StatusPill status={group.runStatus} />
                  </span>
                  <span className="mt-1 block truncate text-xs text-[var(--muted)]">
                    {groupSummaryLine(group)}
                  </span>
                </span>
              </button>
            </li>
          ))
        )}
      </ul>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New batch test group"
      >
        <input
          className={inputClassName}
          value={createName}
          onChange={(e) => setCreateName(e.target.value)}
          placeholder="Customer Support Regression Tests"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className={buttonOutlineClassName}
            onClick={() => setCreateOpen(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className={buttonClassName}
            disabled={busy}
            onClick={() => void handleCreateGroup()}
          >
            Create
          </button>
        </div>
      </Modal>
    </div>
  )
}
