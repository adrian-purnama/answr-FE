import { useEffect, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import ApiKeysSection from '#/components/apiKeys/ApiKeysSection'
import { apiFetch } from '#/lib/api'
import { formatUtcDate } from '#/lib/duration'
import { formatIdr, type Invoice } from '#/lib/invoice'
import { buttonClassName, hintClassName } from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/_authenticated/dashboard/')({
  component: DashboardPage,
})

function DashboardPage() {
  const [openInvoice, setOpenInvoice] = useState<Invoice | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const response = await apiFetch<Invoice | null>(
          '/payment/invoices/active',
        )
        if (cancelled) return
        if (
          response.success &&
          response.data?.status === 'pending' &&
          new Date(response.data.expiresAt).getTime() > Date.now()
        ) {
          setOpenInvoice(response.data)
        } else {
          setOpenInvoice(null)
        }
      } catch {
        if (!cancelled) setOpenInvoice(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="mx-auto mt-8 mb-12 w-full max-w-3xl px-6 py-10 text-[var(--ink)] sm:mt-12">
      <h1 className="text-2xl font-medium">Dashboard</h1>

      {openInvoice ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--accent)]/30 pb-5">
          <p className={cn('text-sm', hintClassName)}>
            <span className="font-medium text-[var(--ink)]">
              Pending invoice
            </span>
            <span className="mx-1.5 text-[var(--line)]">·</span>
            {openInvoice.planName} · {formatIdr(openInvoice.amount)} · expires{' '}
            {formatUtcDate(openInvoice.expiresAt)}
          </p>
          <Link
            to="/payment/$id"
            params={{ id: openInvoice.id }}
            className={cn(buttonClassName, 'text-sm no-underline')}
          >
            Continue payment
          </Link>
        </div>
      ) : null}

      <ApiKeysSection />
    </main>
  )
}
