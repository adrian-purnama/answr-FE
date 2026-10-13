import { cardClassName, hintClassName, projectSectionClassName } from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

type ProjectSectionPlaceholderProps = {
  title: string
  description?: string
}

export default function ProjectSectionPlaceholder({
  title,
  description = 'This section is coming soon.',
}: ProjectSectionPlaceholderProps) {
  return (
    <div className={projectSectionClassName}>
      <h1 className="text-2xl font-medium text-[var(--ink)]">{title}</h1>
      <div className={cn(cardClassName, 'mt-8 p-6')}>
        <p className={hintClassName}>{description}</p>
      </div>
    </div>
  )
}
