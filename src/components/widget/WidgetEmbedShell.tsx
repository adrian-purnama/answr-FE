import { cn } from '#/lib/utils'
import {
  widgetShellAlignClass,
  type WidgetCorner,
} from '#/lib/widget'

type WidgetEmbedShellProps = {
  className?: string
  loading?: boolean
  error?: string | null
  corner?: WidgetCorner
  /** Closed FAB visibility (animated from WidgetApp when both are mounted). */
  closed?: boolean
  onOpen?: () => void
  /** Public or owned URL for the launcher badge (png/jpg/gif). Shown uncropped. */
  badgeImageUrl?: string | null
  /** Extra classes for the FAB wrapper (open/close transitions). */
  fabClassName?: string
}

function DefaultBadgeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-6"
      fill="currentColor"
      aria-hidden
    >
      <rect x="4" y="14" width="3" height="6" rx="1" />
      <rect x="10.5" y="10" width="3" height="10" rx="1" />
      <rect x="17" y="6" width="3" height="14" rx="1" />
    </svg>
  )
}

/**
 * Presentational embed chrome: loading, unavailable, and closed FAB.
 */
export default function WidgetEmbedShell({
  className,
  loading,
  error,
  corner = 'bottom-right',
  closed,
  onOpen,
  badgeImageUrl,
  fabClassName,
}: WidgetEmbedShellProps) {
  if (loading) {
    return (
      <div
        className={cn(
          'flex h-full w-full bg-transparent p-4',
          widgetShellAlignClass(corner),
          className,
        )}
      >
        <div className="size-14 animate-pulse rounded-full bg-neutral-900/20" />
      </div>
    )
  }

  if (error) {
    return (
      <div
        className={cn(
          'flex h-full w-full flex-col gap-2 bg-transparent p-4',
          widgetShellAlignClass(corner),
          className,
        )}
      >
        <div className="max-w-xs rounded-2xl bg-white/95 px-4 py-3 text-left shadow-lg ring-1 ring-black/10">
          <p className="text-sm font-medium text-neutral-800">Widget unavailable</p>
          <p className="mt-1 text-sm text-neutral-600">{error}</p>
        </div>
      </div>
    )
  }

  if (closed) {
    const hasBadge = Boolean(badgeImageUrl)
    return (
      <div
        className={cn(
          'flex h-full w-full bg-transparent p-4',
          widgetShellAlignClass(corner),
          className,
        )}
      >
        <div className={cn(fabClassName)}>
          <button
            type="button"
            onClick={onOpen}
            className={cn(
              'transition hover:opacity-90',
              hasBadge
                ? 'flex max-h-20 max-w-20 items-center justify-center bg-transparent p-0'
                : 'flex size-14 items-center justify-center rounded-full bg-neutral-950 text-white shadow-lg hover:bg-neutral-800',
            )}
            aria-label="Open widget"
          >
            {hasBadge ? (
              <img
                src={badgeImageUrl!}
                alt=""
                className="max-h-20 max-w-20 object-contain"
                draggable={false}
              />
            ) : (
              <DefaultBadgeIcon />
            )}
          </button>
        </div>
      </div>
    )
  }

  return null
}

export { DefaultBadgeIcon }
