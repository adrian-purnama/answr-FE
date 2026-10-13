import { useEffect, useState, type ReactNode } from 'react'
import { ChevronRight, MessageCircle } from 'lucide-react'
import WidgetFaqList from '#/components/widget/WidgetFaqList'
import WidgetNewsCard from '#/components/widget/WidgetNewsCard'
import { cn } from '#/lib/utils'
import {
  getPublicNewsList,
  type PublicNewsListItem,
} from '#/lib/news'
import {
  getPublicWidgetFaqContent,
  type HomeSectionElement,
  type PublicFaqContent,
  type WidgetHomeSettings,
} from '#/lib/widget'

function sectionCardClass(darkMode?: boolean): string {
  return cn(
    'rounded-[1.25rem] shadow-[0_8px_30px_rgba(0,0,0,0.08)] ring-1',
    darkMode
      ? 'bg-neutral-900/95 text-neutral-50 ring-white/10 shadow-black/40'
      : 'bg-white text-neutral-900 ring-black/[0.04]',
  )
}

function SectionContent({
  element,
  darkMode,
  onGoToChat,
  faqContent,
  onOpenArticle,
  publicKey,
  newsItems,
  onOpenNews,
}: {
  element: HomeSectionElement
  darkMode?: boolean
  onGoToChat?: () => void
  faqContent?: PublicFaqContent | null
  onOpenArticle?: (articleId: string, topicIds: string[]) => void
  publicKey?: string
  newsItems?: PublicNewsListItem[]
  onOpenNews?: (newsId: string) => void
}): ReactNode {
  switch (element.type) {
    case 'goToChat':
      return (
        <button
          type="button"
          className={cn(
            'flex w-full items-start gap-3 px-4 py-3.5 text-left transition',
            sectionCardClass(darkMode),
            darkMode ? 'hover:bg-neutral-800' : 'hover:bg-neutral-50',
          )}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onGoToChat?.()
          }}
        >
          <span
            className={cn(
              'mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full',
              darkMode ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-50 text-emerald-700',
            )}
          >
            <MessageCircle className="size-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold tracking-tight">
              {element.label || 'Go to chat'}
            </span>
            {element.subtitle ? (
              <span
                className={cn(
                  'mt-0.5 block text-xs leading-snug',
                  darkMode ? 'text-neutral-400' : 'text-neutral-500',
                )}
              >
                {element.subtitle}
              </span>
            ) : null}
          </span>
          <ChevronRight
            className={cn(
              'mt-1 size-4 shrink-0',
              darkMode ? 'text-neutral-500' : 'text-neutral-400',
            )}
            aria-hidden
          />
        </button>
      )
    case 'latestNews': {
      const items = (newsItems ?? []).slice(0, element.limit)
      if (items.length === 0 && !element.title) return null
      return (
        <div className={cn('overflow-hidden', sectionCardClass(darkMode))}>
          {element.title ? (
            <p className="truncate px-4 pt-3.5 text-[13px] font-semibold">
              {element.title}
            </p>
          ) : null}
          <div
            className={cn(
              'flex flex-col gap-2.5 px-3 pb-3',
              element.title ? 'pt-2' : 'pt-3',
            )}
          >
            {items.map((item) => (
              <WidgetNewsCard
                key={item.id}
                item={item}
                publicKey={publicKey}
                darkMode={darkMode}
                embedded
                onOpen={(id) => onOpenNews?.(id)}
              />
            ))}
          </div>
        </div>
      )
    }
    case 'faq':
      return (
        <WidgetFaqList
          title={element.title}
          enableSearch={element.enableSearch !== false}
          searchPlaceholder={element.searchPlaceholder}
          entries={element.entries}
          darkMode={darkMode}
          faqContent={faqContent}
          onOpenArticle={onOpenArticle}
        />
      )
    case 'linkCard':
      return (
        <a
          href={element.url || '#'}
          target={element.openInNewTab ? '_blank' : undefined}
          rel={element.openInNewTab ? 'noreferrer' : undefined}
          className={cn(
            'block px-4 py-3.5 transition',
            sectionCardClass(darkMode),
            darkMode ? 'hover:bg-neutral-800' : 'hover:bg-neutral-50',
          )}
          onClick={(e) => {
            if (!onOpenArticle && !onGoToChat) e.preventDefault()
          }}
        >
          {element.title ? (
            <p
              className={cn(
                'text-[11px] font-semibold',
                darkMode ? 'text-neutral-400' : 'text-neutral-500',
              )}
            >
              {element.title}
            </p>
          ) : null}
          <p className="mt-0.5 truncate text-[15px] font-semibold tracking-tight">
            {element.label || 'Learn more'}
          </p>
          <p
            className={cn(
              'mt-0.5 truncate text-xs',
              darkMode ? 'text-neutral-400' : 'text-neutral-500',
            )}
          >
            {element.url}
          </p>
        </a>
      )
  }
}

type HomeSectionsProps = {
  homeSettings: WidgetHomeSettings
  className?: string
  darkMode?: boolean
  /** Resolved public/absolute URL for homeSettings.logo */
  logoUrl?: string
  publicKey?: string
  onGoToChat?: () => void
  onOpenArticle?: (articleId: string, topicIds: string[]) => void
  onOpenNews?: (newsId: string) => void
  /** When true, leave top space for close/exit chrome. */
  chromeOffset?: boolean
}

export default function HomeSections({
  homeSettings,
  className,
  darkMode = false,
  logoUrl,
  publicKey,
  onGoToChat,
  onOpenArticle,
  onOpenNews,
  chromeOffset = false,
}: HomeSectionsProps) {
  const elements = homeSettings.elements
  const hasFaq = elements.some((el) => el.type === 'faq')
  const newsLimit = elements.reduce(
    (max, el) => (el.type === 'latestNews' ? Math.max(max, el.limit) : max),
    0,
  )
  const [faqContent, setFaqContent] = useState<PublicFaqContent | null>(null)
  const [newsItems, setNewsItems] = useState<PublicNewsListItem[]>([])

  useEffect(() => {
    if (!publicKey || !hasFaq) {
      setFaqContent(null)
      return
    }
    let cancelled = false
    async function load() {
      try {
        const response = await getPublicWidgetFaqContent(publicKey!)
        if (!cancelled && response.success && response.data) {
          setFaqContent(response.data)
        }
      } catch {
        if (!cancelled) setFaqContent(null)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [publicKey, hasFaq, homeSettings.elements])

  useEffect(() => {
    if (!publicKey || newsLimit < 1) {
      setNewsItems([])
      return
    }
    let cancelled = false
    async function load() {
      try {
        const response = await getPublicNewsList(publicKey!, newsLimit)
        if (!cancelled && response.success && response.data) {
          setNewsItems(response.data)
        }
      } catch {
        if (!cancelled) setNewsItems([])
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [publicKey, newsLimit, homeSettings.elements])

  const greeting = homeSettings.greeting?.trim()
  const greetingColor = homeSettings.greetingColor?.trim()

  return (
    <div
      className={cn(
        'flex w-full flex-col px-6 pb-6',
        chromeOffset ? 'pt-2' : 'pt-3',
        className,
      )}
    >
      {logoUrl ? (
        <div className={cn(chromeOffset ? 'mt-2' : 'mt-1')}>
          <img
            src={logoUrl}
            alt=""
            className="h-12 max-w-[120px] object-contain object-left drop-shadow-sm"
            draggable={false}
          />
        </div>
      ) : null}

      {/* Gap from logo (or chrome) down to greeting */}
      <div className={cn(logoUrl ? 'mt-8' : chromeOffset ? 'mt-8' : 'mt-6')} />

      {greeting ? (
        <h1
          className={cn(
            'max-w-[18ch] text-[1.65rem] leading-[1.15] font-semibold tracking-tight whitespace-pre-line',
            !greetingColor && (darkMode ? 'text-white' : 'text-neutral-900'),
          )}
          style={greetingColor ? { color: greetingColor } : undefined}
        >
          {greeting}
        </h1>
      ) : null}

      {/* Short gap from greeting to first card */}
      <div className={cn('flex flex-col gap-3', greeting ? 'mt-4' : 'mt-2')}>
        {elements.length === 0 ? (
          <div
            className={cn(
              'flex h-24 items-center justify-center text-sm',
              sectionCardClass(darkMode),
              darkMode ? 'text-neutral-500' : 'text-neutral-400',
            )}
          >
            No sections yet
          </div>
        ) : (
          elements.map((element) => (
            <SectionContent
              key={element.id}
              element={element}
              darkMode={darkMode}
              onGoToChat={onGoToChat}
              onOpenArticle={onOpenArticle}
              onOpenNews={onOpenNews}
              publicKey={publicKey}
              newsItems={newsItems}
              faqContent={faqContent}
            />
          ))
        )}
      </div>
    </div>
  )
}
