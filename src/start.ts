import { createMiddleware, createStart } from '@tanstack/react-start'

/**
 * Browser-enforced companion to the client-side `allowedDomains` check.
 *
 * The widget can only ever see a *claimed* host origin, so the allowlist is
 * also enforced here, on the embed document response, where the browser
 * refuses to frame us at all from an unlisted page.
 */
const EMBED_PATHNAME = /^\/embed\/widget\/([^/?#]+)/

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const ALLOWLIST_TTL_MS = 60_000

type CachedAllowlist = { domains: string[]; fetchedAt: number }

const allowlistCache = new Map<string, CachedAllowlist>()

async function readAllowedDomains(publicKey: string): Promise<string[]> {
  const cached = allowlistCache.get(publicKey)
  if (cached && Date.now() - cached.fetchedAt < ALLOWLIST_TTL_MS) {
    return cached.domains
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/widgets/public/${encodeURIComponent(publicKey)}`,
      { headers: { 'Content-Type': 'application/json' } },
    )
    const body = (await response.json()) as {
      data?: { allowedDomains?: unknown }
    }
    const raw = body.data?.allowedDomains
    const domains = Array.isArray(raw)
      ? raw.filter((entry): entry is string => typeof entry === 'string')
      : []
    allowlistCache.set(publicKey, { domains, fetchedAt: Date.now() })
    return domains
  } catch {
    // Never fail the document over the allowlist lookup; the client-side
    // check still applies and 'self' keeps the builder preview working.
    return []
  }
}

function frameAncestors(domains: string[]): string {
  const sources = new Set<string>(["'self'"])
  for (const entry of domains) {
    const host = entry
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .split('/')[0]
    if (!host) continue
    // Both schemes so local development hosts work the same as production.
    sources.add(`https://${host}`)
    sources.add(`http://${host}`)
  }
  return `frame-ancestors ${Array.from(sources).join(' ')}`
}

const embedFramePolicy = createMiddleware({ type: 'request' }).server(
  async ({ pathname, next }) => {
    const result = await next()

    const match = EMBED_PATHNAME.exec(pathname)
    if (!match?.[1]) return result

    const domains = await readAllowedDomains(decodeURIComponent(match[1]))
    result.response.headers.set(
      'Content-Security-Policy',
      frameAncestors(domains),
    )
    // Legacy header must not be sent: it has no allowlist form and would
    // block every third-party embed.
    result.response.headers.delete('X-Frame-Options')

    return result
  },
)

export const startInstance = createStart(() => ({
  requestMiddleware: [embedFramePolicy],
}))
