import { Outlet, createFileRoute, useLoaderData } from '@tanstack/react-router'
import TrainTestAgentPanel from '#/components/train/TrainTestAgentPanel'

export const Route = createFileRoute('/_authenticated/project/$id/tools')({
  component: ToolsLayout,
})

function ToolsLayout() {
  const { apiKey } = useLoaderData({ from: '/_authenticated/project/$id' })

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden md:h-[calc(100dvh-3.5rem)] md:flex-row md:overflow-hidden">
      <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden md:overflow-auto">
        <Outlet />
      </div>
      {/* Test agent is desktop-only   keeps mobile to a single page scroll. */}
      <div className="hidden h-full md:contents">
        <TrainTestAgentPanel apiKeyId={apiKey.id} />
      </div>
    </div>
  )
}
