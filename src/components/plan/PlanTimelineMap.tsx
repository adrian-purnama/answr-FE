import type {
  UserPlan,
  UserPlanNextPeriod,
  UserPlanTimeline,
} from '#/context/planContext'
import { formatUtcDate } from '#/lib/duration'
import { hintClassName } from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

export type PendingPurchasePreview = {
  label: string
  effectiveDate: string
  untilDate: string
}

type PlanTimelineMapProps = {
  plan: UserPlan
  planExpiresAt: string | null
  neverExpires: boolean
  timeline: UserPlanTimeline | null
  nextPeriod: UserPlanNextPeriod | null
  nowMs: number
  /** Simulated period that would be added if a pending invoice is paid. */
  pendingPurchase?: PendingPurchasePreview | null
}

type MapSegment = {
  key: string
  label: string
  startMs: number
  endMs: number
  color: string
  kind: 'current' | 'future' | 'default_preview' | 'pending_purchase'
  openEnded?: boolean
}

function formatUtcShort(isoMs: number): string {
  return formatUtcDate(isoMs)
}

function appendPendingPurchase(
  segments: MapSegment[],
  horizonMs: number,
  pendingPurchase: PendingPurchasePreview | null | undefined,
): { segments: MapSegment[]; horizonMs: number } {
  if (!pendingPurchase) return { segments, horizonMs }
  const start = new Date(pendingPurchase.effectiveDate).getTime()
  const end = new Date(pendingPurchase.untilDate).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return { segments, horizonMs }
  }
  return {
    segments: [
      ...segments,
      {
        key: 'pending-purchase',
        label: pendingPurchase.label,
        startMs: start,
        endMs: end,
        color: 'var(--accent)',
        kind: 'pending_purchase',
      },
    ],
    horizonMs: Math.max(horizonMs, end),
  }
}

function buildSegments(
  plan: UserPlan,
  planExpiresAt: string | null,
  neverExpires: boolean,
  timeline: UserPlanTimeline | null,
  nextPeriod: UserPlanNextPeriod | null,
  nowMs: number,
  pendingPurchase?: PendingPurchasePreview | null,
): { segments: MapSegment[]; horizonMs: number } {
  const day = 24 * 60 * 60 * 1000
  const periods = timeline?.periods ?? []
  const future = periods
    .filter((p) => new Date(p.effectiveDate).getTime() > nowMs)
    .sort(
      (a, b) =>
        new Date(a.effectiveDate).getTime() -
        new Date(b.effectiveDate).getTime(),
    )

  if (neverExpires || !planExpiresAt) {
    // Pending purchase from an open-ended plan starts at "now" and replaces
    // the open period on pay. Don't draw a full-width open bar under it or
    // the labels stack on top of each other.
    if (pendingPurchase) {
      const start = new Date(pendingPurchase.effectiveDate).getTime()
      const end = new Date(pendingPurchase.untilDate).getTime()
      if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
        const segments: MapSegment[] = []
        if (start > nowMs) {
          segments.push({
            key: 'current-open',
            label: plan.name,
            startMs: nowMs,
            endMs: start,
            color: plan.accentColor,
            kind: 'current',
            openEnded: true,
          })
        }
        segments.push({
          key: 'pending-purchase',
          label: pendingPurchase.label,
          startMs: Math.max(start, nowMs),
          endMs: end,
          color: 'var(--accent)',
          kind: 'pending_purchase',
        })
        return {
          segments,
          horizonMs: Math.max(end, nowMs + day),
        }
      }
    }

    const baseHorizon = nowMs + 30 * day
    return {
      horizonMs: baseHorizon,
      segments: [
        {
          key: 'current-open',
          label: plan.name,
          startMs: nowMs,
          endMs: baseHorizon,
          color: plan.accentColor,
          kind: 'current' as const,
          openEnded: true,
        },
      ],
    }
  }

  const expiresMs = new Date(planExpiresAt).getTime()

  if (future.length > 0 || nextPeriod || pendingPurchase) {
    const segments: MapSegment[] = [
      {
        key: 'current',
        label: plan.name,
        startMs: nowMs,
        endMs: Math.max(expiresMs, nowMs),
        color: plan.accentColor,
        kind: 'current',
      },
    ]
    const listed = future.length > 0 ? future : []
    for (const p of listed) {
      const start = new Date(p.effectiveDate).getTime()
      const end = p.neverExpires
        ? Math.max(start + 14 * day, expiresMs + 14 * day)
        : new Date(p.untilDate).getTime()
      segments.push({
        key: p.id,
        label: p.planName ?? 'Plan',
        startMs: start,
        endMs: end,
        color: '#737373',
        kind: 'future',
        openEnded: p.neverExpires,
      })
    }
    if (listed.length === 0 && nextPeriod && !pendingPurchase) {
      const start = new Date(nextPeriod.effectiveDate).getTime()
      const end = nextPeriod.neverExpires
        ? start + 14 * day
        : new Date(nextPeriod.untilDate).getTime()
      segments.push({
        key: 'next',
        label: nextPeriod.planName ?? 'Next plan',
        startMs: start,
        endMs: end,
        color: '#737373',
        kind: 'future',
        openEnded: nextPeriod.neverExpires,
      })
    }
    const horizonMs = Math.max(...segments.map((s) => s.endMs), expiresMs, nowMs)
    return appendPendingPurchase(segments, horizonMs, pendingPurchase)
  }

  // Heading to expiry: current + muted default preview
  const previewEnd = expiresMs + 14 * day
  return appendPendingPurchase(
    [
      {
        key: 'current',
        label: plan.name,
        startMs: nowMs,
        endMs: expiresMs,
        color: plan.accentColor,
        kind: 'current',
      },
      {
        key: 'default-preview',
        label: 'Default',
        startMs: expiresMs,
        endMs: previewEnd,
        color: '#a3a3a3',
        kind: 'default_preview',
      },
    ],
    previewEnd,
    pendingPurchase,
  )
}

function isDashedKind(kind: MapSegment['kind']): boolean {
  return (
    kind === 'default_preview' ||
    kind === 'future' ||
    kind === 'pending_purchase'
  )
}

export default function PlanTimelineMap({
  plan,
  planExpiresAt,
  neverExpires,
  timeline,
  nextPeriod,
  nowMs,
  pendingPurchase = null,
}: PlanTimelineMapProps) {
  const { segments, horizonMs } = buildSegments(
    plan,
    planExpiresAt,
    neverExpires,
    timeline,
    nextPeriod,
    nowMs,
    pendingPurchase,
  )
  const span = Math.max(1, horizonMs - nowMs)

  return (
    <div className="space-y-3">
      <div className="relative h-10 overflow-hidden rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface)]">
        {segments.map((seg) => {
          const left = ((seg.startMs - nowMs) / span) * 100
          const width = ((seg.endMs - seg.startMs) / span) * 100
          return (
            <div
              key={seg.key}
              title={`${seg.label}: ${formatUtcShort(seg.startMs)} → ${seg.openEnded ? '…' : formatUtcShort(seg.endMs)}`}
              className={cn(
                'absolute top-0 bottom-0 flex items-center justify-center overflow-hidden px-1 text-[10px] font-medium text-white sm:text-xs',
                isDashedKind(seg.kind) &&
                  'border border-dashed border-neutral-400/80 bg-transparent text-neutral-600',
                seg.kind === 'pending_purchase' &&
                  'border-[var(--accent)] text-[var(--accent)]',
              )}
              style={{
                left: `${Math.max(0, left)}%`,
                width: `${Math.max(2, width)}%`,
                backgroundColor: isDashedKind(seg.kind) ? undefined : seg.color,
              }}
            >
              <span className="truncate">{seg.label}</span>
              {seg.openEnded ? <span className="ml-0.5">→</span> : null}
            </div>
          )
        })}
        <div
          className="pointer-events-none absolute top-0 bottom-0 w-px bg-[var(--ink)]"
          style={{ left: 0 }}
          aria-hidden
        />
      </div>
      <div className="flex justify-between gap-2 text-[11px]">
        <span className={hintClassName}>Now</span>
        <span className={hintClassName}>
          {pendingPurchase
            ? `Through ${formatUtcShort(horizonMs)} (incl. pending purchase)`
            : neverExpires || !planExpiresAt
              ? 'Continues'
              : nextPeriod ||
                  timeline?.periods.some(
                    (p) => new Date(p.effectiveDate).getTime() > nowMs,
                  )
                ? `Through ${formatUtcShort(horizonMs)}`
                : `Expires ${formatUtcShort(new Date(planExpiresAt).getTime())} → default`}
        </span>
      </div>
      <ul className="space-y-1">
        {segments.map((seg) => (
          <li
            key={`legend-${seg.key}`}
            className={cn('flex items-center gap-2 text-xs', hintClassName)}
          >
            <span
              className={cn(
                'size-2.5 shrink-0 rounded-sm',
                isDashedKind(seg.kind) &&
                  'border border-dashed border-neutral-400 bg-transparent',
                seg.kind === 'pending_purchase' && 'border-[var(--accent)]',
              )}
              style={{
                backgroundColor: isDashedKind(seg.kind) ? undefined : seg.color,
              }}
              aria-hidden
            />
            <span className="text-[var(--ink)]">{seg.label}</span>
            <span>
              {formatUtcShort(seg.startMs)}
              {seg.openEnded
                ? ' → …'
                : ` → ${formatUtcShort(seg.endMs)}`}
              {seg.kind === 'default_preview'
                ? ' (after expiry)'
                : seg.kind === 'future'
                  ? ' (not yet active)'
                  : seg.kind === 'pending_purchase'
                    ? ' (after payment)'
                    : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
