import { marked, Renderer } from 'marked'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, type MouseEvent } from 'react'
import { sanitizeHtml } from '#/components/agentChat/agentChatMarkdown'
import { cn } from '#/lib/utils'

marked.setOptions({
  gfm: true,
  breaks: false,
})

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const docsRenderer = new Renderer()
const defaultCode = docsRenderer.code.bind(docsRenderer)

docsRenderer.code = function docsCode(token) {
  if (token.lang === 'mermaid') {
    const source = token.escaped ? token.text : escapeHtml(token.text)
    return `<div class="docs-mermaid mermaid">${source}</div>`
  }
  return defaultCode(token)
}

/** Rewrite repo-relative .md links to in-app /docs paths. */
export function rewriteDocLinks(markdown: string): string {
  return markdown
    .replace(/\]\(\.\/README\.md(#[^)]*)?\)/g, '](/docs$1)')
    .replace(/\]\(\.\/([^)#]+)\.md(#[^)]*)?\)/g, '](/docs/$1$2)')
}

export function docsMarkdownToHtml(markdown: string): string {
  const prepared = rewriteDocLinks(markdown)
  const html = marked.parse(prepared, {
    async: false,
    renderer: docsRenderer,
  })
  if (typeof html !== 'string') return ''
  return sanitizeHtml(html)
}

const docsProseClassName = cn(
  'docs-prose max-w-none text-sm leading-relaxed text-[var(--ink)]',
  '[&_h1]:font-display [&_h1]:text-3xl [&_h1]:tracking-tight [&_h1]:sm:text-4xl',
  '[&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-medium',
  '[&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-medium',
  '[&_p]:mt-3',
  '[&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5',
  '[&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5',
  '[&_li]:leading-relaxed',
  '[&_a]:text-[var(--accent)] [&_a]:underline [&_a]:underline-offset-2',
  '[&_strong]:font-semibold',
  '[&_hr]:my-8 [&_hr]:border-[var(--line)]',
  '[&_blockquote]:mt-4 [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--line)] [&_blockquote]:pl-4 [&_blockquote]:text-[var(--muted)]',
  '[&_table]:mt-4 [&_table]:w-full [&_table]:border-collapse [&_table]:text-left [&_table]:text-sm',
  '[&_th]:border-b [&_th]:border-[var(--line)] [&_th]:py-2 [&_th]:pr-3 [&_th]:font-medium',
  '[&_td]:border-b [&_td]:border-[var(--line)] [&_td]:py-2 [&_td]:pr-3 [&_td]:align-top',
  '[&_pre]:mt-4 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-[var(--bg)] [&_pre]:p-3 [&_pre]:text-xs [&_pre]:ring-1 [&_pre]:ring-[var(--line)]',
  '[&_code]:rounded [&_code]:bg-[var(--bg)] [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em]',
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0',
  '[&_.docs-mermaid]:mt-6 [&_.docs-mermaid]:overflow-x-auto [&_.docs-mermaid]:rounded-md [&_.docs-mermaid]:bg-[var(--bg)] [&_.docs-mermaid]:p-4 [&_.docs-mermaid]:ring-1 [&_.docs-mermaid]:ring-[var(--line)]',
  '[&_.docs-mermaid_svg]:mx-auto [&_.docs-mermaid_svg]:max-w-full',
)

type DocsMarkdownProps = {
  markdown: string
  className?: string
}

export default function DocsMarkdown({ markdown, className }: DocsMarkdownProps) {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const html = useMemo(() => docsMarkdownToHtml(markdown), [markdown])

  useEffect(() => {
    const root = containerRef.current
    if (!root) return

    const nodes = [
      ...root.querySelectorAll<HTMLElement>('.mermaid'),
    ]
    if (nodes.length === 0) return

    let cancelled = false

    void (async () => {
      const mermaid = (await import('mermaid')).default
      if (cancelled) return

      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'neutral',
        fontFamily: 'inherit',
      })

      // Fresh nodes only   already-rendered SVGs are skipped by mermaid.
      const pending = nodes.filter((node) => !node.querySelector('svg'))
      if (pending.length === 0) return
      await mermaid.run({ nodes: pending })
    })()

    return () => {
      cancelled = true
    }
  }, [html])

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    const anchor = (event.target as HTMLElement | null)?.closest('a')
    if (!anchor || !(anchor instanceof HTMLAnchorElement)) return

    const href = anchor.getAttribute('href')
    if (!href || href.startsWith('http') || href.startsWith('mailto:')) return
    if (href.startsWith('#')) return

    if (href === '/docs' || href === '/docs/') {
      event.preventDefault()
      void navigate({ to: '/docs' })
      return
    }

    const match = /^\/docs\/([^/#?]+)(.*)$/.exec(href)
    if (match) {
      event.preventDefault()
      void navigate({
        to: '/docs/$slug',
        params: { slug: match[1] },
        hash: match[2]?.startsWith('#') ? match[2].slice(1) : undefined,
      })
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn(docsProseClassName, className)}
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
