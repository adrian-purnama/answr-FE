import {
  createFileRoute,
  useLoaderData,
  useNavigate,
} from '@tanstack/react-router'
import GuidanceSection from '#/components/guidance/GuidanceSection'

type GuidanceSearch = {
  guidanceId?: string
}

export const Route = createFileRoute(
  '/_authenticated/project/$id/train/guidance',
)({
  validateSearch: (search: Record<string, unknown>): GuidanceSearch => ({
    guidanceId:
      typeof search.guidanceId === 'string' && search.guidanceId
        ? search.guidanceId
        : undefined,
  }),
  component: TrainGuidancePage,
})

function TrainGuidancePage() {
  const { apiKey } = useLoaderData({ from: '/_authenticated/project/$id' })
  const { id: projectId } = Route.useParams()
  const { guidanceId } = Route.useSearch()
  const navigate = useNavigate()

  return (
    <GuidanceSection
      apiKeyId={apiKey.id}
      openGuidanceId={guidanceId}
      onOpenRequestConsumed={() => {
        void navigate({
          to: '/project/$id/train/guidance',
          params: { id: projectId },
          search: {},
          replace: true,
        })
      }}
    />
  )
}
