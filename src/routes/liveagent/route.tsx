import { Outlet, createFileRoute } from '@tanstack/react-router'
import { pageHead } from '#/lib/seo'

export const Route = createFileRoute('/liveagent')({
  ssr: false,
  head: () =>
    pageHead({
      title: 'Live Agent',
      path: '/liveagent',
      noIndex: true,
    }),
  component: LiveAgentLayout,
})

function LiveAgentLayout() {
  return (
    <div className="flex h-dvh flex-col bg-[var(--surface)] text-[var(--ink)]">
      <header className="shrink-0 border-b border-[var(--line)] bg-white px-6 py-3">
        <p className="text-sm font-medium tracking-wide text-[var(--ink)]">
          SapAi Live Agent
        </p>
      </header>
      <div className="min-h-0 flex-1">
        <Outlet />
      </div>
    </div>
  )
}
