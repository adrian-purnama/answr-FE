import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import toast from 'react-hot-toast'
import { Copy, Headset, Plus, Trash2 } from 'lucide-react'
import LiveAgentAvatar from '#/components/liveAgent/LiveAgentAvatar'
import LiveAgentDrawer from '#/components/liveAgent/LiveAgentDrawer'
import PasswordInput from '#/components/forms/PasswordInput'
import Modal from '#/components/ui/Modal'
import { usePlan } from '#/context/planContext'
import {
  createLiveAgent,
  deleteLiveAgent,
  getLiveAgentSettings,
  listLiveAgents,
  LIVE_AGENT_RESILIENCE_OPTIONS,
  resetLiveAgentPassword,
  updateLiveAgent,
  updateLiveAgentSettings,
  uploadLiveAgentAvatar,
  type LiveAgent,
  type LiveAgentResilience,
  type LiveAgentSettings,
} from '#/lib/liveAgent'
import {
  buttonClassName,
  buttonOutlineClassName,
  hintClassName,
  inputClassName,
  inputClassNameCompact,
  projectSectionClassName,
} from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

type LiveAgentSectionProps = {
  apiKeyId: string
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

export default function LiveAgentSection({ apiKeyId }: LiveAgentSectionProps) {
  const { plan } = usePlan()
  const planAllows = plan?.liveAgent === true
  const maxLiveAgents = plan?.maxLiveAgents ?? 0

  const [items, setItems] = useState<LiveAgent[]>([])
  const [settings, setSettings] = useState<LiveAgentSettings | null>(null)
  const [loading, setLoading] = useState(planAllows)
  const [saving, setSaving] = useState(false)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [notifyEmailDraft, setNotifyEmailDraft] = useState('')
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [selected, setSelected] = useState<LiveAgent | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const [showCreate, setShowCreate] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<LiveAgent | null>(null)

  const atLimit = items.length >= maxLiveAgents
  const resilienceHint =
    LIVE_AGENT_RESILIENCE_OPTIONS.find(
      (option) => option.value === settings?.resilience,
    )?.hint ?? ''

  const load = useCallback(async () => {
    if (!planAllows) {
      setItems([])
      setSettings(null)
      setNotifyEmailDraft('')
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [agentsResponse, settingsResponse] = await Promise.all([
        listLiveAgents(apiKeyId),
        getLiveAgentSettings(apiKeyId),
      ])
      if (!agentsResponse.success || !agentsResponse.data) {
        toast.error(agentsResponse.message || 'Failed to load live agents')
        return
      }
      setItems(agentsResponse.data)
      if (!settingsResponse.success || !settingsResponse.data) {
        toast.error(settingsResponse.message || 'Failed to load settings')
        return
      }
      setSettings(settingsResponse.data)
      setNotifyEmailDraft(settingsResponse.data.notifyEmail ?? '')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to load live agents',
      )
    } finally {
      setLoading(false)
    }
  }, [apiKeyId, planAllows])

  useEffect(() => {
    void load()
  }, [load])

  function openAgent(item: LiveAgent) {
    setSelected(item)
    setDrawerOpen(true)
  }

  async function handleToggleProjectEnabled() {
    if (!settings) return
    setSettingsSaving(true)
    try {
      const response = await updateLiveAgentSettings(apiKeyId, {
        enabled: !settings.enabled,
      })
      if (!response.success || !response.data) {
        toast.error(response.message || 'Failed to update settings')
        return
      }
      setSettings(response.data)
      setNotifyEmailDraft(response.data.notifyEmail ?? '')
      toast.success(
        response.data.enabled
          ? 'Live agent enabled for this project'
          : 'Live agent disabled for this project',
      )
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update settings',
      )
    } finally {
      setSettingsSaving(false)
    }
  }

  async function handleResilienceChange(resilience: LiveAgentResilience) {
    if (!settings || settings.resilience === resilience) return
    setSettingsSaving(true)
    try {
      const response = await updateLiveAgentSettings(apiKeyId, { resilience })
      if (!response.success || !response.data) {
        toast.error(response.message || 'Failed to update resilience')
        return
      }
      setSettings(response.data)
      setNotifyEmailDraft(response.data.notifyEmail ?? '')
      toast.success('Resilience updated')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update resilience',
      )
    } finally {
      setSettingsSaving(false)
    }
  }

  async function handleNotifyEmailSave() {
    if (!settings) return
    const next = notifyEmailDraft.trim().toLowerCase()
    if (next === (settings.notifyEmail ?? '').trim().toLowerCase()) return
    setSettingsSaving(true)
    try {
      const response = await updateLiveAgentSettings(apiKeyId, {
        notifyEmail: next,
      })
      if (!response.success || !response.data) {
        toast.error(response.message || 'Failed to update notify email')
        return
      }
      setSettings(response.data)
      setNotifyEmailDraft(response.data.notifyEmail ?? '')
      toast.success('Notify email updated')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update notify email',
      )
    } finally {
      setSettingsSaving(false)
    }
  }

  async function copyJoinCode() {
    if (!settings?.code) return
    try {
      await navigator.clipboard.writeText(settings.code)
      toast.success('Join code copied')
    } catch {
      toast.error('Failed to copy join code')
    }
  }

  async function handleCreate() {
    const name = createName.trim()
    if (!name) {
      toast.error('Name is required')
      return
    }
    if (createPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setSaving(true)
    try {
      const response = await createLiveAgent(apiKeyId, {
        name,
        password: createPassword,
        enabled: true,
      })
      if (!response.success || !response.data) {
        toast.error(response.message || 'Failed to create live agent')
        return
      }
      setItems((prev) => [response.data!, ...prev])
      setShowCreate(false)
      setCreateName('')
      setCreatePassword('')
      openAgent(response.data)
      toast.success('Live agent created')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create live agent',
      )
    } finally {
      setSaving(false)
    }
  }

  async function saveName(name: string) {
    if (!selected) return
    const trimmed = name.trim()
    if (!trimmed) {
      toast.error('Name is required')
      return
    }
    if (trimmed === selected.name) return
    const response = await updateLiveAgent(apiKeyId, selected.id, {
      name: trimmed,
    })
    if (!response.success || !response.data) {
      toast.error(response.message || 'Failed to update name')
      return
    }
    setSelected(response.data)
    setItems((prev) =>
      prev.map((row) => (row.id === response.data!.id ? response.data! : row)),
    )
  }

  async function toggleEnabled() {
    if (!selected) return
    const response = await updateLiveAgent(apiKeyId, selected.id, {
      enabled: !selected.enabled,
    })
    if (!response.success || !response.data) {
      toast.error(response.message || 'Failed to update live agent')
      return
    }
    setSelected(response.data)
    setItems((prev) =>
      prev.map((row) => (row.id === response.data!.id ? response.data! : row)),
    )
  }

  async function handleUploadAvatar(file: File) {
    if (!selected) return
    setUploading(true)
    try {
      const response = await uploadLiveAgentAvatar(apiKeyId, selected.id, file)
      if (!response.success || !response.data) {
        toast.error(response.message || 'Upload failed')
        return
      }
      const next = {
        ...selected,
        profilePicture: response.data.mediaId,
      }
      setSelected(next)
      setItems((prev) => prev.map((row) => (row.id === next.id ? next : row)))
      toast.success('Profile picture updated')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleResetPassword(password: string) {
    if (!selected) return
    const response = await resetLiveAgentPassword(
      apiKeyId,
      selected.id,
      password,
    )
    if (!response.success) {
      toast.error(response.message || 'Failed to reset password')
      return
    }
    toast.success('Password reset')
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const id = deleteTarget.id
      const response = await deleteLiveAgent(apiKeyId, id)
      if (!response.success) {
        toast.error(response.message || 'Failed to delete live agent')
        return
      }
      if (selected?.id === id) {
        setDrawerOpen(false)
        setSelected(null)
      }
      setDeleteTarget(null)
      await load()
      toast.success('Live agent deleted')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className={cn(projectSectionClassName, 'min-w-0 space-y-8')}>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Headset className="size-5 text-[var(--muted)]" aria-hidden />
            <h1 className="text-xl font-semibold text-[var(--ink)]">
              Live Agent
            </h1>
          </div>
          <Link
            to="/liveagent/login"
            target="_blank"
            rel="noreferrer"
            className={cn(
              hintClassName,
              'mt-1 inline-flex underline underline-offset-2 hover:text-[var(--ink)]',
            )}
          >
            Agent sign in
          </Link>
        </div>
        <button
          type="button"
          className={cn(
            buttonClassName,
            'inline-flex h-8 items-center gap-1.5 px-2.5 py-0 text-xs',
          )}
          disabled={
            !planAllows || saving || loading || atLimit || maxLiveAgents === 0
          }
          onClick={() => setShowCreate(true)}
          title={
            !planAllows || maxLiveAgents === 0
              ? 'Live agents are not included in your plan'
              : atLimit
                ? 'Live agent limit reached for your plan'
                : undefined
          }
        >
          <Plus className="size-3.5" aria-hidden />
          New agent
        </button>
      </header>

      {!planAllows ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Your current plan does not include Live Agent.
        </p>
      ) : (
        <>
      {atLimit ? (
        <p className={hintClassName}>
          Plan limit reached ({maxLiveAgents} live agents).
        </p>
      ) : (
        <p className={hintClassName}>
          {items.length} / {maxLiveAgents} used.
        </p>
      )}

      <section className="space-y-0">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pb-5">
          <label
            htmlFor="live-agent-project-enabled"
            className={cn(
              'inline-flex items-center gap-3',
              (!settings || settingsSaving) && 'pointer-events-none opacity-60',
            )}
          >
            <span className="text-sm font-medium text-[var(--ink)]">Enabled</span>
            <span className="relative inline-flex shrink-0">
              <input
                id="live-agent-project-enabled"
                type="checkbox"
                className="peer sr-only"
                checked={settings?.enabled ?? false}
                disabled={!settings || settingsSaving}
                onChange={() => void handleToggleProjectEnabled()}
              />
              <span
                className={cn(
                  'block h-6 w-11 rounded-full border border-[var(--line)] bg-[var(--surface)] transition',
                  'peer-checked:border-[var(--ink)] peer-checked:bg-[var(--ink)]',
                  'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--ink)]',
                )}
                aria-hidden
              />
              <span
                className={cn(
                  'pointer-events-none absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition',
                  'peer-checked:translate-x-5',
                )}
                aria-hidden
              />
            </span>
          </label>

          <div className="h-6 w-[.5px] bg-[var(--line)]" />

          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--muted)]">Join code</span>
            <code
              className={cn(
                'rounded-md border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5 font-mono text-sm tracking-wider text-[var(--ink)]',
                !settings && 'animate-pulse',
              )}
            >
              {settings?.code ?? '    '}
            </code>
            <button
              type="button"
              className={cn(
                buttonOutlineClassName,
                'inline-flex h-8 items-center gap-1.5 px-2 text-xs',
              )}
              disabled={!settings?.code}
              onClick={() => void copyJoinCode()}
              aria-label="Copy join code"
            >
              <Copy className="size-3.5" aria-hidden />
              Copy
            </button>
          </div>
        </div>

        <div className="grid gap-4 border-t border-[var(--line)] py-5 lg:grid-cols-2">
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium text-[var(--ink)]">Resilience</p>
              {resilienceHint ? (
                <p className={hintClassName}>{resilienceHint}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {LIVE_AGENT_RESILIENCE_OPTIONS.map((option) => {
                const isSelected = settings?.resilience === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={!settings || settingsSaving}
                    title={option.hint}
                    onClick={() => void handleResilienceChange(option.value)}
                    className={cn(
                      'rounded-md border px-2.5 py-1 text-xs font-medium transition',
                      isSelected
                        ? 'border-[var(--ink)] bg-[var(--ink)] text-white'
                        : 'border-[var(--line)] bg-white text-[var(--ink)] hover:bg-[var(--surface)]',
                      'disabled:opacity-50',
                    )}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium text-[var(--ink)]">
                Notify email
              </p>
              <p className={hintClassName}>
                When a visitor requests a live agent.
              </p>
            </div>
            <div className="flex max-w-sm items-center gap-2">
              <input
                type="email"
                value={notifyEmailDraft}
                onChange={(e) => setNotifyEmailDraft(e.target.value)}
                placeholder="ops@example.com"
                disabled={!settings || settingsSaving}
                className={cn(inputClassNameCompact, 'min-w-0 flex-1')}
              />
              <button
                type="button"
                disabled={
                  !settings ||
                  settingsSaving ||
                  notifyEmailDraft.trim().toLowerCase() ===
                    (settings.notifyEmail ?? '').trim().toLowerCase()
                }
                onClick={() => void handleNotifyEmailSave()}
                className={cn(
                  buttonOutlineClassName,
                  'inline-flex h-8 shrink-0 items-center px-2.5 text-xs disabled:opacity-50',
                )}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="min-w-0 space-y-3 border-t border-[var(--line)] pt-5">
        <h2 className="text-sm font-medium text-[var(--ink)]">Agents</h2>

        {loading ? (
          <p className={hintClassName}>Loading…</p>
        ) : items.length === 0 ? (
          <p className={hintClassName}>
            No live agents yet.
            {maxLiveAgents > 0 ? ' Create one to get started.' : ''}
          </p>
        ) : (
          <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)] border-t-0">
            {items.map((item) => (
              <li key={item.id} className="min-w-0">
                <div className="group flex min-w-0 items-center gap-2">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-3 px-1 py-3 text-left transition hover:bg-[var(--surface)]"
                    onClick={() => openAgent(item)}
                  >
                    <LiveAgentAvatar
                      apiKeyId={apiKeyId}
                      mediaId={item.profilePicture}
                      name={item.name}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--ink)]">
                        {item.name}
                      </p>
                      <p className={hintClassName}>
                        Updated {new Date(item.updatedAt).toLocaleString()}
                      </p>
                    </div>
                    <StatusPill enabled={item.enabled} />
                  </button>
                  <IconAction
                    label={`Delete ${item.name}`}
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
      </section>
        </>
      )}

      <LiveAgentDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        apiKeyId={apiKeyId}
        agent={selected}
        saving={saving}
        uploading={uploading}
        onSaveName={saveName}
        onToggleEnabled={toggleEnabled}
        onUploadAvatar={handleUploadAvatar}
        onResetPassword={handleResetPassword}
        onDelete={() => {
          if (selected) setDeleteTarget(selected)
        }}
      />

      <Modal
        open={showCreate}
        onClose={() => {
          if (!saving) {
            setShowCreate(false)
            setCreateName('')
            setCreatePassword('')
          }
        }}
        title="New live agent"
      >
        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm text-[var(--ink)]">Name</span>
            <input
              className={inputClassName}
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="e.g. Support agent"
              autoFocus
              disabled={saving}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm text-[var(--ink)]">Password</span>
            <PasswordInput
              id="live-agent-create-password"
              value={createPassword}
              onChange={setCreatePassword}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className={inputClassName}
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className={buttonOutlineClassName}
              disabled={saving}
              onClick={() => {
                setShowCreate(false)
                setCreateName('')
                setCreatePassword('')
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
              {saving ? 'Creating…' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={deleteTarget !== null}
        onClose={() => {
          if (!deleting) setDeleteTarget(null)
        }}
        title="Delete live agent"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--ink)]">
            Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
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
              onClick={() => void handleDelete()}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
