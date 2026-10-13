import { useEffect, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '#/lib/utils'

const ANIMATION_MS = 180

type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  maxWidth?: string
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 'max-w-md',
}: ModalProps) {
  const [mounted, setMounted] = useState(false)
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    if (open) {
      setMounted(true)
      return
    }
    setAnimated(false)
    const timer = window.setTimeout(() => setMounted(false), ANIMATION_MS)
    return () => window.clearTimeout(timer)
  }, [open])

  // Wait for the closed frame to paint, then animate in (single rAF often skips).
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

  if (!mounted) return null

  return (
    <div
      className={cn(
        'fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4 transition-opacity duration-50 ease-out',
        animated ? 'opacity-100' : 'opacity-0',
      )}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'w-full rounded-[var(--radius-md)] border border-[var(--line)] bg-white p-6 shadow-lg transition-[opacity,transform] duration-50 ease-out',
          animated ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
          maxWidth,
        )}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-lg font-medium text-[var(--ink)]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--ink)]"
            aria-label="Close"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
