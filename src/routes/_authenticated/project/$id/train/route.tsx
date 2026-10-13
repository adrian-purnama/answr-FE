import { Outlet, createFileRoute, useLoaderData } from '@tanstack/react-router'
import TrainTestAgentPanel from '#/components/train/TrainTestAgentPanel'

export const Route = createFileRoute('/_authenticated/project/$id/train')({
  component: TrainLayout,
})

function TrainLayout() {
  const { apiKey } = useLoaderData({ from: '/_authenticated/project/$id' })

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] min-h-0 min-w-0 flex-1 overflow-hidden">
      <div className="min-h-0 min-w-0 flex-1 overflow-auto">
        <Outlet />
      </div>
      <TrainTestAgentPanel apiKeyId={apiKey.id} />
    </div>
  )
}
