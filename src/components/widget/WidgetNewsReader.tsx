import { useEffect, useState } from 'react'
import { ArrowLeft, Maximize2, Minimize2 } from 'lucide-react'
import WidgetChromeActions from '#/components/widget/WidgetChromeActions'
import { cn } from '#/lib/utils'
import {
  getPublicNews,
  newsHtmlWithPublicSrcs,
  type PublicNewsDetail,
} from '#/lib/news'
import { widgetPublicMediaPath } from '#/lib/widget'

function sanitizeNewsHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '')
}

type WidgetNewsReaderProps = {
  publicKey: string
  newsId: string
  darkMode?: boolean
  expanded: boolean
  onToggleExpanded: () => void
  onBack: () => void
}

export default function WidgetNewsReader({
  publicKey,
  newsId,
  darkMode = false,
  expanded,
  onToggleExpanded,
  onBack,
}: WidgetNewsReaderProps) {
  const [article, setArticle] = useState<PublicNewsDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const response = await getPublicNews(publicKey, newsId)
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
  }, [publicKey, newsId])

  const chromeBtn = cn(
    'flex size-8 items-center justify-center rounded-full transition',
    darkMode
      ? 'text-neutral-300 hover:bg-white/10 hover:text-white'
      : 'text-neutral-600 hover:bg-black/5 hover:text-neutral-900',
  )

  const bodyHtml = article
    ? sanitizeNewsHtml(newsHtmlWithPublicSrcs(article.content, publicKey))
    : ''
  const showCta = Boolean(
    article?.cta.enabled && article.cta.text.trim() && article.cta.url.trim(),
  )
  const heroUrl =
    article?.heroImage && publicKey
      ? widgetPublicMediaPath(publicKey, article.heroImage)
      : ''

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

      <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
        {loading ? (
          <p
            className={cn(
              'px-5 py-12 text-center text-sm',
              darkMode ? 'text-neutral-500' : 'text-neutral-400',
            )}
          >
            Loading…
          </p>
        ) : null}
        {error ? (
          <p className="px-5 py-12 text-center text-sm text-red-500">{error}</p>
        ) : null}
        {article && !loading ? (
          <>
            {heroUrl ? (
              <img
                src={heroUrl}
                alt=""
                className="mb-5 max-h-56 w-full object-cover"
              />
            ) : null}
            <div className="px-5 pb-8">
              <h1 className="break-words text-[1.65rem] leading-tight font-semibold tracking-tight">
                {article.title}
              </h1>
              <div
                className={cn(
                  'article-body mt-5 max-w-full overflow-x-hidden break-words text-[15px] leading-7 [overflow-wrap:anywhere] [&_a]:underline [&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_img]:my-4 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg [&_li]:my-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-4 [&_strong]:font-semibold [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5',
                  darkMode
                    ? 'text-neutral-200 [&_a]:text-white [&_blockquote]:border-white/20'
                    : 'text-neutral-700 [&_a]:text-neutral-900 [&_blockquote]:border-black/15',
                )}
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
              />
              {showCta ? (
                <a
                  href={article.cta.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'mt-6 inline-flex rounded-full px-4 py-2 text-sm font-medium transition',
                    darkMode
                      ? 'bg-white text-neutral-950 hover:bg-neutral-200'
                      : 'bg-neutral-950 text-white hover:bg-neutral-800',
                  )}
                >
                  {article.cta.text}
                </a>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
