import { useEffect, useMemo, useState } from 'react'
import { ChevronRight, Search } from 'lucide-react'
import { cn } from '#/lib/utils'
import {
  getPublicWidgetFaqContent,
  type HomeFaqEntry,
  type PublicFaqArticle,
  type PublicFaqContent,
} from '#/lib/widget'

function sectionCardClass(darkMode?: boolean): string {
  return cn(
    'rounded-[1.25rem] shadow-[0_8px_30px_rgba(0,0,0,0.08)] ring-1',
    darkMode
      ? 'bg-neutral-900/95 text-neutral-50 ring-white/10 shadow-black/40'
      : 'bg-white text-neutral-900 ring-black/[0.04]',
  )
}

type WidgetFaqListProps = {
  title?: string
  enableSearch?: boolean
  searchPlaceholder?: string
  entries: HomeFaqEntry[]
  darkMode?: boolean
  publicKey?: string
  onOpenArticle?: (articleId: string, topicIds: string[]) => void
  /** When true, skip fetching and use provided content. */
  faqContent?: PublicFaqContent | null
  className?: string
}

export default function WidgetFaqList({
  title,
  enableSearch = true,
  searchPlaceholder = 'Search for help',
  entries,
  darkMode = false,
  publicKey,
  onOpenArticle,
  faqContent: faqContentProp,
  className,
}: WidgetFaqListProps) {
  const [query, setQuery] = useState('')
  const [loadedContent, setLoadedContent] = useState<PublicFaqContent | null>(
    null,
  )
  const shouldFetch = faqContentProp === undefined && Boolean(publicKey)

  useEffect(() => {
    if (!shouldFetch || !publicKey) {
      if (faqContentProp === undefined) setLoadedContent(null)
      return
    }
    let cancelled = false
    async function load() {
      try {
        const response = await getPublicWidgetFaqContent(publicKey!)
        if (!cancelled && response.success && response.data) {
          setLoadedContent(response.data)
        }
      } catch {
        if (!cancelled) setLoadedContent(null)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [faqContentProp, publicKey, shouldFetch, entries])

  const faqContent = faqContentProp !== undefined ? faqContentProp : loadedContent
  const placeholder = searchPlaceholder.trim() || 'Search for help'

  const articleMap = useMemo(
    () => new Map((faqContent?.articles ?? []).map((a) => [a.id, a] as const)),
    [faqContent],
  )

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return entries
      .map((entry) => {
        const article: PublicFaqArticle | undefined = articleMap.get(
          entry.articleId,
        )
        return { entry, article }
      })
      .filter(({ article }) => {
        if (!needle) return true
        if (!article) return false
        return article.title.toLowerCase().includes(needle)
      })
  }, [articleMap, entries, query])

  return (
    <div className={cn('overflow-hidden', sectionCardClass(darkMode), className)}>
      {title ? (
        <p className="truncate px-4 pt-3.5 text-[13px] font-semibold">{title}</p>
      ) : null}

      {enableSearch ? (
        <div className={cn('px-3', title ? 'pt-2' : 'pt-3')}>
          <label className="relative block">
            <span className="sr-only">{placeholder}</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className={cn(
                'w-full rounded-xl py-2.5 pr-10 pl-3.5 text-sm outline-none transition',
                darkMode
                  ? 'bg-neutral-800/80 text-neutral-50 placeholder:text-neutral-500 focus:ring-1 focus:ring-white/20'
                  : 'bg-neutral-100 text-neutral-900 placeholder:text-neutral-400 focus:ring-1 focus:ring-neutral-300',
              )}
            />
            <Search
              className={cn(
                'pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2',
                darkMode ? 'text-emerald-400' : 'text-emerald-600',
              )}
              aria-hidden
            />
          </label>
        </div>
      ) : null}

      <div className="pt-1">
        {rows.length === 0 ? (
          <p
            className={cn(
              'px-4 py-3 text-xs',
              darkMode ? 'text-neutral-500' : 'text-neutral-400',
            )}
          >
            {query.trim() ? 'No matching articles' : 'No articles selected'}
          </p>
        ) : (
          rows.map(({ entry, article }, index) => {
            const showDivider = index < rows.length - 1
            if (!article) {
              return (
                <div
                  key={entry.articleId}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3.5 text-sm opacity-50',
                    showDivider &&
                      (darkMode
                        ? 'border-b border-white/5'
                        : 'border-b border-black/5'),
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">
                    Article unavailable
                  </span>
                </div>
              )
            }
            if (!article.enabled) {
              return (
                <div
                  key={entry.articleId}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3.5 text-sm',
                    showDivider &&
                      (darkMode
                        ? 'border-b border-white/5'
                        : 'border-b border-black/5'),
                  )}
                >
                  <span className="min-w-0 flex-1 truncate font-medium opacity-70">
                    {article.title}
                  </span>
                  <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 uppercase">
                    Disabled
                  </span>
                </div>
              )
            }
            return (
              <button
                key={entry.articleId}
                type="button"
                className={cn(
                  'flex w-full items-center gap-2 px-4 py-3.5 text-left text-[15px] font-medium transition',
                  darkMode ? 'hover:bg-white/[0.04]' : 'hover:bg-neutral-50',
                  showDivider &&
                    (darkMode
                      ? 'border-b border-white/5'
                      : 'border-b border-black/5'),
                )}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onOpenArticle?.(entry.articleId, entry.topicIds)
                }}
              >
                <span className="min-w-0 flex-1 truncate">{article.title}</span>
                <ChevronRight
                  className={cn(
                    'size-4 shrink-0',
                    darkMode ? 'text-emerald-400/80' : 'text-emerald-600/80',
                  )}
                  aria-hidden
                />
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
