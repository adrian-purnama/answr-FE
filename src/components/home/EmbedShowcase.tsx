import { useEffect, useMemo, useState } from 'react'
import { Check, Copy } from 'lucide-react'

/** Same demo public key used by HostWidgetEmbed in __root.tsx */
const DEMO_PUBLIC_KEY = 'c3e595a262334d36c91bde6cca787192'

const STEPS = [
  {
    n: '01',
    title: 'Copy one script',
    body: 'Public key only — nothing secret leaves your dashboard.',
  },
  {
    n: '02',
    title: 'Paste before </body>',
    body: 'Works on any allowed domain. No npm install, no iframe farm.',
  },
  {
    n: '03',
    title: 'Answers show up',
    body: 'Same widget live in this page’s corner — ready for your visitors.',
  },
] as const

const PREVIEW_TABS = ['Home', 'Chat', 'Help', 'News'] as const

export default function EmbedShowcase() {
  const [origin, setOrigin] = useState('https://answr.id')
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) return

    const id = window.setInterval(() => {
      setActiveTab((prev) => (prev + 1) % PREVIEW_TABS.length)
    }, 2800)
    return () => window.clearInterval(id)
  }, [])

  const snippet = useMemo(
    () =>
      `<script src="${origin}/widget.js" data-public-key="${DEMO_PUBLIC_KEY}" async></script>`,
    [origin],
  )

  async function copySnippet() {
    try {
      await navigator.clipboard.writeText(snippet)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section
      id="embed"
      className="relative overflow-hidden border-t border-[var(--line)] text-[var(--ink)]"
      aria-labelledby="embed-heading"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_100%_0%,color-mix(in_srgb,var(--logo-gold)_14%,transparent),transparent_55%),radial-gradient(ellipse_50%_40%_at_0%_100%,color-mix(in_srgb,var(--primary)_8%,transparent),transparent_50%)]"
      />

      <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          <div>
            <p className="nojegaye mb-4 text-sm tracking-wide text-[var(--accent)]">
              On your site
            </p>
            <h2
              id="embed-heading"
              className="nojegaye mb-4 max-w-xl text-3xl leading-tight tracking-tight text-[var(--primary)] sm:text-4xl"
            >
              Drop Answr in. Visitors find jawaban.
            </h2>
            <p className="mb-10 max-w-md text-sm leading-relaxed text-[var(--muted)]">
              One loader tag mounts chat, help, and news in the corner of your
              site — the same experience running on this page right now.
            </p>

            <ol className="space-y-6">
              {STEPS.map((step) => (
                <li key={step.n} className="grid grid-cols-[auto_1fr] gap-4">
                  <span className="font-mono text-[11px] leading-6 text-[var(--logo-gold)]">
                    {step.n}
                  </span>
                  <div>
                    <h3 className="mb-1 text-base font-medium text-[var(--ink)]">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[var(--muted)]">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--line)] bg-white shadow-[0_24px_60px_-28px_rgba(12,12,11,0.35)]">
              <div className="flex items-center gap-2 border-b border-[var(--line)] bg-[var(--surface)] px-4 py-3">
                <span className="size-2.5 rounded-full bg-[var(--line)]" />
                <span className="size-2.5 rounded-full bg-[var(--line)]" />
                <span className="size-2.5 rounded-full bg-[var(--line)]" />
                <span className="ml-2 truncate font-mono text-[10px] tracking-wide text-[var(--muted)]">
                  yoursite.com
                </span>
              </div>

              <div className="relative min-h-[22rem] bg-[linear-gradient(180deg,#faf9f7_0%,#ffffff_55%)] p-5 sm:min-h-[24rem] sm:p-6">
                <div className="mb-4 h-2.5 w-28 bg-[var(--line)]" />
                <div className="mb-2 h-2 w-3/4 max-w-xs bg-[var(--line)]/70" />
                <div className="mb-2 h-2 w-2/3 max-w-[14rem] bg-[var(--line)]/55" />
                <div className="mb-8 h-2 w-1/2 max-w-[11rem] bg-[var(--line)]/40" />
                <div className="grid max-w-sm gap-2">
                  <div className="h-16 border border-dashed border-[var(--line)] bg-white/60" />
                  <div className="h-16 border border-dashed border-[var(--line)] bg-white/60" />
                </div>

                <div className="absolute right-4 bottom-4 flex w-[min(17.5rem,calc(100%-2rem))] flex-col overflow-hidden rounded-[var(--radius-md)] border border-[var(--line)] bg-white shadow-[0_18px_40px_-20px_rgba(27,43,77,0.45)] sm:right-5 sm:bottom-5">
                  <div className="flex items-center justify-between border-b border-[var(--line)] px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <img
                        src="/answr%20logo%20dark.svg"
                        alt=""
                        className="h-4 w-auto object-contain"
                      />
                      <span className="text-xs font-semibold text-[var(--primary)]">
                        Answr
                      </span>
                    </div>
                    <span className="font-mono text-[9px] tracking-wider text-[var(--logo-gold)] uppercase">
                      Live
                    </span>
                  </div>

                  <div className="space-y-2.5 px-3 py-3">
                    <p className="rounded-[var(--radius-sm)] bg-[var(--surface)] px-2.5 py-2 text-[11px] leading-relaxed text-[var(--muted)]">
                      Hi — what can we help you find today?
                    </p>
                    <p className="ml-6 rounded-[var(--radius-sm)] bg-[var(--primary)] px-2.5 py-2 text-[11px] leading-relaxed text-white">
                      How do I get started?
                    </p>
                    <p
                      key={PREVIEW_TABS[activeTab]}
                      className="embed-fade rounded-[var(--radius-sm)] bg-[var(--surface)] px-2.5 py-2 text-[11px] leading-relaxed text-[var(--ink)]"
                    >
                      {activeTab === 0 &&
                        'Start from Home — greetings, logo, and quick paths.'}
                      {activeTab === 1 &&
                        'Chat for AI answers, handoff, or book a meeting.'}
                      {activeTab === 2 &&
                        'Help surfaces articles when people prefer to self-serve.'}
                      {activeTab === 3 &&
                        'News shares updates with optional call-to-action links.'}
                    </p>
                  </div>

                  <div
                    className="grid grid-cols-4 border-t border-[var(--line)]"
                    role="tablist"
                    aria-label="Widget areas"
                  >
                    {PREVIEW_TABS.map((tab, i) => (
                      <button
                        key={tab}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === i}
                        onClick={() => setActiveTab(i)}
                        className={`py-2 text-[10px] font-medium transition ${
                          activeTab === i
                            ? 'bg-[var(--paper)] text-[var(--primary)]'
                            : 'text-[var(--muted)] hover:text-[var(--ink)]'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-4 text-center text-xs text-[var(--muted)] sm:text-left">
              Open the Answr bubble on this page to try the real embed.
            </p>
          </div>
        </div>

        {/* <div className="mt-14 border-t border-[var(--line)] pt-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="font-mono text-[11px] tracking-[0.14em] text-[var(--muted)] uppercase">
              Install snippet
            </p>
            <button
              type="button"
              onClick={() => void copySnippet()}
              className="inline-flex items-center gap-1.5 border border-[var(--line)] bg-white px-3 py-1.5 text-xs text-[var(--ink)] transition hover:border-[var(--logo-gold)] hover:text-[var(--logo-gold)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--logo-gold)]"
            >
              {copied ? (
                <>
                  <Check className="size-3.5" aria-hidden />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="size-3.5" aria-hidden />
                  Copy
                </>
              )}
            </button>
          </div>
          <pre className="overflow-x-auto border border-[var(--line)] bg-white/80 p-4 font-mono text-[11px] leading-relaxed text-[var(--ink)]/80 backdrop-blur-sm sm:text-xs">
            <code>{snippet}</code>
          </pre>
        </div> */}
      </div>

      <style>{`
        @keyframes embed-fade {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .embed-fade {
          animation: embed-fade 0.45s ease-out;
        }
        @media (prefers-reduced-motion: reduce) {
          .embed-fade {
            animation: none;
          }
        }
      `}</style>
    </section>
  )
}
