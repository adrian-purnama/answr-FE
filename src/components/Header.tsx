import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { LogOut, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '#/context/authContext'
import { useBranding } from '#/context/brandingContext'
import { cn } from '#/lib/utils'

const NAV_LINKS = [
  { to: '/pricing' as const, label: 'Pricing' },
  { to: '/docs' as const, label: 'Docs' },
  { to: '/admin' as const, label: 'Admin', requiresAdmin: true },
] as const

const DRAWER_TRANSITION_MS = 300

export default function Header() {
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const { appName /*, appLogo */ } = useBranding()
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuVisible, setMenuVisible] = useState(false)
  const [menuAnimated, setMenuAnimated] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const isHome = pathname === '/'

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (menuOpen) {
      setMenuVisible(true)
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => setMenuAnimated(true))
      })
      return () => cancelAnimationFrame(frame)
    }

    setMenuAnimated(false)
    const timer = window.setTimeout(() => setMenuVisible(false), DRAWER_TRANSITION_MS)
    return () => window.clearTimeout(timer)
  }, [menuOpen])

  useEffect(() => {
    if (!menuVisible) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [menuVisible])

  function closeMenu() {
    setMenuOpen(false)
  }

  function openMenu() {
    setMenuOpen(true)
  }

  function handleLogout() {
    logout()
    setMenuOpen(false)
    void navigate({ to: '/login' })
  }

  const navLinkClass = isHome
    ? 'text-sm font-medium text-[var(--muted)] no-underline transition hover:text-[var(--ink)]'
    : 'text-sm font-medium text-[var(--muted)] no-underline transition hover:text-[var(--ink)]'

  const activeNavClass = isHome
    ? cn(navLinkClass, 'text-[var(--ink)] underline underline-offset-4')
    : cn(navLinkClass, 'text-[var(--ink)] underline underline-offset-4')

  const drawerLinkClass =
    'block px-6 py-3 text-base font-medium text-[var(--ink)] no-underline transition hover:bg-[var(--surface)]'
  const drawerActiveClass = cn(
    drawerLinkClass,
    'bg-[var(--surface)] font-semibold',
  )

  const ctaOutlineClass = cn(
    'rounded-[var(--radius-sm)] px-4 py-2 text-sm font-semibold no-underline transition',
    isHome
      ? 'border border-[var(--line)] text-[var(--ink)] hover:border-[var(--ink)]'
      : 'border border-[var(--line)] text-[var(--ink)] hover:border-[var(--ink)]',
  )

  const ctaPrimaryClass = cn(
    'rounded-[var(--radius-sm)] px-4 py-2 text-sm font-semibold no-underline transition',
    isHome
      ? 'bg-[var(--ink)] text-white hover:opacity-90'
      : 'bg-[var(--ink)] text-white hover:opacity-90',
  )

  const homeLink = isAuthenticated
    ? ({ to: '/dashboard' as const, label: 'Dashboard' })
    : ({ to: '/' as const, label: 'Home' })

  const visibleLinks = [
    homeLink,
    ...NAV_LINKS.filter((link) => {
      if ('requiresAdmin' in link && link.requiresAdmin) return user?.isAdmin
      return true
    }),
  ]

  const logoTo = homeLink.to
  const emailInitial = user?.email?.trim().charAt(0).toUpperCase() || '?'
  const headerLogoSrc = '/answr-logo-dark.svg'
  const drawerLogoSrc = '/answr-logo-dark.svg'

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b backdrop-blur-sm',
        isHome
          ? 'border-[var(--line)] bg-white/95 text-[var(--ink)]'
          : 'border-[var(--line)] bg-white/95 text-[var(--ink)]',
      )}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-2 sm:grid sm:grid-cols-[1fr_auto_1fr]">
        <Link
          to={logoTo}
          className="font-display inline-flex items-center gap-2 justify-self-start text-xl tracking-tight no-underline"
        >
          {/* {appLogo ? (
            <img
              src={appLogo}
              alt={appName}
              className="size-7 object-contain"
            />
          ) : (
            appName
          )} */}
          <img
            src={headerLogoSrc}
            alt={appName}
            className="h-7 w-auto object-contain"
          />
        </Link>

        <div className="hidden items-center justify-center gap-6 sm:flex">
          {visibleLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={navLinkClass}
              activeOptions={link.to === '/' ? { exact: true } : undefined}
              activeProps={{ className: activeNavClass }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center justify-self-end gap-2 sm:gap-3">
          {isLoading ? null : isAuthenticated ? (
            <div className="hidden items-center gap-3 sm:flex">
              <Link
                to="/profile"
                className={cn(
                  'inline-flex size-8 items-center justify-center rounded-full text-xs font-semibold no-underline transition',
                  isHome
                    ? 'bg-white/15 text-[var(--paper)] hover:bg-white/25'
                    : 'border border-[var(--line)] text-[var(--ink)] hover:border-[var(--ink)]',
                )}
                aria-label={`Profile (${user?.email ?? 'account'})`}
                title={user?.email}
              >
                {emailInitial}
              </Link>
              <div
                className={cn(
                  'mx-0.5 h-4 w-px',
                  isHome ? 'bg-white/20' : 'bg-[var(--line)]',
                )}
                aria-hidden
              />
              <button
                type="button"
                onClick={handleLogout}
                className={cn(
                  'inline-flex cursor-pointer items-center justify-center bg-transparent transition hover:opacity-70',
                  isHome ? 'text-[var(--paper)]' : 'text-[var(--ink)]',
                )}
                aria-label="Log out"
              >
                <LogOut className="size-4" aria-hidden />
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className={cn(ctaOutlineClass, 'hidden sm:inline-flex')}
                activeProps={{
                  className: cn(
                    ctaOutlineClass,
                    'hidden sm:inline-flex',
                    isHome ? 'border-white/40 text-[var(--paper)]' : 'border-[var(--ink)]',
                  ),
                }}
              >
                Login
              </Link>
              <Link
                to="/register"
                className={ctaPrimaryClass}
                activeProps={{
                  className: cn(
                    ctaPrimaryClass,
                    isHome ? 'bg-[var(--accent-paper)]' : 'opacity-90',
                  ),
                }}
              >
                Register
              </Link>
            </>
          )}

          <button
            type="button"
            className="inline-flex size-10 items-center justify-center text-[var(--ink)] sm:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={openMenu}
          >
            <Menu className="size-6" aria-hidden />
            <span className="sr-only">Open menu</span>
          </button>
        </div>
      </nav>

      {mounted &&
        menuVisible &&
        createPortal(
          <div
            className={cn(
              'fixed inset-0 z-[100] sm:hidden',
              menuAnimated ? 'pointer-events-auto' : 'pointer-events-none',
            )}
          >
            <button
              type="button"
              className={cn(
                'absolute inset-0 border-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300 ease-out',
                menuAnimated ? 'opacity-100' : 'opacity-0',
              )}
              aria-label="Close menu"
              onClick={closeMenu}
            />

            <aside
              id="mobile-nav"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              aria-hidden={!menuAnimated}
              className={cn(
                'absolute inset-y-0 right-0 z-10 flex w-[min(20rem,88vw)] flex-col rounded-l-[var(--radius-md)] border-l border-[var(--line)] bg-white text-[var(--ink)] shadow-2xl transition-transform duration-300 ease-out',
                menuAnimated ? 'translate-x-0' : 'translate-x-full',
              )}
            >
              <div className="flex items-center justify-between border-b border-[var(--line)] bg-white px-4 py-3">
                <Link
                  to={logoTo}
                  onClick={closeMenu}
                  className="inline-flex items-center gap-2 text-xl tracking-tight no-underline"
                >
                  {/* {appLogo ? (
                    <img
                      src={appLogo}
                      alt={appName}
                      className="size-7 object-contain"
                    />
                  ) : (
                    appName
                  )} */}
                  <img
                    src={drawerLogoSrc}
                    alt={appName}
                    className="h-7 w-auto object-contain"
                  />
                </Link>
                <button
                  type="button"
                  className="inline-flex size-10 items-center justify-center text-[var(--ink)]"
                  onClick={closeMenu}
                >
                  <X className="size-6" aria-hidden />
                  <span className="sr-only">Close menu</span>
                </button>
              </div>

              <div className="flex flex-1 flex-col bg-white py-2">
                {visibleLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={drawerLinkClass}
                    activeOptions={link.to === '/' ? { exact: true } : undefined}
                    activeProps={{ className: drawerActiveClass }}
                    onClick={closeMenu}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="mt-auto border-t border-[var(--line)] bg-white p-4">
                {isLoading ? null : isAuthenticated ? (
                  <>
                    <Link
                      to="/profile"
                      className="mb-3 flex items-center gap-3 rounded-[var(--radius-sm)] px-1 py-1 text-sm text-[var(--ink)] no-underline transition hover:bg-[var(--surface)]"
                      onClick={closeMenu}
                      aria-label={`Profile (${user?.email ?? 'account'})`}
                      title={user?.email}
                    >
                      <span className="inline-flex size-8 items-center justify-center rounded-full border border-[var(--line)] text-xs font-semibold">
                        {emailInitial}
                      </span>
                      <span>Profile</span>
                    </Link>
                    <div className="mb-3 h-px w-full bg-[var(--line)]" aria-hidden />
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-sm)] px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      <LogOut className="size-4" aria-hidden />
                      Log out
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Link
                      to="/login"
                      className="block rounded-[var(--radius-sm)] border border-[var(--line)] bg-white px-4 py-3 text-center text-sm font-semibold text-[var(--ink)] no-underline transition hover:border-[var(--ink)]"
                      onClick={closeMenu}
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="block rounded-[var(--radius-sm)] bg-[var(--ink)] px-4 py-3 text-center text-sm font-semibold text-white no-underline transition hover:opacity-90"
                      onClick={closeMenu}
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </aside>
          </div>,
          document.body,
        )}
    </header>
  )
}
