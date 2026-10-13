import { apiFetch } from '#/lib/api'

export const GUIDANCE_TITLE_MAX = 200

export type Guidance = {
  id: string
  apiKeyId: string
  title: string
  content: string
  enabled: boolean
  createdAt: string
  updatedAt: string
  createdBy?: string | null
  updatedBy?: string | null
}

function withApiKey(path: string, apiKeyId: string): string {
  const sep = path.includes('?') ? '&' : '?'
  return `${path}${sep}apiKeyId=${encodeURIComponent(apiKeyId)}`
}

export async function listGuidances(apiKeyId: string) {
  return apiFetch<Guidance[]>(withApiKey('/guidances', apiKeyId))
}

export async function createGuidance(
  apiKeyId: string,
  input: { title: string; content: string },
) {
  return apiFetch<Guidance>('/guidances', {
    method: 'POST',
    body: JSON.stringify({ apiKeyId, ...input }),
  })
}

export async function updateGuidance(
  apiKeyId: string,
  id: string,
  patch: { title?: string; content?: string; enabled?: boolean },
) {
  return apiFetch<Guidance>(withApiKey(`/guidances/${id}`, apiKeyId), {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export async function deleteGuidance(apiKeyId: string, id: string) {
  return apiFetch<null>(withApiKey(`/guidances/${id}`, apiKeyId), {
    method: 'DELETE',
  })
}
