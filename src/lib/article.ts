import { apiFetch, apiUpload, toAbsoluteMediaUrl } from '#/lib/api'
import { getToken } from '#/context/authContext'
import {
  parseContentToBlocks,
  serializeContentBlocks,
  type ContentBlock,
} from '#/lib/contentReferences'

export type TopicTextBlock = { type: 'text'; content: string }
export type TopicImageBlock = { type: 'image'; mediaId: string; alt?: string }
export type TopicContentBlock = TopicTextBlock | TopicImageBlock

/** Local image pending upload (not yet persisted). */
export type TopicImageDraftBlock = {
  type: 'image'
  fileKey: string
  file: File
  previewUrl: string
  alt?: string
}

export type TopicEditorBlock =
  | TopicTextBlock
  | TopicImageBlock
  | TopicImageDraftBlock

export type TopicSyncStatus =
  | 'synced'
  | 'not-synced'
  | 'failed'
  | 'in-progress'

export type ArticleSyncStatus = 'synced' | 'partial' | 'not-synced'

export type Topic = {
  id: string
  articleId?: string
  topicName: string
  topicContent: string
  type: 'content' | 'snippet'
  order: number
  enabled: boolean
  isSynced: TopicSyncStatus
  createdAt: string
  updatedAt: string
  createdBy?: string | null
  updatedBy?: string | null
}

export type Article = {
  id: string
  apiKeyId: string
  title: string
  description: string
  enabled: boolean
  syncStatus: ArticleSyncStatus
  createdAt: string
  updatedAt: string
  createdBy?: string | null
  updatedBy?: string | null
}

export type ArticleDetail = Article & {
  topics: Topic[]
}

type ExportArticle = {
  filename: string
  zipBase64: string
}

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export const ARTICLE_TITLE_MAX = 200
export const ARTICLE_DESCRIPTION_MAX = 500
export const TOPIC_NAME_MAX = 200

export const MAX_TOPIC_IMAGE_BYTES = 5 * 1024 * 1024

function withApiKey(path: string, apiKeyId: string): string {
  const sep = path.includes('?') ? '&' : '?'
  return `${path}${sep}apiKeyId=${encodeURIComponent(apiKeyId)}`
}

function pushText(blocks: TopicContentBlock[], content: string): void {
  const last = blocks[blocks.length - 1]
  if (last?.type === 'text') {
    last.content += content
    return
  }
  blocks.push({ type: 'text', content })
}

function legacyArrayToBlocks(value: unknown[]): ContentBlock[] {
  const blocks: ContentBlock[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    if (row.type === 'text' && typeof row.content === 'string') {
      blocks.push({ type: 'text', content: row.content })
    } else if (row.type === 'image') {
      const id =
        (typeof row.id === 'string' && row.id.trim()) ||
        (typeof row.mediaId === 'string' && row.mediaId.trim()) ||
        (typeof row.fileKey === 'string' && row.fileKey.trim()) ||
        ''
      if (!id) continue
      const alt =
        typeof row.alt === 'string' && row.alt.trim()
          ? row.alt.trim().slice(0, 200)
          : undefined
      blocks.push(alt ? { type: 'image', id, alt } : { type: 'image', id })
    } else if (
      row.type === 'topic' &&
      typeof row.id === 'string' &&
      row.id.trim()
    ) {
      blocks.push({ type: 'topic', id: row.id.trim() })
    } else if (
      row.type === 'tool' &&
      typeof row.name === 'string' &&
      row.name.trim()
    ) {
      blocks.push({ type: 'tool', name: row.name.trim() })
    }
  }
  return blocks
}

/** Coerce API/legacy topicContent to the stored token string. */
export function topicContentToString(raw: unknown): string {
  if (raw === undefined || raw === null) return ''
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (trimmed.startsWith('[')) {
      try {
        const parsed: unknown = JSON.parse(trimmed)
        if (Array.isArray(parsed)) {
          return serializeContentBlocks(legacyArrayToBlocks(parsed))
        }
      } catch {
        // already a token/markdown string
      }
    }
    return raw
  }
  if (Array.isArray(raw)) {
    return serializeContentBlocks(legacyArrayToBlocks(raw))
  }
  return ''
}

/** Editor view: images as mediaId blocks; topic/tool/var tokens stay in text for Quill. */
export function topicContentToEditorBlocks(content: string): TopicContentBlock[] {
  const blocks: TopicContentBlock[] = []
  for (const block of parseContentToBlocks(content)) {
    if (block.type === 'text') {
      pushText(blocks, block.content)
    } else if (block.type === 'image') {
      blocks.push({
        type: 'image',
        mediaId: block.id,
        ...(block.alt ? { alt: block.alt } : {}),
      })
    } else {
      // Keep topic/tool/var tokens in text so they round-trip through the editor.
      pushText(blocks, serializeContentBlocks([block]))
    }
  }
  return blocks
}

export type TopicContentSavePayload = {
  blocks: Array<
    | TopicTextBlock
    | TopicImageBlock
    | { type: 'image'; fileKey: string; alt?: string }
  >
  files: Array<{ fileKey: string; file: File }>
}

export function savePayloadToContentString(
  payload: TopicContentSavePayload,
): string {
  return serializeContentBlocks(
    payload.blocks.map((block) => {
      if (block.type === 'text') return block
      const id = 'fileKey' in block ? block.fileKey : block.mediaId
      return {
        type: 'image' as const,
        id,
        ...(block.alt ? { alt: block.alt } : {}),
      }
    }),
  )
}

function normalizeTopic(topic: Topic): Topic {
  return {
    ...topic,
    topicContent: topicContentToString(topic.topicContent),
    isSynced: topic.isSynced ?? 'not-synced',
  }
}

function normalizeDetail(detail: ArticleDetail): ArticleDetail {
  return {
    ...detail,
    syncStatus: detail.syncStatus ?? 'not-synced',
    topics: detail.topics.map(normalizeTopic),
  }
}

export function articleMediaPath(mediaId: string, apiKeyId: string): string {
  return withApiKey(`/articles/media/${mediaId}`, apiKeyId)
}

export function articleMediaAbsoluteUrl(
  mediaId: string,
  apiKeyId: string,
): string {
  return toAbsoluteMediaUrl(articleMediaPath(mediaId, apiKeyId)) ?? ''
}

/** Fetch owned media with auth and return a blob object URL (caller must revoke). */
export async function fetchArticleMediaObjectUrl(
  mediaId: string,
  apiKeyId: string,
): Promise<string> {
  const headers = new Headers()
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(
    `${API_BASE_URL}${articleMediaPath(mediaId, apiKeyId)}`,
    { headers },
  )
  if (!response.ok) {
    throw new Error('Failed to load image')
  }
  const blob = await response.blob()
  return URL.createObjectURL(blob)
}

/** Upload a file or remote URL into article GridFS; returns permanent mediaId. */
export async function ingestArticleMedia(
  apiKeyId: string,
  opts: { file?: File; url?: string; articleId?: string },
) {
  const formData = new FormData()
  formData.append('apiKeyId', apiKeyId)
  if (opts.articleId) formData.append('articleId', opts.articleId)
  if (opts.file) formData.append('file', opts.file)
  if (opts.url) formData.append('url', opts.url)
  return apiUpload<{ mediaId: string }>(
    withApiKey('/articles/media/ingest', apiKeyId),
    formData,
  )
}

export async function listArticles(apiKeyId: string) {
  return apiFetch<Article[]>(withApiKey('/articles', apiKeyId))
}

export async function createArticle(
  apiKeyId: string,
  title: string,
  description = '',
) {
  return apiFetch<Article>('/articles', {
    method: 'POST',
    body: JSON.stringify({ apiKeyId, title, description }),
  })
}

export async function getArticle(apiKeyId: string, articleId: string) {
  const response = await apiFetch<ArticleDetail>(
    withApiKey(`/articles/${articleId}`, apiKeyId),
  )
  if (response.success && response.data) {
    return { ...response, data: normalizeDetail(response.data) }
  }
  return response
}

/** All topic names for chip labels; enabledIds only when article + topic are enabled. */
export async function loadTopicRefLookup(apiKeyId: string): Promise<{
  names: Map<string, string>
  enabledIds: Set<string>
}> {
  const names = new Map<string, string>()
  const enabledIds = new Set<string>()
  const response = await listArticles(apiKeyId)
  if (!response.success || !response.data) {
    return { names, enabledIds }
  }

  await Promise.all(
    response.data.map(async (article) => {
      const detail = await getArticle(apiKeyId, article.id)
      if (!detail.success || !detail.data) return
      for (const topic of detail.data.topics) {
        const id = topic.id.toLowerCase()
        names.set(id, topic.topicName)
        if (article.enabled && topic.enabled) {
          enabledIds.add(id)
        }
      }
    }),
  )

  return { names, enabledIds }
}

export async function updateArticle(
  apiKeyId: string,
  articleId: string,
  patch: { title?: string; description?: string; enabled?: boolean },
) {
  return apiFetch<Article>(`/articles/${articleId}`, {
    method: 'PATCH',
    body: JSON.stringify({ apiKeyId, ...patch }),
  })
}

export async function deleteArticle(apiKeyId: string, articleId: string) {
  return apiFetch<null>(withApiKey(`/articles/${articleId}`, apiKeyId), {
    method: 'DELETE',
  })
}

export async function importArticle(apiKeyId: string, file: File) {
  const formData = new FormData()
  formData.append('apiKeyId', apiKeyId)
  formData.append('file', file)
  const response = await apiUpload<ArticleDetail>(
    withApiKey('/articles/import', apiKeyId),
    formData,
  )
  if (response.success && response.data) {
    return { ...response, data: normalizeDetail(response.data) }
  }
  return response
}

export async function exportArticle(apiKeyId: string, articleId: string) {
  return apiFetch<ExportArticle>(
    withApiKey(`/articles/${articleId}/export`, apiKeyId),
  )
}

/** `force` re-embeds every topic; default only syncs pending/failed ones. */
export async function resyncArticles(apiKeyId: string, force = false) {
  return apiFetch<string[]>(
    withApiKey(`/articles/resync${force ? '?force=true' : ''}`, apiKeyId),
    { method: 'POST' },
  )
}

export async function resyncArticle(
  apiKeyId: string,
  articleId: string,
  force = false,
) {
  return apiFetch<string[]>(
    withApiKey(
      `/articles/${articleId}/resync${force ? '?force=true' : ''}`,
      apiKeyId,
    ),
    { method: 'POST' },
  )
}

export async function createTopic(
  apiKeyId: string,
  articleId: string,
  topicName: string,
  topicContent = '',
) {
  const formData = new FormData()
  formData.append('apiKeyId', apiKeyId)
  formData.append('topicName', topicName)
  formData.append('topicContent', topicContent)
  const response = await apiUpload<Topic>(
    withApiKey(`/articles/${articleId}/topics`, apiKeyId),
    formData,
  )
  if (response.success && response.data) {
    return { ...response, data: normalizeTopic(response.data) }
  }
  return response
}

export async function updateTopic(
  apiKeyId: string,
  articleId: string,
  topicId: string,
  patch: {
    topicName?: string
    topicContent?: TopicContentSavePayload
    enabled?: boolean
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
  if (patch.topicContent) {
    formData.append(
      'topicContent',
      savePayloadToContentString(patch.topicContent),
    )
    for (const { fileKey, file } of patch.topicContent.files) {
      formData.append(fileKey, file)
    }
  }

  const response = await apiUpload<Topic>(
    withApiKey(`/articles/${articleId}/topics/${topicId}`, apiKeyId),
    formData,
    { method: 'PATCH' },
  )
  if (response.success && response.data) {
    return { ...response, data: normalizeTopic(response.data) }
  }
  return response
}

export async function deleteTopic(
  apiKeyId: string,
  articleId: string,
  topicId: string,
) {
  return apiFetch<null>(
    withApiKey(`/articles/${articleId}/topics/${topicId}`, apiKeyId),
    { method: 'DELETE' },
  )
}

export async function reorderTopics(
  apiKeyId: string,
  articleId: string,
  topicIds: string[],
) {
  const response = await apiFetch<Topic[]>(
    `/articles/${articleId}/topics/reorder`,
    {
      method: 'PATCH',
      body: JSON.stringify({ apiKeyId, topicIds }),
    },
  )
  if (response.success && response.data) {
    return {
      ...response,
      data: response.data.map(normalizeTopic),
    }
  }
  return response
}

export function downloadZipBase64(filename: string, zipBase64: string) {
  const binary = atob(zipBase64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  const blob = new Blob([bytes], { type: 'application/zip' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename.endsWith('.zip') ? filename : `${filename}.zip`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function countTopicImages(blocks: TopicEditorBlock[]): number {
  return blocks.filter((b) => b.type === 'image').length
}
