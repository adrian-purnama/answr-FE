import { useCallback, useEffect, useState, type ReactNode } from 'react'
import toast from 'react-hot-toast'
import { FileText, LoaderCircle, Plus, Trash2 } from 'lucide-react'
import GuidanceDrawer from '#/components/guidance/GuidanceDrawer'
import Modal from '#/components/ui/Modal'
import { usePlan } from '#/context/planContext'
import {
  createGuidance,
  deleteGuidance,
  GUIDANCE_TITLE_MAX,
  listGuidances,
  updateGuidance,
  type Guidance,
} from '#/lib/guidance'
import {
  buttonClassName,
  buttonOutlineClassName,
  cardClassName,
  hintClassName,
  inputClassName,
  projectSectionClassName,
} from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

type GuidanceSectionProps = {
  apiKeyId: string
  openGuidanceId?: string
  onOpenRequestConsumed?: () => void
}

function GuidanceSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className={cn(cardClassName, 'animate-pulse p-5')}>
          <div className="mb-3 h-4 w-40 bg-[var(--surface)]" />
          <div className="h-3 w-3/4 bg-[var(--surface)]" />
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

export default function GuidanceSection({
  apiKeyId,
  openGuidanceId,
  onOpenRequestConsumed,
}: GuidanceSectionProps) {
  const { plan } = usePlan()
  const maxGuidances = plan?.maxGuidances ?? 10
  const maxCharacters = plan?.maxCharactersPerGuidance ?? 2000

  const [items, setItems] = useState<Guidance[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [selected, setSelected] = useState<Guidance | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [contentDraft, setContentDraft] = useState('')

  const [showCreate, setShowCreate] = useState(false)
  const [createTitle, setCreateTitle] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Guidance | null>(null)

  const atLimit = items.length >= maxGuidances

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await listGuidances(apiKeyId)
      if (!response.success || !response.data) {
        toast.error(response.message || 'Failed to load guidances')
        return
      }
      setItems(response.data)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to load guidances',
      )
    } finally {
      setLoading(false)
    }
  }, [apiKeyId])

  useEffect(() => {
    void load()
  }, [load])

  function openGuidance(item: Guidance) {
    setSelected(item)
    setContentDraft(item.content)
    setDrawerOpen(true)
  }

  useEffect(() => {
    if (!openGuidanceId) return
    if (loading) return

    const item = items.find((guidance) => guidance.id === openGuidanceId)
    if (!item) {
      toast.error('Guidance not found')
      onOpenRequestConsumed?.()
      return
    }

    openGuidance(item)
    onOpenRequestConsumed?.()
    // Intentionally keyed to open request id + load state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openGuidanceId, loading, items])

  async function handleCreate() {
    const title = createTitle.trim()
    if (!title) {
      toast.error('Title is required')
      return
    }
    setSaving(true)
    try {
      const response = await createGuidance(apiKeyId, {
        title,
        content: '',
      })
      if (!response.success || !response.data) {
        toast.error(response.message || 'Failed to create guidance')
        return
      }
      setCreateTitle('')
      setShowCreate(false)
      await load()
      toast.success('Guidance created')
      openGuidance(response.data)
    } finally {
      setSaving(false)
    }
  }

  async function saveTitle(title: string) {
    if (!selected || !selected.enabled) return
    const trimmed = title.trim()
    if (!trimmed || trimmed === selected.title) return
    const response = await updateGuidance(apiKeyId, selected.id, {
      title: trimmed,
    })
    if (!response.success || !response.data) {
      toast.error(response.message || 'Failed to update title')
      return
    }
    setSelected(response.data)
    setItems((prev) =>
      prev.map((row) => (row.id === response.data!.id ? response.data! : row)),
    )
  }

  async function saveContent(content: string) {
    if (!selected || !selected.enabled) return
    if (content.length > maxCharacters) {
      toast.error(`Character limit reached (${maxCharacters} per guidance)`)
      return
    }
    if (content === selected.content) return
    const response = await updateGuidance(apiKeyId, selected.id, { content })
    if (!response.success || !response.data) {
      toast.error(response.message || 'Failed to update content')
      return
    }
    setSelected(response.data)
    setContentDraft(response.data.content)
    setItems((prev) =>
      prev.map((row) => (row.id === response.data!.id ? response.data! : row)),
    )
  }

  async function toggleEnabled() {
    if (!selected) return
    const enabled = !selected.enabled
    const response = await updateGuidance(apiKeyId, selected.id, { enabled })
    if (!response.success || !response.data) {
      toast.error(response.message || 'Failed to update guidance')
      return
    }
    setSelected(response.data)
    setContentDraft(response.data.content)
    setItems((prev) =>
      prev.map((row) => (row.id === response.data!.id ? response.data! : row)),
    )
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const id = deleteTarget.id
      const response = await deleteGuidance(apiKeyId, id)
      if (!response.success) {
        toast.error(response.message || 'Failed to delete guidance')
        return
      }
      if (selected?.id === id) {
        setDrawerOpen(false)
        setSelected(null)
      }
      setDeleteTarget(null)
      await load()
      toast.success('Guidance deleted')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className={cn(projectSectionClassName, 'min-w-0 max-w-full overflow-x-hidden')}>
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-medium text-[var(--ink)]">Guidance</h1>
          <p className={cn(hintClassName, 'mt-1')}>
            Tone and instructions always included when the agent runs for this
            project.
          </p>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            className={cn(
              buttonClassName,
              'inline-flex h-8 items-center gap-1.5 px-2.5 py-0 text-xs',
            )}
            disabled={saving || atLimit}
            onClick={() => setShowCreate(true)}
          >
            <Plus className="size-3.5" aria-hidden />
            New
          </button>
        )}
      </div>

      {atLimit && (
        <p className={cn(hintClassName, 'mt-3')}>
          Plan limit reached ({maxGuidances} guidances).
        </p>
      )}

      <div className="mt-8 min-w-0 max-w-full">
        {loading ? (
          <GuidanceSkeleton />
        ) : items.length === 0 ? (
          <div
            className={cn(cardClassName, 'flex flex-col items-start gap-4 p-8')}
          >
            <FileText className="size-8 text-[var(--muted)]" aria-hidden />
            <div>
              <p className="text-lg font-medium">No guidance yet</p>
              <p className={cn(hintClassName, 'mt-1')}>
                Add tone, style, or other standing instructions for the agent.
              </p>
            </div>
            <button
              type="button"
              className={cn(
                buttonClassName,
                'inline-flex h-8 items-center gap-1.5 px-2.5 py-0 text-xs',
              )}
              disabled={saving || atLimit}
              onClick={() => setShowCreate(true)}
            >
              <Plus className="size-3.5" aria-hidden />
              New guidance
            </button>
          </div>
        ) : (
          <ul className="min-w-0 max-w-full space-y-2">
            {items.map((item) => (
              <li key={item.id} className="min-w-0 max-w-full">
                <div
                  className={cn(
                    'group flex min-w-0 max-w-full items-center gap-3 border-b border-[var(--line)] px-1 py-4 transition',
                    'hover:bg-[var(--surface)]/60',
                  )}
                >
                  <button
                    type="button"
                    className="w-0 min-w-0 flex-1 overflow-hidden text-left"
                    onClick={() => openGuidance(item)}
                  >
                    <span className="flex min-w-0 max-w-full items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-[15px] font-medium">
                        {item.title}
                      </span>
                      <span className="shrink-0">
                        <StatusPill enabled={item.enabled} />
                      </span>
                    </span>
                    {item.content ? (
                      <span className="mt-1 block max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm text-[var(--muted)]">
                        {item.content}
                      </span>
                    ) : null}
                    <span className="mt-1 block max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs text-[var(--muted)]">
                      Updated {new Date(item.updatedAt).toLocaleString()}
                      {item.updatedBy ? ` by ${item.updatedBy}` : ''}
                    </span>
                  </button>
                  <IconAction
                    label={`Delete ${item.title}`}
                    danger
                    onClick={() => setDeleteTarget(item)}
                  >
                    <Trash2 className="size-4" />
                  </IconAction>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <GuidanceDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        apiKeyId={apiKeyId}
        guidance={selected}
        contentDraft={contentDraft}
        onContentDraftChange={setContentDraft}
        maxCharacters={maxCharacters}
        onSaveTitle={saveTitle}
        onSaveContent={saveContent}
        onToggleEnabled={toggleEnabled}
        onDelete={() => {
          if (selected) setDeleteTarget(selected)
        }}
      />

      <Modal
        open={showCreate}
        onClose={() => {
          if (!saving) {
            setShowCreate(false)
            setCreateTitle('')
          }
        }}
        title="New guidance"
      >
        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm text-[var(--ink)]">Title</span>
            <input
              id="new-guidance-title"
              className={inputClassName}
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              placeholder="Tone of voice"
              maxLength={GUIDANCE_TITLE_MAX}
              autoFocus
              disabled={saving}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleCreate()
              }}
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
        open={deleteTarget !== null}
        onClose={() => {
          if (!deleting) setDeleteTarget(null)
        }}
        title="Delete guidance"
      >
        <p className={hintClassName}>
          Delete &quot;{deleteTarget?.title}&quot;? This cannot be undone.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className={cn(buttonClassName, 'bg-red-600 hover:bg-red-700')}
            disabled={deleting}
            onClick={() => void handleDelete()}
          >
            {deleting ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              'Delete'
            )}
          </button>
          <button
            type="button"
            className={buttonOutlineClassName}
            disabled={deleting}
            onClick={() => setDeleteTarget(null)}
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  )
}
