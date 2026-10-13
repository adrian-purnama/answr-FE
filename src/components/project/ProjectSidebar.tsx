import { Link, useRouterState } from '@tanstack/react-router'
import { ChevronDown, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ApiKey } from '#/lib/apiKey'
import {
  PROJECT_NAV,
  filterProjectNav,
  projectNavHref,
} from '#/lib/project-nav'
import type { ProjectNavGroup, ProjectNavItem, ProjectNavLink } from '#/lib/project-nav'
import { hintClassName } from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

const DRAWER_TRANSITION_MS = 300

type ProjectSidebarProps = {
  projectId: string
  apiKey: ApiKey
}

const navItemBase =
  'rounded-[var(--radius-sm)] px-3 py-2.5 text-sm text-[var(--ink)] transition-colors hover:bg-neutral-100'

const navLinkClass = cn(navItemBase, 'flex items-center gap-2.5 no-underline')

const navLinkActiveClass = 'bg-neutral-200 hover:bg-neutral-200'

const navGroupButtonClass = cn(
  navItemBase,
  'flex w-full items-center gap-2.5 text-left',
)

function searchMatches(
  locationSearch: Record<string, unknown>,
  expected?: Record<string, string>,
): boolean {
  const expectedEntries = Object.entries(expected ?? {})
  if (expectedEntries.length === 0) {
    // Path-only links stay active for any search on that route.
    return true
  }
  return expectedEntries.every(([key, value]) => locationSearch[key] === value)
}

function isNavLinkActive(
  pathname: string,
  locationSearch: Record<string, unknown>,
  projectId: string,
  item: ProjectNavLink,
): boolean {
  const href = projectNavHref(projectId, item.to)
  const pathMatch = pathname === href || pathname.startsWith(`${href}/`)
  if (!pathMatch) return false
  return searchMatches(locationSearch, item.search)
}

function isGroupActive(
  pathname: string,
  locationSearch: Record<string, unknown>,
  projectId: string,
  group: ProjectNavGroup,
): boolean {
  return group.children.some((child) => {
    if (child.type === 'link') {
      return isNavLinkActive(pathname, locationSearch, projectId, child)
    }
    return isGroupActive(pathname, locationSearch, projectId, child)
  })
}

function NavLinkItem({
  item,
  projectId,
  pathname,
  locationSearch,
  nested = false,
  onNavigate,
}: {
  item: ProjectNavLink
  projectId: string
  pathname: string
  locationSearch: Record<string, unknown>
  nested?: boolean
  onNavigate?: () => void
}) {
  const href = projectNavHref(projectId, item.to, item.search)
  const isActive = isNavLinkActive(pathname, locationSearch, projectId, item)
  const Icon = item.icon

  return (
    <Link
      to={href}
      onClick={onNavigate}
      className={cn(navLinkClass, nested && 'pl-6', isActive && navLinkActiveClass)}
    >
      <Icon className="size-4 shrink-0 text-[var(--muted)]" aria-hidden />
      <span className="min-w-0 truncate">{item.label}</span>
    </Link>
  )
}

function NavGroupItem({
  group,
  projectId,
  pathname,
  locationSearch,
  onNavigate,
}: {
  group: ProjectNavGroup
  projectId: string
  pathname: string
  locationSearch: Record<string, unknown>
  onNavigate?: () => void
}) {
  const childActive = isGroupActive(
    pathname,
    locationSearch,
    projectId,
    group,
  )
  const [expanded, setExpanded] = useState(childActive)
  const Icon = group.icon

  useEffect(() => {
    if (childActive) setExpanded(true)
  }, [childActive])

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        className={navGroupButtonClass}
        aria-expanded={expanded}
      >
        <Icon className="size-4 shrink-0 text-[var(--muted)]" aria-hidden />
        <span className="min-w-0 flex-1 truncate">{group.label}</span>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-[var(--muted)] transition-transform duration-300 ease-out',
            expanded && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-out',
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div
            className={cn(
              'mt-1 space-y-0.5 transition-opacity duration-300 ease-out',
              expanded ? 'opacity-100' : 'opacity-0',
            )}
          >
            {group.children.map((child) =>
              child.type === 'link' ? (
                <NavLinkItem
                  key={`${child.to}:${child.search ? JSON.stringify(child.search) : ''}`}
                  item={child}
                  projectId={projectId}
                  pathname={pathname}
                  locationSearch={locationSearch}
                  nested
                  onNavigate={onNavigate}
                />
              ) : (
                <NavGroupItem
                  key={child.label}
                  group={child}
                  projectId={projectId}
                  pathname={pathname}
                  locationSearch={locationSearch}
                  onNavigate={onNavigate}
                />
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function NavItems({
  items,
  projectId,
  pathname,
  locationSearch,
  onNavigate,
}: {
  items: ProjectNavItem[]
  projectId: string
  pathname: string
  locationSearch: Record<string, unknown>
  onNavigate?: () => void
}) {
  return (
    <>
      {items.map((item) =>
        item.type === 'link' ? (
          <NavLinkItem
            key={`${item.to}:${item.search ? JSON.stringify(item.search) : ''}`}
            item={item}
            projectId={projectId}
            pathname={pathname}
            locationSearch={locationSearch}
            onNavigate={onNavigate}
          />
        ) : (
          <NavGroupItem
            key={item.label}
            group={item}
            projectId={projectId}
            pathname={pathname}
            locationSearch={locationSearch}
            onNavigate={onNavigate}
          />
        ),
      )}
    </>
  )
}

function SidebarNavContent({
  projectId,
  apiKey,
  pathname,
  locationSearch,
  navItems,
  onNavigate,
}: {
  projectId: string
  apiKey: ApiKey
  pathname: string
  locationSearch: Record<string, unknown>
  navItems: ProjectNavItem[]
  onNavigate?: () => void
}) {
  return (
    <>
      <Link
        to="/dashboard"
        onClick={onNavigate}
        className={`block text-sm ${hintClassName} no-underline transition hover:text-[var(--ink)]`}
      >
        ← Dashboard
      </Link>

      <div className="mt-3 border-b border-[var(--line)] pb-3">
        <p className="truncate font-medium text-[var(--ink)]">{apiKey.label}</p>
        <p className={`mt-0.5 truncate font-mono text-xs ${hintClassName}`}>{apiKey.prefix}…</p>
      </div>

      <nav className="mt-3 space-y-0.5">
        <NavItems
          items={navItems}
          projectId={projectId}
          pathname={pathname}
          locationSearch={locationSearch}
          onNavigate={onNavigate}
        />
      </nav>
    </>
  )
}

function ProjectMobileDrawer({
  open,
  onClose,
  projectId,
  apiKey,
  pathname,
  locationSearch,
  navItems,
}: {
  open: boolean
  onClose: () => void
  projectId: string
  apiKey: ApiKey
  pathname: string
  locationSearch: Record<string, unknown>
  navItems: ProjectNavItem[]
}) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (open) {
      setVisible(true)
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimated(true))
      })
      return () => cancelAnimationFrame(frame)
    }

    setAnimated(false)
    const timer = window.setTimeout(() => setVisible(false), DRAWER_TRANSITION_MS)
    return () => window.clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (!visible) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [visible, onClose])

  if (!mounted || !visible) return null

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[100] md:hidden',
        animated ? 'pointer-events-auto' : 'pointer-events-none',
      )}
    >
      <button
        type="button"
        className={cn(
          'absolute inset-0 border-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300 ease-out',
          animated ? 'opacity-100' : 'opacity-0',
        )}
        aria-label="Close project menu"
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Project navigation"
        aria-hidden={!animated}
        className={cn(
          'absolute inset-y-0 left-0 z-10 flex w-[min(20rem,88vw)] flex-col border-r border-[var(--line)] bg-white text-[var(--ink)] shadow-2xl transition-transform duration-300 ease-out',
          animated ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
          <span className="truncate text-sm font-medium">{apiKey.label}</span>
          <button
            type="button"
            className="inline-flex size-10 shrink-0 items-center justify-center text-[var(--ink)]"
            onClick={onClose}
          >
            <X className="size-5" aria-hidden />
            <span className="sr-only">Close menu</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <SidebarNavContent
            projectId={projectId}
            apiKey={apiKey}
            pathname={pathname}
            locationSearch={locationSearch}
            navItems={navItems}
            onNavigate={onClose}
          />
        </div>
      </aside>
    </div>,
    document.body,
  )
}

export default function ProjectSidebar({
  projectId,
  apiKey,
}: ProjectSidebarProps) {
  const { pathname, locationSearch } = useRouterState({
    select: (state) => ({
      pathname: state.location.pathname,
      locationSearch: state.location.search as Record<string, unknown>,
    }),
  })
  const [drawerOpen, setDrawerOpen] = useState(false)
  const navItems = filterProjectNav(PROJECT_NAV, apiKey)

  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname, locationSearch])

  return (
    <>
      {/* Mobile: compact bar + drawer from the left */}
      <div className="border-b border-[var(--line)] bg-white md:hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--line)] text-[var(--ink)] transition hover:border-[var(--ink)]"
            aria-expanded={drawerOpen}
            aria-label="Open project menu"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="size-5" aria-hidden />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-[var(--ink)]">{apiKey.label}</p>
            <p className={`truncate font-mono text-xs ${hintClassName}`}>{apiKey.prefix}…</p>
          </div>
        </div>

        <ProjectMobileDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          projectId={projectId}
          apiKey={apiKey}
          pathname={pathname}
          locationSearch={locationSearch}
          navItems={navItems}
        />
      </div>

      {/* Desktop: flush left sticky nav */}
      <aside
        className={cn(
          'sticky top-14 z-20 hidden h-[calc(100dvh-3.5rem)] w-56 shrink-0 flex-col overflow-y-auto border-r border-[var(--line)] bg-white p-4 lg:w-60 xl:w-64 md:flex',
        )}
      >
        <SidebarNavContent
          projectId={projectId}
          apiKey={apiKey}
          pathname={pathname}
          locationSearch={locationSearch}
          navItems={navItems}
        />
      </aside>
    </>
  )
}
