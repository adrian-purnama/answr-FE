import { apiFetch, apiUpload } from '#/lib/api'
import {
  savePayloadToContentString,
  topicContentToEditorBlocks,
  type TopicContentSavePayload,
  type TopicSyncStatus,
} from '#/lib/article'

export type Snippet = {
  id: string
  apiKeyId: string
  topicName: string
  topicContent: string
  type: 'snippet'
  order: number
  enabled: boolean
  isSynced: TopicSyncStatus
  createdAt: string
  updatedAt: string
  createdBy?: string | null
  updatedBy?: string | null
}

function withApiKey(path: string, apiKeyId: string): string {
  const sep = path.includes('?') ? '&' : '?'
  return `${path}${sep}apiKeyId=${encodeURIComponent(apiKeyId)}`
}

export async function listSnippets(apiKeyId: string) {
  return apiFetch<Snippet[]>(withApiKey('/snippets', apiKeyId))
}

export async function createSnippet(
  apiKeyId: string,
  input: { topicName: string; topicContent?: string },
) {
  return apiFetch<Snippet>('/snippets', {
    method: 'POST',
    body: JSON.stringify({ apiKeyId, ...input }),
  })
}

export async function updateSnippet(
  apiKeyId: string,
  id: string,
  patch: {
    topicName?: string
    topicContent?: string | TopicContentSavePayload
    enabled?: boolean
    order?: number
  },
) {
  const formData = new FormData()
  formData.append('apiKeyId', apiKeyId)
  if (patch.topicName !== undefined) {
    formData.append('topicName', patch.topicName)
  }
  if (patch.enabled !== undefined) {
    formData.append('enabled', String(patch.enabled))
  }
  if (patch.order !== undefined) {
    formData.append('order', String(patch.order))
  }
  if (patch.topicContent !== undefined) {
    if (typeof patch.topicContent === 'string') {
      formData.append('topicContent', patch.topicContent)
    } else {
      formData.append(
        'topicContent',
        savePayloadToContentString(patch.topicContent),
      )
      for (const { fileKey, file } of patch.topicContent.files) {
        formData.append(fileKey, file)
      }
    }
  }
  return apiUpload<Snippet>(
    withApiKey(`/snippets/${id}`, apiKeyId),
    formData,
    { method: 'PATCH' },
  )
}

export async function deleteSnippet(apiKeyId: string, id: string) {
  return apiFetch<null>(withApiKey(`/snippets/${id}`, apiKeyId), {
    method: 'DELETE',
  })
}

/** `force` re-embeds every snippet; default only syncs pending/failed ones. */
export async function resyncSnippets(apiKeyId: string, force = false) {
  return apiFetch<string[]>(
    withApiKey(`/snippets/resync${force ? '?force=true' : ''}`, apiKeyId),
    { method: 'POST' },
  )
}

export { topicContentToEditorBlocks }
