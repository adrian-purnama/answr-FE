import { createFileRoute, useLoaderData } from '@tanstack/react-router'
import AnalyzeOverviewSection from '#/components/analyze/AnalyzeOverviewSection'

export const Route = createFileRoute(
  '/_authenticated/project/$id/analyze/overview',
)({
  component: AnalyzeOverviewPage,
})

function AnalyzeOverviewPage() {
  const { apiKey } = useLoaderData({ from: '/_authenticated/project/$id' })

  return <AnalyzeOverviewSection apiKeyId={apiKey.id} />
}
