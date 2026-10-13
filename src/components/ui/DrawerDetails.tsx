import type { ReactNode } from 'react'
import { cn } from '#/lib/utils'

function formatRelativeTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '  '

  const seconds = Math.round((date.getTime() - Date.now()) / 1000)
  const abs = Math.abs(seconds)
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

  if (abs < 60) return rtf.format(seconds, 'second')
  const minutes = Math.round(seconds / 60)
  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return rtf.format(hours, 'hour')
  const days = Math.round(hours / 24)
  if (Math.abs(days) < 30) return rtf.format(days, 'day')
  const months = Math.round(days / 30)
  if (Math.abs(months) < 12) return rtf.format(months, 'month')
  return rtf.format(Math.round(days / 365), 'year')
}

function DetailRow({
  label,
  value,
  title,
}: {
  label: string
  value: ReactNode
  title?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="shrink-0 text-[var(--muted)]">{label}</span>
      <span
        className="min-w-0 truncate text-right text-[var(--ink)]"
        title={title}
      >
        {value}
      </span>
    </div>
  )
}

type DrawerDetailsProps = {
  createdAt: string
  updatedAt: string
  createdBy?: string | null
  updatedBy?: string | null
  statusRows?: Array<{ label: string; value: ReactNode }>
  /** Extra content under Data rows (e.g. editable topic fields). */
  children?: ReactNode
  actions?: ReactNode
  className?: string
}

export default function DrawerDetails({
  createdAt,
  updatedAt,
  createdBy,
  updatedBy,
  statusRows,
  children,
  actions,
  className,
}: DrawerDetailsProps) {
  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      <div className="shrink-0 border-b border-[var(--line)] px-4 py-3">
        <p className="text-sm font-semibold text-[var(--ink)]">Details</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <p className="mb-2 text-xs font-medium tracking-wide text-[var(--muted)] uppercase">
          Data
        </p>
        <DetailRow
          label="Created"
          value={formatRelativeTime(createdAt)}
          title={new Date(createdAt).toLocaleString()}
        />
        {createdBy ? (
          <DetailRow label="Created by" value={createdBy} title={createdBy} />
        ) : null}
        <DetailRow
          label="Updated"
          value={formatRelativeTime(updatedAt)}
          title={new Date(updatedAt).toLocaleString()}
        />
        {updatedBy ? (
          <DetailRow
            label="Last updated by"
            value={updatedBy}
            title={updatedBy}
          />
        ) : null}
        {statusRows?.map((row) => (
          <DetailRow key={row.label} label={row.label} value={row.value} />
        ))}
        {children ? (
          <div className="mt-4 space-y-3 border-t border-[var(--line)] pt-3">
            {children}
          </div>
        ) : null}
      </div>
      {actions ? (
        <div className="shrink-0 space-y-2 border-t border-[var(--line)] px-4 py-3">
          {actions}
        </div>
      ) : null}
    </div>
  )
}
