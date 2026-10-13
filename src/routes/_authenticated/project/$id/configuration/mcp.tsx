import { createFileRoute } from '@tanstack/react-router'
import ProjectSectionPlaceholder from '#/components/project/ProjectSectionPlaceholder'

export const Route = createFileRoute('/_authenticated/project/$id/configuration/mcp')({
  component: ConfigurationMcpPage,
})

function ConfigurationMcpPage() {
  return (
    <ProjectSectionPlaceholder
      title="MCP"
      description="Manage MCP server connections and tools for this project."
    />
  )
}
