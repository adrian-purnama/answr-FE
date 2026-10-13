import { createFileRoute } from '@tanstack/react-router'
import ProjectSectionPlaceholder from '#/components/project/ProjectSectionPlaceholder'

export const Route = createFileRoute('/_authenticated/project/$id/configuration/appearance')({
  component: ConfigurationAppearancePage,
})

function ConfigurationAppearancePage() {
  return (
    <ProjectSectionPlaceholder
      title="Appearance"
      description="Customize how your agent looks and presents itself."
    />
  )
}
