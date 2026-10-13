import { useState } from 'react'
import { cn } from '#/lib/utils'

const API_RESPONSE = `{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "email": "you@example.com",
    "jwt": "eyJhbGciOiJIUzI1NiIs..."
  }
}`

const RECENT_ACTIVITY = [
  { label: 'Chat session', value: '+ 12 messages' },
  { label: 'Model switch', value: 'GPT-4o' },
  { label: 'Export run', value: 'Completed' },
  { label: 'API call', value: '+ 847 tokens' },
]

export default function FeatureShowcase() {
  const [mode, setMode] = useState<'ui' | 'api'>('ui')

  return (
    <section className="text-white">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <h2 className="font-display mb-16 text-center text-4xl tracking-tight sm:text-5xl">
          Designed to help you build
        </h2>

        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h3 className="mb-4 text-2xl font-semibold">AI workspaces</h3>
            <p className="mb-6 leading-relaxed text-white/60">
              Develop smart AI solutions for any use case, powered by dedicated
              workspaces, model routing, and session management.
            </p>
            <ul className="mb-8 space-y-3 text-sm text-white/75">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                Fully managed sessions
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                Flexible model selection
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                Simple REST API
              </li>
            </ul>
            <a
              href="#"
              className="text-sm font-semibold text-[var(--paper)] underline underline-offset-4 transition hover:text-white"
            >
              Learn more
            </a>
          </div>

          <div>
            <div className="mb-4 flex justify-end">
              <div className="inline-flex rounded-full border border-[var(--line)] bg-white p-1">
                <button
                  type="button"
                  onClick={() => setMode('ui')}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide uppercase transition',
                    mode === 'ui'
                      ? 'bg-[var(--ink)] text-white'
                      : 'text-[var(--muted)] hover:text-[var(--ink)]',
                  )}
                >
                  UI
                </button>
                <button
                  type="button"
                  onClick={() => setMode('api')}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide uppercase transition',
                    mode === 'api'
                      ? 'bg-[var(--ink)] text-white'
                      : 'text-[var(--muted)] hover:text-[var(--ink)]',
                  )}
                >
                  API
                </button>
              </div>
            </div>

            {mode === 'ui' ? (
              <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-sm">
                <div className="border-b border-[var(--line)] px-5 py-4">
                  <p className="text-xs font-semibold tracking-wider text-[var(--muted)] uppercase">
                    Acme Workspace
                  </p>
                  <p className="text-xs text-[var(--muted)]">Session #4201</p>
                </div>
                <div className="px-5 py-4">
                  <p className="mb-1 text-xs text-[var(--muted)]">Active model</p>
                  <p className="font-display mb-4 text-3xl">GPT-4o</p>
                  <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-[var(--muted)]">Sessions</p>
                      <p className="font-medium">24 active</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--muted)]">Tokens today</p>
                      <p className="font-medium">142,800</p>
                    </div>
                  </div>
                  <p className="mb-2 text-xs font-semibold tracking-wider text-[var(--muted)] uppercase">
                    Recent activity
                  </p>
                  <ul className="space-y-2 text-sm">
                    {RECENT_ACTIVITY.map((item) => (
                      <li
                        key={item.label}
                        className="flex items-center justify-between border-t border-[var(--line)] pt-2"
                      >
                        <span className="text-[var(--muted)]">{item.label}</span>
                        <span className="font-medium">{item.value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="border-t border-[var(--line)] px-5 py-3">
                  <span className="text-xs font-semibold tracking-wider text-[var(--accent)] uppercase">
                    Open workspace
                  </span>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--ink)] shadow-sm">
                <div className="border-b border-white/10 px-5 py-3">
                  <p className="text-xs font-semibold tracking-wider text-white/50 uppercase">
                    API response
                  </p>
                  <p className="text-xs text-white/40">POST /auth/login</p>
                </div>
                <pre className="overflow-x-auto p-5 text-xs leading-relaxed text-white/80">
                  <code>{API_RESPONSE}</code>
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
