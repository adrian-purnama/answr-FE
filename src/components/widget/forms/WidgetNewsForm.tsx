import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import ToggleRow from '#/components/widget/forms/ToggleRow'
import NewsRichEditor from '#/components/widget/forms/NewsRichEditor'
import {
  WidgetFormSection,
  hintClassName,
  inputClassName,
  widgetFieldLabelClassName,
} from '#/components/widget/forms/widgetFormUi'
import { getToken } from '#/context/authContext'
import {
  buttonClassName,
  buttonOutlineClassName,
} from '#/lib/ui-classes'
import { cn } from '#/lib/utils'
import {
  createNews,
  deleteNews,
  emptyNewsCta,
  hydrateNewsHtml,
  isHttpUrl,
  isNewsContentEmpty,
  listNews,
  stampNewsImageMediaIds,
  uploadNewsMedia,
  updateNews,
  type NewsArticle,
  type NewsCta,
  MAX_WIDGET_MEDIA_BYTES,
} from '#/lib/news'
import {
  widgetPublicMediaPath,
  type WidgetSectionSettings,
} from '#/lib/widget'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type WidgetNewsFormProps = {
  value: WidgetSectionSettings
  onChange: (value: WidgetSectionSettings) => void
  apiKeyId: string
  publicKey: string
}

type Draft = {
  id: string | null
  title: string
  heroImage: string
  content: string
  cta: NewsCta
  enabled: boolean
}

function emptyDraft(): Draft {
  return {
    id: null,
    title: '',
    heroImage: '',
    content: '<p><br></p>',
    cta: emptyNewsCta(),
    enabled: true,
  }
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

async function previewMediaUrl(
  apiKeyId: string,
  publicKey: string,
  mediaId: string,
): Promise<string | null> {
  const publicUrl = widgetPublicMediaPath(publicKey, mediaId)
  try {
    const probe = await fetch(publicUrl, { method: 'HEAD' })
    if (probe.ok) return publicUrl
  } catch {
    // fall through
  }
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

export default function WidgetNewsForm({
  value,
  onChange,
  apiKeyId,
  publicKey,
}: WidgetNewsFormProps) {
  const coverInputRef = useRef<HTMLInputElement>(null)
  const objectUrlsRef = useRef<string[]>([])
  const [items, setItems] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function rememberUrl(url: string | null) {
    if (url?.startsWith('blob:')) objectUrlsRef.current.push(url)
  }

  useEffect(() => {
    return () => {
      for (const url of objectUrlsRef.current) URL.revokeObjectURL(url)
    }
  }, [])

  async function loadList() {
    setLoading(true)
    try {
      const response = await listNews(apiKeyId)
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to load news')
      }
      setItems(response.data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load news')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadList()
  }, [apiKeyId])

  useEffect(() => {
    let revoked: string | null = null
    let cancelled = false
    async function loadCover() {
      if (!draft?.heroImage) {
        setCoverPreview(null)
        return
      }
      const url = await previewMediaUrl(apiKeyId, publicKey, draft.heroImage)
      if (cancelled) {
        if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
        return
      }
      if (url?.startsWith('blob:')) revoked = url
      setCoverPreview(url)
    }
    void loadCover()
    return () => {
      cancelled = true
      if (revoked) URL.revokeObjectURL(revoked)
    }
  }, [apiKeyId, publicKey, draft?.heroImage])

  async function openEditor(item?: NewsArticle) {
    setError(null)
    if (!item) {
      setDraft(emptyDraft())
      return
    }
    const hydrated = await hydrateNewsHtml(item.content, apiKeyId, publicKey)
    for (const url of hydrated.objectUrls) rememberUrl(url)
    setDraft({
      id: item.id,
      title: item.title,
      heroImage: item.heroImage,
      content: hydrated.html,
      cta: item.cta ?? emptyNewsCta(),
      enabled: item.enabled,
    })
  }

  async function onCoverFile(file: File | undefined) {
    if (!file || !draft) return
    setError(null)
    if (file.size > MAX_WIDGET_MEDIA_BYTES) {
      setError('Image must be 5MB or smaller')
      return
    }
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed')
      return
    }
    setUploadingCover(true)
    try {
      const response = await uploadNewsMedia(apiKeyId, file)
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Upload failed')
      }
      setDraft({ ...draft, heroImage: response.data.mediaId })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadingCover(false)
    }
  }

  async function onInlineImage(file: File) {
    if (file.size > MAX_WIDGET_MEDIA_BYTES) {
      throw new Error('Image must be 5MB or smaller')
    }
    const response = await uploadNewsMedia(apiKeyId, file)
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Upload failed')
    }
    const previewUrl = URL.createObjectURL(file)
    rememberUrl(previewUrl)
    return { mediaId: response.data.mediaId, previewUrl }
  }

  async function save() {
    if (!draft) return
    const title = draft.title.trim()
    const content = stampNewsImageMediaIds(draft.content)
    if (!title) {
      setError('Title is required')
      return
    }
    if (isNewsContentEmpty(content)) {
      setError('Article content is required')
      return
    }
    if (draft.cta.enabled) {
      if (!draft.cta.text.trim()) {
        setError('Button text is required')
        return
      }
      if (!isHttpUrl(draft.cta.url.trim())) {
        setError('Button URL must be a valid http(s) link')
        return
      }
    }
    setSaving(true)
    setError(null)
    try {
      const body = {
        title,
        heroImage: draft.heroImage,
        content,
        cta: {
          enabled: draft.cta.enabled,
          text: draft.cta.text.trim(),
          url: draft.cta.url.trim(),
        },
        enabled: draft.enabled,
      }
      const response = draft.id
        ? await updateNews(apiKeyId, draft.id, body)
        : await createNews(apiKeyId, body)
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to save article')
      }
      toast.success(draft.id ? 'Article saved' : 'Article created')
      setDraft(null)
      await loadList()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save article')
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!draft?.id) return
    if (!window.confirm('Delete this article?')) return
    setSaving(true)
    try {
      const response = await deleteNews(apiKeyId, draft.id)
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete article')
      }
      toast.success('Article deleted')
      setDraft(null)
      await loadList()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete article')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <WidgetFormSection
        title="News tab"
        description="Controls whether visitors see the News tab in the widget navigation."
      >
        <ToggleRow
          id="widget-section-news"
          label="Enable News"
          description="News tab for announcements and product updates."
          checked={value.enabled}
          onChange={(enabled) => onChange({ ...value, enabled })}
        />
      </WidgetFormSection>

      {draft ? (
        <div className="space-y-5">
          <button
            type="button"
            className="text-sm text-[var(--muted)] hover:text-[var(--ink)]"
            onClick={() => setDraft(null)}
          >
            ← All articles
          </button>

          <div>
            <label className={widgetFieldLabelClassName} htmlFor="news-title">
              Title
            </label>
            <input
              id="news-title"
              className={cn(inputClassName, 'text-lg font-medium')}
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Article title"
            />
          </div>

          <div>
            <p className={widgetFieldLabelClassName}>Cover image</p>
            <p className={cn(hintClassName, 'mb-2')}>Optional. Shown at the top of the article.</p>
            {coverPreview ? (
              <img
                src={coverPreview}
                alt=""
                className="mb-2 max-h-48 w-full rounded-lg object-cover"
              />
            ) : (
              <div className="mb-2 flex h-28 items-center justify-center rounded-lg border border-dashed border-[var(--line)] text-xs text-[var(--muted)]">
                No cover image
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={cn(buttonOutlineClassName, 'px-3 py-1.5 text-xs')}
                disabled={uploadingCover}
                onClick={() => coverInputRef.current?.click()}
              >
                {uploadingCover
                  ? 'Uploading…'
                  : draft.heroImage
                    ? 'Replace'
                    : 'Upload'}
              </button>
              {draft.heroImage ? (
                <button
                  type="button"
                  className={cn(buttonOutlineClassName, 'px-3 py-1.5 text-xs')}
                  onClick={() => setDraft({ ...draft, heroImage: '' })}
                >
                  Remove
                </button>
              ) : null}
            </div>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                void onCoverFile(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </div>

          <div>
            <p className={widgetFieldLabelClassName}>Content</p>
            <NewsRichEditor
              key={draft.id ?? 'new'}
              defaultValue={draft.content}
              onChange={(content) =>
                setDraft((current) =>
                  current ? { ...current, content } : current,
                )
              }
              onUploadImage={onInlineImage}
            />
          </div>

          <div className="space-y-3 border-t border-[var(--line)] pt-4">
            <ToggleRow
              id="news-cta-enabled"
              label="Add button"
              description="Optional link at the end of the article, such as to another website."
              checked={draft.cta.enabled}
              onChange={(enabled) =>
                setDraft({ ...draft, cta: { ...draft.cta, enabled } })
              }
            />
            {draft.cta.enabled ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={widgetFieldLabelClassName} htmlFor="news-cta-text">
                    Button text
                  </label>
                  <input
                    id="news-cta-text"
                    className={inputClassName}
                    value={draft.cta.text}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        cta: { ...draft.cta, text: e.target.value },
                      })
                    }
                    placeholder="Read more"
                  />
                </div>
                <div>
                  <label className={widgetFieldLabelClassName} htmlFor="news-cta-url">
                    Button URL
                  </label>
                  <input
                    id="news-cta-url"
                    className={inputClassName}
                    value={draft.cta.url}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        cta: { ...draft.cta, url: e.target.value },
                      })
                    }
                    placeholder="https://example.com/article"
                  />
                </div>
              </div>
            ) : null}
          </div>

          <ToggleRow
            id="news-enabled"
            label="Visible in widget"
            description="Unpublished articles stay in this list until you turn this on."
            checked={draft.enabled}
            onChange={(enabled) => setDraft({ ...draft, enabled })}
          />

          {error ? <p className="text-xs text-red-600">{error}</p> : null}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={buttonClassName}
              disabled={saving}
              onClick={() => void save()}
            >
              {saving ? 'Saving…' : 'Save article'}
            </button>
            {draft.id ? (
              <button
                type="button"
                className={cn(buttonOutlineClassName, 'text-red-600')}
                disabled={saving}
                onClick={() => void remove()}
              >
                Delete
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-[var(--ink)]">Articles</p>
            <button
              type="button"
              className={cn(buttonOutlineClassName, 'px-3 py-1.5 text-xs')}
              onClick={() => void openEditor()}
            >
              New article
            </button>
          </div>
          {loading ? (
            <p className={hintClassName}>Loading…</p>
          ) : items.length === 0 ? (
            <p className={hintClassName}>No articles yet.</p>
          ) : (
            <ul className="divide-y divide-[var(--line)] border-t border-[var(--line)]">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 py-3 text-left"
                    onClick={() => void openEditor(item)}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-[var(--ink)]">
                        {item.title || 'Untitled'}
                      </span>
                      <span className={hintClassName}>
                        {item.enabled ? 'Visible' : 'Hidden'}
                        {item.createdAt ? ` · ${formatDate(item.createdAt)}` : ''}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
