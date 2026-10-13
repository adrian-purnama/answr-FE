import { useCallback, useEffect, useRef, useState } from 'react'
import {
  VISITOR_TOKEN_MESSAGE_TYPE,
  bindPublicVisitorIdentity,
  isVisitorTokenUsable,
  requestVisitorTokenFromHost,
} from '#/lib/widget'
import type { ApplySessionFn } from '#/components/widget/hooks/usePublicWidgetSession'

function readQueryVisitorToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const url = new URL(window.location.href)
    const token = url.searchParams.get('visitorToken')?.trim()
    if (!token) return null
    url.searchParams.delete('visitorToken')
    window.history.replaceState({}, '', url.toString())
    return token
  } catch {
    return null
  }
}

type UseVisitorTokenBridgeOptions = {
  publicKey: string
  /** Origin of the embedding page; null when the widget is not framed. */
  hostOrigin: string | null
  getSessionId: () => string | null
  applySession: ApplySessionFn
}

const REFRESH_WAIT_MS = 10_000

/**
 * Owns pending visitor JWT state and host→embed delivery
 * (query param strip + postMessage). Binding uses the live session via refs.
 */
export function useVisitorTokenBridge({
  publicKey,
  hostOrigin,
  getSessionId,
  applySession,
}: UseVisitorTokenBridgeOptions) {
  const [pendingVisitorToken, setPendingVisitorToken] = useState<string | null>(
    () => readQueryVisitorToken(),
  )
  const getSessionIdRef = useRef(getSessionId)
  const applySessionRef = useRef(applySession)
  const lastVisitorTokenRef = useRef<string | null>(null)
  const refreshWaitersRef = useRef<Array<(ok: boolean) => void>>([])

  getSessionIdRef.current = getSessionId
  applySessionRef.current = applySession

  const rememberToken = useCallback((token: string) => {
    const trimmed = token.trim()
    if (!trimmed) return
    if (isVisitorTokenUsable(trimmed)) {
      lastVisitorTokenRef.current = trimmed
    }
  }, [])

  const resolveRefreshWaiters = useCallback((ok: boolean) => {
    const waiters = refreshWaitersRef.current
    refreshWaitersRef.current = []
    for (const resolve of waiters) resolve(ok)
  }, [])

  const bindVisitorToken = useCallback(
    async (token: string) => {
      const trimmed = token.trim()
      if (!trimmed) return

      rememberToken(trimmed)

      const sessionId = getSessionIdRef.current()
      if (!sessionId) {
        setPendingVisitorToken(trimmed)
        return
      }

      try {
        const response = await bindPublicVisitorIdentity(
          publicKey,
          sessionId,
          trimmed,
        )
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to bind visitor identity')
        }
        applySessionRef.current(
          response.data.id,
          response.data.expiredAt,
          response.data.visitorAuthMode ?? 'authenticated',
          response.data.visitor ?? null,
          response.data.tokenExp ?? null,
        )
        setPendingVisitorToken(null)
        resolveRefreshWaiters(true)
      } catch (error) {
        console.warn(
          '[visitor-token] bind failed (claims will use fallbacks):',
          error instanceof Error ? error.message : error,
        )
        setPendingVisitorToken(trimmed)
        resolveRefreshWaiters(false)
      }
    },
    [publicKey, rememberToken, resolveRefreshWaiters],
  )

  const getUsableVisitorToken = useCallback((): string | undefined => {
    if (isVisitorTokenUsable(pendingVisitorToken)) return pendingVisitorToken!
    if (isVisitorTokenUsable(lastVisitorTokenRef.current)) {
      return lastVisitorTokenRef.current!
    }
    return undefined
  }, [pendingVisitorToken])

  const requestVisitorTokenRefresh = useCallback((): Promise<boolean> => {
    if (typeof window === 'undefined' || window.parent === window) {
      return Promise.resolve(false)
    }

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        refreshWaitersRef.current = refreshWaitersRef.current.filter(
          (waiter) => waiter !== settle,
        )
        resolve(false)
      }, REFRESH_WAIT_MS)

      function settle(ok: boolean) {
        clearTimeout(timer)
        resolve(ok)
      }

      refreshWaitersRef.current.push(settle)
      requestVisitorTokenFromHost(publicKey)
    })
  }, [publicKey])

  useEffect(() => {
    if (pendingVisitorToken) rememberToken(pendingVisitorToken)
  }, [pendingVisitorToken, rememberToken])

  useEffect(() => {
    if (!hostOrigin) return

    function onMessage(event: MessageEvent) {
      // Only the page that embedded us may deliver identities.
      if (event.origin !== hostOrigin) return
      const data = event.data
      if (!data || typeof data !== 'object') return
      const record = data as Record<string, unknown>
      if (record.type !== VISITOR_TOKEN_MESSAGE_TYPE) return
      if (typeof record.token !== 'string' || !record.token.trim()) return
      void bindVisitorToken(record.token)
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [bindVisitorToken, hostOrigin])

  return {
    pendingVisitorToken,
    setPendingVisitorToken,
    bindVisitorToken,
    requestVisitorTokenRefresh,
    getUsableVisitorToken,
  }
}
