import { MessageCircle, Megaphone, Newspaper, Link2 } from 'lucide-react'
import { buttonOutlineClassName } from '#/lib/ui-classes'
import { cn } from '#/lib/utils'
import type { HomeSectionType } from '#/lib/widget'

const ITEMS: {
  type: HomeSectionType
  label: string
  Icon: typeof MessageCircle
}[] = [
  { type: 'goToChat', label: 'Go to chat', Icon: MessageCircle },
  { type: 'faq', label: 'FAQ', Icon: Megaphone },
  { type: 'latestNews', label: 'News', Icon: Newspaper },
  { type: 'linkCard', label: 'Link card', Icon: Link2 },
]

type ElementPaletteProps = {
  onAdd: (type: HomeSectionType) => void
}

export default function ElementPalette({ onAdd }: ElementPaletteProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-[var(--ink)]">Add section</p>
      <div className="flex flex-wrap gap-2">
        {ITEMS.map(({ type, label, Icon }) => (
          <button
            key={type}
            type="button"
            className={cn(
              buttonOutlineClassName,
              'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs',
            )}
            onClick={() => onAdd(type)}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
