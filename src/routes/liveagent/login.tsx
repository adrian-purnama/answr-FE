import { createFileRoute, redirect } from '@tanstack/react-router'
import LiveAgentLoginForm from '#/components/liveAgent/LiveAgentLoginForm'
import { bootstrapLiveAgentAuth } from '#/lib/liveAgent'

type LiveAgentLoginSearch = {
  code?: string
}

export const Route = createFileRoute('/liveagent/login')({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): LiveAgentLoginSearch => {
    const raw = search.code
    if (typeof raw !== 'string') return {}
    const code = raw.trim().toUpperCase()
    return code ? { code } : {}
  },
  beforeLoad: async () => {
    const agent = await bootstrapLiveAgentAuth()
    if (agent) {
      throw redirect({ to: '/liveagent' })
    }
  },
  component: LiveAgentLoginPage,
})

function LiveAgentLoginPage() {
  const { code } = Route.useSearch()
  return (
    <main className="mx-auto mt-8 mb-12 w-full max-w-md px-6 pt-12 pb-10 text-[var(--ink)] sm:mt-12 sm:pt-16">
      <LiveAgentLoginForm initialCode={code} />
    </main>
  )
}
