import { apiFetch, apiUpload, type ApiResponseDto } from '#/lib/api'
import { getToken } from '#/context/authContext'
import { MAX_WIDGET_MEDIA_BYTES, widgetPublicMediaPath } from '#/lib/widget'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export { MAX_WIDGET_MEDIA_BYTES }

export type NewsCta = {
  enabled: boolean
  text: string
  url: string
}

export type NewsArticle = {
  id: string
  apiKeyId: string
  title: string
  heroImage: string
  content: string
  cta: NewsCta
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export type NewsMediaOut = {
  mediaId: string
  url: string
}

export type PublicNewsListItem = {
  id: string
  title: string
  heroImage: string
  excerpt?: string
  createdAt: string
}

export type PublicNewsDetail = {
  id: string
  title: string
  heroImage: string
  content: string
  cta: NewsCta
  createdAt: string
  updatedAt: string
}

export type CreateNewsInput = {
  title: string
  heroImage?: string
  content: string
  cta?: NewsCta
  enabled?: boolean
}

export type UpdateNewsInput = Partial<CreateNewsInput>

function withApiKey(path: string, apiKeyId: string): string {
  const params = new URLSearchParams({ apiKeyId })
  return `${path}?${params.toString()}`
}

export function emptyNewsCta(): NewsCta {
  return { enabled: false, text: '', url: '' }
}

export function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function isNewsContentEmpty(html: string): boolean {
  const text = html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\u00a0/g, ' ')
    .trim()
  if (text) return false
  return !/data-media-id\s*=/.test(html) && !/\/media\/[a-f0-9]{24}/i.test(html)
}

export function stampNewsImageMediaIds(html: string): string {
  return html.replace(/<img\b([^>]*?)\/?>/gi, (full, attrs: string) => {
    if (/data-media-id\s*=/i.test(attrs)) return full
    const srcMatch = attrs.match(/src\s*=\s*(?:"([^"]*)"|'([^']*)')/i)
    const src = srcMatch?.[1] ?? srcMatch?.[2] ?? ''
    const id = src.match(/\/media\/([a-f0-9]{24})(?:\?|$)/i)?.[1]
    if (!id) return full
    return `<img data-media-id="${id}"${attrs}>`
  })
}

export function newsHtmlWithPublicSrcs(html: string, publicKey: string): string {
  return html.replace(
    /<img\b([^>]*?)>/gi,
    (full, attrs: string) => {
      const idMatch = attrs.match(
        /data-media-id\s*=\s*(?:"([^"]*)"|'([^']*)')/i,
      )
      const id = (idMatch?.[1] ?? idMatch?.[2] ?? '').trim()
      if (!id) return full
      const src = widgetPublicMediaPath(publicKey, id)
      if (/\ssrc\s*=/i.test(attrs)) {
        const nextAttrs = attrs.replace(
          /\ssrc\s*=\s*(?:"[^"]*"|'[^']*')/i,
          ` src="${src}"`,
        )
        return `<img${nextAttrs}>`
      }
      return `<img${attrs} src="${src}">`
    },
  )
}

async function fetchNewsMediaObjectUrl(
  apiKeyId: string,
  mediaId: string,
): Promise<string | null> {
  const token = getToken()
  const params = new URLSearchParams({ apiKeyId })
  const response = await fetch(
    `${API_BASE_URL}/widgets/media/${encodeURIComponent(mediaId)}?${params}`,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} },
  )
  if (!response.ok) return null
  const blob = await response.blob()
  return URL.createObjectURL(blob)
}

export async function hydrateNewsHtml(
  html: string,
  apiKeyId: string,
  publicKey: string,
): Promise<{ html: string; objectUrls: string[] }> {
  const ids = [
    ...html.matchAll(/data-media-id\s*=\s*(?:"([^"]*)"|'([^']*)')/gi),
  ]
    .map((match) => (match[1] ?? match[2] ?? '').trim())
    .filter(Boolean)
  const unique = [...new Set(ids)]
  const srcById = new Map<string, string>()
  const objectUrls: string[] = []

  await Promise.all(
    unique.map(async (id) => {
      const publicUrl = widgetPublicMediaPath(publicKey, id)
      try {
        const probe = await fetch(publicUrl, { method: 'HEAD' })
        if (probe.ok) {
          srcById.set(id, publicUrl)
          return
        }
      } catch {
        // fall through
      }
      const blobUrl = await fetchNewsMediaObjectUrl(apiKeyId, id)
      if (blobUrl) {
        objectUrls.push(blobUrl)
        srcById.set(id, blobUrl)
      }
    }),
  )

  const next = html.replace(/<img\b([^>]*?)>/gi, (full, attrs: string) => {
    const idMatch = attrs.match(/data-media-id\s*=\s*(?:"([^"]*)"|'([^']*)')/i)
    const id = (idMatch?.[1] ?? idMatch?.[2] ?? '').trim()
    const src = id ? srcById.get(id) : undefined
    if (!src) return full
    if (/\ssrc\s*=/i.test(attrs)) {
      return `<img${attrs.replace(/\ssrc\s*=\s*(?:"[^"]*"|'[^']*')/i, ` src="${src}"`)}>`
    }
    return `<img${attrs} src="${src}">`
  })

  return { html: next, objectUrls }
}

export async function listNews(apiKeyId: string) {
  return apiFetch<NewsArticle[]>(withApiKey('/widgets/news', apiKeyId))
}

export async function createNews(apiKeyId: string, body: CreateNewsInput) {
  return apiFetch<NewsArticle>(withApiKey('/widgets/news', apiKeyId), {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function updateNews(
  apiKeyId: string,
  newsId: string,
  body: UpdateNewsInput,
) {
  return apiFetch<NewsArticle>(
    withApiKey(`/widgets/news/${encodeURIComponent(newsId)}`, apiKeyId),
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    },
  )
}

export async function deleteNews(apiKeyId: string, newsId: string) {
  return apiFetch<null>(
    withApiKey(`/widgets/news/${encodeURIComponent(newsId)}`, apiKeyId),
    { method: 'DELETE' },
  )
}

export async function uploadNewsMedia(apiKeyId: string, file: File) {
  if (file.size > MAX_WIDGET_MEDIA_BYTES) {
    throw new Error('Image must be 5MB or smaller')
  }
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed')
  }
  const formData = new FormData()
  formData.append('file', file)
  return apiUpload<NewsMediaOut>(
    withApiKey('/widgets/news/media', apiKeyId),
    formData,
  )
}

export async function getPublicNewsList(publicKey: string, limit?: number) {
  const params = new URLSearchParams()
  if (limit !== undefined) params.set('limit', String(limit))
  const query = params.size ? `?${params.toString()}` : ''
  const response = await fetch(
    `${API_BASE_URL}/widgets/public/${encodeURIComponent(publicKey)}/news${query}`,
    { headers: { 'Content-Type': 'application/json' } },
  )
  return response.json() as Promise<ApiResponseDto<PublicNewsListItem[]>>
}

export async function getPublicNews(publicKey: string, newsId: string) {
  const response = await fetch(
    `${API_BASE_URL}/widgets/public/${encodeURIComponent(publicKey)}/news/${encodeURIComponent(newsId)}`,
    { headers: { 'Content-Type': 'application/json' } },
  )
  return response.json() as Promise<ApiResponseDto<PublicNewsDetail>>
}
