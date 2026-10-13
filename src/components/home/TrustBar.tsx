const TRUST_ROW_1 = [
  { type: 'logo' as const, label: 'Your company here' },
  { type: 'logo' as const, label: 'Your company here' },
  { type: 'label' as const },
  { type: 'logo' as const, label: 'Your company here' },
  { type: 'logo' as const, label: 'Your company here' },
]

const TRUST_ROW_2 = [
  'Your company here',
  'Your company here',
  'Your company here',
  'Your company here',
  'Your company here',
  'Your company here',
]

const cellClass =
  'flex min-h-14 items-center justify-center border border-dashed border-[var(--line)] px-3 py-4 sm:min-h-20 sm:px-5 sm:py-6 lg:min-h-28 lg:px-6 lg:py-8'

const logoClass =
  'text-center text-[11px] font-semibold leading-tight tracking-wide text-[var(--ink)]/65 uppercase sm:text-sm lg:text-base'

export default function TrustBar() {
  return (
    <section className="border-y border-dashed border-[var(--line)] text-[var(--ink)]">
      <div className="grid grid-cols-2 lg:grid-cols-5 [&>*]:-ml-px [&>*]:-mt-px">
        {TRUST_ROW_1.map((item) =>
          item.type === 'label' ? (
            <div
              key="trusted-label"
              className={`${cellClass} order-first col-span-2 lg:order-none lg:col-span-1`}
            >
              <p className="max-w-[16rem] text-center text-[9px] leading-relaxed tracking-[0.18em] text-[var(--muted)] uppercase sm:max-w-none sm:text-[10px] sm:tracking-[0.25em] lg:text-xs">
                Lets Create History Together{' '}
                <span className="font-semibold text-[var(--ink)]">
                  Bbecome a FOunding Partner
                </span>
              </p>
            </div>
          ) : (
            <div key={item.label} className={cellClass}>
              <span className={logoClass}>{item.label}</span>
            </div>
          ),
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 [&>*]:-ml-px [&>*]:-mt-px">
        {TRUST_ROW_2.map((name) => (
          <div key={name} className={cellClass}>
            <span className={logoClass}>{name}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
