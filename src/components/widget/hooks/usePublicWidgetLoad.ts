import { useEffect, useState } from 'react'
import {
  getPublicWidget,
  isEmbedHostAllowed,
  resolveWidgetHostOrigin,
  type PublicWidget,
} from '#/lib/widget'

/**
 * Host the allowlist is checked against: the page that embedded us, not this
 * iframe's own origin. Falls back to our own host when the widget is opened
 * directly (builder preview, manual testing).
 */
function embeddingHost(): string {
  if (typeof window === 'undefined') return ''
  const hostOrigin = resolveWidgetHostOrigin()
  if (!hostOrigin) return window.location.host
  try {
    return new URL(hostOrigin).host
  } catch {
    return window.location.host
  }
}

export function usePublicWidgetLoad(publicKey: string) {
  const [widget, setWidget] = useState<PublicWidget | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const response = await getPublicWidget(publicKey)
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Widget not found')
        }

        const data = response.data
        if (!data.enabled) {
          throw new Error('This widget is disabled')
        }

        const host = embeddingHost()
        if (!isEmbedHostAllowed(data.allowedDomains, host)) {
          throw new Error(
            `This domain (${host || 'this domain'}) is not registered. Add it to the widget allowed domains in Configuration.`,
          )
        }

        if (!cancelled) {
          setWidget(data)
        }
      } catch (err) {
        if (!cancelled) {
          setWidget(null)
          setError(err instanceof Error ? err.message : 'Widget not found')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [publicKey])

  return { widget, error, loading }
}
