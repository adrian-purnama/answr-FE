import { Link, Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { LoaderCircle } from 'lucide-react'
import ProjectSidebar from '#/components/project/ProjectSidebar'
import { apiFetch } from '#/lib/api'
import type { ApiKey } from '#/lib/apiKey'
import { cardClassName, hintClassName, projectSectionClassName } from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/_authenticated/project/$id')({
  loader: async ({ params }) => {
    const response = await apiFetch<ApiKey>(`/api-keys/${params.id}`)
    if (!response.success || !response.data) {
      throw redirect({ to: '/dashboard' })
    }

    return { apiKey: response.data }
  },
  component: ProjectLayout,
  pendingComponent: ProjectLayoutPending,
  errorComponent: ProjectLayoutError,
})

function ProjectLayout() {
  const { id } = Route.useParams()
  const { apiKey } = Route.useLoaderData()

  return (
    <main className="flex w-full flex-col text-[var(--ink)] md:min-h-[calc(100dvh-3.5rem)] md:flex-row">
      <ProjectSidebar projectId={id} apiKey={apiKey} />
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </main>
  )
}

function ProjectLayoutPending() {
  return (
    <main className="w-full text-[var(--ink)]">
      <div className={cn(projectSectionClassName, `flex items-center gap-2 ${hintClassName}`)}>
        <LoaderCircle className="size-4 animate-spin" aria-hidden />
        Loading project…
      </div>
    </main>
  )
}

function ProjectLayoutError() {
  return (
    <main className="w-full text-[var(--ink)]">
      <div className={projectSectionClassName}>
        <div className={cn(cardClassName, 'px-6 py-12 text-center')}>
          <p className={hintClassName}>Unable to load this project.</p>
          <Link
            to="/dashboard"
            className={`mt-4 inline-block ${hintClassName} underline hover:text-[var(--ink)]`}
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  )
}
