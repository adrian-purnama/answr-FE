import { LogOut, X } from 'lucide-react'
import { useWidgetRuntime } from '#/components/widget/context/WidgetRuntimeContext'
import { cn } from '#/lib/utils'

type WidgetChromeActionsProps = {
  /** `overlay` = floating home chrome; `header` = in-page toolbars */
  variant?: 'overlay' | 'header'
  className?: string
}

export default function WidgetChromeActions({
  variant = 'header',
  className,
}: WidgetChromeActionsProps) {
  const { darkMode, onClose, onExit } = useWidgetRuntime()

  if (!onClose && !onExit) return null

  const buttonClass =
    variant === 'overlay'
      ? // White + difference: reads as white on dark areas, black on light areas
        'pointer-events-auto flex size-8 items-center justify-center rounded-full text-white mix-blend-difference transition hover:opacity-80'
      : cn(
          'flex size-8 items-center justify-center rounded-full transition',
          darkMode
            ? 'text-neutral-300 hover:text-white'
            : 'text-neutral-600 hover:text-neutral-900',
        )

  return (
    <div
      className={cn(
        'flex items-center gap-0.5',
        variant === 'overlay' && 'pointer-events-none',
        className,
      )}
    >
      {onExit ? (
        <button
          type="button"
          onClick={() => void onExit()}
          className={buttonClass}
          aria-label="End session"
        >
          <LogOut className="size-4" strokeWidth={2.25} />
        </button>
      ) : null}
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className={buttonClass}
          aria-label="Close widget"
        >
          <X className="size-4" strokeWidth={2.25} />
        </button>
      ) : null}
    </div>
  )
}
