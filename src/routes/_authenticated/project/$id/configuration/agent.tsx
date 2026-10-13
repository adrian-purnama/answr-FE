import { createFileRoute } from '@tanstack/react-router'
import ProjectSectionPlaceholder from '#/components/project/ProjectSectionPlaceholder'

export const Route = createFileRoute('/_authenticated/project/$id/configuration/agent')({
  component: ConfigurationAgentPage,
})

function ConfigurationAgentPage() {
  return (
    <ProjectSectionPlaceholder
      title="Agent"
      description="Configure agent behavior and defaults for this project."
    />
  )
}
