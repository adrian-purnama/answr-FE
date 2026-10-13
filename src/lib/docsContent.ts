import indexMarkdown from '../../docs/README.md?raw'
import embeddingWidgetMarkdown from '../../docs/embedding-widget.md?raw'
import visitorJwtMarkdown from '../../docs/visitor-jwt.md?raw'

export type DocPage = {
  slug: string
  title: string
  description: string
  markdown: string
}

/** Customer-facing integration guides (source: frontend/docs/*.md). */
export const DOC_PAGES: DocPage[] = [
  {
    slug: 'embedding-widget',
    title: 'Embedding the Widget',
    description:
      'Install widget.js once, public key, embed URL, and optional open / close / setVisitorToken.',
    markdown: embeddingWidgetMarkdown,
  },
  {
    slug: 'visitor-jwt',
    title: 'Visitor JWT',
    description:
      'Mint, push, and remint visitor identity tokens; RSA keys; claims for page context.',
    markdown: visitorJwtMarkdown,
  },
]

export const DOCS_INDEX_MARKDOWN = indexMarkdown

export function getDocBySlug(slug: string): DocPage | undefined {
  return DOC_PAGES.find((page) => page.slug === slug)
}
