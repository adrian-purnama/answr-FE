import { CalendarDays, Headset, Loader2 } from 'lucide-react'
import { cn } from '#/lib/utils'

export type ToolUiKind = 'live_agent' | 'meeting'

type WidgetToolLoadingCardProps = {
  kind: ToolUiKind
  status: 'loading' | 'error'
  topicName?: string
  message?: string
  darkMode?: boolean
  onRetry?: () => void
}

export default function WidgetToolLoadingCard({
  kind,
  status,
  topicName,
  message,
  darkMode = false,
  onRetry,
}: WidgetToolLoadingCardProps) {
  const shell = cn(
    'mt-3 w-full max-w-sm rounded-2xl border px-3 py-3 text-left',
    darkMode
      ? 'border-white/15 bg-white/5 text-white'
      : 'border-neutral-200 bg-white text-neutral-950',
  )
  const muted = darkMode ? 'text-white/65' : 'text-neutral-500'
  const Icon = kind === 'live_agent' ? Headset : CalendarDays
  const title =
    kind === 'live_agent'
      ? status === 'error'
        ? 'Could not prepare live support'
        : 'Preparing live support…'
      : status === 'error'
        ? 'Could not load meeting times'
        : 'Loading available meeting times…'
  const detail =
    status === 'error'
      ? message || 'Something went wrong. Please try again.'
      : kind === 'meeting'
        ? topicName
          ? `Getting the calendar ready for ${topicName}.`
          : 'Getting the calendar ready.'
        : 'Connecting you with a support option.'

  return (
    <div className={shell} role="status" aria-live="polite">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full',
            darkMode ? 'bg-white/10' : 'bg-neutral-100',
          )}
        >
          {status === 'loading' ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Icon className="size-4" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{title}</p>
          <p className={cn('mt-0.5 text-xs', muted)}>{detail}</p>
          {status === 'loading' ? (
            <div className="mt-3 space-y-2">
              <div
                className={cn(
                  'h-2.5 w-3/4 animate-pulse rounded',
                  darkMode ? 'bg-white/10' : 'bg-neutral-100',
                )}
              />
              <div
                className={cn(
                  'h-2.5 w-1/2 animate-pulse rounded',
                  darkMode ? 'bg-white/10' : 'bg-neutral-100',
                )}
              />
            </div>
          ) : onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className={cn(
                'mt-3 inline-flex rounded-full px-3 py-1.5 text-xs font-medium',
                darkMode
                  ? 'bg-white text-black hover:bg-white/90'
                  : 'bg-neutral-950 text-white hover:opacity-90',
              )}
            >
              Retry
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
