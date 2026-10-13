import { createFileRoute, useLoaderData } from '@tanstack/react-router'
import AnalyzePerformanceSection from '#/components/analyze/AnalyzePerformanceSection'

export const Route = createFileRoute(
  '/_authenticated/project/$id/analyze/performance',
)({
  component: AnalyzePerformancePage,
})

function AnalyzePerformancePage() {
  const { apiKey } = useLoaderData({ from: '/_authenticated/project/$id' })

  return <AnalyzePerformanceSection apiKeyId={apiKey.id} />
}
