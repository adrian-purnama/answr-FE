import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { ApiResponseDto } from '#/lib/api'

const TOKEN_KEY = 'sapai_token'
const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export interface AuthUser {
  email: string
  isAdmin: boolean
}

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isAdmin: boolean
  isLoading: boolean
  login: (jwt: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

let cachedUser: AuthUser | null | undefined
let bootstrapPromise: Promise<AuthUser | null> | null = null

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(jwt: string): void {
  localStorage.setItem(TOKEN_KEY, jwt)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  invalidateAuthCache()
}

export function invalidateAuthCache(): void {
  cachedUser = undefined
  bootstrapPromise = null
}

function setCachedUser(user: AuthUser | null): void {
  cachedUser = user
}

async function fetchValidatedUser(): Promise<AuthUser | null> {
  const token = getToken()
  if (!token) return null

  try {
    const response = await fetch(`${API_BASE_URL}/auth/validate`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    const body = (await response.json()) as ApiResponseDto<AuthUser>

    if (!response.ok || !body.success || !body.data?.email) {
      clearToken()
      return null
    }

    return {
      email: body.data.email,
      isAdmin: Boolean(body.data.isAdmin),
    }
  } catch {
    return null
  }
}

export async function bootstrapAuth(): Promise<AuthUser | null> {
  if (cachedUser !== undefined) return cachedUser

  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const user = await fetchValidatedUser()
      setCachedUser(user)
      return user
    })().finally(() => {
      bootstrapPromise = null
    })
  }

  return bootstrapPromise
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    void bootstrapAuth().then((result) => {
      if (!cancelled) {
        setUser(result)
        setIsLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  async function login(jwt: string) {
    setToken(jwt)
    invalidateAuthCache()
    const validatedUser = await bootstrapAuth()
    setUser(validatedUser)
  }

  function logout() {
    clearToken()
    setCachedUser(null)
    setUser(null)
  }

  return createElement(
    AuthContext.Provider,
    {
      value: {
        user,
        isAuthenticated: user !== null,
        isAdmin: user?.isAdmin ?? false,
        isLoading,
        login,
        logout,
      },
    },
    children,
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
