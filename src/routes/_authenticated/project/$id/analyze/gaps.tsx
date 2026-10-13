import { createFileRoute, useLoaderData } from '@tanstack/react-router'
import AnalyzeGapsSection from '#/components/analyze/AnalyzeGapsSection'

export const Route = createFileRoute(
  '/_authenticated/project/$id/analyze/gaps',
)({
  component: AnalyzeGapsPage,
})

function AnalyzeGapsPage() {
  const { apiKey } = useLoaderData({ from: '/_authenticated/project/$id' })

  return <AnalyzeGapsSection apiKeyId={apiKey.id} />
}
