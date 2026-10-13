import { createFileRoute, redirect } from '@tanstack/react-router'
import LiveAgentDashboard from '#/components/liveAgent/LiveAgentDashboard'
import { bootstrapLiveAgentAuth } from '#/lib/liveAgent'

export const Route = createFileRoute('/liveagent/')({
  ssr: false,
  beforeLoad: async () => {
    const agent = await bootstrapLiveAgentAuth()
    if (!agent) {
      throw redirect({ to: '/liveagent/login' })
    }
    return { agent }
  },
  component: LiveAgentHomePage,
})

function LiveAgentHomePage() {
  const { agent } = Route.useRouteContext()
  return <LiveAgentDashboard agent={agent} />
}
