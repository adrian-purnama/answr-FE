import { cardClassName, hintClassName } from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

type ToggleRowProps = {
  id: string
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
  /** `plain` for use inside section cards; `card` for standalone rows. */
  variant?: 'card' | 'plain'
}

export default function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
  disabled,
  variant = 'plain',
}: ToggleRowProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer items-start justify-between gap-4',
        variant === 'card'
          ? cn(
              cardClassName,
              'px-4 py-3 transition hover:border-[var(--ink)]',
            )
          : 'py-1',
        disabled && 'pointer-events-none opacity-60',
      )}
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-[var(--ink)]">{label}</span>
        <span className={`mt-0.5 block ${hintClassName}`}>{description}</span>
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          id={id}
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span
          className={cn(
            'block h-6 w-11 rounded-full border border-[var(--line)] bg-[var(--surface)] transition',
            'peer-checked:border-[var(--ink)] peer-checked:bg-[var(--ink)]',
            'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--ink)]',
          )}
          aria-hidden
        />
        <span
          className={cn(
            'pointer-events-none absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition',
            'peer-checked:translate-x-5',
          )}
          aria-hidden
        />
      </span>
    </label>
  )
}
