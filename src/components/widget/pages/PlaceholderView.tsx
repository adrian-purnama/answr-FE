import { cn } from '#/lib/utils'

export default function PlaceholderView({
  title,
  darkMode,
}: {
  title: string
  darkMode?: boolean
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <p
        className={cn(
          'text-sm font-medium',
          darkMode ? 'text-neutral-500' : 'text-neutral-400',
        )}
      >
        {title}
      </p>
    </div>
  )
}
