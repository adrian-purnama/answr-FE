import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '#/context/authContext'
import { apiFetch } from '#/lib/api'
import { pageHead } from '#/lib/seo'
import { cardClassName, hintClassName } from '#/lib/ui-classes'

type AcceptInviteResponse = {
  apiKeyId: string
  label: string
  role: 'owner' | 'collaborator'
  alreadyMember: boolean
  permissions: unknown
}

export const Route = createFileRoute('/api-key/$apiKeyId/collaborate/$token')({
  component: AcceptInvitePage,
  head: () =>
    pageHead({
      title: 'Collaboration invite',
      description: 'Accept an invitation to collaborate on an answr project.',
      path: '/api-key',
      noIndex: true,
    }),
})

function AcceptInvitePage() {
  const { apiKeyId, token } = Route.useParams()
  const navigate = useNavigate()
  const { isAuthenticated, isLoading } = useAuth()
  const [status, setStatus] = useState<'working' | 'ok' | 'error'>('working')
  const [message, setMessage] = useState('Accepting invitation…')
  const [label, setLabel] = useState('')

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      void navigate({
        to: '/login',
        search: { redirect: `/api-key/${apiKeyId}/collaborate/${token}` },
      })
      return
    }

    let cancelled = false

    void (async () => {
      try {
        const response = await apiFetch<AcceptInviteResponse>(
          `/api-key-collaboration-invites/${encodeURIComponent(token)}/accept`,
          { method: 'POST' },
        )
        if (cancelled) return
        if (!response.success || !response.data) {
          setStatus('error')
          setMessage(response.message || 'Invitation could not be accepted')
          return
        }
        setLabel(response.data.label)
        setStatus('ok')
        setMessage(
          response.data.alreadyMember
            ? 'You already have access to this workspace.'
            : 'You have joined this workspace.',
        )
      } catch {
        if (!cancelled) {
          setStatus('error')
          setMessage('Unable to reach the server')
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [apiKeyId, isAuthenticated, isLoading, navigate, token])

  return (
    <main className="mx-auto mt-8 mb-12 w-full max-w-md px-6 py-10 text-[var(--ink)] sm:mt-12">
      <div className={`${cardClassName} p-6 sm:p-8`}>
        <h1 className="text-2xl font-medium">Collaboration invite</h1>
        {label ? (
          <p className={`mt-2 ${hintClassName}`}>{label}</p>
        ) : null}
        <p className={`mt-4 ${hintClassName}`}>{message}</p>
        {status !== 'working' ? (
          <Link
            to="/dashboard"
            className="mt-6 inline-block underline hover:text-[var(--ink)]"
          >
            Back to dashboard
          </Link>
        ) : null}
      </div>
    </main>
  )
}
