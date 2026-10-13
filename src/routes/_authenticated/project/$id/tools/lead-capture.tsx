import { createFileRoute, useLoaderData } from '@tanstack/react-router'
import LeadCaptureSection from '#/components/leadCapture/LeadCaptureSection'

export const Route = createFileRoute(
  '/_authenticated/project/$id/tools/lead-capture',
)({
  component: ToolsLeadCapturePage,
})

function ToolsLeadCapturePage() {
  const { apiKey } = useLoaderData({ from: '/_authenticated/project/$id' })

  return <LeadCaptureSection apiKeyId={apiKey.id} />
}
