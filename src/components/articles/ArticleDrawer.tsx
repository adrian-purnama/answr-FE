import type { ReactNode } from 'react'
import DrawerDetails from '#/components/ui/DrawerDetails'
import SideDrawer from '#/components/ui/SideDrawer'
import type { ArticleSyncStatus } from '#/lib/article'
import { cn } from '#/lib/utils'

function StatusPill({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium',
        enabled
          ? 'bg-emerald-50 text-emerald-800'
          : 'bg-[var(--surface)] text-[var(--muted)]',
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          enabled ? 'bg-emerald-500' : 'bg-[var(--muted)]',
        )}
      />
      {enabled ? 'Enabled' : 'Disabled'}
    </span>
  )
}

function SyncPill({ status }: { status: ArticleSyncStatus }) {
  const label =
    status === 'synced'
      ? 'Synced'
      : status === 'partial'
        ? 'Partial'
        : 'Not synced'
  const tone =
    status === 'synced'
      ? 'bg-emerald-50 text-emerald-800'
      : status === 'partial'
        ? 'bg-amber-50 text-amber-800'
        : 'bg-[var(--surface)] text-[var(--muted)]'
  const dot =
    status === 'synced'
      ? 'bg-emerald-500'
      : status === 'partial'
        ? 'bg-amber-500'
        : 'bg-[var(--muted)]'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium',
        tone,
      )}
    >
      <span className={cn('size-1.5 rounded-full', dot)} />
      {label}
    </span>
  )
}

type ArticleDrawerProps = {
  open: boolean
  onClose: () => void
  headerActions?: ReactNode
  detailActions?: ReactNode
  createdAt?: string
  updatedAt?: string
  createdBy?: string | null
  updatedBy?: string | null
  enabled?: boolean
  syncStatus?: ArticleSyncStatus
  children: ReactNode
}

export default function ArticleDrawer({
  open,
  onClose,
  headerActions,
  detailActions,
  createdAt,
  updatedAt,
  createdBy,
  updatedBy,
  enabled,
  syncStatus,
  children,
}: ArticleDrawerProps) {
  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      label="Article"
      size="lg"
      actions={headerActions}
      details={
        createdAt && updatedAt ? (
          <DrawerDetails
            createdAt={createdAt}
            updatedAt={updatedAt}
            createdBy={createdBy}
            updatedBy={updatedBy}
            statusRows={[
              ...(enabled !== undefined
                ? [{ label: 'Enable', value: <StatusPill enabled={enabled} /> }]
                : []),
              ...(syncStatus !== undefined
                ? [
                    {
                      label: 'Synced',
                      value: <SyncPill status={syncStatus} />,
                    },
                  ]
                : []),
            ]}
            actions={detailActions}
          />
        ) : null
      }
    >
      {children}
    </SideDrawer>
  )
}
