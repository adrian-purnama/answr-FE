import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ChevronDown, Maximize2, Minimize2 } from 'lucide-react'
import WidgetChromeActions from '#/components/widget/WidgetChromeActions'
import { topicContentToHtml } from '#/lib/articleContent'
import { parseContentToBlocks, serializeContentBlocks } from '#/lib/contentReferences'
import { cn } from '#/lib/utils'
import {
  getPublicWidgetArticle,
  widgetPublicArticleMediaPath,
  type PublicArticleDetail,
  type PublicArticleTopic,
} from '#/lib/widget'

function sanitizeArticleHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '')
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
}

function topicBodyHtml(
  topic: PublicArticleTopic,
  publicKey: string,
): string {
  const parts: string[] = []
  for (const block of parseContentToBlocks(topic.topicContent)) {
    if (block.type === 'text') {
      const html = topicContentToHtml(block.content)
      if (html) parts.push(html)
    } else if (block.type === 'image') {
      const src = widgetPublicArticleMediaPath(publicKey, block.id)
      parts.push(
        `<p><img src="${escapeAttr(src)}" alt="${escapeAttr(block.alt ?? '')}" /></p>`,
      )
    } else {
      const token = serializeContentBlocks([block])
      if (token) {
        parts.push(`<p>${escapeAttr(token)}</p>`)
      }
    }
  }
  return sanitizeArticleHtml(parts.join(''))
}

type WidgetArticleReaderProps = {
  publicKey: string
  articleId: string
  topicIds: string[]
  darkMode?: boolean
  expanded: boolean
  onToggleExpanded: () => void
  onBack: () => void
}

export default function WidgetArticleReader({
  publicKey,
  articleId,
  topicIds,
  darkMode = false,
  expanded,
  onToggleExpanded,
  onBack,
}: WidgetArticleReaderProps) {
  const [article, setArticle] = useState<PublicArticleDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tocOpen, setTocOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const response = await getPublicWidgetArticle(publicKey, articleId)
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Article not found')
        }
        if (!cancelled) setArticle(response.data)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load')
          setArticle(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [publicKey, articleId])

  const topics = useMemo(() => {
    if (!article) return []
    const enabled = article.topics.filter((t) => t.enabled)
    if (topicIds.length === 0) return enabled
    const allow = new Set(topicIds)
    return enabled.filter((t) => allow.has(t.id))
  }, [article, topicIds])

  function scrollToTopic(id: string) {
    const el = scrollRef.current?.querySelector(`[data-topic-id="${id}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setTocOpen(false)
  }

  const chromeBtn = cn(
    'flex size-8 items-center justify-center rounded-full transition',
    darkMode
      ? 'text-neutral-300 hover:bg-white/10 hover:text-white'
      : 'text-neutral-600 hover:bg-black/5 hover:text-neutral-900',
  )

  return (
    <div
      className={cn(
        'flex h-full min-h-0 min-w-0 w-full flex-col overflow-x-hidden',
        darkMode ? 'bg-neutral-950 text-neutral-50' : 'bg-white text-neutral-900',
      )}
    >
      <div className="flex shrink-0 items-center justify-between px-3 pt-3 pb-2">
        <button type="button" className={chromeBtn} onClick={onBack} aria-label="Back">
          <ArrowLeft className="size-4" />
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={chromeBtn}
            onClick={onToggleExpanded}
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? (
              <Minimize2 className="size-4" />
            ) : (
              <Maximize2 className="size-4" />
            )}
          </button>
          <WidgetChromeActions />
        </div>
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-5 pb-8"
      >
        {loading ? (
          <p
            className={cn(
              'py-12 text-center text-sm',
              darkMode ? 'text-neutral-500' : 'text-neutral-400',
            )}
          >
            Loading…
          </p>
        ) : null}
        {error ? (
          <p className="py-12 text-center text-sm text-red-500">{error}</p>
        ) : null}
        {article && !article.enabled ? (
          <div className="py-8">
            <h1 className="break-words text-2xl font-semibold tracking-tight">
              {article.title}
            </h1>
            <p className="mt-3 text-sm text-amber-600">This article is disabled.</p>
          </div>
        ) : null}
        {article && article.enabled ? (
          <>
            <h1 className="break-words text-[1.65rem] leading-tight font-semibold tracking-tight">
              {article.title}
            </h1>
            {article.description ? (
              <p
                className={cn(
                  'mt-2 break-words text-sm leading-relaxed',
                  darkMode ? 'text-neutral-400' : 'text-neutral-500',
                )}
              >
                {article.description}
              </p>
            ) : null}

            {topics.length > 0 ? (
              <div className="relative mt-6 max-w-full">
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium transition',
                    darkMode
                      ? 'bg-neutral-900 text-neutral-100 ring-1 ring-white/10'
                      : 'bg-neutral-100 text-neutral-800 ring-1 ring-black/5',
                  )}
                  onClick={() => setTocOpen((o) => !o)}
                >
                  Table of contents
                  <ChevronDown
                    className={cn(
                      'size-4 shrink-0 opacity-60 transition',
                      tocOpen && 'rotate-180',
                    )}
                  />
                </button>
                {tocOpen ? (
                  <div
                    className={cn(
                      'absolute inset-x-0 top-full z-10 mt-1 max-w-full overflow-hidden rounded-xl shadow-lg ring-1',
                      darkMode
                        ? 'bg-neutral-900 ring-white/10'
                        : 'bg-white ring-black/10',
                    )}
                  >
                    {topics.map((topic) => (
                      <button
                        key={topic.id}
                        type="button"
                        className={cn(
                          'block w-full truncate px-4 py-2.5 text-left text-sm transition',
                          darkMode
                            ? 'text-neutral-200 hover:bg-white/5'
                            : 'text-neutral-700 hover:bg-neutral-50',
                        )}
                        onClick={() => scrollToTopic(topic.id)}
                      >
                        {topic.topicName}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="mt-8 max-w-full space-y-10 overflow-x-hidden">
              {topics.map((topic) => (
                <section
                  key={topic.id}
                  data-topic-id={topic.id}
                  className="min-w-0 max-w-full"
                >
                  <h2 className="mb-3 break-words text-lg font-semibold tracking-tight">
                    {topic.topicName}
                  </h2>
                  <div
                    className={cn(
                      'article-body max-w-full overflow-x-hidden break-words text-[15px] leading-7 [overflow-wrap:anywhere] [&_a]:underline [&_code]:break-all [&_img]:my-4 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg [&_li]:my-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-4 [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap [&_strong]:font-semibold [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5',
                      darkMode
                        ? 'text-neutral-200 [&_a]:text-white'
                        : 'text-neutral-700 [&_a]:text-neutral-900',
                    )}
                    dangerouslySetInnerHTML={{
                      __html: topicBodyHtml(topic, publicKey),
                    }}
                  />
                </section>
              ))}
              {topics.length === 0 ? (
                <p
                  className={cn(
                    'text-sm',
                    darkMode ? 'text-neutral-500' : 'text-neutral-400',
                  )}
                >
                  No topics to show.
                </p>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
