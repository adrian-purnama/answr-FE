export const SITE_NAME = 'answr'

export const SITE_URL = (
  import.meta.env.VITE_SITE_URL ?? 'https://answr.id'
).replace(/\/$/, '')

export const DEFAULT_DESCRIPTION =
  'Embed AI workflows, models, and tooling quickly via a simple API. Build on infrastructure that\'s safe, scalable, and ready for production.'

export const HOME_TITLE = 'answr   The AI chatbot you can build on'

const DEFAULT_OG_IMAGE = '/og-default.png'
const THEME_COLOR = '#1e3149'

type MetaEntry =
  | { title: string }
  | { name: string; content: string }
  | { property: string; content: string }

type LinkEntry = {
  rel: string
  href: string
  type?: string
  sizes?: string
}

export type PageHeadOptions = {
  /** Page label; omit or pass null for the home title. */
  title?: string | null
  description?: string
  /** Path starting with `/` for canonical / og:url. */
  path?: string
  noIndex?: boolean
  /** Absolute URL or site-relative path for og:image. */
  image?: string
}

function absoluteUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl
  }
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`
  return `${SITE_URL}${path}`
}

function formatTitle(title?: string | null): string {
  if (title == null || title === '') return HOME_TITLE
  if (title === SITE_NAME || title.startsWith(`${SITE_NAME} `)) return title
  return `${title} · ${SITE_NAME}`
}

/** Shared document head for TanStack Router `head()`. */
export function pageHead(options: PageHeadOptions = {}): {
  meta: MetaEntry[]
  links: LinkEntry[]
} {
  const description = options.description ?? DEFAULT_DESCRIPTION
  const title = formatTitle(options.title)
  const path = options.path ?? '/'
  const pageUrl = absoluteUrl(path)
  const imageUrl = absoluteUrl(options.image ?? DEFAULT_OG_IMAGE)

  const meta: MetaEntry[] = [
    { title },
    { name: 'description', content: description },
    { name: 'theme-color', content: THEME_COLOR },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: pageUrl },
    { property: 'og:image', content: imageUrl },
    { property: 'og:site_name', content: SITE_NAME },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: imageUrl },
  ]

  if (options.noIndex) {
    meta.push({ name: 'robots', content: 'noindex, nofollow' })
  }

  const links: LinkEntry[] = [
    { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
    { rel: 'apple-touch-icon', href: '/apple-touch-icon.png', sizes: '180x180' },
  ]

  if (!options.noIndex) {
    links.push({ rel: 'canonical', href: pageUrl })
  }

  return { meta, links }
}
