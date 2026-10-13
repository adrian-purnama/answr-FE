import { createFileRoute } from '@tanstack/react-router'
import WidgetApp from '#/components/widget/WidgetApp'
import { pageHead } from '#/lib/seo'

export const Route = createFileRoute('/embed/widget/$publicKey')({
  component: EmbedWidgetPage,
  head: () =>
    pageHead({
      title: 'Widget',
      path: '/embed',
      noIndex: true,
    }),
})

function EmbedWidgetPage() {
  const { publicKey } = Route.useParams()
  return <WidgetApp publicKey={publicKey} />
}
