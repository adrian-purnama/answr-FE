import { ChevronRight } from 'lucide-react'
import { cn } from '#/lib/utils'
import type { PublicNewsListItem } from '#/lib/news'
import { widgetPublicMediaPath } from '#/lib/widget'

type WidgetNewsCardProps = {
  item: PublicNewsListItem
  publicKey?: string
  darkMode?: boolean
  /** Flat row styling when nested inside a parent section card. */
  embedded?: boolean
  onOpen: (newsId: string) => void
}

export default function WidgetNewsCard({
  item,
  publicKey,
  darkMode = false,
  embedded = false,
  onOpen,
}: WidgetNewsCardProps) {
  const cover =
    item.heroImage && publicKey
      ? widgetPublicMediaPath(publicKey, item.heroImage)
      : ''

  return (
    <button
      type="button"
      className={cn(
        'w-full overflow-hidden text-left transition',
        embedded
          ? cn(
              'rounded-xl ring-1',
              darkMode
                ? 'bg-neutral-800/60 text-neutral-50 ring-white/10 hover:bg-neutral-800'
                : 'bg-neutral-50 text-neutral-900 ring-black/[0.04] hover:bg-neutral-100',
            )
          : cn(
              'rounded-[1.25rem] shadow-[0_8px_30px_rgba(0,0,0,0.08)] ring-1',
              darkMode
                ? 'bg-neutral-900/95 text-neutral-50 ring-white/10 hover:bg-neutral-800'
                : 'bg-white text-neutral-900 ring-black/[0.04] hover:bg-neutral-50',
            ),
      )}
      onClick={() => onOpen(item.id)}
    >
      {cover ? (
        <img
          src={cover}
          alt=""
          className="aspect-[2/1] w-full object-cover"
        />
      ) : null}
      <span className="block px-4 py-2.5">
        <span className="block text-[15px] leading-snug font-semibold tracking-tight">
          {item.title}
        </span>
        {item.excerpt ? (
          <span className="mt-1 flex items-start gap-2">
            <span
              className={cn(
                'min-w-0 flex-1 line-clamp-2 text-sm leading-snug',
                darkMode ? 'text-neutral-400' : 'text-neutral-500',
              )}
            >
              {item.excerpt}
            </span>
            <ChevronRight
              className={cn(
                'mt-0.5 size-4 shrink-0',
                darkMode ? 'text-neutral-500' : 'text-neutral-400',
              )}
              aria-hidden
            />
          </span>
        ) : (
          <span className="mt-1 flex justify-end">
            <ChevronRight
              className={cn(
                'size-4',
                darkMode ? 'text-neutral-500' : 'text-neutral-400',
              )}
              aria-hidden
            />
          </span>
        )}
      </span>
    </button>
  )
}
