import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import DocsMarkdown from '#/components/docs/DocsMarkdown'
import { DOC_PAGES, getDocBySlug } from '#/lib/docsContent'
import { pageHead } from '#/lib/seo'
import { hintClassName } from '#/lib/ui-classes'

export const Route = createFileRoute('/docs/$slug')({
  component: DocsArticlePage,
  loader: ({ params }) => {
    const page = getDocBySlug(params.slug)
    if (!page) throw notFound()
    return page
  },
  head: ({ loaderData }) =>
    pageHead({
      title: loaderData ? `${loaderData.title} · Docs` : 'Docs',
      description: loaderData?.description,
      path: loaderData ? `/docs/${loaderData.slug}` : '/docs',
    }),
})

function DocsArticlePage() {
  const page = Route.useLoaderData()

  return (
    <main className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
      <p className={hintClassName}>
        <Link to="/docs" className="text-[var(--accent)] underline underline-offset-2">
          Docs
        </Link>
        <span className="mx-1.5 text-[var(--muted)]">/</span>
        <span>{page.title}</span>
      </p>

      <article className="mt-6">
        <DocsMarkdown markdown={page.markdown} />
      </article>

      <nav className="mt-12 border-t border-[var(--line)] pt-6">
        <p className={`mb-3 ${hintClassName}`}>More guides</p>
        <ul className="space-y-2 text-sm">
          <li>
            <Link
              to="/docs"
              className="text-[var(--accent)] underline underline-offset-2"
            >
              All docs
            </Link>
          </li>
          {DOC_PAGES.filter((entry) => entry.slug !== page.slug).map((entry) => (
            <li key={entry.slug}>
              <Link
                to="/docs/$slug"
                params={{ slug: entry.slug }}
                className="text-[var(--accent)] underline underline-offset-2"
              >
                {entry.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  )
}
