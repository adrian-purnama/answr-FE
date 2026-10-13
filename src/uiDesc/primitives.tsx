import type { ReactNode } from 'react'
import { cn } from '#/lib/utils'

export function UiStack({
  children,
  darkMode,
}: {
  children: ReactNode
  darkMode: boolean
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 max-w-full flex-col gap-2',
        darkMode ? 'text-neutral-100' : 'text-neutral-900',
      )}
    >
      {children}
    </div>
  )
}

export function UiCard({
  title,
  children,
  darkMode,
}: {
  title?: string
  children: ReactNode
  darkMode: boolean
}) {
  return (
    <div
      className={cn(
        'min-w-0 max-w-full rounded-xl border px-3 py-2.5',
        darkMode
          ? 'border-white/10 bg-neutral-950/60'
          : 'border-neutral-200 bg-white',
      )}
    >
      {title ? (
        <p
          className={cn(
            'mb-2 text-[11px] font-semibold tracking-wide',
            darkMode ? 'text-neutral-200' : 'text-neutral-800',
          )}
        >
          {title}
        </p>
      ) : null}
      <div className="flex min-w-0 max-w-full flex-col gap-2">{children}</div>
    </div>
  )
}

export function UiText({
  content,
  tone = 'default',
  darkMode,
}: {
  content: string
  tone?: 'default' | 'muted' | 'emphasis'
  darkMode: boolean
}) {
  return (
    <p
      className={cn(
        'text-xs leading-relaxed whitespace-pre-wrap',
        tone === 'muted' &&
          (darkMode ? 'text-neutral-400' : 'text-neutral-500'),
        tone === 'emphasis' && 'font-semibold',
        tone === 'default' &&
          (darkMode ? 'text-neutral-100' : 'text-neutral-900'),
      )}
    >
      {content}
    </p>
  )
}

export function UiKeyValue({
  rows,
  darkMode,
}: {
  rows: Array<{ label: string; value: string }>
  darkMode: boolean
}) {
  if (rows.length === 0) return null
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
      {rows.map((row) => (
        <div key={`${row.label}:${row.value}`} className="contents">
          <dt
            className={cn(
              'font-medium',
              darkMode ? 'text-neutral-400' : 'text-neutral-500',
            )}
          >
            {row.label}
          </dt>
          <dd
            className={cn(
              'min-w-0 wrap-break-word',
              darkMode ? 'text-neutral-100' : 'text-neutral-900',
            )}
          >
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

const STATUS_STYLES: Record<
  'pending' | 'paid' | 'failed' | 'expired',
  { light: string; dark: string; defaultLabel: string }
> = {
  pending: {
    light: 'bg-amber-100 text-amber-800',
    dark: 'bg-amber-500/20 text-amber-200',
    defaultLabel: 'Pending',
  },
  paid: {
    light: 'bg-emerald-100 text-emerald-800',
    dark: 'bg-emerald-500/20 text-emerald-200',
    defaultLabel: 'Paid',
  },
  failed: {
    light: 'bg-red-100 text-red-800',
    dark: 'bg-red-500/20 text-red-200',
    defaultLabel: 'Failed',
  },
  expired: {
    light: 'bg-neutral-200 text-neutral-700',
    dark: 'bg-neutral-700 text-neutral-200',
    defaultLabel: 'Expired',
  },
}

export function UiStatusBadge({
  value,
  label,
  darkMode,
}: {
  value: 'pending' | 'paid' | 'failed' | 'expired'
  label?: string
  darkMode: boolean
}) {
  const style = STATUS_STYLES[value]
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase',
        darkMode ? style.dark : style.light,
      )}
    >
      {label ?? style.defaultLabel}
    </span>
  )
}

function mediaSrc(node: {
  kind: 'url' | 'dataUrl' | 'payload'
  src?: string
  payload?: string
  encoding?: 'raw' | 'base64'
  mimeType?: string
}): string | null {
  if (node.kind === 'url' || node.kind === 'dataUrl') {
    return node.src ?? null
  }
  if (!node.payload) return null
  if (node.encoding === 'base64') {
    const mime = node.mimeType || 'image/png'
    return `data:${mime};base64,${node.payload}`
  }
  // raw payload: treat as QR/payload string shown as text fallback (no image lib)
  return null
}

export function UiMedia({
  kind,
  src,
  payload,
  encoding,
  mimeType,
  alt,
  darkMode,
}: {
  kind: 'url' | 'dataUrl' | 'payload'
  src?: string
  payload?: string
  encoding?: 'raw' | 'base64'
  mimeType?: string
  alt?: string
  darkMode: boolean
}) {
  const resolved = mediaSrc({ kind, src, payload, encoding, mimeType })

  if (resolved) {
    return (
      <img
        src={resolved}
        alt={alt ?? ''}
        className="my-1 h-auto max-h-48 w-full max-w-full rounded-lg object-contain"
      />
    )
  }

  // Raw QR string / unresolved media: show a placeholder box with truncated payload
  const preview =
    kind === 'payload' && payload
      ? payload.length > 64
        ? `${payload.slice(0, 64)}…`
        : payload
      : null

  return (
    <div
      className={cn(
        'flex aspect-square max-h-40 w-full max-w-40 flex-col items-center justify-center gap-1 rounded-lg border border-dashed px-2 text-center',
        darkMode
          ? 'border-white/15 bg-neutral-900 text-neutral-400'
          : 'border-neutral-300 bg-neutral-50 text-neutral-500',
      )}
      role="img"
      aria-label={alt || 'QR code placeholder'}
    >
      <span className="text-[10px] font-semibold tracking-wide uppercase">
        QR
      </span>
      {preview ? (
        <span className="text-[9px] leading-tight wrap-break-word opacity-80">
          {preview}
        </span>
      ) : (
        <span className="text-[9px] opacity-70">No preview</span>
      )}
    </div>
  )
}

export function UiTable({
  headers,
  rows,
  darkMode,
}: {
  headers: string[]
  rows: string[][]
  darkMode: boolean
}) {
  if (headers.length === 0) return null
  // CSS grid + minmax(0,1fr) pins the scrollport to the card width so the
  // wide table scrolls instead of expanding (or getting clipped with no bar).
  return (
    <div className="grid min-w-0 max-w-full grid-cols-[minmax(0,1fr)]">
      <div className="ui-table-scroll touch-pan-x">
        <table className="w-max border-collapse text-left text-[11px]">
          <thead>
            <tr>
              {headers.map((header, headerIndex) => (
                <th
                  key={`${header}-${headerIndex}`}
                  className={cn(
                    'border-b px-2 py-1.5 font-semibold whitespace-nowrap',
                    darkMode
                      ? 'border-white/10 text-neutral-300'
                      : 'border-neutral-200 text-neutral-600',
                  )}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {headers.map((_, colIndex) => (
                  <td
                    key={`${rowIndex}-${colIndex}`}
                    className={cn(
                      'border-b px-2 py-1.5 whitespace-nowrap',
                      darkMode
                        ? 'border-white/5 text-neutral-100'
                        : 'border-neutral-100 text-neutral-900',
                    )}
                  >
                    {row[colIndex] ?? ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function UiButtonGroup({
  buttons,
  darkMode,
  onAction,
}: {
  buttons: Array<{ actionId: string; label: string }>
  darkMode: boolean
  onAction?: (actionId: string, label: string) => void
}) {
  if (buttons.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5 pt-0.5">
      {buttons.map((button) => (
        <button
          key={`${button.actionId}:${button.label}`}
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onAction?.(button.actionId, button.label)
          }}
          className={cn(
            'rounded-md px-2.5 py-1 text-[11px] font-medium transition',
            darkMode
              ? 'bg-white text-neutral-950 hover:bg-neutral-200'
              : 'bg-neutral-900 text-white hover:bg-neutral-800',
          )}
        >
          {button.label}
        </button>
      ))}
    </div>
  )
}

export function UiMetric({
  label,
  value,
  unit,
  darkMode,
}: {
  label: string
  value: string
  unit?: string
  darkMode: boolean
}) {
  return (
    <div className="min-w-0">
      <p
        className={cn(
          'text-[10px] font-medium tracking-wide uppercase',
          darkMode ? 'text-neutral-400' : 'text-neutral-500',
        )}
      >
        {label || 'Metric'}
      </p>
      <p
        className={cn(
          'mt-0.5 text-xl font-semibold tabular-nums',
          darkMode ? 'text-neutral-50' : 'text-neutral-900',
        )}
      >
        {value || ' '}
        {unit ? (
          <span
            className={cn(
              'ml-1 text-xs font-medium',
              darkMode ? 'text-neutral-400' : 'text-neutral-500',
            )}
          >
            {unit}
          </span>
        ) : null}
      </p>
    </div>
  )
}

export function UiMetricGrid({
  items,
  columns = 2,
  darkMode,
}: {
  items: Array<{ label: string; value: string; unit?: string }>
  columns?: 2 | 3
  darkMode: boolean
}) {
  if (items.length === 0) return null
  return (
    <div
      className={cn(
        'grid gap-3',
        columns === 3 ? 'grid-cols-3' : 'grid-cols-2',
      )}
    >
      {items.map((item, index) => (
        <UiMetric
          key={`${item.label}:${index}`}
          label={item.label}
          value={item.value}
          unit={item.unit}
          darkMode={darkMode}
        />
      ))}
    </div>
  )
}

export function UiProgress({
  label,
  value,
  max,
  darkMode,
}: {
  label?: string
  value: number
  max: number
  darkMode: boolean
}) {
  const safeMax = max > 0 ? max : 100
  const pct = Math.max(0, Math.min(100, (value / safeMax) * 100))
  return (
    <div className="space-y-1">
      {label ? (
        <div className="flex items-baseline justify-between gap-2">
          <p
            className={cn(
              'text-[11px] font-medium',
              darkMode ? 'text-neutral-300' : 'text-neutral-700',
            )}
          >
            {label}
          </p>
          <p
            className={cn(
              'text-[10px] tabular-nums',
              darkMode ? 'text-neutral-400' : 'text-neutral-500',
            )}
          >
            {Math.round(pct)}%
          </p>
        </div>
      ) : null}
      <div
        className={cn(
          'h-1.5 overflow-hidden rounded-full',
          darkMode ? 'bg-white/10' : 'bg-neutral-200',
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-[width]',
            darkMode ? 'bg-white' : 'bg-neutral-900',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function UiDivider({ darkMode }: { darkMode: boolean }) {
  return (
    <hr
      className={cn(
        'my-1 border-0 border-t',
        darkMode ? 'border-white/10' : 'border-neutral-200',
      )}
    />
  )
}

const CHART_COLORS = [
  '#0c0c0b',
  '#525252',
  '#a3a3a3',
  '#404040',
  '#737373',
  '#d4d4d4',
]

type ChartSeries = Array<{ label: string; value: number }>

function ChartPie({
  series,
  donut,
  darkMode,
}: {
  series: ChartSeries
  donut: boolean
  darkMode: boolean
}) {
  const total = series.reduce((sum, item) => sum + Math.max(0, item.value), 0)
  if (total <= 0) {
    return (
      <p
        className={cn(
          'text-[11px]',
          darkMode ? 'text-neutral-400' : 'text-neutral-500',
        )}
      >
        No data
      </p>
    )
  }
  const size = 120
  const cx = size / 2
  const cy = size / 2
  const r = 48
  const inner = donut ? 28 : 0
  let angle = -Math.PI / 2
  const slices: Array<{ d: string; color: string; label: string }> = []

  for (let i = 0; i < series.length; i++) {
    const item = series[i]
    const sweep = (Math.max(0, item.value) / total) * Math.PI * 2
    const end = angle + sweep
    const x1 = cx + r * Math.cos(angle)
    const y1 = cy + r * Math.sin(angle)
    const x2 = cx + r * Math.cos(end)
    const y2 = cy + r * Math.sin(end)
    const large = sweep > Math.PI ? 1 : 0
    let d: string
    if (inner > 0) {
      const ix1 = cx + inner * Math.cos(end)
      const iy1 = cy + inner * Math.sin(end)
      const ix2 = cx + inner * Math.cos(angle)
      const iy2 = cy + inner * Math.sin(angle)
      d = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${inner} ${inner} 0 ${large} 0 ${ix2} ${iy2} Z`
    } else {
      d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
    }
    slices.push({
      d,
      color: CHART_COLORS[i % CHART_COLORS.length],
      label: item.label,
    })
    angle = end
  }

  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        {slices.map((slice) => (
          <path key={slice.label} d={slice.d} fill={slice.color} />
        ))}
      </svg>
      <ul className="min-w-0 space-y-1">
        {series.map((item, index) => (
          <li
            key={`${item.label}:${index}`}
            className="flex items-center gap-1.5 text-[10px]"
          >
            <span
              className="size-2 shrink-0 rounded-sm"
              style={{ background: CHART_COLORS[index % CHART_COLORS.length] }}
            />
            <span
              className={cn(
                'truncate',
                darkMode ? 'text-neutral-300' : 'text-neutral-600',
              )}
            >
              {item.label}
            </span>
            <span
              className={cn(
                'ml-auto tabular-nums',
                darkMode ? 'text-neutral-100' : 'text-neutral-900',
              )}
            >
              {item.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ChartBar({
  series,
  darkMode,
}: {
  series: ChartSeries
  darkMode: boolean
}) {
  const max = Math.max(...series.map((item) => item.value), 1)
  const height = 88
  const gap = 6
  const barW = Math.max(12, Math.min(28, 160 / Math.max(series.length, 1) - gap))
  const width = series.length * (barW + gap) + gap

  return (
    <svg
      width="100%"
      height={height + 24}
      viewBox={`0 0 ${Math.max(width, 120)} ${height + 24}`}
      className="max-w-full"
      role="img"
    >
      {series.map((item, index) => {
        const h = (Math.max(0, item.value) / max) * height
        const x = gap + index * (barW + gap)
        const y = height - h
        return (
          <g key={`${item.label}:${index}`}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={3}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
            />
            <text
              x={x + barW / 2}
              y={height + 14}
              textAnchor="middle"
              className="fill-current"
              fontSize={8}
              fill={darkMode ? '#a3a3a3' : '#737373'}
            >
              {item.label.length > 8
                ? `${item.label.slice(0, 7)}…`
                : item.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function ChartLine({
  series,
  darkMode,
}: {
  series: ChartSeries
  darkMode: boolean
}) {
  const max = Math.max(...series.map((item) => item.value), 1)
  const height = 88
  const width = 180
  const pad = 8
  const points = series.map((item, index) => {
    const x =
      pad +
      (series.length <= 1
        ? width / 2
        : (index / (series.length - 1)) * (width - pad * 2))
    const y = height - pad - (Math.max(0, item.value) / max) * (height - pad * 2)
    return `${x},${y}`
  })

  return (
    <svg
      width="100%"
      height={height + 16}
      viewBox={`0 0 ${width} ${height + 16}`}
      className="max-w-full"
      role="img"
    >
      <polyline
        fill="none"
        stroke={darkMode ? '#f5f5f5' : '#0c0c0b'}
        strokeWidth={2}
        points={points.join(' ')}
      />
      {series.map((item, index) => {
        const [x, y] = points[index].split(',').map(Number)
        return (
          <circle
            key={`${item.label}:${index}`}
            cx={x}
            cy={y}
            r={3}
            fill={darkMode ? '#f5f5f5' : '#0c0c0b'}
          />
        )
      })}
    </svg>
  )
}

export function UiChart({
  variant,
  title,
  series,
  darkMode,
}: {
  variant: 'bar' | 'line' | 'pie' | 'donut'
  title?: string
  series: ChartSeries
  darkMode: boolean
}) {
  const clean = series.filter(
    (item) => item.label.trim() || Number.isFinite(item.value),
  )
  return (
    <div className="space-y-2">
      {title ? (
        <p
          className={cn(
            'text-[11px] font-semibold',
            darkMode ? 'text-neutral-200' : 'text-neutral-800',
          )}
        >
          {title}
        </p>
      ) : null}
      {clean.length === 0 ? (
        <p
          className={cn(
            'text-[11px]',
            darkMode ? 'text-neutral-400' : 'text-neutral-500',
          )}
        >
          No data
        </p>
      ) : variant === 'pie' || variant === 'donut' ? (
        <ChartPie series={clean} donut={variant === 'donut'} darkMode={darkMode} />
      ) : variant === 'line' ? (
        <ChartLine series={clean} darkMode={darkMode} />
      ) : (
        <ChartBar series={clean} darkMode={darkMode} />
      )}
    </div>
  )
}

