import { createFileRoute } from '@tanstack/react-router'
import DocsMarkdown from '#/components/docs/DocsMarkdown'
import { DOCS_INDEX_MARKDOWN } from '#/lib/docsContent'
import { pageHead } from '#/lib/seo'

export const Route = createFileRoute('/docs/')({
  component: DocsIndexPage,
  head: () =>
    pageHead({
      title: 'Developer docs',
      description:
        'Integrate the answr widget on your site: embed once, mint visitor JWTs, push page context.',
      path: '/docs',
    }),
})

function DocsIndexPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
      <DocsMarkdown markdown={DOCS_INDEX_MARKDOWN} />
    </main>
  )
}
