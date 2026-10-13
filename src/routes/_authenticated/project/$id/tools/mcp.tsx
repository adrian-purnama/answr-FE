import { createFileRoute, useLoaderData } from '@tanstack/react-router'
import McpSection from '#/components/mcp/McpSection'

export const Route = createFileRoute('/_authenticated/project/$id/tools/mcp')({
  component: ToolsMcpPage,
})

function ToolsMcpPage() {
  const { apiKey } = useLoaderData({ from: '/_authenticated/project/$id' })

  return <McpSection apiKeyId={apiKey.id} />
}
