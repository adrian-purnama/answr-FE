import { Link, useNavigate } from '@tanstack/react-router'
import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import PasswordInput from '#/components/forms/PasswordInput'
import { apiFetch } from '#/lib/api'
import {
  isSafePostAuthRedirect,
  parseInviteRedirectPath,
} from '#/lib/collaborationInvite'
import { useAuth } from '#/context/authContext'
import { formatDurationCountdown } from '#/lib/duration'
import {
  buttonClassNameFull,
  cardClassName,
  hintClassName,
  inputClassNameCompact,
} from '#/lib/ui-classes'

interface LoginResponse {
  email: string
  jwt: string
}

type LoginFormProps = {
  redirect?: string
}

export default function LoginForm({ redirect }: LoginFormProps) {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null)
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    if (blockedUntil == null || blockedUntil <= Date.now()) return
    const id = window.setInterval(() => {
      const t = Date.now()
      setNowMs(t)
      if (t >= blockedUntil) setBlockedUntil(null)
    }, 1000)
    return () => window.clearInterval(id)
  }, [blockedUntil])

  const remainingMs =
    blockedUntil != null ? Math.max(0, blockedUntil - nowMs) : 0
  const blocked = remainingMs > 0

  async function goAfterAuth() {
    const invite = parseInviteRedirectPath(redirect)
    if (invite) {
      await navigate({
        to: '/api-key/$apiKeyId/collaborate/$token',
        params: invite,
      })
      return
    }
    if (isSafePostAuthRedirect(redirect)) {
      if (redirect.startsWith('/payment')) {
        await navigate({ to: '/payment' })
        return
      }
      await navigate({ to: '/pricing' })
      return
    }
    await navigate({ to: '/dashboard' })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (blocked) return

    if (!email.trim() || !password) {
      toast.error('Email and password are required')
      return
    }

    setLoading(true)

    try {
      const response = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password, rememberMe }),
      })

      if (!response.success || !response.data?.jwt) {
        if (
          typeof response.retryAfterSeconds === 'number' &&
          response.retryAfterSeconds > 0
        ) {
          const end = Date.now() + response.retryAfterSeconds * 1000
          setBlockedUntil(end)
          setNowMs(Date.now())
          toast.error(
            `${response.message || 'Too many login attempts'}. Wait ${formatDurationCountdown(response.retryAfterSeconds * 1000)}.`,
          )
          return
        }
        toast.error(response.message || 'Login failed')
        return
      }

      await login(response.data.jwt)
      toast.success(response.message || 'Logged in successfully')
      await goAfterAuth()
    } catch {
      toast.error('Unable to reach the server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`${cardClassName} w-full p-6 sm:p-8`}>
      <h1 className="mb-6 text-2xl font-medium text-[var(--ink)]">Sign in</h1>

      <form className="w-full space-y-4" onSubmit={handleSubmit}>
        <div className="w-full">
          <label htmlFor="login-email" className="mb-1 block text-sm text-[var(--ink)]">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClassNameCompact}
          />
        </div>

        <div className="w-full">
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="login-password" className="block text-sm text-[var(--ink)]">
              Password
            </label>
            <Link to="/forgot-password" className={`${hintClassName} underline hover:text-[var(--ink)]`}>
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="login-password"
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
          />
        </div>

        <label className={`flex items-center gap-2 ${hintClassName}`}>
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
          />
          Remember me
        </label>

        <button
          type="submit"
          disabled={loading || blocked}
          className={buttonClassNameFull}
        >
          {loading
            ? 'Signing in…'
            : blocked
              ? `Try again in ${formatDurationCountdown(remainingMs)}`
              : 'Sign in'}
        </button>
      </form>

      <p className={`mt-6 ${hintClassName}`}>
        Don&apos;t have an account?{' '}
        <Link
          to="/register"
          search={redirect ? { redirect } : undefined}
          className="text-[var(--ink)] underline"
        >
          Register
        </Link>
      </p>
    </div>
  )
}
