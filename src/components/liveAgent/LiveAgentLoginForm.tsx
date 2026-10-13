import { useNavigate } from '@tanstack/react-router'
import type { FormEvent } from 'react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import PasswordInput from '#/components/forms/PasswordInput'
import {
  loginLiveAgent,
  setAgentToken,
} from '#/lib/liveAgent'
import {
  buttonClassNameFull,
  cardClassName,
  hintClassName,
  inputClassNameCompact,
} from '#/lib/ui-classes'

export default function LiveAgentLoginForm({
  initialCode = '',
}: {
  initialCode?: string
}) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState(() => initialCode.trim().toUpperCase())
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!name.trim() || !password || !code.trim()) {
      toast.error('Name, password, and code are required')
      return
    }

    setLoading(true)
    try {
      const response = await loginLiveAgent({
        name: name.trim(),
        password,
        code: code.trim(),
      })

      if (!response.success || !response.data?.jwt) {
        toast.error(response.message || 'Login failed')
        return
      }

      setAgentToken(response.data.jwt)
      toast.success(response.message || 'Logged in successfully')
      await navigate({ to: '/liveagent' })
    } catch {
      toast.error('Unable to reach the server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`${cardClassName} w-full p-6 sm:p-8`}>
      <h1 className="mb-2 text-2xl font-medium text-[var(--ink)]">
        Agent sign in
      </h1>
      <p className={`mb-6 ${hintClassName}`}>
        Use your agent name, password, and project join code.
      </p>

      <form className="w-full space-y-4" onSubmit={handleSubmit}>
        <div className="w-full">
          <label
            htmlFor="live-agent-name"
            className="mb-1 block text-sm text-[var(--ink)]"
          >
            Name
          </label>
          <input
            id="live-agent-name"
            type="text"
            autoComplete="username"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={inputClassNameCompact}
          />
        </div>

        <div className="w-full">
          <label
            htmlFor="live-agent-password"
            className="mb-1 block text-sm text-[var(--ink)]"
          >
            Password
          </label>
          <PasswordInput
            id="live-agent-password"
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
          />
        </div>

        <div className="w-full">
          <label
            htmlFor="live-agent-code"
            className="mb-1 block text-sm text-[var(--ink)]"
          >
            Join code
          </label>
          <input
            id="live-agent-code"
            type="text"
            autoComplete="off"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            className={`${inputClassNameCompact} font-mono tracking-wider`}
            placeholder="Project join code"
          />
        </div>

        <button type="submit" disabled={loading} className={buttonClassNameFull}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
