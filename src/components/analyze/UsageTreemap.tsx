import { useMemo } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { WidgetUsageNamedCount } from '#/lib/widgetAnalytics'
import {
  TILE_COLORS,
  TREEMAP_H,
  TREEMAP_W,
  layoutTreemap,
} from '#/components/analyze/treemapLayout'
import { cardClassName, hintClassName } from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

type UsageTreemapProps = {
  title: string
  empty: string
  items: WidgetUsageNamedCount[]
  unitLabel?: string
  icon?: LucideIcon
}

export default function UsageTreemap({
  title,
  empty,
  items,
  unitLabel = 'views',
  icon: Icon,
}: UsageTreemapProps) {
  const total = items.reduce((sum, item) => sum + item.count, 0)

  const tiles = useMemo(() => {
    const positive = items.filter((item) => item.count > 0)
    return positive.map((item, index) => ({
      key: item.id,
      label: item.label,
      total: item.count,
      sharePercent:
        total > 0 ? Math.round((item.count / total) * 1000) / 10 : 0,
      color: TILE_COLORS[index % TILE_COLORS.length]!,
    }))
  }, [items, total])

  const treemap = useMemo(
    () =>
      layoutTreemap(
        tiles.map((tile) => ({ key: tile.key, value: tile.total })),
        TREEMAP_W,
        TREEMAP_H,
      ),
    [tiles],
  )

  return (
    <div className={cn(cardClassName, 'overflow-hidden p-0')}>
      <div className="flex items-center gap-2 border-b border-[var(--line)] px-4 py-3">
        {Icon ? (
          <Icon className="size-4 shrink-0 text-[var(--primary)]" aria-hidden />
        ) : null}
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--ink)]">{title}</p>
          {total > 0 ? (
            <p className={cn(hintClassName, 'mt-0.5 text-xs')}>
              {total} {unitLabel}
            </p>
          ) : null}
        </div>
      </div>
      {tiles.length === 0 || total === 0 ? (
        <div className="px-4 py-12 text-center">
          <p className={hintClassName}>{empty}</p>
        </div>
      ) : (
        <div
          className="relative w-full"
          style={{ aspectRatio: `${TREEMAP_W} / ${TREEMAP_H}` }}
        >
          {treemap.map((rect) => {
            const tile = tiles.find((item) => item.key === rect.key)
            if (!tile) return null
            const showStats = rect.w > 220 && rect.h > 150
            const showLabel = rect.w > 90 && rect.h > 48
            return (
              <div
                key={tile.key}
                title={`${tile.label}: ${tile.total} ${unitLabel} · ${tile.sharePercent}% share`}
                className={cn(
                  'absolute flex flex-col justify-between overflow-hidden border border-white/20 text-left text-white',
                  showStats ? 'p-3' : 'justify-start p-2',
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
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
