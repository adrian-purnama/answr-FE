import type { ReactNode } from 'react'
import { cardClassName, hintClassName, inputClassName } from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

export const widgetFieldLabelClassName =
  'mb-1.5 block text-sm font-medium text-[var(--ink)]'

export { inputClassName, hintClassName }

type WidgetFormSectionProps = {
  title?: string
  description?: string
  children: ReactNode
  className?: string
}

export function WidgetFormSection({
  title,
  description,
  children,
  className,
}: WidgetFormSectionProps) {
  return (
    <section className={cn(cardClassName, 'space-y-4 p-5 sm:p-6', className)}>
      {title || description ? (
        <div>
          {title ? (
            <h2 className="text-sm font-medium text-[var(--ink)]">{title}</h2>
          ) : null}
          {description ? (
            <p className={cn(hintClassName, title && 'mt-1')}>{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}
