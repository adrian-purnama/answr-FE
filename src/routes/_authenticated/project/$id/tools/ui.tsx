import { createFileRoute, useLoaderData } from '@tanstack/react-router'
import UiTemplatesSection from '#/components/uiTemplate/UiTemplatesSection'

export const Route = createFileRoute('/_authenticated/project/$id/tools/ui')({
  component: ToolsUiPage,
})

function ToolsUiPage() {
  const { apiKey } = useLoaderData({ from: '/_authenticated/project/$id' })

  return <UiTemplatesSection apiKeyId={apiKey.id} />
}
