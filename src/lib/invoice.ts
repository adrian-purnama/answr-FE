import { getToken } from '#/context/authContext'

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export type InvoiceSimulatedPeriod = {
  planId: string
  planName: string
  effectiveDate: string
  untilDate: string
}

export type Invoice = {
  id: string
  userId: string
  planId: string
  planName: string
  amount: number
  status: string
  snapToken: string | null
  expiresAt: string
  paidAt: string | null
  activatedAt: string | null
  midtransTransactionStatus: string | null
  createdAt: string
  updatedAt: string
  simulatedPeriod: InvoiceSimulatedPeriod | null
}

export type InvoiceList = {
  items: Invoice[]
  page: number
  pageSize: number
  total: number
}

export type MidtransClientConfig = {
  clientKey: string
  snapJsUrl: string
  build: 'development' | 'production'
}

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options?: {
          onSuccess?: (result: unknown) => void
          onPending?: (result: unknown) => void
          onError?: (result: unknown) => void
          onClose?: () => void
        },
      ) => void
      hide?: () => void
      show?: () => void
    }
  }
}

export function formatIdr(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Authenticated PDF download for an invoice the user owns. */
export async function downloadInvoicePdf(invoiceId: string): Promise<void> {
  const headers = new Headers()
  const token = getToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(
    `${API_BASE_URL}/payment/invoices/${encodeURIComponent(invoiceId)}/export-pdf`,
    { headers },
  )

  if (!response.ok) {
    let message = 'Failed to export invoice'
    try {
      const body = (await response.json()) as { message?: string }
      if (body.message) message = body.message
    } catch {
      // keep default
    }
    throw new Error(message)
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `invoice-${invoiceId}.pdf`
  anchor.click()
  URL.revokeObjectURL(url)
}
