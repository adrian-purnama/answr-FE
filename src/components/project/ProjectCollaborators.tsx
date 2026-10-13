import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { LoaderCircle, Trash2 } from 'lucide-react'
import type { ApiKeyCollaborator, CollaboratorPermissions } from '#/lib/collaborator'
import {
  COLLABORATOR_PERMISSION_FIELDS,
  listCollaborators,
  removeCollaborator,
  updateCollaboratorPermissions,
} from '#/lib/collaborator'
import {
  buttonClassName,
  hintClassName,
} from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

type ProjectCollaboratorsProps = {
  projectId: string
}

export default function ProjectCollaborators({
  projectId,
}: ProjectCollaboratorsProps) {
  const [members, setMembers] = useState<ApiKeyCollaborator[]>([])
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)
  const [drafts, setDrafts] = useState<Record<string, CollaboratorPermissions>>(
    {},
  )
  const [savingId, setSavingId] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const response = await listCollaborators(projectId)
    if (!response.success) {
      if (response.message.includes('permission') || response.message.includes('owner')) {
        setForbidden(true)
        return
      }
      throw new Error(response.message || 'Failed to load collaborators')
    }
    setMembers(response.data)
    setDrafts(
      Object.fromEntries(
        response.data.map((member) => [member.id, member.permissions]),
      ),
    )
  }, [projectId])

  useEffect(() => {
    void (async () => {
      try {
        await load()
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to load collaborators',
        )
      } finally {
        setLoading(false)
      }
    })()
  }, [load])

  async function handleSave(member: ApiKeyCollaborator) {
    const permissions = drafts[member.id] ?? member.permissions
    setSavingId(member.id)
    try {
      const response = await updateCollaboratorPermissions(
        projectId,
        member.userId,
        permissions,
      )
      if (!response.success) {
        toast.error(response.message || 'Failed to update access')
        return
      }
      toast.success('Access updated')
      await load()
    } catch {
      toast.error('Unable to reach the server')
    } finally {
      setSavingId(null)
    }
  }

  async function handleRemove(member: ApiKeyCollaborator) {
    setRemovingId(member.id)
    try {
      const response = await removeCollaborator(projectId, member.userId)
      if (!response.success) {
        toast.error(response.message || 'Failed to remove collaborator')
        return
      }
      toast.success('Collaborator removed')
      await load()
    } catch {
      toast.error('Unable to reach the server')
    } finally {
      setRemovingId(null)
    }
  }

  if (forbidden) return null
  if (loading) {
    return (
      <p className={cn(hintClassName, 'flex items-center gap-2 text-sm')}>
        <LoaderCircle className="size-4 animate-spin" aria-hidden />
        Loading collaborators…
      </p>
    )
  }

  if (members.length === 0) {
    return <p className={`text-sm ${hintClassName}`}>No one has joined yet.</p>
  }

  return (
    <ul className="space-y-6">
      {members.map((member) => {
        const permissions = drafts[member.id] ?? member.permissions
        return (
          <li key={member.id} className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-[var(--ink)]">
                {member.email ?? member.userId}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void handleSave(member)}
                  disabled={savingId === member.id}
                  className={cn(buttonClassName, 'px-3 py-1.5 text-sm')}
                >
                  {savingId === member.id ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" aria-hidden />
                      Saving…
                    </>
                  ) : (
                    'Save access'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => void handleRemove(member)}
                  disabled={removingId === member.id}
                  className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-red-300 bg-white px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {removingId === member.id ? (
                    <LoaderCircle className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <Trash2 className="size-3.5" aria-hidden />
                  )}
                  Remove
                </button>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {COLLABORATOR_PERMISSION_FIELDS.map((field) => (
                <label
                  key={field.key}
                  className="flex items-center gap-2 text-sm text-[var(--ink)]"
                >
                  <input
                    type="checkbox"
                    checked={field.get(permissions)}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [member.id]: field.set(
                          current[member.id] ?? member.permissions,
                          event.target.checked,
                        ),
                      }))
                    }
                  />
                  {field.label}
                </label>
              ))}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
