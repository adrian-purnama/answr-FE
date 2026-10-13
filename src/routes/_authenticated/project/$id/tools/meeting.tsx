import { createFileRoute, useLoaderData } from '@tanstack/react-router'
import MeetingToolSection from '#/components/meetingTool/MeetingToolSection'

export const Route = createFileRoute(
  '/_authenticated/project/$id/tools/meeting',
)({
  component: ToolsMeetingPage,
})

function ToolsMeetingPage() {
  const { apiKey } = useLoaderData({ from: '/_authenticated/project/$id' })

  return <MeetingToolSection apiKeyId={apiKey.id} />
}
