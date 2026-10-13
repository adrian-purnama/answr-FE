import type { LucideIcon } from 'lucide-react'
import { cardClassName, hintClassName } from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

export type MetricTone = 'accent' | 'amber' | 'muted'

const TONE_CLASS: Record<MetricTone, string> = {
  accent: 'bg-[var(--primary)]/10 text-[var(--primary)]',
  amber: 'bg-amber-50 text-amber-800',
  muted: 'bg-[var(--surface)] text-[var(--muted)]',
}

type MetricCardProps = {
  label: string
  value: string | number
  hint?: string
  icon: LucideIcon
  tone?: MetricTone
  active?: boolean
  onClick?: () => void
}

export default function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'muted',
  active,
  onClick,
}: MetricCardProps) {
  const interactive = Boolean(onClick)
  const Comp = interactive ? 'button' : 'div'

  return (
    <Comp
      type={interactive ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        cardClassName,
        'px-4 py-4 text-left transition',
        interactive && 'hover:bg-[var(--surface)]',
        active && 'ring-1 ring-[var(--ink)]/20',
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'inline-flex size-7 shrink-0 items-center justify-center rounded-md',
            TONE_CLASS[tone],
          )}
        >
          <Icon className="size-3.5" aria-hidden />
        </span>
        <p className={hintClassName}>{label}</p>
      </div>
      <p className="mt-3 text-3xl font-medium tabular-nums text-[var(--ink)]">
        {value}
      </p>
      {hint ? <p className={cn(hintClassName, 'mt-1 text-xs')}>{hint}</p> : null}
    </Comp>
  )
}
