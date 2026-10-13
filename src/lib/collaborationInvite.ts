import { apiFetch } from '#/lib/api'

const INVITE_PATH =
  /^\/api-key\/([a-fA-F0-9]{24})\/collaborate\/([A-Za-z0-9_-]{16,128})$/

export type CollaborationInvite = {
  invitationUrl: string
  expiresAt: string
}

export function createCollaborationInvite(apiKeyId: string) {
  return apiFetch<CollaborationInvite>(
    `/api-keys/${encodeURIComponent(apiKeyId)}/collaboration-invites`,
    { method: 'POST' },
  )
}

export type InviteRedirectParams = {
  apiKeyId: string
  token: string
}

export function parseInviteRedirectPath(
  value: string | undefined,
): InviteRedirectParams | null {
  if (!value) return null
  const match = INVITE_PATH.exec(value)
  if (!match) return null
  return { apiKeyId: match[1], token: match[2] }
}

const SAFE_POST_AUTH_REDIRECTS = new Set([
  '/pricing',
  '/pricing/',
  '/payment',
  '/payment/',
])

export function isSafePostAuthRedirect(
  value: string | undefined,
): value is string {
  return typeof value === 'string' && SAFE_POST_AUTH_REDIRECTS.has(value)
}

export function inviteRedirectSearch(
  search: Record<string, unknown>,
): { redirect?: string } {
  const redirect =
    typeof search.redirect === 'string' ? search.redirect : undefined
  if (parseInviteRedirectPath(redirect) || isSafePostAuthRedirect(redirect)) {
    return { redirect }
  }
  return {}
}
