import { useMemo, useState } from 'react'
import { LayoutGrid, TrendingUp } from 'lucide-react'
import type { ChatAnalyticsTrendSeries, ChatAnalyticsTrends } from '#/lib/chatAnalytics'
import {
  TILE_COLORS,
  TREEMAP_H,
  TREEMAP_W,
  layoutTreemap,
} from '#/components/analyze/treemapLayout'
import { cardClassName, hintClassName } from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

type VolumeTile = {
  key: string
  label: string
  total: number
  sharePercent: number
  color: string
}

type AnalyticsExplorerProps = {
  trends: ChatAnalyticsTrends
  title: string
  unitLabel?: string
  activeKey?: string | null
  onSelect?: (key: string, label: string) => void
  describe?: (key: string) => string | undefined
}

function formatShortDate(iso: string) {
  const date = new Date(iso)
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

function toVolumeTiles(series: ChatAnalyticsTrendSeries[]): VolumeTile[] {
  return series
    .filter((s) => s.total > 0)
    .map((s, index) => ({
      key: s.key,
      label: s.label,
      total: s.total,
      sharePercent: s.sharePercent,
      color: TILE_COLORS[index % TILE_COLORS.length]!,
    }))
}

function SparklineRow({
  label,
  description,
  points,
  dates,
  active,
  hoverIndex,
  onHoverIndex,
  onSelect,
  globalMax,
}: {
  label: string
  description?: string
  points: number[]
  dates: string[]
  active: boolean
  hoverIndex: number | null
  onHoverIndex: (index: number | null) => void
  onSelect: () => void
  globalMax: number
}) {
  const width = 320
  const height = 44
  const padY = 4
  const max = Math.max(globalMax, 1)

  const path = useMemo(() => {
    if (points.length === 0) return { line: '', area: '' }
    if (points.length === 1) {
      const y = height - padY - ((points[0] ?? 0) / max) * (height - padY * 2)
      return {
        line: `M0 ${y} L${width} ${y}`,
        area: `M0 ${height} L0 ${y} L${width} ${y} L${width} ${height} Z`,
      }
    }
    const step = width / (points.length - 1)
    const coords = points.map((value, index) => {
      const x = index * step
      const y = height - padY - (value / max) * (height - padY * 2)
      return { x, y }
    })
    const line = coords
      .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`)
      .join(' ')
    const area = `${line} L${width} ${height} L0 ${height} Z`
    return { line, area }
  }, [height, max, points, width])

  const hoverValue =
    hoverIndex !== null && hoverIndex >= 0 && hoverIndex < points.length
      ? points[hoverIndex]
      : null
  const hoverDate =
    hoverIndex !== null && dates[hoverIndex]
      ? formatShortDate(dates[hoverIndex]!)
      : null
  const hoverXRatio =
    hoverIndex !== null && points.length > 1
      ? hoverIndex / (points.length - 1)
      : points.length === 1
        ? 0.5
        : null

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)_3.5rem] items-center gap-3 rounded-md px-2 py-1.5 text-left transition',
        'hover:bg-[var(--surface)]',
        active && 'bg-[var(--surface)]',
      )}
      onMouseLeave={() => onHoverIndex(null)}
    >
      <span
        className="truncate text-sm text-[var(--ink)]"
        title={description ? `${label}: ${description}` : label}
      >
        {label}
      </span>
      <div className="relative min-w-0">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-11 w-full"
          preserveAspectRatio="none"
          onMouseMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect()
            const ratio = (event.clientX - rect.left) / rect.width
            const index =
              points.length <= 1
                ? 0
                : Math.round(ratio * (points.length - 1))
            onHoverIndex(Math.max(0, Math.min(points.length - 1, index)))
          }}
        >
          {dates.map((_, index) => {
            if (index === 0 || index === dates.length - 1) return null
            if (index % 7 !== 0) return null
            const x =
              points.length <= 1 ? 0 : (index / (points.length - 1)) * width
            return (
              <line
                key={`guide-${index}`}
                x1={x}
                x2={x}
                y1={0}
                y2={height}
                stroke="var(--line)"
                strokeWidth={1}
              />
            )
          })}
          <path d={path.area} fill="var(--primary)" opacity={0.16} />
          <path
            d={path.line}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
          {hoverIndex !== null && points.length > 0 ? (
            <>
              <line
                x1={
                  points.length <= 1
                    ? width / 2
                    : (hoverIndex / (points.length - 1)) * width
                }
                x2={
                  points.length <= 1
                    ? width / 2
                    : (hoverIndex / (points.length - 1)) * width
                }
                y1={0}
                y2={height}
                stroke="var(--primary)"
                strokeWidth={1}
              />
              <circle
                cx={
                  points.length <= 1
                    ? width / 2
                    : (hoverIndex / (points.length - 1)) * width
                }
                cy={
                  height -
                  padY -
                  ((points[hoverIndex] ?? 0) / max) * (height - padY * 2)
                }
                r={3}
                fill="var(--primary)"
                stroke="var(--paper)"
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
              />
            </>
          ) : null}
        </svg>
        {hoverDate !== null && hoverXRatio !== null ? (
          <div
            className="pointer-events-none absolute top-0.5 z-10 -translate-x-1/2 rounded border border-[var(--line)] bg-[var(--paper)] px-1.5 py-0.5 text-[10px] whitespace-nowrap text-[var(--ink)] shadow-sm"
            style={{
              left: `${Math.min(92, Math.max(8, hoverXRatio * 100))}%`,
            }}
          >
            {hoverDate}
            {hoverValue !== null ? ` · ${hoverValue}` : ''}
          </div>
        ) : null}
      </div>
      <span className="text-right text-xs tabular-nums text-[var(--muted)]">
        {hoverValue !== null ? hoverValue : points.reduce((a, b) => a + b, 0)}
      </span>
    </button>
  )
}

export default function AnalyticsExplorer({
  trends,
  title,
  unitLabel = 'messages',
  activeKey,
  onSelect,
  describe,
}: AnalyticsExplorerProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const tiles = useMemo(() => toVolumeTiles(trends.series), [trends.series])
  const treemap = useMemo(
    () =>
      layoutTreemap(
        tiles.map((tile) => ({ key: tile.key, value: tile.total })),
        TREEMAP_W,
        TREEMAP_H,
      ),
    [tiles],
  )

  const globalMax = useMemo(() => {
    let max = 0
    for (const series of trends.series) {
      for (const point of series.points) {
        if (point > max) max = point
      }
    }
    return max
  }, [trends.series])

  const rangeLabel = `${formatShortDate(trends.from)} – ${formatShortDate(trends.to)}`
  const hoverDate =
    hoverIndex !== null && trends.dates[hoverIndex]
      ? formatShortDate(trends.dates[hoverIndex]!)
      : null

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-medium text-[var(--ink)]">{title}</h2>
        <p className={cn(hintClassName, 'mt-1')}>{rangeLabel}</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
        <div className={cn(cardClassName, 'overflow-hidden p-0')}>
          <div className="flex items-center gap-2 border-b border-[var(--line)] px-4 py-3">
            <LayoutGrid className="size-4 text-[var(--primary)]" aria-hidden />
            <p className="text-sm font-medium text-[var(--ink)]">
              {trends.series.length} highest volume
            </p>
          </div>
          {tiles.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <p className={hintClassName}>No volume data in this range yet.</p>
            </div>
          ) : (
            <div
              className="relative w-full"
              style={{ aspectRatio: `${TREEMAP_W} / ${TREEMAP_H}` }}
            >
              {treemap.map((rect) => {
                const tile = tiles.find((item) => item.key === rect.key)
                if (!tile) return null
                const active = activeKey === tile.key
                const showStats = rect.w > 220 && rect.h > 150
                const showLabel = rect.w > 90 && rect.h > 48
                return (
                  <button
                    key={tile.key}
                    type="button"
                    title={
                      describe?.(tile.key)
                        ? `${tile.label}: ${describe(tile.key)} · ${tile.total} ${unitLabel}`
                        : `${tile.label}: ${tile.total} ${unitLabel} · ${tile.sharePercent}% share`
                    }
                    onClick={() => onSelect?.(tile.key, tile.label)}
                    className={cn(
                      'absolute flex flex-col justify-between overflow-hidden border border-white/20 text-left text-white transition',
                      'hover:brightness-110 focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white',
                      showStats ? 'p-3' : 'justify-start p-2',
                      active && 'z-10 ring-2 ring-[var(--primary)] ring-inset',
                    )}
                    style={{
                      left: `${(rect.x / TREEMAP_W) * 100}%`,
                      top: `${(rect.y / TREEMAP_H) * 100}%`,
                      width: `${(rect.w / TREEMAP_W) * 100}%`,
                      height: `${(rect.h / TREEMAP_H) * 100}%`,
                      background: tile.color,
                    }}
                  >
                    {showLabel ? (
                      <span className="min-w-0 truncate text-sm font-medium">
                        {tile.label}
                      </span>
                    ) : null}
                    {showStats ? (
                      <span className="w-full shrink-0 text-right text-[11px] uppercase tracking-wide text-white/80">
                        <span className="tabular-nums">{tile.total}</span>{' '}
                        {unitLabel}
                        <span className="mt-0.5 block text-white/65">
                          {tile.sharePercent}% share
                        </span>
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className={cn(cardClassName, 'flex h-full flex-col overflow-hidden p-0')}>
          <div className="flex items-center gap-2 border-b border-[var(--line)] px-4 py-3">
            <TrendingUp className="size-4 text-[var(--primary)]" aria-hidden />
            <p className="text-sm font-medium text-[var(--ink)]">
              Trends over time
            </p>
          </div>
          {trends.series.length === 0 ? (
            <div className="flex flex-1 items-center justify-center px-4 py-16 text-center">
              <p className={hintClassName}>No trend series yet.</p>
            </div>
          ) : (
            <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
              {trends.series.map((series) => (
                <SparklineRow
                  key={series.key}
                  label={series.label}
                  description={describe?.(series.key)}
                  points={series.points}
                  dates={trends.dates}
                  active={activeKey === series.key}
                  hoverIndex={hoverIndex}
                  onHoverIndex={setHoverIndex}
                  onSelect={() => onSelect?.(series.key, series.label)}
                  globalMax={globalMax}
                />
              ))}
            </div>
          )}
          <div className="mt-auto flex items-center justify-between border-t border-[var(--line)] px-4 py-2 text-[11px] text-[var(--muted)]">
            <span>{formatShortDate(trends.from)}</span>
            <span className="tabular-nums text-[var(--ink)]">{hoverDate}</span>
            <span>{formatShortDate(trends.to)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
