import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '#/lib/utils'

export type SideDrawerSize = 'lg' | 'md'

type SideDrawerProps = {
  open: boolean
  onClose: () => void
  label: string
  statusLabel?: ReactNode
  actions?: ReactNode
  details?: ReactNode
  size?: SideDrawerSize
  /** Merged onto the scrollable body wrapper (e.g. wider content for dense forms). */
  contentClassName?: string
  children: ReactNode
}

const PANEL_SIZE: Record<SideDrawerSize, string> = {
  lg: 'max-w-3xl sm:max-w-3xl lg:max-w-4xl',
  md: 'max-w-xl sm:max-w-xl',
}

const PANEL_SIZE_WITH_DETAILS: Record<SideDrawerSize, string> = {
  lg: 'max-w-4xl sm:max-w-5xl lg:max-w-6xl',
  md: 'max-w-2xl sm:max-w-3xl',
}

const BODY_SIZE: Record<SideDrawerSize, string> = {
  lg: 'max-w-2xl px-5 py-10 sm:px-10 sm:py-12',
  md: 'w-full px-5 py-8 sm:px-8 sm:py-10',
}

let bodyScrollLocks = 0

function lockBodyScroll() {
  bodyScrollLocks += 1
  if (bodyScrollLocks === 1) {
    document.body.style.overflow = 'hidden'
  }
}

function unlockBodyScroll() {
  bodyScrollLocks = Math.max(0, bodyScrollLocks - 1)
  if (bodyScrollLocks === 0) {
    document.body.style.overflow = ''
  }
}

export default function SideDrawer({
  open,
  onClose,
  label,
  statusLabel,
  actions,
  details,
  size = 'lg',
  contentClassName,
  children,
}: SideDrawerProps) {
  const titleId = useId()
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const [mounted, setMounted] = useState(false)
  const [animated, setAnimated] = useState(false)
  const hasDetails = Boolean(details)

  useEffect(() => {
    if (open) {
      setMounted(true)
      return
    }
    setAnimated(false)
    const timer = window.setTimeout(() => setMounted(false), 300)
    return () => window.clearTimeout(timer)
  }, [open])

  // Wait for the off-screen frame to paint, then slide in (single rAF often skips).
  useEffect(() => {
    if (!open || !mounted) return
    let inner = 0
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setAnimated(true))
    })
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [open, mounted])

  useEffect(() => {
    if (!open) return
    lockBodyScroll()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      unlockBodyScroll()
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!mounted || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[100]',
        animated ? 'pointer-events-auto' : 'pointer-events-none',
      )}
    >
      <button
        type="button"
        className={cn(
          'absolute inset-0 border-0 bg-black/35 transition-opacity duration-300 ease-out',
          animated ? 'opacity-100' : 'opacity-0',
        )}
        aria-label={`Close ${label.toLowerCase()} editor`}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'absolute inset-y-0 right-0 flex w-full flex-col overflow-hidden bg-white shadow-2xl transition-transform duration-300 ease-out',
          'border-l border-[var(--line)]',
          hasDetails ? PANEL_SIZE_WITH_DETAILS[size] : PANEL_SIZE[size],
          animated ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <header className="sticky top-0 z-10 flex shrink-0 items-center gap-3 border-b border-[var(--line)] bg-white/95 px-4 py-2.5 backdrop-blur-sm sm:px-8">
          <div className="min-w-0 flex-1">
            <p
              id={titleId}
              className="truncate text-xs font-medium tracking-wide text-[var(--muted)] uppercase"
            >
              {label}
            </p>
            {statusLabel ? (
              <div className="mt-0.5 flex items-center gap-2">{statusLabel}</div>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">{actions}</div>
          <button
            type="button"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--ink)]"
            onClick={onClose}
          >
            <X className="size-4" aria-hidden />
            <span className="sr-only">Close</span>
          </button>
        </header>

        <div className="flex min-h-0 min-w-0 flex-1">
          <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
            <div
              className={cn('mx-auto min-w-0', BODY_SIZE[size], contentClassName)}
            >
              {children}
            </div>
          </div>
          {hasDetails ? (
            <aside className="hidden w-64 shrink-0 border-l border-[var(--line)] bg-[var(--surface)]/30 sm:flex sm:w-72 sm:flex-col">
              {details}
            </aside>
          ) : null}
        </div>
      </aside>
    </div>,
    document.body,
  )
}
