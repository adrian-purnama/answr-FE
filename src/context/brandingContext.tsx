import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { apiFetch } from '#/lib/api'

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const DEFAULT_APP_NAME = 'SapAi'

export interface Branding {
  appName: string
  /** Absolute URL to the logo image, or null if none */
  appLogo: string | null
}

interface BrandingContextValue {
  appName: string
  appLogo: string | null
  isLoading: boolean
  refreshBranding: () => Promise<void>
}

const BrandingContext = createContext<BrandingContextValue | null>(null)

let cachedBranding: Branding | undefined
let bootstrapPromise: Promise<Branding> | null = null

function toAbsoluteLogoUrl(path: string | null): string | null {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${API_BASE_URL}${path}`
}

async function fetchBranding(): Promise<Branding> {
  try {
    const body = await apiFetch<{ appName: string; appLogo: string | null }>(
      '/app-config/branding',
    )

    if (!body.success || !body.data) {
      return { appName: DEFAULT_APP_NAME, appLogo: null }
    }

    return {
      appName: body.data.appName || DEFAULT_APP_NAME,
      appLogo: toAbsoluteLogoUrl(body.data.appLogo),
    }
  } catch {
    return { appName: DEFAULT_APP_NAME, appLogo: null }
  }
}

function invalidateBrandingCache(): void {
  cachedBranding = undefined
  bootstrapPromise = null
}

async function bootstrapBranding(): Promise<Branding> {
  if (cachedBranding !== undefined) return cachedBranding

  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const branding = await fetchBranding()
      cachedBranding = branding
      return branding
    })().finally(() => {
      bootstrapPromise = null
    })
  }

  return bootstrapPromise
}

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [appName, setAppName] = useState(DEFAULT_APP_NAME)
  const [appLogo, setAppLogo] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const applyBranding = useCallback((result: Branding) => {
    setAppName(result.appName)
    setAppLogo(result.appLogo)
    setIsLoading(false)
  }, [])

  const refreshBranding = useCallback(async () => {
    invalidateBrandingCache()
    const result = await bootstrapBranding()
    applyBranding(result)
  }, [applyBranding])

  useEffect(() => {
    let cancelled = false

    void bootstrapBranding().then((result) => {
      if (!cancelled) {
        applyBranding(result)
      }
    })

    return () => {
      cancelled = true
    }
  }, [applyBranding])

  return createElement(
    BrandingContext.Provider,
    {
      value: {
        appName,
        appLogo,
        isLoading,
        refreshBranding,
      },
    },
    children,
  )
}

export function useBranding(): BrandingContextValue {
  const context = useContext(BrandingContext)
  if (!context) {
    throw new Error('useBranding must be used within BrandingProvider')
  }
  return context
}
