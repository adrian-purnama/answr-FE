import { createFileRoute, useLoaderData } from '@tanstack/react-router'
import BatchTestSection from '#/components/batchTest/BatchTestSection'

type TestSearch = {
  groupId?: string
}

export const Route = createFileRoute('/_authenticated/project/$id/test')({
  validateSearch: (search: Record<string, unknown>): TestSearch => ({
    groupId:
      typeof search.groupId === 'string' && search.groupId.trim()
        ? search.groupId.trim()
        : undefined,
  }),
  component: ProjectTestPage,
})

function ProjectTestPage() {
  const { apiKey } = useLoaderData({ from: '/_authenticated/project/$id' })
  const { id: projectId } = Route.useParams()
  const { groupId } = Route.useSearch()

  return (
    <BatchTestSection
      apiKeyId={apiKey.id}
      projectId={projectId}
      groupId={groupId}
    />
  )
}
