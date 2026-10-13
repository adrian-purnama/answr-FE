import { useEffect, useState } from 'react'
import { getToken } from '#/context/authContext'
import { liveAgentOwnedMediaPath } from '#/lib/liveAgent'
import { cn } from '#/lib/utils'

type LiveAgentAvatarProps = {
  apiKeyId: string
  mediaId?: string | null
  name: string
  className?: string
  size?: 'sm' | 'md'
}

const sizeClass = {
  sm: 'size-9 text-xs',
  md: 'size-10 text-sm',
} as const

export default function LiveAgentAvatar({
  apiKeyId,
  mediaId,
  name,
  className,
  size = 'sm',
}: LiveAgentAvatarProps) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let revoked: string | null = null
    let cancelled = false

    async function load() {
      if (!mediaId) {
        setUrl(null)
        return
      }
      const token = getToken()
      const response = await fetch(liveAgentOwnedMediaPath(mediaId, apiKeyId), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!response.ok || cancelled) return
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      revoked = objectUrl
      if (!cancelled) setUrl(objectUrl)
    }

    void load()
    return () => {
      cancelled = true
      if (revoked) URL.revokeObjectURL(revoked)
    }
  }, [mediaId, apiKeyId])

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface)] font-semibold text-[var(--muted)]',
        sizeClass[size],
        className,
      )}
      aria-hidden
    >
      {url ? (
        <img src={url} alt="" className="size-full object-cover" />
      ) : (
        name.slice(0, 1).toUpperCase() || '?'
      )}
    </span>
  )
}
