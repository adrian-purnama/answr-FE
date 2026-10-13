import { Link, useRouterState } from '@tanstack/react-router'
import { useBranding } from '#/context/brandingContext'
import BrandMark from '#/components/BrandMark'
import { cn } from '#/lib/utils'

type FooterLink =
  | { label: string; to: '/pricing' | '/dashboard' | '/register' | '/privacy' | '/docs' }
  | { label: string; href: string }

const FOOTER_COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Pricing', to: '/pricing' },
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Register', to: '/register' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Privacy Policy', to: '/privacy' },
    ],
  },
  {
    title: 'Developers',
    links: [
      { label: 'Docs', to: '/docs' },
      { label: 'API', href: '#' },
    ],
  },
]

export default function Footer() {
  const year = new Date().getFullYear()
  const { appName } = useBranding()
  const isHome = useRouterState({ select: (state) => state.location.pathname === '/' })

  const linkClass = isHome
    ? 'text-sm text-[var(--muted)] no-underline transition hover:text-[var(--ink)]'
    : 'text-sm text-[var(--muted)] no-underline transition hover:text-[var(--ink)]'

  return (
    <footer
      className={cn(
        isHome
          ? 'border-t border-[var(--line)] bg-white text-[var(--ink)]'
          : 'border-t border-[var(--line)] bg-white text-[var(--ink)]',
      )}
    >
      <div className="mx-auto max-w-6xl px-6 py-16">
        <Link to="/" className="mb-12 inline-flex no-underline">
          <BrandMark variant="dark" size="lg" />
        </Link>

        <div className="mb-12 grid gap-10 sm:grid-cols-3">
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="mb-4 text-sm font-semibold">{column.title}</p>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {'to' in link ? (
                      <Link to={link.to} className={linkClass}>
                        {link.label}
                      </Link>
                    ) : (
                      <a href={link.href} className={linkClass}>
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div
          className={cn(
            'border-t pt-8',
            isHome ? 'border-[var(--line)]' : 'border-[var(--line)]',
          )}
        >
          <p className={cn('text-sm', isHome ? 'text-[var(--muted)]' : 'text-[var(--muted)]')}>
            &copy; {year} {appName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
