import { Gauge } from 'lucide-react'
import { cardClassName, hintClassName } from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

type PriorityMeterProps = {
  percent: number
  loading?: boolean
}

/** Semicircle track geometry (viewBox 0 0 120 70). */
const CX = 60
const CY = 60
const R = 46
const STROKE = 8

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180
  return {
    x: cx + r * Math.cos(rad),
    y: cy - r * Math.sin(rad),
  }
}

function arcPath(fromDeg: number, toDeg: number) {
  const start = polar(CX, CY, R, fromDeg)
  const end = polar(CX, CY, R, toDeg)
  const sweep = fromDeg - toDeg
  const largeArc = sweep > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${R} ${R} 0 ${largeArc} 1 ${end.x} ${end.y}`
}

const TRACK = arcPath(180, 0)

export default function PriorityMeter({
  percent,
  loading,
}: PriorityMeterProps) {
  const safe = Math.max(0, Math.min(100, Math.round(percent)))
  const endAngle = 180 - (safe / 100) * 180
  const fill = safe > 0 ? arcPath(180, endAngle) : ''

  if (loading) {
    return (
      <div className={cn(cardClassName, 'px-4 py-4')}>
        <div className="animate-pulse space-y-2">
          <div className="h-3 w-24 bg-[var(--surface)]" />
          <div className="mx-auto h-16 w-28 rounded-t-full bg-[var(--surface)]" />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(cardClassName, 'px-4 py-4')}
      role="meter"
      aria-label="Priority meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safe}
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-[var(--primary)]/10 text-[var(--primary)]">
          <Gauge className="size-3.5" aria-hidden />
        </span>
        <p className={hintClassName}>After Burner</p>
      </div>
      <div className="relative mx-auto mt-2 w-[7.5rem]">
        <svg
          viewBox="0 0 120 70"
          className="block h-auto w-full"
          aria-hidden
        >
          <path
            d={TRACK}
            fill="none"
            stroke="var(--line)"
            strokeWidth={STROKE}
            strokeLinecap="round"
          />
          {fill ? (
            <path
              d={fill}
              fill="none"
              stroke="var(--primary)"
              strokeWidth={STROKE}
              strokeLinecap="round"
            />
          ) : null}
        </svg>
        <p className="absolute inset-x-0 bottom-0 text-center text-2xl font-medium tabular-nums text-[var(--ink)]">
          {safe}%
        </p>
      </div>
    </div>
  )
}
