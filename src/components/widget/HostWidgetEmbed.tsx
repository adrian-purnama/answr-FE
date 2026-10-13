import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { useAuth } from '#/context/authContext'
import { createVisitorJwt, getWidget } from '#/lib/widget'
import type { SapAiWidgetApi } from '#/widget-loader/loader'

type HostWidgetEmbedProps = {
  /** Fallback widget public key when not inside a project. */
  publicKey: string
  /** SapAi project id. Falls back to `/project/$id` when omitted. */
  apiKeyId?: string
}

/** Remint ~60s before JWT exp so the embed can re-bind before chat fails. */
const REMINT_SKEW_MS = 60_000

const LOADER_SRC = '/widget.js'

/**
 * Installs the widget on this app exactly the way a customer installs it: by
 * loading the public loader script. This component contributes no styling,
 * positioning or animation   the loader owns the iframe box and the widget
 * owns everything visible   so what we see in development is what a
 * third-party page gets.
 *
 * When the user is inside a project, mints a visitor JWT with that project's
 * `apiKeyId` (and that project's widget public key), the same way a customer
 * host would pass page context from their own backend.
 */
export default function HostWidgetEmbed({
  publicKey: fallbackPublicKey,
  apiKeyId: apiKeyIdProp,
}: HostWidgetEmbedProps) {
  const { isAuthenticated, isLoading } = useAuth()

  const routeApiKeyId = useRouterState({
    select: (state) => {
      const match = /^\/project\/([^/]+)/.exec(state.location.pathname)
      return match?.[1] ?? null
    },
  })
  const apiKeyId = apiKeyIdProp?.trim() || routeApiKeyId

  const [publicKey, setPublicKey] = useState(fallbackPublicKey)

  // Any signed-in user in a project gets a visitor JWT with that apiKeyId.
  const canMint = isAuthenticated && Boolean(apiKeyId)

  useEffect(() => {
    if (!apiKeyId) {
      setPublicKey(fallbackPublicKey)
      return
    }
    let cancelled = false
    void getWidget(apiKeyId).then((response) => {
      if (cancelled) return
      const key = response.data?.publicKey?.trim()
      if (response.success && key) {
        setPublicKey(key)
      }
    })
    return () => {
      cancelled = true
    }
  }, [apiKeyId, fallbackPublicKey])

  const expiresAtMsRef = useRef<number | null>(null)
  const remintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mintInFlightRef = useRef<Promise<string | null> | null>(null)

  const widgetApi = useCallback((): SapAiWidgetApi | undefined => {
    if (typeof window === 'undefined') return undefined
    return window.SapAiWidget
  }, [])

  const clearRemintTimer = useCallback(() => {
    if (remintTimerRef.current) {
      clearTimeout(remintTimerRef.current)
      remintTimerRef.current = null
    }
  }, [])

  const mintAndDeliverRef = useRef<() => Promise<string | null>>(async () => null)

  const mintAndDeliver = useCallback(async (): Promise<string | null> => {
    if (!apiKeyId) return null
    if (mintInFlightRef.current) {
      return mintInFlightRef.current
    }

    const run = (async (): Promise<string | null> => {
      try {
        const response = await createVisitorJwt(publicKey, {
          claims: { apiKeyId },
        })
        const token = response.data?.token?.trim() || null
        const expiresAt = response.data?.expiresAt
        if (!response.success || !token || !expiresAt) {
          console.warn(
            '[HostWidgetEmbed] visitor JWT mint failed:',
            response.message || 'no token',
          )
          return null
        }

        const expiresAtMs = Date.parse(expiresAt)
        expiresAtMsRef.current = Number.isNaN(expiresAtMs) ? null : expiresAtMs
        widgetApi()?.setVisitorToken(token)

        if (!Number.isNaN(expiresAtMs)) {
          clearRemintTimer()
          const delay = Math.max(0, expiresAtMs - Date.now() - REMINT_SKEW_MS)
          remintTimerRef.current = setTimeout(() => {
            void mintAndDeliverRef.current()
          }, delay)
        }

        return token
      } catch (error) {
        console.warn('[HostWidgetEmbed] visitor JWT mint error:', error)
        return null
      } finally {
        mintInFlightRef.current = null
      }
    })()

    mintInFlightRef.current = run
    return run
  }, [apiKeyId, clearRemintTimer, publicKey, widgetApi])

  mintAndDeliverRef.current = mintAndDeliver

  // Load / reload the public loader when the widget public key changes
  // (e.g. switching projects).
  useEffect(() => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${LOADER_SRC}"]`,
    )
    if (existing) {
      window.SapAiWidget?.destroy()
      existing.remove()
    }

    const script = document.createElement('script')
    script.src = LOADER_SRC
    script.async = true
    script.dataset.publicKey = publicKey
    document.body.appendChild(script)

    return () => {
      window.SapAiWidget?.destroy()
      script.remove()
    }
  }, [publicKey])

  // The widget asks for a fresh identity whenever it needs one.
  useEffect(() => {
    if (isLoading) return
    let cancelled = false

    function register(api: SapAiWidgetApi) {
      api.onVisitorTokenRequest(() => {
        if (!canMint) return
        void mintAndDeliver()
      })
      if (canMint) void mintAndDeliver()
    }

    const api = widgetApi()
    if (api) {
      register(api)
      return
    }

    const poll = setInterval(() => {
      const ready = widgetApi()
      if (!ready || cancelled) return
      clearInterval(poll)
      register(ready)
    }, 50)

    return () => {
      cancelled = true
      clearInterval(poll)
    }
  }, [canMint, isLoading, mintAndDeliver, widgetApi])

  useEffect(() => {
    if (canMint) return
    clearRemintTimer()
    expiresAtMsRef.current = null
  }, [clearRemintTimer, canMint])

  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState !== 'visible') return
      if (!canMint) return
      const exp = expiresAtMsRef.current
      if (exp == null || exp - Date.now() > REMINT_SKEW_MS) return
      void mintAndDeliver()
    }

    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [canMint, mintAndDeliver])

  useEffect(() => clearRemintTimer, [clearRemintTimer])

  return null
}
