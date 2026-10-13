import type { FormEvent } from 'react'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from '@tanstack/react-router'
import {
  BookOpen,
  ChevronRight,
  Copy,
  Eye,
  Flame,
  KeyRound,
  LoaderCircle,
  MessageSquare,
  Newspaper,
  Pencil,
  Trash2,
} from 'lucide-react'
import MetricCard from '#/components/analyze/MetricCard'
import Modal from '#/components/ui/Modal'
import { apiFetch } from '#/lib/api'
import type { ApiKey, CreatedApiKey } from '#/lib/apiKey'
import {
  API_KEY_DESCRIPTION_MAX,
  API_KEY_LABEL_MAX,
  formatApiKeyStatusLabel,
  parseIpAllowlist,
} from '#/lib/apiKey'
import {
  getDashboardOverview,
  type DashboardOverview,
} from '#/lib/user'
import {
  buttonClassName,
  buttonOutlineClassName,
  cardClassName,
  hintClassName,
  inputClassName,
} from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

function isOwner(key: ApiKey): boolean {
  return key.role !== 'collaborator'
}

function statusBadgeClass(status: ApiKey['status']): string {
  switch (status) {
    case 'active':
      return 'border-emerald-600/30 bg-emerald-50 text-emerald-800'
    case 'disabled_plan':
      return 'border-amber-600/40 bg-amber-50 text-amber-900'
    case 'revoked':
      return 'border-red-600/30 bg-red-50 text-red-800'
  }
}

function ProjectKeyCard({
  keyItem,
  onEdit,
  onRevoke,
}: {
  keyItem: ApiKey
  onEdit: (key: ApiKey) => void
  onRevoke: (key: ApiKey) => void
}) {
  const owner = isOwner(keyItem)
  const disabledByPlan = keyItem.status === 'disabled_plan'
  const actionClassName =
    'inline-flex items-center gap-1.5 px-3 py-2 text-sm transition hover:text-[var(--ink)]'
  return (
    <li
      className={cn(
        cardClassName,
        'flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between',
        disabledByPlan && 'border-amber-300/80 bg-amber-50/40',
        keyItem.status === 'revoked' && 'opacity-70',
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-[var(--ink)]">{keyItem.label}</p>
          <span
            className={cn(
              'inline-flex items-center rounded-[var(--radius-sm)] border px-2 py-0.5 text-xs font-medium',
              statusBadgeClass(keyItem.status),
            )}
          >
            {formatApiKeyStatusLabel(keyItem.status)}
          </span>
        </div>
        {disabledByPlan ? (
          <p className="mt-1 text-sm text-amber-900/80">
            Over your plan’s API key limit   upgrade or revoke other keys to
            re-enable.
          </p>
        ) : null}
        {keyItem.description ? (
          <p className={`mt-1 text-sm ${hintClassName} line-clamp-2`}>
            {keyItem.description}
          </p>
        ) : null}
        {owner ? (
          <>
            <p className={`mt-2 font-mono text-sm ${hintClassName}`}>
              {keyItem.prefix}…
            </p>
            {/* Last used / IP allowlist   hidden for now
            <p className={`mt-2 ${hintClassName}`}>
              {keyItem.lastUsedAt
                ? `Last used ${new Date(keyItem.lastUsedAt).toLocaleString()}`
                : 'Never used'}
            </p>
            <p className={`mt-1 text-xs ${hintClassName}`}>
              IP allowlist: {formatIpAllowlistSummary(keyItem.ipAllowlist)}
            </p>
            */}
          </>
        ) : (
          <p className={`mt-2 text-sm ${hintClassName}`}>Shared with you</p>
        )}
      </div>
      <div className="flex shrink-0 items-center divide-x divide-[var(--line)]">
        {owner ? (
          <>
            <button
              type="button"
              onClick={() => onEdit(keyItem)}
              className={cn(actionClassName, 'text-[var(--muted)]')}
            >
              <Pencil className="size-3.5" aria-hidden />
              Edit
            </button>
            <button
              type="button"
              onClick={() => onRevoke(keyItem)}
              className={cn(actionClassName, 'text-red-600 hover:text-red-700')}
            >
              <Trash2 className="size-3.5" aria-hidden />
              Revoke
            </button>
          </>
        ) : null}
        <Link
          to="/project/$id/analyze/overview"
          params={{ id: keyItem.id }}
          className={cn(actionClassName, 'text-[var(--muted)]')}
          aria-label={`Open ${keyItem.label}`}
        >
          <ChevronRight className="size-5" aria-hidden />
        </Link>
      </div>
    </li>
  )
}

function ApiKeysSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1].map((i) => (
        <div
          key={i}
          className={cn(cardClassName, 'animate-pulse p-5')}
        >
          <div className="mb-3 h-4 w-32 bg-[var(--surface)]" />
          <div className="mb-2 h-3 w-48 bg-[var(--surface)]" />
          <div className="h-3 w-24 bg-[var(--surface)]" />
        </div>
      ))}
    </div>
  )
}

function OverviewStrip({ overview }: { overview: DashboardOverview }) {
  const hottest = overview.hottestApiKeyId
    ? overview.projects.find((p) => p.apiKeyId === overview.hottestApiKeyId)
    : null

  return (
    <div className="mb-6 space-y-3 border-b border-[var(--line)] pb-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-[var(--ink)]">Overview</p>
        <p className={`text-xs ${hintClassName}`}>
          Last {overview.lookbackDays} days
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          icon={Eye}
          label="Visits"
          value={overview.totals.visits}
        />
        <MetricCard
          icon={MessageSquare}
          tone="accent"
          label="Chats"
          value={overview.totals.chatUsed}
        />
        <MetricCard
          icon={BookOpen}
          tone="accent"
          label="FAQ views"
          value={overview.totals.faqViews}
        />
        <MetricCard
          icon={Newspaper}
          label="News views"
          value={overview.totals.newsViews}
        />
      </div>
      <p className={`flex items-center gap-1.5 text-sm ${hintClassName}`}>
        {hottest ? (
          <>
            <Flame className="size-4 shrink-0 text-orange-500" aria-hidden />
            <span className="font-medium text-[var(--ink)]">{hottest.label}</span>
          </>
        ) : (
          <>No visits in this period</>
        )}
      </p>
    </div>
  )
}

export default function ApiKeysSection() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState<ApiKey | null>(null)
  const [createdKey, setCreatedKey] = useState<CreatedApiKey | null>(null)
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null)
  const [revokeConfirmLabel, setRevokeConfirmLabel] = useState('')

  const [label, setLabel] = useState('')
  const [description, setDescription] = useState('')
  const [ipAllowlistText, setIpAllowlistText] = useState('')

  const loadKeys = useCallback(async () => {
    const response = await apiFetch<ApiKey[]>('/api-keys')
    if (!response.success) {
      throw new Error(response.message || 'Failed to load API keys')
    }
    setKeys(response.data)
  }, [])

  const loadOverview = useCallback(async () => {
    const response = await getDashboardOverview()
    if (!response.success) {
      throw new Error(response.message || 'Failed to load dashboard overview')
    }
    setOverview(response.data)
  }, [])

  useEffect(() => {
    void (async () => {
      try {
        await Promise.all([loadKeys(), loadOverview()])
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to load dashboard',
        )
      } finally {
        setLoading(false)
      }
    })()
  }, [loadKeys, loadOverview])

  function openCreate() {
    setShowEdit(null)
    setCreatedKey(null)
    closeRevoke()
    setLabel('')
    setDescription('')
    setIpAllowlistText('0.0.0.0')
    setShowCreate(true)
  }

  function openEdit(key: ApiKey) {
    setShowCreate(false)
    setCreatedKey(null)
    closeRevoke()
    setLabel(key.label)
    setDescription(key.description)
    setIpAllowlistText(key.ipAllowlist.join('\n'))
    setShowEdit(key)
  }

  function openRevoke(key: ApiKey) {
    setShowCreate(false)
    setShowEdit(null)
    setCreatedKey(null)
    setRevokeConfirmLabel('')
    setRevokeTarget(key)
  }

  function closeRevoke() {
    setRevokeTarget(null)
    setRevokeConfirmLabel('')
  }

  function closeFormModal() {
    setShowCreate(false)
    setShowEdit(null)
    setLabel('')
    setDescription('')
    setIpAllowlistText('')
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!label.trim()) {
      toast.error('Label is required')
      return
    }
    if (label.trim().length > API_KEY_LABEL_MAX) {
      toast.error(`Label must be at most ${API_KEY_LABEL_MAX} characters`)
      return
    }
    if (description.trim().length > API_KEY_DESCRIPTION_MAX) {
      toast.error(`Description must be at most ${API_KEY_DESCRIPTION_MAX} characters`)
      return
    }

    setSaving(true)
    try {
      const response = await apiFetch<CreatedApiKey>('/api-keys', {
        method: 'POST',
        body: JSON.stringify({
          label: label.trim(),
          description: description.trim(),
          ipAllowlist: parseIpAllowlist(ipAllowlistText),
        }),
      })

      if (!response.success) {
        toast.error(response.message || 'Failed to create API key')
        return
      }

      setShowCreate(false)
      setLabel('')
      setDescription('')
      setIpAllowlistText('')
      setCreatedKey(response.data)
      await Promise.all([loadKeys(), loadOverview()])
      toast.success('API key created')
    } catch {
      toast.error('Unable to reach the server')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!showEdit) return
    if (!label.trim()) {
      toast.error('Label is required')
      return
    }
    if (label.trim().length > API_KEY_LABEL_MAX) {
      toast.error(`Label must be at most ${API_KEY_LABEL_MAX} characters`)
      return
    }
    if (description.trim().length > API_KEY_DESCRIPTION_MAX) {
      toast.error(`Description must be at most ${API_KEY_DESCRIPTION_MAX} characters`)
      return
    }

    setSaving(true)
    try {
      const response = await apiFetch<ApiKey>(`/api-keys/${showEdit.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          label: label.trim(),
          description: description.trim(),
          ipAllowlist: parseIpAllowlist(ipAllowlistText),
        }),
      })

      if (!response.success) {
        toast.error(response.message || 'Failed to update API key')
        return
      }

      await Promise.all([loadKeys(), loadOverview()])
      closeFormModal()
      toast.success('API key updated')
    } catch {
      toast.error('Unable to reach the server')
    } finally {
      setSaving(false)
    }
  }

  async function handleRevoke() {
    if (!revokeTarget) return
    if (revokeConfirmLabel.trim() !== revokeTarget.label) {
      toast.error('Type the project name exactly to confirm')
      return
    }

    setRevokingId(revokeTarget.id)
    try {
      const response = await apiFetch<ApiKey>(`/api-keys/${revokeTarget.id}`, {
        method: 'DELETE',
      })

      if (!response.success) {
        toast.error(response.message || 'Failed to revoke API key')
        return
      }

      closeRevoke()
      await Promise.all([loadKeys(), loadOverview()])
      toast.success('API key revoked')
    } catch {
      toast.error('Unable to reach the server')
    } finally {
      setRevokingId(null)
    }
  }

  async function copyKey(value: string) {
    try {
      await navigator.clipboard.writeText(value)
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Failed to copy')
    }
  }

  const ownedKeys = keys.filter(isOwner)
  const sharedKeys = keys.filter((key) => !isOwner(key))
  const canConfirmRevoke =
    revokeTarget !== null &&
    revokeConfirmLabel.trim() === revokeTarget.label

  return (
    <section className="mt-6">
      {!loading && overview ? <OverviewStrip overview={overview} /> : null}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-medium">Projects</h2>
          <p className={`mt-1 ${hintClassName}`}>
            Your workspaces and projects shared with you.
          </p>
        </div>
        {keys.length > 0 ? (
          <button type="button" onClick={openCreate} className={buttonClassName}>
            <KeyRound className="size-4" aria-hidden />
            Create API key
          </button>
        ) : null}
      </div>

      {loading ? (
        <ApiKeysSkeleton />
      ) : keys.length === 0 ? (
        <div className={cn(cardClassName, 'px-6 py-12 text-center')}>
          <KeyRound className="mx-auto mb-4 size-10 text-[var(--muted)]" aria-hidden />
          <h3 className="mb-2 text-lg font-medium text-[var(--ink)]">
            You don&apos;t have an API key yet
          </h3>
          <p className={`mx-auto mb-6 max-w-md ${hintClassName}`}>
            Create an API key to connect your applications to SapAi. You can
            restrict access by IP and revoke keys at any time.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className={cn(buttonClassName, 'px-8 py-3 text-base')}
          >
            <KeyRound className="size-5" aria-hidden />
            Create API key
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div>
            <h3 className="mb-3 text-sm font-medium text-[var(--ink)]">My projects</h3>
            {ownedKeys.length === 0 ? (
              <p className={`text-sm ${hintClassName}`}>You have not created a project yet.</p>
            ) : (
              <ul className="space-y-3">
                {ownedKeys.map((key) => (
                  <ProjectKeyCard
                    key={key.id}
                    keyItem={key}
                    onEdit={openEdit}
                    onRevoke={openRevoke}
                  />
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="mb-3 text-sm font-medium text-[var(--ink)]">
              Projects I&apos;m on
            </h3>
            {sharedKeys.length === 0 ? (
              <p className={`text-sm ${hintClassName}`}>
                You have not joined any shared projects.
              </p>
            ) : (
              <ul className="space-y-3">
                {sharedKeys.map((key) => (
                  <ProjectKeyCard
                    key={key.id}
                    keyItem={key}
                    onEdit={openEdit}
                    onRevoke={openRevoke}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <Modal
        open={showCreate || showEdit !== null}
        onClose={closeFormModal}
        title={showEdit ? 'Edit API key' : 'Create API key'}
      >
        <form onSubmit={showEdit ? handleUpdate : handleCreate} className="space-y-4">
          <div>
            <label htmlFor="api-key-label" className="mb-1.5 block text-sm">
              Label
            </label>
            <input
              id="api-key-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className={inputClassName}
              placeholder="Production server"
              maxLength={API_KEY_LABEL_MAX}
              required
            />
          </div>
          <div>
            <label htmlFor="api-key-description" className="mb-1.5 block text-sm">
              Description
            </label>
            <textarea
              id="api-key-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={cn(inputClassName, 'min-h-20 resize-y')}
              placeholder="Optional note about this key"
              maxLength={API_KEY_DESCRIPTION_MAX}
            />
            <p className={`mt-1.5 text-xs ${hintClassName}`}>
              Optional, max {API_KEY_DESCRIPTION_MAX} characters.
            </p>
          </div>
          <div>
            <label htmlFor="api-key-ips" className="mb-1.5 block text-sm">
              IP allowlist
            </label>
            <textarea
              id="api-key-ips"
              value={ipAllowlistText}
              onChange={(e) => setIpAllowlistText(e.target.value)}
              className={cn(inputClassName, 'min-h-24 resize-y')}
              placeholder="0.0.0.0"
            />
            <p className={`mt-1.5 text-xs ${hintClassName}`}>
              One IP per line. 0.0.0.0 allows all IPs. Leave empty to block all
              requests until specific IPs are added.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeFormModal}
              className={buttonOutlineClassName}
            >
              Cancel
            </button>
            <button type="submit" disabled={saving} className={buttonClassName}>
              {saving ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : showEdit ? (
                'Save changes'
              ) : (
                'Create key'
              )}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={createdKey !== null}
        onClose={() => setCreatedKey(null)}
        title="Save your API key now"
      >
        <p className={`mb-4 ${hintClassName}`}>
          This is the only time the full key will be shown. Store it somewhere
          safe.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <code className={cn(cardClassName, 'flex-1 break-all bg-[var(--surface)] px-3 py-2 text-sm')}>
            {createdKey?.key}
          </code>
          <button
            type="button"
            onClick={() => createdKey && void copyKey(createdKey.key)}
            className={buttonOutlineClassName}
          >
            <Copy className="size-4" aria-hidden />
            Copy
          </button>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => setCreatedKey(null)}
            className={buttonClassName}
          >
            Done
          </button>
        </div>
      </Modal>

      <Modal
        open={revokeTarget !== null}
        onClose={closeRevoke}
        title="Revoke API key"
      >
        <p className={hintClassName}>
          This cannot be undone. Type{' '}
          <span className="font-medium text-[var(--ink)]">
            {revokeTarget?.label}
          </span>{' '}
          to confirm.
        </p>
        <input
          type="text"
          value={revokeConfirmLabel}
          onChange={(e) => setRevokeConfirmLabel(e.target.value)}
          className={cn(inputClassName, 'mt-4')}
          placeholder={revokeTarget?.label ?? 'Project name'}
          aria-label="Type project name to confirm revoke"
          autoComplete="off"
        />
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => void handleRevoke()}
            disabled={!canConfirmRevoke || revokingId === revokeTarget?.id}
            className="inline-flex items-center justify-center gap-2 border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            {revokingId === revokeTarget?.id ? (
              <>
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
                Revoking…
              </>
            ) : (
              'Revoke'
            )}
          </button>
          <button
            type="button"
            onClick={closeRevoke}
            className="border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)]"
          >
            Cancel
          </button>
        </div>
      </Modal>
    </section>
  )
}
