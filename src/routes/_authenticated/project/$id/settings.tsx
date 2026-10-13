import { Navigate, createFileRoute, getRouteApi } from '@tanstack/react-router'
import ProjectSettings from '#/components/project/ProjectSettings'
import { projectSectionClassName } from '#/lib/ui-classes'

const projectRouteApi = getRouteApi('/_authenticated/project/$id')

export const Route = createFileRoute('/_authenticated/project/$id/settings')({
  component: ProjectSettingsPage,
})

function ProjectSettingsPage() {
  const { id } = Route.useParams()
  const { apiKey } = projectRouteApi.useLoaderData()

  if (apiKey.role === 'collaborator') {
    return <Navigate to="/project/$id" params={{ id }} />
  }

  return (
    <div className={projectSectionClassName}>
      <ProjectSettings projectId={id} apiKey={apiKey} />
    </div>
  )
}
