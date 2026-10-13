import { useCallback, useEffect, useRef, useState } from 'react'
import {
  clearStoredWidgetChatSession,
  createPublicChatSession,
  deletePublicChatSession,
  getPublicChatSession,
  isVisitorTokenUsable,
  readStoredWidgetChatSession,
  requestVisitorTokenFromHost,
  writeStoredWidgetChatSession,
  type PublicChatSessionVisitor,
} from '#/lib/widget'

type SessionState = {
  id: string | null
  expiredAt: string | null
  tokenExp: string | null
  expired: boolean
  ready: boolean
  visitorAuthMode: 'anonymous' | 'authenticated'
  visitor: PublicChatSessionVisitor | null
  endedSessionId: string | null
}

export type ApplySessionFn = (
  id: string,
  expiredAt: string,
  visitorAuthMode?: 'anonymous' | 'authenticated',
  visitor?: PublicChatSessionVisitor | null,
  tokenExp?: string | null,
) => void

type UsePublicWidgetSessionOptions = {
  publicKey: string
  open: boolean
  widgetReady: boolean
  pendingVisitorToken: string | null
  setPendingVisitorToken: (token: string | null) => void
  bindVisitorToken: (token: string) => Promise<void>
  requestVisitorTokenRefresh?: () => Promise<boolean>
  getUsableVisitorToken?: () => string | undefined
}

export function usePublicWidgetSession({
  publicKey,
  open,
  widgetReady,
  pendingVisitorToken,
  setPendingVisitorToken,
  bindVisitorToken,
  requestVisitorTokenRefresh,
  getUsableVisitorToken,
}: UsePublicWidgetSessionOptions) {
  const [session, setSession] = useState<SessionState>({
    id: null,
    expiredAt: null,
    tokenExp: null,
    expired: false,
    ready: false,
    visitorAuthMode: 'anonymous',
    visitor: null,
    endedSessionId: null,
  })
  const [sessionEpoch, setSessionEpoch] = useState(0)
  const expireTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sessionIdRef = useRef<string | null>(null)
  const sessionExpiredRef = useRef(false)
  const pendingTokenRef = useRef<string | null>(null)
  const revalidatingRef = useRef(false)

  useEffect(() => {
    sessionIdRef.current = session.id
  }, [session.id])

  useEffect(() => {
    sessionExpiredRef.current = session.expired
  }, [session.expired])

  useEffect(() => {
    pendingTokenRef.current = pendingVisitorToken
  }, [pendingVisitorToken])

  const visitorTokenForCreate = useCallback(() => {
    if (getUsableVisitorToken) return getUsableVisitorToken()
    return isVisitorTokenUsable(pendingTokenRef.current)
      ? pendingTokenRef.current!
      : undefined
  }, [getUsableVisitorToken])

  const clearExpireTimer = useCallback(() => {
    if (expireTimerRef.current) {
      clearTimeout(expireTimerRef.current)
      expireTimerRef.current = null
    }
  }, [])

  const markSessionEnded = useCallback(() => {
    clearExpireTimer()
    clearStoredWidgetChatSession(publicKey)
    const previousId = sessionIdRef.current
    sessionIdRef.current = null
    sessionExpiredRef.current = true
    setSession({
      id: null,
      expiredAt: null,
      tokenExp: null,
      expired: true,
      ready: true,
      visitorAuthMode: 'anonymous',
      visitor: null,
      endedSessionId: previousId,
    })
  }, [clearExpireTimer, publicKey])

  const applySession = useCallback<ApplySessionFn>(
    (
      id,
      expiredAt,
      visitorAuthMode = 'anonymous',
      visitor = null,
      tokenExp = null,
    ) => {
      writeStoredWidgetChatSession(publicKey, { id, expiredAt })
      sessionIdRef.current = id
      sessionExpiredRef.current = false
      setSession({
        id,
        expiredAt,
        tokenExp: tokenExp ?? null,
        expired: false,
        ready: true,
        visitorAuthMode,
        visitor: visitorAuthMode === 'authenticated' ? (visitor ?? null) : null,
        endedSessionId: null,
      })
    },
    [publicKey],
  )

  const createSession = useCallback(
    async (visitorToken?: string): Promise<string> => {
      const response = await createPublicChatSession(
        publicKey,
        visitorToken ? { visitorToken } : undefined,
      )
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create chat session')
      }
      applySession(
        response.data.id,
        response.data.expiredAt,
        response.data.visitorAuthMode ?? 'anonymous',
        response.data.visitor ?? null,
        response.data.tokenExp ?? null,
      )
      return response.data.id
    },
    [applySession, publicKey],
  )

  const tryRefreshVisitorFromHost = useCallback(async (): Promise<boolean> => {
    if (requestVisitorTokenRefresh) {
      return requestVisitorTokenRefresh()
    }
    requestVisitorTokenFromHost(publicKey)
    return false
  }, [publicKey, requestVisitorTokenRefresh])

  const bootstrapSession = useCallback(async () => {
    setSession((prev) => ({
      ...prev,
      ready: false,
      expired: false,
    }))
    sessionExpiredRef.current = false
    let visitorToken = visitorTokenForCreate()
    try {
      const stored = readStoredWidgetChatSession(publicKey)
      if (stored) {
        const expiresMs = Date.parse(stored.expiredAt)
        if (Number.isNaN(expiresMs) || expiresMs <= Date.now()) {
          clearStoredWidgetChatSession(publicKey)
        } else {
          const existing = await getPublicChatSession(publicKey, stored.id)
          if (existing.success && existing.data) {
            applySession(
              existing.data.id,
              existing.data.expiredAt,
              existing.data.visitorAuthMode ?? 'anonymous',
              existing.data.visitor ?? null,
              existing.data.tokenExp ?? null,
            )
            if (
              visitorToken &&
              existing.data.visitorAuthMode !== 'authenticated'
            ) {
              await bindVisitorToken(visitorToken)
            }
            return
          }

          const restoreMessage = existing.message || ''
          if (
            restoreMessage === 'Visitor token expired' ||
            restoreMessage === 'Visitor authentication required'
          ) {
            const refreshed = await tryRefreshVisitorFromHost()
            visitorToken = visitorTokenForCreate()
            if (refreshed || visitorToken) {
              const token = visitorTokenForCreate()
              if (token) {
                try {
                  await bindVisitorToken(token)
                  const again = await getPublicChatSession(publicKey, stored.id)
                  if (again.success && again.data) {
                    applySession(
                      again.data.id,
                      again.data.expiredAt,
                      again.data.visitorAuthMode ?? 'anonymous',
                      again.data.visitor ?? null,
                      again.data.tokenExp ?? null,
                    )
                    return
                  }
                } catch {
                  // fall through to create
                }
              }
            }
          }

          clearStoredWidgetChatSession(publicKey)
        }
      }

      await createSession(visitorToken)
      if (visitorToken) setPendingVisitorToken(null)
    } catch {
      try {
        await tryRefreshVisitorFromHost()
        const token = visitorTokenForCreate()
        await createSession(token)
        if (token) setPendingVisitorToken(null)
      } catch {
        markSessionEnded()
      }
    }
  }, [
    applySession,
    bindVisitorToken,
    createSession,
    markSessionEnded,
    publicKey,
    setPendingVisitorToken,
    tryRefreshVisitorFromHost,
    visitorTokenForCreate,
  ])

  const ensureSession = useCallback(async (): Promise<string> => {
    const existingId = sessionIdRef.current
    if (existingId && !sessionExpiredRef.current) {
      return existingId
    }

    const visitorToken = visitorTokenForCreate()
    try {
      const id = await createSession(visitorToken)
      if (visitorToken) setPendingVisitorToken(null)
      return id
    } catch (error) {
      markSessionEnded()
      throw error instanceof Error
        ? error
        : new Error('Failed to create chat session')
    }
  }, [createSession, markSessionEnded, setPendingVisitorToken, visitorTokenForCreate])

  /**
   * Drop any reused session (and its server history) so the next turn matches
   * a greeting-only UI   same empty-history path as Train test agent.
   */
  const startFreshChatSession = useCallback(async (): Promise<string> => {
    if (sessionExpiredRef.current) {
      throw new Error('Chat session expired')
    }

    const previousId = sessionIdRef.current
    const visitorToken = visitorTokenForCreate()

    if (previousId) {
      clearStoredWidgetChatSession(publicKey)
      sessionIdRef.current = null
      sessionExpiredRef.current = false
      setSession({
        id: null,
        expiredAt: null,
        tokenExp: null,
        expired: false,
        ready: false,
        visitorAuthMode: 'anonymous',
        visitor: null,
        endedSessionId: null,
      })
      setSessionEpoch((n) => n + 1)
      try {
        await deletePublicChatSession(publicKey, previousId)
      } catch {
        // best-effort; create still proceeds
      }
    }

    try {
      const id = await createSession(visitorToken)
      if (visitorToken) setPendingVisitorToken(null)
      return id
    } catch (error) {
      markSessionEnded()
      throw error instanceof Error
        ? error
        : new Error('Failed to create chat session')
    }
  }, [
    createSession,
    markSessionEnded,
    publicKey,
    setPendingVisitorToken,
    visitorTokenForCreate,
  ])

  const renewSession = useCallback(async () => {
    clearExpireTimer()
    clearStoredWidgetChatSession(publicKey)
    sessionIdRef.current = null
    sessionExpiredRef.current = false
    setSession({
      id: null,
      expiredAt: null,
      tokenExp: null,
      expired: false,
      ready: false,
      visitorAuthMode: 'anonymous',
      visitor: null,
      endedSessionId: null,
    })
    // Clear the thread now. Waiting until createSession finishes leaves the
    // previous messages up through the host-token round trip.
    setSessionEpoch((n) => n + 1)
    try {
      let token = visitorTokenForCreate()
      if (!token) {
        await tryRefreshVisitorFromHost()
        token = visitorTokenForCreate()
      }
      await createSession(token)
      if (pendingTokenRef.current) setPendingVisitorToken(null)
    } catch {
      markSessionEnded()
    }
  }, [
    clearExpireTimer,
    createSession,
    markSessionEnded,
    publicKey,
    setPendingVisitorToken,
    tryRefreshVisitorFromHost,
    visitorTokenForCreate,
  ])

  const handleExit = useCallback(async () => {
    const id = sessionIdRef.current
    if (id) {
      try {
        await deletePublicChatSession(publicKey, id)
      } catch {
        // best-effort delete
      }
    }
    markSessionEnded()
  }, [markSessionEnded, publicKey])

  const revalidateSessionOnWake = useCallback(async () => {
    if (revalidatingRef.current) return
    const id = sessionIdRef.current
    if (!id || sessionExpiredRef.current) return

    revalidatingRef.current = true
    try {
      const existing = await getPublicChatSession(publicKey, id)
      if (existing.success && existing.data) {
        applySession(
          existing.data.id,
          existing.data.expiredAt,
          existing.data.visitorAuthMode ?? 'anonymous',
          existing.data.visitor ?? null,
          existing.data.tokenExp ?? null,
        )
        return
      }

      const message = existing.message || ''
      if (
        message === 'Visitor token expired' ||
        message === 'Visitor authentication required'
      ) {
        const refreshed = await tryRefreshVisitorFromHost()
        if (refreshed) {
          const again = await getPublicChatSession(publicKey, id)
          if (again.success && again.data) {
            applySession(
              again.data.id,
              again.data.expiredAt,
              again.data.visitorAuthMode ?? 'anonymous',
              again.data.visitor ?? null,
              again.data.tokenExp ?? null,
            )
            return
          }
        }
        setSession((prev) => ({
          ...prev,
          visitorAuthMode: 'anonymous',
          visitor: null,
          tokenExp: null,
          ready: true,
        }))
        return
      }

      if (
        message === 'Chat session expired' ||
        message === 'Chat session not found'
      ) {
        markSessionEnded()
      }
    } finally {
      revalidatingRef.current = false
    }
  }, [applySession, markSessionEnded, publicKey, tryRefreshVisitorFromHost])

  useEffect(() => {
    if (!open || !widgetReady) return
    void bootstrapSession()
  }, [open, widgetReady, bootstrapSession])

  // Token may arrive while the launcher is still closed   start a session so
  // {{claims.*}} greetings resolve as soon as the panel opens.
  useEffect(() => {
    if (!widgetReady || open) return
    if (!pendingVisitorToken) return
    if (session.id) return
    void bootstrapSession()
  }, [
    bootstrapSession,
    open,
    pendingVisitorToken,
    session.id,
    widgetReady,
  ])

  // Always re-bind when a fresh host token arrives (including refresh while authenticated).
  useEffect(() => {
    if (!session.id || !pendingVisitorToken) return
    if (!isVisitorTokenUsable(pendingVisitorToken)) {
      setPendingVisitorToken(null)
      return
    }
    void bindVisitorToken(pendingVisitorToken)
  }, [
    bindVisitorToken,
    pendingVisitorToken,
    session.id,
    setPendingVisitorToken,
  ])

  useEffect(() => {
    clearExpireTimer()
    if (!open || !session.expiredAt || session.expired || !session.id) return

    const expiresMs = Date.parse(session.expiredAt)
    if (Number.isNaN(expiresMs)) return

    const tokenExpMs = session.tokenExp ? Date.parse(session.tokenExp) : NaN
    const endMs = !Number.isNaN(tokenExpMs)
      ? Math.min(expiresMs, tokenExpMs)
      : expiresMs

    const remaining = endMs - Date.now()
    if (remaining <= 0) {
      if (
        !Number.isNaN(tokenExpMs) &&
        tokenExpMs <= Date.now() &&
        expiresMs > Date.now()
      ) {
        void tryRefreshVisitorFromHost()
        return
      }
      markSessionEnded()
      return
    }

    expireTimerRef.current = setTimeout(() => {
      const tokenLeft = session.tokenExp
        ? Date.parse(session.tokenExp) - Date.now()
        : Number.POSITIVE_INFINITY
      if (tokenLeft <= 0 && Date.parse(session.expiredAt!) > Date.now()) {
        void tryRefreshVisitorFromHost()
        return
      }
      markSessionEnded()
    }, remaining)

    return clearExpireTimer
  }, [
    clearExpireTimer,
    markSessionEnded,
    open,
    session.expired,
    session.expiredAt,
    session.id,
    session.tokenExp,
    tryRefreshVisitorFromHost,
  ])

  useEffect(() => {
    if (!widgetReady) return

    function onVisibility() {
      if (document.visibilityState !== 'visible') return
      void revalidateSessionOnWake()
    }

    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [revalidateSessionOnWake, widgetReady])

  return {
    session,
    sessionEpoch,
    applySession,
    getSessionId: () => sessionIdRef.current,
    ensureSession,
    startFreshChatSession,
    renewSession,
    markSessionEnded,
    handleExit,
  }
}
