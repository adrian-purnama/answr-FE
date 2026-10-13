import { cn } from '#/lib/utils'

type WidgetRatingPromptProps = {
  darkMode?: boolean
  title?: string
  submitting: boolean
  stars: number
  feedback: string
  onStars: (stars: number) => void
  onFeedback: (value: string) => void
  onSubmit: () => void
  onSkip?: () => void
  error?: string | null
}

export default function WidgetRatingPrompt({
  darkMode = false,
  title = 'Rate this conversation',
  submitting,
  stars,
  feedback,
  onStars,
  onFeedback,
  onSubmit,
  onSkip,
  error,
}: WidgetRatingPromptProps) {
  return (
    <div
      className={cn(
        'w-full space-y-2 rounded-2xl border p-3 text-left',
        darkMode ? 'border-white/10' : 'border-neutral-200',
      )}
    >
      <p className="text-xs font-medium">{title}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={cn(
              'size-8 rounded text-sm font-semibold',
              stars >= star
                ? 'bg-amber-400 text-amber-950'
                : darkMode
                  ? 'bg-neutral-800 text-neutral-300'
                  : 'bg-neutral-100 text-neutral-500',
            )}
            onClick={() => onStars(star)}
          >
            {star}
          </button>
        ))}
      </div>
      <textarea
        value={feedback}
        onChange={(e) => onFeedback(e.target.value)}
        placeholder="Optional feedback"
        rows={2}
        className={cn(
          'w-full rounded-lg border px-2 py-1.5 text-xs outline-none',
          darkMode
            ? 'border-white/10 bg-neutral-900 text-neutral-50'
            : 'border-neutral-200 bg-white text-neutral-900',
        )}
      />
      {error ? (
        <p className={cn('text-[11px]', darkMode ? 'text-red-300' : 'text-red-600')}>
          {error}
        </p>
      ) : null}
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={stars < 1 || submitting}
          onClick={onSubmit}
          className={cn(
            'rounded-full px-3 py-1.5 text-xs font-medium disabled:opacity-50',
            darkMode ? 'bg-white text-neutral-950' : 'bg-neutral-900 text-white',
          )}
        >
          {submitting ? 'Submitting…' : 'Submit rating'}
        </button>
        {onSkip ? (
          <button
            type="button"
            disabled={submitting}
            onClick={onSkip}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs',
              darkMode ? 'text-neutral-400' : 'text-neutral-500',
            )}
          >
            Skip
          </button>
        ) : null}
      </div>
    </div>
  )
}
