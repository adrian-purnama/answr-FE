import { useEffect, useRef, useState, type ReactNode } from 'react'
import toast from 'react-hot-toast'
import { Trash2 } from 'lucide-react'
import LiveAgentAvatar from '#/components/liveAgent/LiveAgentAvatar'
import PasswordInput from '#/components/forms/PasswordInput'
import DrawerDetails from '#/components/ui/DrawerDetails'
import SideDrawer from '#/components/ui/SideDrawer'
import type { LiveAgent } from '#/lib/liveAgent'
import {
  buttonOutlineClassName,
  inputClassNameCompact,
} from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

type LiveAgentDrawerProps = {
  open: boolean
  onClose: () => void
  apiKeyId: string
  agent: LiveAgent | null
  onSaveName: (name: string) => void | Promise<void>
  onToggleEnabled: () => void | Promise<void>
  onUploadAvatar: (file: File) => void | Promise<void>
  onResetPassword: (password: string) => void | Promise<void>
  onDelete: () => void
  uploading?: boolean
  saving?: boolean
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
      {children}
    </h3>
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

export default function LiveAgentDrawer({
  open,
  onClose,
  apiKeyId,
  agent,
  onSaveName,
  onToggleEnabled,
  onUploadAvatar,
  onResetPassword,
  onDelete,
  uploading = false,
  saving = false,
}: LiveAgentDrawerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [resetPassword, setResetPassword] = useState('')
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    setResetPassword('')
  }, [agent?.id])

  async function handleResetPassword() {
    if (!agent) return
    if (resetPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setResetting(true)
    try {
      await onResetPassword(resetPassword)
      setResetPassword('')
    } finally {
      setResetting(false)
    }
  }

  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      label="Live agent"
      size="md"
      details={
        agent ? (
          <DrawerDetails
            createdAt={agent.createdAt}
            updatedAt={agent.updatedAt}
            statusRows={[
              {
                label: 'Status',
                value: <StatusPill enabled={agent.enabled} />,
              },
            ]}
            actions={
              <>
                <button
                  type="button"
                  className={cn(buttonOutlineClassName, 'w-full text-xs')}
                  disabled={saving}
                  onClick={() => void onToggleEnabled()}
                >
                  {agent.enabled ? 'Disable' : 'Enable'}
                </button>
                <button
                  type="button"
                  className={cn(
                    buttonOutlineClassName,
                    'w-full text-xs text-red-600 hover:bg-red-50 hover:text-red-700',
                  )}
                  onClick={onDelete}
                >
                  <Trash2 className="mr-1.5 inline size-3.5" aria-hidden />
                  Delete
                </button>
              </>
            }
          />
        ) : null
      }
    >
      {agent ? (
        <div className="min-w-0">
          <section className="space-y-3 pb-5">
            <SectionTitle>Agent</SectionTitle>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="shrink-0 rounded-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[var(--ink)] disabled:opacity-50"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                title="Change profile picture"
              >
                <LiveAgentAvatar
                  apiKeyId={apiKeyId}
                  mediaId={agent.profilePicture}
                  name={agent.name}
                  size="md"
                />
              </button>
              <button
                type="button"
                className="text-xs text-[var(--muted)] underline underline-offset-2 hover:text-[var(--ink)] disabled:opacity-50"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? 'Uploading…' : 'Change photo'}
              </button>
            </div>

            <label className="block space-y-1">
              <span className="text-xs text-[var(--muted)]">Name</span>
              <input
                aria-label="Live agent name"
                className={inputClassNameCompact}
                defaultValue={agent.name}
                key={`${agent.id}-name-${agent.name}`}
                placeholder="Agent name"
                disabled={saving}
                onBlur={(e) => void onSaveName(e.target.value)}
              />
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (file) void onUploadAvatar(file)
              }}
            />
          </section>

          <section className="space-y-2 border-t border-[var(--line)] py-5">
            <SectionTitle>Password</SectionTitle>
            <div className="flex items-center gap-2">
              <PasswordInput
                id="live-agent-drawer-reset-password"
                value={resetPassword}
                onChange={setResetPassword}
                autoComplete="new-password"
                placeholder="New password (min 8)"
                className="min-w-0 flex-1 border-1 border-[var(--line)] rounded-sm"
              />
              <button
                type="button"
                className={cn(
                  buttonOutlineClassName,
                  'inline-flex h-9 shrink-0 items-center px-3 text-xs',
                )}
                disabled={resetting || saving || resetPassword.length < 8}
                onClick={() => void handleResetPassword()}
              >
                {resetting ? 'Saving…' : 'Reset'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </SideDrawer>
  )
}
