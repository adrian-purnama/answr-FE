import { useCallback, useEffect, useState, type ReactNode } from 'react'
import toast from 'react-hot-toast'
import { LoaderCircle, Plus, RefreshCw, StickyNote, Trash2 } from 'lucide-react'
import SnippetDrawer from '#/components/articles/SnippetDrawer'
import TopicRichEditor from '#/components/articles/TopicRichEditor'
import Modal from '#/components/ui/Modal'
import { usePlan } from '#/context/planContext'
import {
  createSnippet,
  deleteSnippet,
  listSnippets,
  resyncSnippets,
  topicContentToEditorBlocks,
  updateSnippet,
  type Snippet,
} from '#/lib/snippet'
import { TOPIC_NAME_MAX, type TopicSyncStatus } from '#/lib/article'
import {
  buttonClassName,
  buttonOutlineClassName,
  cardClassName,
  hintClassName,
  inputClassName,
  projectSectionClassName,
} from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

type SnippetsSectionProps = {
  apiKeyId: string
  /** When true, page chrome (title/padding) is provided by the parent. */
  embedded?: boolean
  openSnippetId?: string
  onOpenRequestConsumed?: () => void
}

function SnippetsSkeleton() {
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

function SyncPill({ status }: { status: TopicSyncStatus }) {
  const label =
    status === 'synced'
      ? 'Synced'
      : status === 'failed'
        ? 'Failed'
        : status === 'in-progress'
          ? 'Syncing'
          : 'Not synced'
  const tone =
    status === 'synced'
      ? 'bg-emerald-50 text-emerald-800'
      : status === 'failed'
        ? 'bg-red-50 text-red-700'
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

export default function SnippetsSection({
  apiKeyId,
  embedded = false,
  openSnippetId,
  onOpenRequestConsumed,
}: SnippetsSectionProps) {
  const { plan } = usePlan()
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resyncing, setResyncing] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [createTitle, setCreateTitle] = useState('')
  const [selected, setSelected] = useState<Snippet | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Snippet | null>(null)
  const [deleting, setDeleting] = useState(false)

  const maxSnippets = plan?.maxSnippets ?? 50
  const maxCharacters = plan?.maxCharactersPerSnippet ?? 5000
  const maxImages = plan?.maxImagesPerSnippet ?? 10
  const atLimit = snippets.length >= maxSnippets
  const editable = Boolean(selected?.enabled)

  const load = useCallback(async () => {
    const response = await listSnippets(apiKeyId)
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to load snippets')
    }
    setSnippets(response.data)
    return response.data
  }, [apiKeyId])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        await load()
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error ? error.message : 'Failed to load snippets',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [load])

  function openSnippet(snippet: Snippet) {
    setSelected(snippet)
    setDrawerOpen(true)
  }

  useEffect(() => {
    if (!openSnippetId || loading) return
    const match = snippets.find((s) => s.id === openSnippetId)
    if (!match) return
    openSnippet(match)
    onOpenRequestConsumed?.()
    // Intentionally keyed only to open request id from the route.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openSnippetId, loading])

  async function handleCreate() {
    const topicName = createTitle.trim()
    if (!topicName) {
      toast.error('Title is required')
      return
    }
    if (atLimit) {
      toast.error(`Snippet limit reached (${maxSnippets})`)
      return
    }
    setSaving(true)
    try {
      const response = await createSnippet(apiKeyId, {
        topicName,
        topicContent: '',
      })
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create snippet')
      }
      setCreateTitle('')
      setShowCreate(false)
      await load()
      toast.success('Snippet created')
      openSnippet(response.data)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create snippet',
      )
    } finally {
      setSaving(false)
    }
  }

  async function saveSnippet(
    id: string,
    patch: {
      topicName?: string
      topicContent?: Parameters<typeof updateSnippet>[2]['topicContent']
      enabled?: boolean
    },
  ) {
    setSaving(true)
    try {
      const response = await updateSnippet(apiKeyId, id, patch)
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update snippet')
      }
      setSnippets((prev) =>
        prev.map((item) => (item.id === id ? response.data! : item)),
      )
      setSelected((prev) =>
        prev?.id === id ? response.data! : prev,
      )
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update snippet',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleResyncAll() {
    setResyncing(true)
    try {
      const response = await resyncSnippets(apiKeyId)
      if (!response.success) {
        throw new Error(response.message || 'Failed to resync snippets')
      }
      const next = await load()
      if (selected) {
        const refreshed = next.find((s) => s.id === selected.id)
        if (refreshed) setSelected(refreshed)
      }
      toast.success('Snippets synced')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to resync snippets',
      )
    } finally {
      setResyncing(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const response = await deleteSnippet(apiKeyId, deleteTarget.id)
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete snippet')
      }
      const deletedId = deleteTarget.id
      setDeleteTarget(null)
      if (selected?.id === deletedId) {
        setDrawerOpen(false)
        setSelected(null)
      }
      await load()
      toast.success('Snippet deleted')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete snippet',
      )
    } finally {
      setDeleting(false)
    }
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
    <div className={cn(!embedded && projectSectionClassName)}>
      <div
        className={cn(
          'mb-6 flex flex-wrap items-center justify-between gap-3',
          !embedded && 'items-end',
        )}
      >
        {!embedded ? (
          <div>
            <h2 className="text-lg font-semibold text-[var(--ink)]">Snippets</h2>
            <p className={hintClassName}>
              Standalone knowledge units synced to the vector store for
              retrieval.
            </p>
          </div>
        ) : (
          <p className={cn(hintClassName, 'min-w-0')}>
            {snippets.length} snippet{snippets.length === 1 ? '' : 's'}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          {snippets.length > 0 ? (
            <button
              type="button"
              className={toolbarBtn}
              disabled={resyncing || loading}
              onClick={() => void handleResyncAll()}
            >
              {resyncing ? (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              Sync
            </button>
          ) : null}
          <button
            type="button"
            className={toolbarBtnPrimary}
            disabled={saving || atLimit}
            onClick={() => setShowCreate(true)}
          >
            <Plus className="size-3.5" />
            New
          </button>
        </div>
      </div>

      {atLimit ? (
        <p className={cn(hintClassName, 'mb-4')}>
          Snippet limit reached ({maxSnippets}).
        </p>
      ) : null}

      {loading ? (
        <SnippetsSkeleton />
      ) : snippets.length === 0 ? (
        <div
          className={cn(cardClassName, 'flex flex-col items-start gap-4 p-8')}
        >
          <StickyNote className="size-8 text-[var(--muted)]" aria-hidden />
          <div>
            <p className="text-lg font-medium">No snippets yet</p>
            <p className={cn(hintClassName, 'mt-1')}>
              Create a snippet to add standalone knowledge for the agent.
            </p>
          </div>
          <button
            type="button"
            className={toolbarBtnPrimary}
            disabled={saving || atLimit}
            onClick={() => setShowCreate(true)}
          >
            <Plus className="size-3.5" aria-hidden />
            New snippet
          </button>
        </div>
      ) : (
        <ul className="min-w-0 max-w-full space-y-2">
          {snippets.map((snippet) => (
            <li key={snippet.id} className="min-w-0 max-w-full">
              <div
                className={cn(
                  'group flex min-w-0 max-w-full items-center gap-3 border-b border-[var(--line)] px-1 py-4 transition',
                  'hover:bg-[var(--surface)]/60',
                )}
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => openSnippet(snippet)}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-medium text-[var(--ink)]">
                      {snippet.topicName}
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1.5">
                      <SyncPill status={snippet.isSynced} />
                      <StatusPill enabled={snippet.enabled} />
                    </span>
                  </span>
                  <span className="mt-1 block max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs text-[var(--muted)]">
                    Updated {new Date(snippet.updatedAt).toLocaleString()}
                    {snippet.updatedBy
                      ? ` by ${snippet.updatedBy}`
                      : ''}
                  </span>
                </button>
                <IconAction
                  label={`Delete ${snippet.topicName}`}
                  danger
                  onClick={() => setDeleteTarget(snippet)}
                >
                  <Trash2 className="size-4" />
                </IconAction>
              </div>
            </li>
          ))}
        </ul>
      )}

      <SnippetDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        createdAt={selected?.createdAt}
        updatedAt={selected?.updatedAt}
        createdBy={selected?.createdBy}
        updatedBy={selected?.updatedBy}
        enabled={selected?.enabled}
        syncStatus={selected?.isSynced}
        detailActions={
          selected ? (
            <>
              <button
                type="button"
                className={cn(
                  buttonOutlineClassName,
                  'w-full text-xs',
                  !selected.enabled &&
                    'bg-[var(--surface)] text-[var(--ink)]',
                )}
                disabled={saving}
                onClick={() =>
                  void saveSnippet(selected.id, {
                    enabled: !selected.enabled,
                  })
                }
              >
                {selected.enabled ? 'Disable' : 'Enable'}
              </button>
              <button
                type="button"
                className={cn(
                  buttonOutlineClassName,
                  'w-full text-xs text-red-600 hover:bg-red-50 hover:text-red-700',
                )}
                disabled={saving}
                onClick={() => setDeleteTarget(selected)}
              >
                <Trash2 className="mr-1.5 inline size-3.5" aria-hidden />
                Delete snippet
              </button>
            </>
          ) : null
        }
      >
        {selected ? (
          <div
            className={cn(
              'min-w-0 overflow-x-hidden break-words',
              !editable && 'opacity-90',
            )}
          >
            {!editable ? (
              <p className="mb-8 rounded-md bg-[var(--surface)] px-3 py-2 text-sm text-[var(--muted)]">
                This snippet is disabled    content is read-only. Enable it to
                edit.
              </p>
            ) : null}

            {editable ? (
              <input
                aria-label="Snippet title"
                className={cn(
                  'w-full min-w-0 border-0 bg-transparent p-0 text-3xl font-semibold tracking-tight text-[var(--ink)] outline-none',
                  'placeholder:text-[var(--muted)]/50',
                )}
                defaultValue={selected.topicName}
                key={`${selected.id}-title-${selected.topicName}`}
                placeholder="Untitled snippet"
                maxLength={TOPIC_NAME_MAX}
                onBlur={(e) => {
                  const topicName = e.target.value.trim()
                  if (topicName && topicName !== selected.topicName) {
                    void saveSnippet(selected.id, { topicName })
                  }
                }}
              />
            ) : (
              <h1 className="break-words text-3xl font-semibold tracking-tight text-[var(--ink)]">
                {selected.topicName}
              </h1>
            )}

            <div className="mt-8 min-w-0 overflow-x-hidden">
              <TopicRichEditor
                content={topicContentToEditorBlocks(selected.topicContent)}
                contentKey={`${selected.id}-${selected.updatedAt}`}
                apiKeyId={apiKeyId}
                maxImages={maxImages}
                maxCharacters={maxCharacters}
                canEdit={editable}
                placeholder="Write snippet knowledge…"
                onImageLimit={() =>
                  toast.error(`Image limit reached (${maxImages} per snippet)`)
                }
                onImageTooLarge={() =>
                  toast.error('Image must be 5MB or smaller')
                }
                onCharacterLimit={() =>
                  toast.error(
                    `Character limit reached (${maxCharacters} per snippet)`,
                  )
                }
                onSave={(payload) =>
                  void saveSnippet(selected.id, {
                    topicContent: payload,
                  })
                }
              />
            </div>
          </div>
        ) : null}
      </SnippetDrawer>

      <Modal
        open={showCreate}
        onClose={() => {
          if (!saving) {
            setShowCreate(false)
            setCreateTitle('')
          }
        }}
        title="New snippet"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm text-[var(--ink)]">Title</span>
            <input
              id="new-snippet-title"
              className={inputClassName}
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              placeholder="Product FAQ snippet"
              maxLength={TOPIC_NAME_MAX}
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
        open={Boolean(deleteTarget)}
        onClose={() => {
          if (!deleting) setDeleteTarget(null)
        }}
        title="Delete snippet"
      >
        <p className="text-sm text-[var(--muted)]">
          Delete “{deleteTarget?.topicName}”? This removes its vectors from the
          knowledge store.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className={buttonOutlineClassName}
            disabled={deleting}
            onClick={() => setDeleteTarget(null)}
          >
            Cancel
          </button>
          <button
            type="button"
            className={cn(buttonClassName, 'bg-red-600 hover:bg-red-700')}
            disabled={deleting}
            onClick={() => void confirmDelete()}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
