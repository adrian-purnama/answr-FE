import type { FormEvent, ReactNode } from 'react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useRouter } from '@tanstack/react-router'
import {
  Copy,
  LoaderCircle,
  RefreshCw,
  Search,
  Trash2,
  UserPlus,
} from 'lucide-react'
import Modal from '#/components/ui/Modal'
import ProjectCollaborators from '#/components/project/ProjectCollaborators'
import ToggleRow from '#/components/widget/forms/ToggleRow'
import { apiFetch } from '#/lib/api'
import type { ApiKey, CreatedApiKey } from '#/lib/apiKey'
import type { CollaborationInvite } from '#/lib/collaborationInvite'
import { createCollaborationInvite } from '#/lib/collaborationInvite'
import {
  API_KEY_DESCRIPTION_MAX,
  API_KEY_LABEL_MAX,
  parseIpAllowlist,
} from '#/lib/apiKey'
import {
  buttonClassName,
  buttonOutlineClassName,
  cardClassName,
  hintClassName,
  inputClassName,
} from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

function SettingsSection({
  title,
  description,
  icon,
  badge,
  children,
  className,
}: {
  title: string
  description?: string
  icon?: ReactNode
  badge?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn(cardClassName, 'space-y-5 p-5 sm:p-6', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="text-sm font-medium text-[var(--ink)]">{title}</h2>
          </div>
          {description ? (
            <p className={cn(hintClassName, 'mt-1')}>{description}</p>
          ) : null}
        </div>
        {badge}
      </div>
      {children}
    </section>
  )
}

function RetrievalModeBadge({ enhanced }: { enhanced: boolean }) {
  const label = enhanced ? 'Enhanced' : 'Standard'
  const active = enhanced

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium',
        active
          ? 'bg-emerald-50 text-emerald-800'
          : 'bg-[var(--surface)] text-[var(--muted)]',
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          active ? 'bg-emerald-500' : 'bg-[var(--muted)]',
        )}
      />
      {label}
    </span>
  )
}

type ProjectSettingsProps = {
  projectId: string
  apiKey: ApiKey
}

export default function ProjectSettings({ projectId, apiKey }: ProjectSettingsProps) {
  const router = useRouter()
  const navigate = useNavigate()
  const isRevoked = apiKey.status === 'revoked'

  const [label, setLabel] = useState(apiKey.label)
  const [description, setDescription] = useState(apiKey.description)
  const [ipAllowlistText, setIpAllowlistText] = useState(apiKey.ipAllowlist.join('\n'))
  const [enhancedRetrieval, setEnhancedRetrieval] = useState(
    apiKey.enhancedRetrieval === true,
  )
  const [saving, setSaving] = useState(false)
  const [rotating, setRotating] = useState(false)
  const [revoking, setRevoking] = useState(false)

  const [showRotateConfirm, setShowRotateConfirm] = useState(false)
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false)
  const [rotatedKey, setRotatedKey] = useState<CreatedApiKey | null>(null)
  const [inviting, setInviting] = useState(false)
  const [invite, setInvite] = useState<CollaborationInvite | null>(null)

  useEffect(() => {
    setLabel(apiKey.label)
    setDescription(apiKey.description)
    setIpAllowlistText(apiKey.ipAllowlist.join('\n'))
    setEnhancedRetrieval(apiKey.enhancedRetrieval === true)
  }, [apiKey])

  async function refreshProject() {
    await router.invalidate()
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
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
      const response = await apiFetch<ApiKey>(`/api-keys/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          label: label.trim(),
          description: description.trim(),
          ipAllowlist: parseIpAllowlist(ipAllowlistText),
          enhancedRetrieval,
        }),
      })

      if (!response.success) {
        toast.error(response.message || 'Failed to update API key')
        return
      }

      await refreshProject()
      toast.success('Settings saved')
    } catch {
      toast.error('Unable to reach the server')
    } finally {
      setSaving(false)
    }
  }

  async function handleRotate() {
    setRotating(true)
    try {
      const response = await apiFetch<CreatedApiKey>(`/api-keys/${projectId}/rotate`, {
        method: 'POST',
      })

      if (!response.success) {
        toast.error(response.message || 'Failed to rotate API key')
        return
      }

      setShowRotateConfirm(false)
      setRotatedKey(response.data)
      await refreshProject()
      toast.success('API key rotated')
    } catch {
      toast.error('Unable to reach the server')
    } finally {
      setRotating(false)
    }
  }

  async function handleRevoke() {
    setRevoking(true)
    try {
      const response = await apiFetch<ApiKey>(`/api-keys/${projectId}`, {
        method: 'DELETE',
      })

      if (!response.success) {
        toast.error(response.message || 'Failed to revoke API key')
        return
      }

      setShowRevokeConfirm(false)
      toast.success('API key revoked')
      await navigate({ to: '/dashboard' })
    } catch {
      toast.error('Unable to reach the server')
    } finally {
      setRevoking(false)
    }
  }

  async function handleCreateInvite() {
    setInviting(true)
    try {
      const response = await createCollaborationInvite(projectId)
      if (!response.success) {
        toast.error(response.message || 'Failed to create invite')
        return
      }
      setInvite(response.data)
      toast.success('Invite link created')
    } catch {
      toast.error('Unable to reach the server')
    } finally {
      setInviting(false)
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

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-medium text-[var(--ink)]">Settings</h1>
        <p className={cn(hintClassName, 'mt-1')}>
          Manage this API key&apos;s label, retrieval options, access rules, and
          lifecycle.
        </p>
      </header>

      {isRevoked ? (
        <div className={cn(cardClassName, 'p-6')}>
          <p className={hintClassName}>
            This API key has been revoked and can no longer be updated.
          </p>
        </div>
      ) : (
        <>
          <form
            onSubmit={(event) => void handleSave(event)}
            className="space-y-6"
          >
            <SettingsSection
              title="General"
              description="Name and notes for this API key."
            >
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="project-label"
                    className="mb-1.5 block text-sm font-medium text-[var(--ink)]"
                  >
                    Label
                  </label>
                  <input
                    id="project-label"
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
                  <label
                    htmlFor="project-description"
                    className="mb-1.5 block text-sm font-medium text-[var(--ink)]"
                  >
                    Description
                  </label>
                  <textarea
                    id="project-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={cn(inputClassName, 'min-h-20 resize-y')}
                    placeholder="Optional note about this key"
                    maxLength={API_KEY_DESCRIPTION_MAX}
                  />
                  <p className={cn(hintClassName, 'mt-1.5 text-xs')}>
                    Optional, max {API_KEY_DESCRIPTION_MAX} characters.
                  </p>
                </div>
              </div>
            </SettingsSection>


            {/* leave out for now */}
            {/* <SettingsSection
              title="Access"
              description="Restrict which IPs can use this key."
            >
              <div>
                <label
                  htmlFor="project-ips"
                  className="mb-1.5 block text-sm font-medium text-[var(--ink)]"
                >
                  IP allowlist
                </label>
                <textarea
                  id="project-ips"
                  value={ipAllowlistText}
                  onChange={(e) => setIpAllowlistText(e.target.value)}
                  className={cn(inputClassName, 'min-h-28 resize-y font-mono text-sm')}
                  placeholder={'0.0.0.0\n203.0.113.10'}
                />
                <p className={cn(hintClassName, 'mt-1.5 text-xs')}>
                  One IP per line. <code className="font-mono">0.0.0.0</code>{' '}
                  allows all IPs. Leave empty to block all requests until specific
                  IPs are added.
                </p>
              </div>
            </SettingsSection> */}

            <SettingsSection
              title="Retrieval"
              description="Control how the agent searches your knowledge base."
              icon={
                <Search className="size-4 text-[var(--muted)]" aria-hidden />
              }
              badge={<RetrievalModeBadge enhanced={enhancedRetrieval} />}
            >
              <div className="rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface)]/40 px-4 py-3">
                <ToggleRow
                  id="project-enhanced-retrieval"
                  label="Enhanced retrieval"
                  description="Hybrid search and re-ranking for more relevant knowledge matches."
                  checked={enhancedRetrieval}
                  onChange={setEnhancedRetrieval}
                />
              </div>
            </SettingsSection>

            <div className="flex justify-end">
              <button type="submit" disabled={saving} className={buttonClassName}>
                {saving ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" aria-hidden />
                    Saving…
                  </>
                ) : (
                  'Save changes'
                )}
              </button>
            </div>
          </form>

          <SettingsSection
            title="Collaborators"
            description="Create a one-time invite link. It expires in 7 days."
            icon={
              <UserPlus className="size-4 text-[var(--muted)]" aria-hidden />
            }
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--ink)]">
                  Invite link
                </p>
                <p className={cn(hintClassName, 'mt-0.5 text-sm')}>
                  Anyone with the link can join this project.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleCreateInvite()}
                disabled={inviting}
                className={cn(buttonOutlineClassName, 'shrink-0')}
              >
                {inviting ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" aria-hidden />
                    Creating…
                  </>
                ) : (
                  <>
                    <UserPlus className="size-4" aria-hidden />
                    Create invite link
                  </>
                )}
              </button>
            </div>
            {invite ? (
              <div className="space-y-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <code
                    className={cn(
                      cardClassName,
                      'flex-1 break-all bg-neutral-100 px-3 py-2 text-sm',
                    )}
                  >
                    {invite.invitationUrl}
                  </code>
                  <button
                    type="button"
                    onClick={() => void copyKey(invite.invitationUrl)}
                    className={buttonOutlineClassName}
                  >
                    <Copy className="size-4" aria-hidden />
                    Copy
                  </button>
                </div>
                <p className={cn(hintClassName, 'text-xs')}>
                  Expires {new Date(invite.expiresAt).toLocaleString()}
                </p>
              </div>
            ) : null}
            <div className="border-t border-[var(--line)] pt-5">
              <ProjectCollaborators projectId={projectId} />
            </div>
          </SettingsSection>

          <SettingsSection
            title="Danger zone"
            description="Rotate or revoke this key. These actions affect live integrations."
            className="border-red-200/80"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--ink)]">
                  Rotate key
                </p>
                <p className={cn(hintClassName, 'mt-0.5 text-sm')}>
                  Generate a new secret. The old key stops working immediately.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRotateConfirm(true)}
                className={cn(buttonOutlineClassName, 'shrink-0')}
              >
                <RefreshCw className="size-4" aria-hidden />
                Rotate key
              </button>
            </div>

            <div className="border-t border-[var(--line)] pt-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--ink)]">
                    Revoke key
                  </p>
                  <p className={cn(hintClassName, 'mt-0.5 text-sm')}>
                    Permanently disable this key. This cannot be undone.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRevokeConfirm(true)}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 className="size-4" aria-hidden />
                  Revoke key
                </button>
              </div>
            </div>
          </SettingsSection>
        </>
      )}

      <Modal
        open={showRotateConfirm}
        onClose={() => setShowRotateConfirm(false)}
        title="Rotate API key"
      >
        <p className={hintClassName}>
          Rotate &quot;{apiKey.label}&quot;? The current key will stop working
          immediately. You will only see the new key once.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setShowRotateConfirm(false)}
            className={buttonOutlineClassName}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleRotate()}
            disabled={rotating}
            className={buttonClassName}
          >
            {rotating ? (
              <>
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
                Rotating…
              </>
            ) : (
              'Rotate key'
            )}
          </button>
        </div>
      </Modal>

      <Modal
        open={rotatedKey !== null}
        onClose={() => setRotatedKey(null)}
        title="Save your new API key"
      >
        <p className={`mb-4 ${hintClassName}`}>
          This is the only time the full key will be shown. Store it somewhere
          safe.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <code className={cn(cardClassName, 'flex-1 break-all bg-neutral-100 px-3 py-2 text-sm')}>
            {rotatedKey?.key}
          </code>
          <button
            type="button"
            onClick={() => rotatedKey && void copyKey(rotatedKey.key)}
            className={buttonOutlineClassName}
          >
            <Copy className="size-4" aria-hidden />
            Copy
          </button>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => setRotatedKey(null)}
            className={buttonClassName}
          >
            Done
          </button>
        </div>
      </Modal>

      <Modal
        open={showRevokeConfirm}
        onClose={() => setShowRevokeConfirm(false)}
        title="Revoke API key"
      >
        <p className={hintClassName}>
          Revoke &quot;{apiKey.label}&quot;? This cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setShowRevokeConfirm(false)}
            className={buttonOutlineClassName}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleRevoke()}
            disabled={revoking}
            className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            {revoking ? (
              <>
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
                Revoking…
              </>
            ) : (
              'Revoke'
            )}
          </button>
        </div>
      </Modal>
    </div>
  )
}
