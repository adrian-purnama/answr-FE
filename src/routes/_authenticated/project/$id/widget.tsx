import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import WidgetBuilder from '#/components/widget/WidgetBuilder'
import { projectSectionClassName } from '#/lib/ui-classes'

const projectRouteApi = getRouteApi('/_authenticated/project/$id')

export const Route = createFileRoute('/_authenticated/project/$id/widget')({
  component: WidgetPage,
})

function WidgetPage() {
  const { apiKey } = projectRouteApi.useLoaderData()

  return (
    <div className={projectSectionClassName}>
      <WidgetBuilder apiKeyId={apiKey.id} />
    </div>
  )
}
