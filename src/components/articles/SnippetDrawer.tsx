import type { ReactNode } from 'react'
import DrawerDetails from '#/components/ui/DrawerDetails'
import SideDrawer from '#/components/ui/SideDrawer'
import type { TopicSyncStatus } from '#/lib/article'
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

function SyncPill({ status }: { status: TopicSyncStatus }) {
  const label =
    status === 'synced'
      ? 'Synced'
      : status === 'failed'
        ? 'Failed'
        : status === 'in-progress'
          ? 'Syncing'
          : 'Not synced'
  const tone =
    status === 'synced'
      ? 'bg-emerald-50 text-emerald-800'
      : status === 'failed'
        ? 'bg-red-50 text-red-700'
        : status === 'in-progress'
          ? 'bg-amber-50 text-amber-800'
          : 'bg-[var(--surface)] text-[var(--muted)]'
  const dot =
    status === 'synced'
      ? 'bg-emerald-500'
      : status === 'failed'
        ? 'bg-red-500'
        : status === 'in-progress'
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

type SnippetDrawerProps = {
  open: boolean
  onClose: () => void
  detailActions?: ReactNode
  createdAt?: string
  updatedAt?: string
  createdBy?: string | null
  updatedBy?: string | null
  enabled?: boolean
  syncStatus?: TopicSyncStatus
  children: ReactNode
}

export default function SnippetDrawer({
  open,
  onClose,
  detailActions,
  createdAt,
  updatedAt,
  createdBy,
  updatedBy,
  enabled,
  syncStatus,
  children,
}: SnippetDrawerProps) {
  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      label="Snippet"
      size="lg"
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
