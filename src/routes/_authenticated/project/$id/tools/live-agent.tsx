import { createFileRoute, useLoaderData } from '@tanstack/react-router'
import LiveAgentSection from '#/components/liveAgent/LiveAgentSection'

export const Route = createFileRoute(
  '/_authenticated/project/$id/tools/live-agent',
)({
  component: ToolsLiveAgentPage,
})

function ToolsLiveAgentPage() {
  const { apiKey } = useLoaderData({ from: '/_authenticated/project/$id' })

  return <LiveAgentSection apiKeyId={apiKey.id} />
}
