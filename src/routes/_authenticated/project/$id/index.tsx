import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import {
  formatApiKeyStatusLabel,
  formatIpAllowlistSummary,
} from '#/lib/apiKey'
import { cardClassName, hintClassName, projectSectionClassName } from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

const projectRouteApi = getRouteApi('/_authenticated/project/$id')

export const Route = createFileRoute('/_authenticated/project/$id/')({
  component: ProjectDashboardPage,
})

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'active':
      return 'border-emerald-600/30 bg-emerald-50 text-emerald-800'
    case 'disabled_plan':
      return 'border-amber-600/40 bg-amber-50 text-amber-900'
    case 'revoked':
      return 'border-red-600/30 bg-red-50 text-red-800'
    default:
      return 'border-[var(--line)] bg-[var(--surface)] text-[var(--ink)]'
  }
}

function ProjectDashboardPage() {
  const { apiKey } = projectRouteApi.useLoaderData()
  const disabledByPlan = apiKey.status === 'disabled_plan'

  return (
    <div className={projectSectionClassName}>
      <h1 className="text-2xl font-medium text-[var(--ink)]">Dashboard</h1>
      <p className={`mt-1 font-mono ${hintClassName}`}>{apiKey.prefix}…</p>

      <div
        className={cn(
          cardClassName,
          'mt-8 space-y-4 p-6',
          disabledByPlan && 'border-amber-300/80 bg-amber-50/40',
        )}
      >
        <div>
          <p className="text-sm font-medium text-[var(--ink)]">Status</p>
          <span
            className={cn(
              'mt-2 inline-flex items-center rounded-[var(--radius-sm)] border px-2 py-0.5 text-xs font-medium',
              statusBadgeClass(apiKey.status),
            )}
          >
            {formatApiKeyStatusLabel(apiKey.status)}
          </span>
          {disabledByPlan ? (
            <p className="mt-2 text-sm text-amber-900/80">
              Over your plan’s API key limit   upgrade or revoke other keys to
              re-enable.
            </p>
          ) : null}
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--ink)]">Last used</p>
          <p className={`mt-1 ${hintClassName}`}>
            {apiKey.lastUsedAt
              ? new Date(apiKey.lastUsedAt).toLocaleString()
              : 'Never used'}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--ink)]">IP allowlist</p>
          <p className={`mt-1 ${hintClassName}`}>
            {formatIpAllowlistSummary(apiKey.ipAllowlist)}
          </p>
        </div>
      </div>
    </div>
  )
}
