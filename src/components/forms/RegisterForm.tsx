import { Link, useNavigate } from '@tanstack/react-router'
import { Send } from 'lucide-react'
import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import PasswordInput from '#/components/forms/PasswordInput'
import { apiFetch } from '#/lib/api'
import { parseInviteRedirectPath } from '#/lib/collaborationInvite'
import { useAuth } from '#/context/authContext'
import { formatDurationCountdown } from '#/lib/duration'
import {
  clearOtpCooldown,
  readOtpCooldownEnd,
  writeOtpCooldownEnd,
} from '#/lib/otpCooldown'
import {
  buttonClassName,
  buttonClassNameFull,
  cardClassName,
  hintClassName,
  inputClassNameCompact,
} from '#/lib/ui-classes'

interface RegisterResponse {
  email: string
  jwt: string
}

type SendOtpData = {
  email: string
  cooldownSeconds?: number
}

type RegisterFormProps = {
  redirect?: string
}

function formatResendLabel(remainingMs: number): string {
  const totalSec = Math.max(0, Math.ceil(remainingMs / 1000))
  const minutes = Math.floor(totalSec / 60)
  const seconds = totalSec % 60
  return `Resend in ${minutes}:${seconds.toString().padStart(2, '0')}`
}

export default function RegisterForm({ redirect }: RegisterFormProps) {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null)
  const [submitBlockedUntil, setSubmitBlockedUntil] = useState<number | null>(
    null,
  )
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    const trimmed = email.trim()
    if (!trimmed) {
      setCooldownUntil(null)
      return
    }
    setCooldownUntil(readOtpCooldownEnd(trimmed))
  }, [email])

  useEffect(() => {
    const activeUntil =
      cooldownUntil != null || submitBlockedUntil != null
        ? Math.max(cooldownUntil ?? 0, submitBlockedUntil ?? 0)
        : null
    if (activeUntil == null || activeUntil <= Date.now()) return

    const id = window.setInterval(() => {
      const t = Date.now()
      setNowMs(t)
      if (cooldownUntil != null && t >= cooldownUntil) {
        clearOtpCooldown(email.trim())
        setCooldownUntil(null)
      }
      if (submitBlockedUntil != null && t >= submitBlockedUntil) {
        setSubmitBlockedUntil(null)
      }
    }, 1000)
    return () => window.clearInterval(id)
  }, [cooldownUntil, submitBlockedUntil, email])

  function startOtpCooldown(seconds: number) {
    const end = Date.now() + Math.max(1, seconds) * 1000
    const trimmed = email.trim()
    if (trimmed) writeOtpCooldownEnd(trimmed, end)
    setCooldownUntil(end)
    setNowMs(Date.now())
  }

  function startSubmitCooldown(seconds: number) {
    const end = Date.now() + Math.max(1, seconds) * 1000
    setSubmitBlockedUntil(end)
    setNowMs(Date.now())
  }

  const otpRemainingMs =
    cooldownUntil != null ? Math.max(0, cooldownUntil - nowMs) : 0
  const otpCoolingDown = otpRemainingMs > 0
  const submitRemainingMs =
    submitBlockedUntil != null ? Math.max(0, submitBlockedUntil - nowMs) : 0
  const submitBlocked = submitRemainingMs > 0

  async function sendOtp() {
    if (!email.trim()) {
      toast.error('Email is required')
      return
    }
    if (otpCoolingDown) return

    setSendingOtp(true)

    try {
      const response = await apiFetch<SendOtpData>('/auth/otp', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), isResetPassword: false }),
      })

      if (!response.success) {
        const retry =
          response.retryAfterSeconds ??
          (typeof response.data === 'object' &&
          response.data &&
          'retryAfterSeconds' in response.data
            ? Number(
                (response.data as { retryAfterSeconds?: number })
                  .retryAfterSeconds,
              )
            : undefined)
        if (typeof retry === 'number' && Number.isFinite(retry) && retry > 0) {
          startOtpCooldown(retry)
        }
        toast.error(response.message || 'Failed to send OTP')
        return
      }

      const cooldown =
        response.data?.cooldownSeconds ?? response.retryAfterSeconds ?? 60
      startOtpCooldown(cooldown)
      setOtpSent(true)
      toast.success('OTP sent to your email')
    } catch {
      toast.error('Unable to reach the server. Please try again.')
    } finally {
      setSendingOtp(false)
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submitBlocked) return

    if (!email.trim()) {
      toast.error('Email is required')
      return
    }

    if (!otp.trim() || !password) {
      toast.error('OTP and password are required')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const response = await apiFetch<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          password,
        }),
      })

      if (!response.success || !response.data?.jwt) {
        if (
          typeof response.retryAfterSeconds === 'number' &&
          response.retryAfterSeconds > 0
        ) {
          startSubmitCooldown(response.retryAfterSeconds)
          toast.error(
            `${response.message || 'Too many attempts'}. Wait ${formatDurationCountdown(response.retryAfterSeconds * 1000)}.`,
          )
          return
        }
        const msg = response.message || 'Registration failed'
        if (/too many incorrect otp/i.test(msg) || /request a new code/i.test(msg)) {
          toast.error(msg)
          setOtp('')
          setOtpSent(false)
          return
        }
        toast.error(msg)
        return
      }

      await login(response.data.jwt)
      toast.success(response.message || 'Account created successfully')
      const invite = parseInviteRedirectPath(redirect)
      if (invite) {
        await navigate({
          to: '/api-key/$apiKeyId/collaborate/$token',
          params: invite,
        })
      } else {
        await navigate({ to: '/dashboard' })
      }
    } catch {
      toast.error('Unable to reach the server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`${cardClassName} w-full p-6 sm:p-8`}>
      <h1 className="mb-6 text-2xl font-medium text-[var(--ink)]">Register</h1>

      <form className="w-full space-y-4" onSubmit={handleRegister}>
        <div className="w-full">
          <label htmlFor="register-email" className="mb-1 block text-sm text-[var(--ink)]">
            Email
          </label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClassNameCompact}
          />
        </div>

        <div className="w-full">
          <label htmlFor="register-otp" className="mb-1 block text-sm text-[var(--ink)]">
            OTP
          </label>
          <div className="flex gap-2">
            <input
              id="register-otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              className={inputClassNameCompact}
              placeholder={otpSent ? 'Enter code' : 'Send OTP first'}
            />
            <button
              type="button"
              disabled={sendingOtp || !email.trim() || otpCoolingDown}
              onClick={() => void sendOtp()}
              aria-label={otpSent || otpCoolingDown ? 'Resend OTP' : 'Send OTP'}
              className={`${buttonClassName} shrink-0 px-3 py-2 disabled:cursor-not-allowed`}
            >
              {sendingOtp ? (
                '…'
              ) : otpCoolingDown ? (
                formatResendLabel(otpRemainingMs)
              ) : otpSent ? (
                'Resend'
              ) : (
                <Send className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {otpCoolingDown ? (
            <p className={`mt-1 ${hintClassName}`}>
              You can request a new code in {formatResendLabel(otpRemainingMs).replace('Resend in ', '')}.
            </p>
          ) : null}
        </div>

        <div className="w-full">
          <label htmlFor="register-password" className="mb-1 block text-sm text-[var(--ink)]">
            Password
          </label>
          <PasswordInput
            id="register-password"
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
          />
        </div>

        <div className="w-full">
          <label
            htmlFor="register-confirm-password"
            className="mb-1 block text-sm text-[var(--ink)]"
          >
            Confirm password
          </label>
          <PasswordInput
            id="register-confirm-password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={setConfirmPassword}
          />
        </div>

        <p className={hintClassName}>
          By registering, you agree to our{' '}
          <Link to="/privacy" className="text-[var(--ink)] underline">
            Privacy Policy
          </Link>
          .
        </p>

        <button
          type="submit"
          disabled={loading || submitBlocked}
          className={buttonClassNameFull}
        >
          {loading
            ? 'Creating account…'
            : submitBlocked
              ? `Try again in ${formatDurationCountdown(submitRemainingMs)}`
              : 'Register'}
        </button>
      </form>

      <p className={`mt-6 ${hintClassName}`}>
        Already have an account?{' '}
        <Link
          to="/login"
          search={redirect ? { redirect } : undefined}
          className="text-[var(--ink)] underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
