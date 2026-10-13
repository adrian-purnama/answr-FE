import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import toast from 'react-hot-toast'
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react'
import ArticleDrawer from '#/components/articles/ArticleDrawer'
import TopicRichEditor from '#/components/articles/TopicRichEditor'
import Modal from '#/components/ui/Modal'
import { usePlan } from '#/context/planContext'
import {
  ARTICLE_DESCRIPTION_MAX,
  ARTICLE_TITLE_MAX,
  createArticle,
  createTopic,
  deleteArticle,
  deleteTopic,
  downloadZipBase64,
  exportArticle,
  getArticle,
  importArticle,
  listArticles,
  reorderTopics,
  resyncArticle,
  resyncArticles,
  TOPIC_NAME_MAX,
  updateArticle,
  updateTopic,
  topicContentToEditorBlocks,
  savePayloadToContentString,
  type Article,
  type ArticleDetail,
  type ArticleSyncStatus,
  type Topic,
  type TopicContentSavePayload,
  type TopicSyncStatus,
} from '#/lib/article'
import {
  buttonClassName,
  buttonOutlineClassName,
  cardClassName,
  hintClassName,
  inputClassName,
  projectSectionClassName,
} from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

type ArticlesSectionProps = {
  apiKeyId: string
  /** When true, page chrome (title/padding) is provided by the parent. */
  embedded?: boolean
  openArticleId?: string
  openTopicId?: string
  onOpenRequestConsumed?: () => void
}

function ArticlesSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className={cn(cardClassName, 'animate-pulse p-5')}>
          <div className="mb-3 h-4 w-40 bg-[var(--surface)]" />
          <div className="h-3 w-24 bg-[var(--surface)]" />
        </div>
      ))}
    </div>
  )
}

function StatusPill({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium',
        enabled
          ? 'bg-emerald-50 text-emerald-800'
          : 'bg-[var(--surface)] text-[var(--muted)]',
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          enabled ? 'bg-emerald-500' : 'bg-[var(--muted)]',
        )}
      />
      {enabled ? 'Enabled' : 'Disabled'}
    </span>
  )
}

function SyncPill({ status }: { status: ArticleSyncStatus }) {
  const label =
    status === 'synced'
      ? 'Synced'
      : status === 'partial'
        ? 'Partial'
        : 'Not synced'
  const tone =
    status === 'synced'
      ? 'bg-emerald-50 text-emerald-800'
      : status === 'partial'
        ? 'bg-amber-50 text-amber-800'
        : 'bg-[var(--surface)] text-[var(--muted)]'
  const dot =
    status === 'synced'
      ? 'bg-emerald-500'
      : status === 'partial'
        ? 'bg-amber-500'
        : 'bg-[var(--muted)]'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium',
        tone,
      )}
    >
      <span className={cn('size-1.5 rounded-full', dot)} />
      {label}
    </span>
  )
}

function TopicSyncPill({ status }: { status: TopicSyncStatus }) {
  const label =
    status === 'synced'
      ? 'Synced'
      : status === 'failed'
        ? 'Failed'
        : status === 'in-progress'
          ? 'In progress'
          : 'Not synced'
  const tone =
    status === 'synced'
      ? 'bg-emerald-50 text-emerald-800'
      : status === 'failed'
        ? 'bg-red-50 text-red-800'
        : status === 'in-progress'
          ? 'bg-amber-50 text-amber-800'
          : 'bg-[var(--surface)] text-[var(--muted)]'
  const dot =
    status === 'synced'
      ? 'bg-emerald-500'
      : status === 'failed'
        ? 'bg-red-500'
        : status === 'in-progress'
          ? 'bg-amber-500'
          : 'bg-[var(--muted)]'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium',
        tone,
      )}
    >
      <span className={cn('size-1.5 rounded-full', dot)} />
      {label}
    </span>
  )
}

function rollupSyncStatus(topics: Topic[]): ArticleSyncStatus {
  if (topics.length === 0) return 'not-synced'
  if (topics.every((topic) => topic.isSynced === 'synced')) return 'synced'
  if (topics.every((topic) => topic.isSynced !== 'synced')) return 'not-synced'
  return 'partial'
}

function IconAction({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
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
        danger && 'hover:bg-red-50 hover:text-red-600',
      )}
    >
      {children}
    </button>
  )
}

type TopicPatch = {
  topicName?: string
  topicContent?: TopicContentSavePayload
  enabled?: boolean
}

function isTempTopicId(id: string): boolean {
  return id.startsWith('temp-')
}

export default function ArticlesSection({
  apiKeyId,
  embedded = false,
  openArticleId,
  openTopicId,
  onOpenRequestConsumed,
}: ArticlesSectionProps) {
  const { plan } = usePlan()
  const importInputRef = useRef<HTMLInputElement>(null)
  const pendingTopicPatchesRef = useRef(new Map<string, TopicPatch>())
  const cancelledTempTopicIdsRef = useRef(new Set<string>())

  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ArticleDetail | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [resyncing, setResyncing] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importDragging, setImportDragging] = useState(false)
  const [importFileName, setImportFileName] = useState<string | null>(null)
  const [createTitle, setCreateTitle] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [topicDeleteTarget, setTopicDeleteTarget] = useState<Topic | null>(null)
  const [deletingTopic, setDeletingTopic] = useState(false)
  const [articleDeleteTarget, setArticleDeleteTarget] =
    useState<Article | null>(null)
  const [deletingArticle, setDeletingArticle] = useState(false)
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)
  const [editingDescription, setEditingDescription] = useState(false)
  const [descriptionClamped, setDescriptionClamped] = useState(false)
  const descriptionRef = useRef<HTMLParagraphElement>(null)
  /** Topic ids that are collapsed (name only). Default: all collapsed when article opens. */
  const [collapsedTopicIds, setCollapsedTopicIds] = useState<Set<string>>(
    () => new Set(),
  )

  const maxArticles = plan?.maxArticles ?? 10
  const maxTopics = plan?.maxTopicsPerArticle ?? 50
  const maxImagesPerTopic = plan?.maxImagesPerTopic ?? 10
  const maxCharactersPerTopic = plan?.maxCharactersPerTopic ?? 10000
  const atArticleLimit = articles.length >= maxArticles
  const atTopicLimit = (selected?.topics.length ?? 0) >= maxTopics
  const articleEditable = Boolean(selected?.enabled)

  const loadArticles = useCallback(async () => {
    const response = await listArticles(apiKeyId)
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to load articles')
    }
    setArticles(response.data)
  }, [apiKeyId])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        await loadArticles()
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error ? error.message : 'Failed to load articles',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [loadArticles])

  async function openArticle(
    articleId: string,
    options?: { topicId?: string },
  ) {
    const response = await getArticle(apiKeyId, articleId)
    if (!response.success || !response.data) {
      toast.error(response.message || 'Failed to open article')
      return
    }
    setSelected(response.data)
    const collapsed = new Set(response.data.topics.map((t) => t.id))
    if (options?.topicId) collapsed.delete(options.topicId)
    setCollapsedTopicIds(collapsed)
    setDescriptionExpanded(false)
    setEditingDescription(false)
    setDescriptionClamped(false)
    setDrawerOpen(true)

    if (options?.topicId) {
      window.setTimeout(() => {
        document
          .querySelector(`[data-topic-id="${options.topicId}"]`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 80)
    }
  }

  useEffect(() => {
    if (!openArticleId) return

    let cancelled = false
    void (async () => {
      await openArticle(openArticleId, { topicId: openTopicId })
      if (!cancelled) onOpenRequestConsumed?.()
    })()

    return () => {
      cancelled = true
    }
    // Intentionally keyed only to open request ids from the route.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openArticleId, openTopicId])

  function patchArticleSyncStatus(
    articleId: string,
    syncStatus: ArticleSyncStatus,
  ) {
    setArticles((prev) =>
      prev.map((article) =>
        article.id === articleId ? { ...article, syncStatus } : article,
      ),
    )
  }

  async function handleResyncAll() {
    setResyncing(true)
    try {
      const response = await resyncArticles(apiKeyId)
      if (!response.success) {
        toast.error(response.message || 'Failed to resync articles')
        return
      }
      await loadArticles()
      if (selected) {
        const detail = await getArticle(apiKeyId, selected.id)
        if (detail.success && detail.data) {
          setSelected(detail.data)
          patchArticleSyncStatus(
            selected.id,
            rollupSyncStatus(detail.data.topics),
          )
        }
      }
      const count = response.data?.length ?? 0
      toast.success(
        count > 0
          ? `Resynced ${count} topic${count === 1 ? '' : 's'}`
          : 'Nothing to resync',
      )
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to resync articles',
      )
    } finally {
      setResyncing(false)
    }
  }

  async function handleResyncSelected() {
    if (!selected) return
    setResyncing(true)
    try {
      const response = await resyncArticle(apiKeyId, selected.id)
      if (!response.success) {
        toast.error(response.message || 'Failed to resync article')
        return
      }
      const detail = await getArticle(apiKeyId, selected.id)
      if (detail.success && detail.data) {
        setSelected(detail.data)
        const syncStatus = rollupSyncStatus(detail.data.topics)
        patchArticleSyncStatus(selected.id, syncStatus)
      } else {
        await loadArticles()
      }
      const count = response.data?.length ?? 0
      toast.success(
        count > 0
          ? `Resynced ${count} topic${count === 1 ? '' : 's'}`
          : 'Nothing to resync',
      )
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to resync article',
      )
    } finally {
      setResyncing(false)
    }
  }

  async function handleCreate() {
    const title = createTitle.trim()
    if (!title) {
      toast.error('Title is required')
      return
    }
    setSaving(true)
    try {
      const response = await createArticle(
        apiKeyId,
        title,
        createDescription.trim(),
      )
      if (!response.success || !response.data) {
        toast.error(response.message || 'Failed to create article')
        return
      }
      setCreateTitle('')
      setCreateDescription('')
      setShowCreate(false)
      await loadArticles()
      toast.success('Article created')
      await openArticle(response.data.id)
    } finally {
      setSaving(false)
    }
  }

  function openImportModal() {
    setImportFileName(null)
    setImportDragging(false)
    if (importInputRef.current) importInputRef.current.value = ''
    setShowImportModal(true)
  }

  function closeImportModal() {
    if (saving) return
    setShowImportModal(false)
    setImportFileName(null)
    setImportDragging(false)
    if (importInputRef.current) importInputRef.current.value = ''
  }

  async function handleImportFile(file: File) {
    const lower = file.name.toLowerCase()
    const isMarkdown =
      lower.endsWith('.md') ||
      file.type === 'text/markdown' ||
      file.type === 'text/plain'
    const isZip =
      lower.endsWith('.zip') ||
      file.type === 'application/zip' ||
      file.type === 'application/x-zip-compressed'
    if (!isMarkdown && !isZip) {
      toast.error('Please choose a .md or .zip file')
      return
    }

    setImportFileName(file.name)
    setSaving(true)
    try {
      const response = await importArticle(apiKeyId, file)
      if (!response.success || !response.data) {
        toast.error(response.message || 'Failed to import article')
        return
      }
      await loadArticles()
      toast.success('Article imported')
      setShowImportModal(false)
      setImportFileName(null)
      setSelected(response.data)
      setCollapsedTopicIds(new Set(response.data.topics.map((t) => t.id)))
      setDescriptionExpanded(false)
      setEditingDescription(false)
      setDescriptionClamped(false)
      setDrawerOpen(true)
    } finally {
      setSaving(false)
      if (importInputRef.current) importInputRef.current.value = ''
    }
  }

  async function handleExport() {
    if (!selected) return
    const response = await exportArticle(apiKeyId, selected.id)
    if (!response.success || !response.data) {
      toast.error(response.message || 'Failed to export article')
      return
    }
    downloadZipBase64(response.data.filename, response.data.zipBase64)
    toast.success('Downloaded zip')
  }

  async function handleDeleteArticle() {
    if (!articleDeleteTarget) return
    setDeletingArticle(true)
    try {
      const articleId = articleDeleteTarget.id
      const response = await deleteArticle(apiKeyId, articleId)
      if (!response.success) {
        toast.error(response.message || 'Failed to delete article')
        return
      }
      if (selected?.id === articleId) {
        setDrawerOpen(false)
        setSelected(null)
      }
      setArticleDeleteTarget(null)
      await loadArticles()
      toast.success('Article deleted')
    } finally {
      setDeletingArticle(false)
    }
  }

  async function saveTitle(title: string) {
    if (!selected || !selected.enabled) return
    const trimmed = title.trim()
    if (!trimmed || trimmed === selected.title) return
    const response = await updateArticle(apiKeyId, selected.id, {
      title: trimmed,
    })
    if (!response.success || !response.data) {
      toast.error(response.message || 'Failed to update title')
      return
    }
    setSelected((prev) =>
      prev
        ? {
            ...prev,
            title: response.data!.title,
            updatedAt: response.data!.updatedAt,
            updatedBy: response.data!.updatedBy,
          }
        : prev,
    )
    setArticles((prev) =>
      prev.map((a) =>
        a.id === response.data!.id
          ? {
              ...a,
              title: response.data!.title,
              updatedAt: response.data!.updatedAt,
              updatedBy: response.data!.updatedBy,
            }
          : a,
      ),
    )
  }

  async function saveDescription(description: string) {
    if (!selected || !selected.enabled) return
    const trimmed = description.trim()
    if (trimmed === (selected.description ?? '').trim()) return
    const response = await updateArticle(apiKeyId, selected.id, {
      description: trimmed,
    })
    if (!response.success || !response.data) {
      toast.error(response.message || 'Failed to update description')
      return
    }
    setSelected((prev) =>
      prev
        ? {
            ...prev,
            description: response.data!.description,
            updatedAt: response.data!.updatedAt,
            updatedBy: response.data!.updatedBy,
          }
        : prev,
    )
    setArticles((prev) =>
      prev.map((a) =>
        a.id === response.data!.id
          ? {
              ...a,
              description: response.data!.description,
              updatedAt: response.data!.updatedAt,
              updatedBy: response.data!.updatedBy,
            }
          : a,
      ),
    )
  }

  async function toggleArticleEnabled() {
    if (!selected) return
    const enabled = !selected.enabled
    const response = await updateArticle(apiKeyId, selected.id, { enabled })
    if (!response.success || !response.data) {
      toast.error(response.message || 'Failed to update article')
      return
    }
    setSelected((prev) =>
      prev
        ? {
            ...prev,
            enabled: response.data!.enabled,
            updatedAt: response.data!.updatedAt,
            updatedBy: response.data!.updatedBy,
          }
        : prev,
    )
    setArticles((prev) =>
      prev.map((a) =>
        a.id === response.data!.id
          ? {
              ...a,
              enabled: response.data!.enabled,
              updatedAt: response.data!.updatedAt,
              updatedBy: response.data!.updatedBy,
            }
          : a,
      ),
    )
  }

  async function handleAddTopic() {
    if (!selected || !selected.enabled || atTopicLimit) return

    const tempId = `temp-${crypto.randomUUID()}`
    const now = new Date().toISOString()
    const optimistic: Topic = {
      id: tempId,
      articleId: selected.id,
      topicName: 'Untitled topic',
      topicContent: '',
      type: 'content',
      order: selected.topics.length,
      enabled: true,
      isSynced: 'not-synced',
      createdAt: now,
      updatedAt: now,
    }

    setSelected((prev) => {
      if (!prev) return prev
      return { ...prev, topics: [...prev.topics, optimistic] }
    })
    setCollapsedTopicIds((prev) => new Set(prev).add(tempId))

    const articleId = selected.id
    const response = await createTopic(apiKeyId, articleId, 'Untitled topic')
    if (!response.success || !response.data) {
      toast.error(response.message || 'Failed to add topic')
      setSelected((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          topics: prev.topics.filter((t) => t.id !== tempId),
        }
      })
      setCollapsedTopicIds((prev) => {
        const next = new Set(prev)
        next.delete(tempId)
        return next
      })
      pendingTopicPatchesRef.current.delete(tempId)
      return
    }

    const created = response.data
    if (cancelledTempTopicIdsRef.current.has(tempId)) {
      cancelledTempTopicIdsRef.current.delete(tempId)
      void deleteTopic(apiKeyId, articleId, created.id)
      pendingTopicPatchesRef.current.delete(tempId)
      return
    }

    setSelected((prev) => {
      if (!prev) return prev
      if (!prev.topics.some((t) => t.id === tempId)) return prev
      const topics = prev.topics.map((t) => (t.id === tempId ? created : t))
      patchArticleSyncStatus(prev.id, rollupSyncStatus(topics))
      return {
        ...prev,
        updatedAt: created.updatedAt,
        updatedBy: created.updatedBy,
        topics,
      }
    })
    setCollapsedTopicIds((prev) => {
      const next = new Set(prev)
      if (next.delete(tempId)) next.add(created.id)
      return next
    })

    const pending = pendingTopicPatchesRef.current.get(tempId)
    pendingTopicPatchesRef.current.delete(tempId)
    if (pending) {
      await saveTopic(created.id, pending)
    }
  }

  async function saveTopic(topicId: string, patch: TopicPatch) {
    if (!selected) return

    if (isTempTopicId(topicId)) {
      const existing = pendingTopicPatchesRef.current.get(topicId) ?? {}
      pendingTopicPatchesRef.current.set(topicId, { ...existing, ...patch })
      setSelected((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          topics: prev.topics.map((t) => {
            if (t.id !== topicId) return t
            return {
              ...t,
              ...(patch.topicName !== undefined
                ? { topicName: patch.topicName }
                : {}),
              ...(patch.enabled !== undefined
                ? { enabled: patch.enabled }
                : {}),
              ...(patch.topicContent !== undefined
                ? {
                    topicContent: savePayloadToContentString(
                      patch.topicContent,
                    ),
                    updatedAt: new Date().toISOString(),
                  }
                : {}),
            }
          }),
        }
      })
      return
    }

    const response = await updateTopic(apiKeyId, selected.id, topicId, patch)
    if (!response.success || !response.data) {
      toast.error(response.message || 'Failed to save topic')
      return
    }
    setSelected((prev) => {
      if (!prev) return prev
      const topics = prev.topics.map((t) =>
        t.id === topicId ? response.data! : t,
      )
      patchArticleSyncStatus(prev.id, rollupSyncStatus(topics))
      return {
        ...prev,
        updatedAt: response.data!.updatedAt,
        updatedBy: response.data!.updatedBy,
        topics,
      }
    })
  }

  async function handleDeleteTopic() {
    if (!selected || !selected.enabled || !topicDeleteTarget) return
    const topicId = topicDeleteTarget.id

    if (isTempTopicId(topicId)) {
      cancelledTempTopicIdsRef.current.add(topicId)
      pendingTopicPatchesRef.current.delete(topicId)
      setSelected((prev) => {
        if (!prev) return prev
        const topics = prev.topics.filter((t) => t.id !== topicId)
        patchArticleSyncStatus(prev.id, rollupSyncStatus(topics))
        return { ...prev, topics }
      })
      setCollapsedTopicIds((prev) => {
        const next = new Set(prev)
        next.delete(topicId)
        return next
      })
      setTopicDeleteTarget(null)
      toast.success('Topic deleted')
      return
    }

    setDeletingTopic(true)
    try {
      const response = await deleteTopic(apiKeyId, selected.id, topicId)
      if (!response.success) {
        toast.error(response.message || 'Failed to delete topic')
        return
      }
      setSelected((prev) => {
        if (!prev) return prev
        const topics = prev.topics.filter((t) => t.id !== topicId)
        patchArticleSyncStatus(prev.id, rollupSyncStatus(topics))
        return { ...prev, topics }
      })
      setCollapsedTopicIds((prev) => {
        const next = new Set(prev)
        next.delete(topicId)
        return next
      })
      setTopicDeleteTarget(null)
      toast.success('Topic deleted')
    } finally {
      setDeletingTopic(false)
    }
  }

  function collapseAllTopics() {
    if (!selected) return
    setCollapsedTopicIds(new Set(selected.topics.map((t) => t.id)))
  }

  function expandAllTopics() {
    setCollapsedTopicIds(new Set())
  }

  function toggleTopicCollapsed(topicId: string) {
    setCollapsedTopicIds((prev) => {
      const next = new Set(prev)
      if (next.has(topicId)) next.delete(topicId)
      else next.add(topicId)
      return next
    })
  }

  useEffect(() => {
    if (!drawerOpen || editingDescription || descriptionExpanded) return

    let cancelled = false
    let observer: ResizeObserver | null = null
    let attempts = 0

    const measure = (el: HTMLParagraphElement) => {
      if (cancelled) return
      setDescriptionClamped(el.scrollHeight > el.clientHeight + 1)
    }

    const attach = (): boolean => {
      const el = descriptionRef.current
      if (!el) return false
      measure(el)
      observer?.disconnect()
      observer = new ResizeObserver(() => {
        if (descriptionRef.current) measure(descriptionRef.current)
      })
      observer.observe(el)
      return true
    }

    // Drawer mounts asynchronously    retry until the description node exists
    const tick = () => {
      if (cancelled) return
      if (attach() || attempts++ > 30) return
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)

    return () => {
      cancelled = true
      observer?.disconnect()
    }
  }, [
    selected?.id,
    selected?.description,
    editingDescription,
    descriptionExpanded,
    drawerOpen,
  ])

  async function moveTopic(topicId: string, direction: -1 | 1) {
    if (!selected || !selected.enabled) return
    const ids = selected.topics.map((t) => t.id)
    const index = ids.indexOf(topicId)
    const next = index + direction
    if (index < 0 || next < 0 || next >= ids.length) return

    const reordered = [...ids]
    ;[reordered[index], reordered[next]] = [reordered[next], reordered[index]]

    const optimistic = reordered
      .map((id) => selected.topics.find((t) => t.id === id))
      .filter((t): t is Topic => Boolean(t))
      .map((t, order) => ({ ...t, order }))
    setSelected({ ...selected, topics: optimistic })

    const response = await reorderTopics(apiKeyId, selected.id, reordered)
    if (!response.success || !response.data) {
      toast.error(response.message || 'Failed to reorder topics')
      const reload = await getArticle(apiKeyId, selected.id)
      if (reload.success && reload.data) setSelected(reload.data)
      return
    }
    setSelected((prev) => (prev ? { ...prev, topics: response.data! } : prev))
  }

  const toolbarBtn = cn(
    buttonOutlineClassName,
    'inline-flex h-8 items-center gap-1.5 px-2.5 py-0 text-xs',
  )
  const toolbarBtnPrimary = cn(
    buttonClassName,
    'inline-flex h-8 items-center gap-1.5 px-2.5 py-0 text-xs',
  )

  return (
    <div
      className={cn(
        !embedded && projectSectionClassName,
        'min-w-0 max-w-full overflow-x-hidden',
      )}
    >
      <div
        className={cn(
          'flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
          !embedded && 'sm:items-end',
        )}
      >
        {!embedded ? (
          <div className="min-w-0">
            <h1 className="text-2xl font-medium text-[var(--ink)]">Articles</h1>
            <p className={cn(hintClassName, 'mt-1')}>
              Training documents made of ordered topics    open one to edit like a
              page.
            </p>
          </div>
        ) : (
          <p className={cn(hintClassName, 'min-w-0')}>
            {articles.length} article{articles.length === 1 ? '' : 's'}
          </p>
        )}
        {articles.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              className={toolbarBtn}
              disabled={saving || resyncing}
              onClick={() => void handleResyncAll()}
            >
              {resyncing ? (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" aria-hidden />
              )}
              Resync
            </button>
            <button
              type="button"
              className={toolbarBtn}
              disabled={saving || atArticleLimit || resyncing}
              onClick={openImportModal}
            >
              <Upload className="size-3.5" aria-hidden />
              Import
            </button>
            <button
              type="button"
              className={toolbarBtnPrimary}
              disabled={saving || atArticleLimit || resyncing}
              onClick={() => setShowCreate(true)}
            >
              <Plus className="size-3.5" aria-hidden />
              New
            </button>
          </div>
        )}
      </div>

      {atArticleLimit && (
        <p className={cn(hintClassName, 'mt-3')}>
          Plan limit reached ({maxArticles} articles).
        </p>
      )}

      <div className="mt-8 min-w-0 max-w-full">
        {loading ? (
          <ArticlesSkeleton />
        ) : articles.length === 0 ? (
          <div
            className={cn(cardClassName, 'flex flex-col items-start gap-4 p-8')}
          >
            <FileText className="size-8 text-[var(--muted)]" aria-hidden />
            <div>
              <p className="text-lg font-medium">No articles yet</p>
              <p className={cn(hintClassName, 'mt-1')}>
                Create your first article to start writing topics as sections.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                className={toolbarBtnPrimary}
                disabled={saving || atArticleLimit}
                onClick={() => setShowCreate(true)}
              >
                <Plus className="size-3.5" aria-hidden />
                New article
              </button>
              <button
                type="button"
                className={toolbarBtn}
                disabled={saving || atArticleLimit}
                onClick={openImportModal}
              >
                <Upload className="size-3.5" aria-hidden />
                Import
              </button>
            </div>
          </div>
        ) : (
          <ul className="min-w-0 max-w-full space-y-2">
            {articles.map((article) => (
              <li key={article.id} className="min-w-0 max-w-full">
                <div
                  className={cn(
                    'group flex min-w-0 max-w-full items-center gap-3 border-b border-[var(--line)] px-1 py-4 transition',
                    'hover:bg-[var(--surface)]/60',
                  )}
                >
                  <button
                    type="button"
                    className="w-0 min-w-0 flex-1 overflow-hidden text-left"
                    onClick={() => void openArticle(article.id)}
                  >
                    <span className="flex min-w-0 max-w-full items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-[15px] font-medium">
                        {article.title}
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        <SyncPill status={article.syncStatus} />
                        <StatusPill enabled={article.enabled} />
                      </span>
                    </span>
                    {article.description ? (
                      <span className="mt-1 block max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm text-[var(--muted)]">
                        {article.description}
                      </span>
                    ) : null}
                    <span className="mt-1 block max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs text-[var(--muted)]">
                      Updated {new Date(article.updatedAt).toLocaleString()}
                      {article.updatedBy
                        ? ` by ${article.updatedBy}`
                        : ''}
                    </span>
                  </button>
                  <IconAction
                    label={`Delete ${article.title}`}
                    danger
                    onClick={() => setArticleDeleteTarget(article)}
                  >
                    <Trash2 className="size-4" />
                  </IconAction>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ArticleDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        createdAt={selected?.createdAt}
        updatedAt={selected?.updatedAt}
        createdBy={selected?.createdBy}
        updatedBy={selected?.updatedBy}
        enabled={selected?.enabled}
        syncStatus={
          selected ? rollupSyncStatus(selected.topics) : undefined
        }
        detailActions={
          selected ? (
            <>
              <button
                type="button"
                className={cn(
                  buttonOutlineClassName,
                  'flex w-full items-center justify-center gap-1.5 text-xs',
                )}
                disabled={resyncing}
                onClick={() => void handleExport()}
              >
                <Download className="size-3.5" aria-hidden />
                Download
              </button>
              <button
                type="button"
                className={cn(
                  buttonOutlineClassName,
                  'flex w-full items-center justify-center gap-1.5 text-xs',
                )}
                disabled={resyncing}
                onClick={() => void handleResyncSelected()}
              >
                {resyncing ? (
                  <LoaderCircle className="size-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="size-3.5" aria-hidden />
                )}
                Resync
              </button>
              <button
                type="button"
                className={cn(
                  buttonOutlineClassName,
                  'w-full text-xs',
                  !selected.enabled &&
                    'bg-[var(--surface)] text-[var(--ink)]',
                )}
                disabled={resyncing}
                onClick={() => void toggleArticleEnabled()}
              >
                {selected.enabled ? 'Disable' : 'Enable'}
              </button>
              <button
                type="button"
                className={cn(
                  buttonOutlineClassName,
                  'w-full text-xs text-red-600 hover:bg-red-50 hover:text-red-700',
                )}
                disabled={resyncing}
                onClick={() => setArticleDeleteTarget(selected)}
              >
                <Trash2 className="mr-1.5 inline size-3.5" aria-hidden />
                Delete article
              </button>
            </>
          ) : null
        }
      >
        {selected && (
          <div
            className={cn(
              'min-w-0 overflow-x-hidden break-words transition-opacity',
              !articleEditable && 'opacity-90',
            )}
          >
            {!articleEditable && (
              <p className="mb-8 rounded-md bg-[var(--surface)] px-3 py-2 text-sm text-[var(--muted)]">
                This article is disabled    content is read-only. Enable it to
                edit.
              </p>
            )}

            {articleEditable ? (
              <input
                aria-label="Article title"
                className={cn(
                  'w-full min-w-0 border-0 bg-transparent p-0 text-3xl font-semibold tracking-tight text-[var(--ink)] outline-none',
                  'placeholder:text-[var(--muted)]/50',
                )}
                defaultValue={selected.title}
                key={`${selected.id}-title-${selected.title}`}
                placeholder="Untitled"
                maxLength={ARTICLE_TITLE_MAX}
                onBlur={(e) => void saveTitle(e.target.value)}
              />
            ) : (
              <h1 className="break-words text-3xl font-semibold tracking-tight text-[var(--ink)]">
                {selected.title}
              </h1>
            )}

            <div className="mt-2 min-w-0">
              {editingDescription && articleEditable ? (
                <div>
                  <textarea
                    aria-label="Article description"
                    className={cn(
                      'w-full min-w-0 resize-none overflow-hidden border-0 bg-transparent p-0 text-sm leading-relaxed text-[var(--muted)] outline-none',
                      'placeholder:text-[var(--muted)]/50',
                    )}
                    rows={Math.max(
                      2,
                      (selected.description ?? '').split('\n').length + 1,
                    )}
                    defaultValue={selected.description ?? ''}
                    key={`${selected.id}-desc-edit-${selected.description ?? ''}`}
                    placeholder="Add a short description…"
                    maxLength={ARTICLE_DESCRIPTION_MAX}
                    autoFocus
                    onInput={(e) => {
                      const el = e.currentTarget
                      el.style.height = 'auto'
                      el.style.height = `${el.scrollHeight}px`
                    }}
                    ref={(el) => {
                      if (el) {
                        el.style.height = 'auto'
                        el.style.height = `${el.scrollHeight}px`
                      }
                    }}
                    onBlur={(e) => {
                      void saveDescription(e.target.value)
                      setEditingDescription(false)
                      setDescriptionExpanded(false)
                    }}
                  />
                </div>
              ) : (
                <div className="min-w-0">
                  {(selected.description || articleEditable) && (
                    <>
                      <p
                        ref={descriptionRef}
                        className={cn(
                          'text-sm leading-relaxed text-[var(--muted)]',
                          !descriptionExpanded && 'line-clamp-2',
                        )}
                      >
                        {selected.description ||
                          (articleEditable ? 'Add a short description…' : '')}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {descriptionClamped && (
                          <button
                            type="button"
                            className="text-xs text-[var(--muted)] underline-offset-2 hover:text-[var(--ink)] hover:underline"
                            onClick={() =>
                              setDescriptionExpanded((open) => !open)
                            }
                          >
                            {descriptionExpanded ? 'Show less' : 'Show more'}
                          </button>
                        )}

                        {descriptionClamped && articleEditable && (
                          <div className="h-4 w-px bg-[var(--line)]" aria-hidden />
                        )}

                        {articleEditable && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-[var(--muted)] transition hover:text-[var(--ink)]"
                            aria-label="Edit description"
                            title="Edit description"
                            onClick={() => {
                              setEditingDescription(true)
                              setDescriptionExpanded(true)
                            }}
                          >
                            Edit
                            <Pencil className="size-3.5" aria-hidden />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="mt-10">
              {selected.topics.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">
                  No topics yet. Add one below to start a section.
                </p>
              ) : (
                <>
                  <div className="mb-6 flex items-center justify-between gap-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                      Topics
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="text-xs text-[var(--muted)] hover:text-[var(--ink)]"
                        onClick={collapseAllTopics}
                      >
                        Collapse all
                      </button>
                      <span className="text-[var(--line)]" aria-hidden>
                        ·
                      </span>
                      <button
                        type="button"
                        className="text-xs text-[var(--muted)] hover:text-[var(--ink)]"
                        onClick={expandAllTopics}
                      >
                        Expand all
                      </button>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {selected.topics.map((topic, index) => {
                      const topicEditable = articleEditable && topic.enabled
                      const isCollapsed = collapsedTopicIds.has(topic.id)
                      return (
                        <section
                          key={topic.id}
                          data-topic-id={topic.id}
                          className="group/topic relative border-t border-[var(--line)] pt-6 first:border-t-0 first:pt-0"
                        >
                          <div className="flex items-start gap-1">
                            <button
                              type="button"
                              className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center text-[var(--muted)] transition hover:text-[var(--ink)]"
                              aria-expanded={!isCollapsed}
                              aria-label={
                                isCollapsed
                                  ? `Expand ${topic.topicName}`
                                  : `Collapse ${topic.topicName}`
                              }
                              onClick={() => toggleTopicCollapsed(topic.id)}
                            >
                              {isCollapsed ? (
                                <ChevronRight className="size-4" />
                              ) : (
                                <ChevronDown className="size-4" />
                              )}
                            </button>

                            <div className="min-w-0 flex-1">
                              {topicEditable && !isCollapsed ? (
                                <input
                                  aria-label="Topic name"
                                  className={cn(
                                    'w-full min-w-0 border-0 bg-transparent p-0 text-xl font-semibold text-[var(--ink)] outline-none',
                                    'placeholder:text-[var(--muted)]/50',
                                  )}
                                  defaultValue={topic.topicName}
                                  key={`${topic.id}-name-${topic.topicName}`}
                                  placeholder="Untitled topic"
                                  maxLength={TOPIC_NAME_MAX}
                                  onBlur={(e) => {
                                    const topicName = e.target.value.trim()
                                    if (
                                      topicName &&
                                      topicName !== topic.topicName
                                    ) {
                                      void saveTopic(topic.id, { topicName })
                                    }
                                  }}
                                />
                              ) : (
                                <button
                                  type="button"
                                  className={cn(
                                    'block w-full min-w-0 text-left text-xl font-semibold text-[var(--ink)]',
                                    isCollapsed
                                      ? 'truncate'
                                      : 'break-words whitespace-normal',
                                  )}
                                  onClick={() =>
                                    toggleTopicCollapsed(topic.id)
                                  }
                                >
                                  {topic.topicName}
                                </button>
                              )}

                              {!isCollapsed && (
                                <div className="mt-1.5 flex items-center gap-2">
                                  <TopicSyncPill status={topic.isSynced} />
                                  <StatusPill enabled={topic.enabled} />
                                  {articleEditable && (
                                    <button
                                      type="button"
                                      className="text-[11px] text-[var(--muted)] underline-offset-2 hover:text-[var(--ink)] hover:underline"
                                      onClick={() =>
                                        void saveTopic(topic.id, {
                                          enabled: !topic.enabled,
                                        })
                                      }
                                    >
                                      {topic.enabled
                                        ? 'Disable topic'
                                        : 'Enable topic'}
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>

                            {isCollapsed && (
                              <span className="flex shrink-0 items-center gap-1.5">
                                <TopicSyncPill status={topic.isSynced} />
                                <StatusPill enabled={topic.enabled} />
                              </span>
                            )}

                            {articleEditable && (
                              <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover/topic:opacity-100 focus-within:opacity-100">
                                <IconAction
                                  label="Move up"
                                  disabled={index === 0}
                                  onClick={() => void moveTopic(topic.id, -1)}
                                >
                                  <ArrowUp className="size-3.5" />
                                </IconAction>
                                <IconAction
                                  label="Move down"
                                  disabled={
                                    index === selected.topics.length - 1
                                  }
                                  onClick={() => void moveTopic(topic.id, 1)}
                                >
                                  <ArrowDown className="size-3.5" />
                                </IconAction>
                                <IconAction
                                  label="Delete topic"
                                  danger
                                  onClick={() => setTopicDeleteTarget(topic)}
                                >
                                  <Trash2 className="size-3.5" />
                                </IconAction>
                              </div>
                            )}
                          </div>

                          {!isCollapsed && (
                            <div className="mt-4 min-w-0 overflow-x-hidden pl-8">
                              {!topic.enabled && articleEditable && (
                                <p className="mb-2 text-xs text-[var(--muted)]">
                                  Topic disabled    showing read-only content.
                                </p>
                              )}

                              <TopicRichEditor
                                content={topicContentToEditorBlocks(
                                  topic.topicContent,
                                )}
                                contentKey={`${topic.id}-${topic.updatedAt}`}
                                apiKeyId={apiKeyId}
                                articleId={selected.id}
                                maxImages={maxImagesPerTopic}
                                maxCharacters={maxCharactersPerTopic}
                                canEdit={topicEditable}
                                excludeTopicId={topic.id}
                                placeholder="Start writing…"
                                onImageLimit={() =>
                                  toast.error(
                                    `Image limit reached (${maxImagesPerTopic} per topic)`,
                                  )
                                }
                                onImageTooLarge={() =>
                                  toast.error('Image must be 5MB or smaller')
                                }
                                onCharacterLimit={() =>
                                  toast.error(
                                    `Character limit reached (${maxCharactersPerTopic} per topic)`,
                                  )
                                }
                                onSave={(payload) =>
                                  void saveTopic(topic.id, {
                                    topicContent: payload,
                                  })
                                }
                              />
                            </div>
                          )}
                        </section>
                      )
                    })}
                  </div>
                </>
              )}
            </div>

            {articleEditable && (
              <div className="mt-12 border-t border-dashed border-[var(--line)] pt-6">
                {atTopicLimit ? (
                  <p className={hintClassName}>
                    Topic limit reached ({maxTopics} per article).
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleAddTopic()}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-[var(--muted)] transition',
                      'hover:bg-[var(--surface)] hover:text-[var(--ink)]',
                    )}
                  >
                    <Plus className="size-4" aria-hidden />
                    Add topic
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </ArticleDrawer>

      <Modal
        open={showCreate}
        onClose={() => {
          if (!saving) {
            setShowCreate(false)
            setCreateTitle('')
            setCreateDescription('')
          }
        }}
        title="New article"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm text-[var(--ink)]">Title</span>
            <input
              id="new-article-title"
              className={inputClassName}
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              placeholder="Getting started"
              maxLength={ARTICLE_TITLE_MAX}
              autoFocus
              disabled={saving}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleCreate()
              }}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm text-[var(--ink)]">Description</span>
            <textarea
              id="new-article-description"
              className={cn(inputClassName, 'min-h-20')}
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              placeholder="Short summary of what this article covers"
              maxLength={ARTICLE_DESCRIPTION_MAX}
              disabled={saving}
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className={buttonOutlineClassName}
              disabled={saving}
              onClick={() => {
                setShowCreate(false)
                setCreateTitle('')
                setCreateDescription('')
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className={buttonClassName}
              disabled={saving}
              onClick={() => void handleCreate()}
            >
              {saving ? (
                <span className="inline-flex items-center gap-2">
                  <LoaderCircle className="size-4 animate-spin" aria-hidden />
                  Creating…
                </span>
              ) : (
                'Create'
              )}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={showImportModal}
        onClose={closeImportModal}
        title="Import article"
        maxWidth="max-w-lg"
      >
        <p className={cn(hintClassName, 'text-sm')}>
          Import a Markdown file or a zip export (article.md + images/). Format:
        </p>
        <pre
          className={cn(
            'mt-3 overflow-x-auto rounded-md border border-[var(--line)] bg-[var(--surface)] p-3 font-mono text-xs leading-relaxed text-[var(--ink)]',
          )}
        >{`# Article Title

Optional description paragraph(s) go here.

### Topic name
Topic content in normal Markdown    paragraphs,
lists, **bold**, links, etc.

![image](images/<mediaId>.png)

### Another topic
More content under this section.`}</pre>
        <p className={cn(hintClassName, 'mt-2 text-xs')}>
          The first <code className="font-mono">#</code> heading is the article
          title. Text before the first{' '}
          <code className="font-mono">###</code> is the description. Each{' '}
          <code className="font-mono">###</code> starts a topic. Image lines
          reference files under <code className="font-mono">images/</code> in a
          zip package.
        </p>

        <input
          ref={importInputRef}
          type="file"
          accept=".md,.zip,text/markdown,text/plain,application/zip"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleImportFile(file)
          }}
        />

        <div
          role="button"
          tabIndex={0}
          className={cn(
            'mt-5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed px-4 py-8 text-center transition',
            importDragging
              ? 'border-[var(--ink)] bg-[var(--surface)]'
              : 'border-[var(--line)] hover:border-[var(--ink)]/40 hover:bg-[var(--surface)]/60',
            saving && 'pointer-events-none opacity-60',
          )}
          onClick={() => importInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              importInputRef.current?.click()
            }
          }}
          onDragEnter={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setImportDragging(true)
          }}
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setImportDragging(true)
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setImportDragging(false)
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setImportDragging(false)
            const file = e.dataTransfer.files?.[0]
            if (file) void handleImportFile(file)
          }}
        >
          {saving ? (
            <LoaderCircle
              className="size-6 animate-spin text-[var(--muted)]"
              aria-hidden
            />
          ) : (
            <Upload className="size-6 text-[var(--muted)]" aria-hidden />
          )}
          <p className="text-sm font-medium text-[var(--ink)]">
            {saving
              ? 'Importing…'
              : importFileName
                ? importFileName
                : 'Drop a .md or .zip file here'}
          </p>
          {!saving && (
            <p className={cn(hintClassName, 'text-xs')}>
              or click to choose a file
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            className={buttonOutlineClassName}
            disabled={saving}
            onClick={closeImportModal}
          >
            Cancel
          </button>
        </div>
      </Modal>

      <Modal
        open={articleDeleteTarget !== null}
        onClose={() => {
          if (!deletingArticle) setArticleDeleteTarget(null)
        }}
        title="Delete article"
      >
        <p className={hintClassName}>
          Delete &quot;{articleDeleteTarget?.title}&quot; and all of its topics?
          This cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className={buttonOutlineClassName}
            disabled={deletingArticle}
            onClick={() => setArticleDeleteTarget(null)}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deletingArticle}
            onClick={() => void handleDeleteArticle()}
            className="inline-flex items-center justify-center gap-2 border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            {deletingArticle ? (
              <>
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
                Deleting…
              </>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </Modal>

      <Modal
        open={topicDeleteTarget !== null}
        onClose={() => {
          if (!deletingTopic) setTopicDeleteTarget(null)
        }}
        title="Delete topic"
      >
        <p className={hintClassName}>
          Delete &quot;{topicDeleteTarget?.topicName}&quot;? This cannot be
          undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className={buttonOutlineClassName}
            disabled={deletingTopic}
            onClick={() => setTopicDeleteTarget(null)}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deletingTopic}
            onClick={() => void handleDeleteTopic()}
            className="inline-flex items-center justify-center gap-2 border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            {deletingTopic ? (
              <>
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
                Deleting…
              </>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </Modal>
    </div>
  )
}
