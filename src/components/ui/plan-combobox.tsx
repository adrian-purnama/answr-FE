import { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '#/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import type { Plan } from '#/lib/plan'
import { cn } from '#/lib/utils'

type PlanComboboxProps = {
  id?: string
  plans: Plan[]
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
}

export default function PlanCombobox({
  id,
  plans,
  value,
  onValueChange,
  disabled = false,
  placeholder = 'Select a plan…',
}: PlanComboboxProps) {
  const [open, setOpen] = useState(false)

  const selectedPlan = plans.find((plan) => plan.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'h-auto w-full justify-between rounded-[var(--radius-sm)] border-[var(--line)] bg-white px-3 py-2.5 font-normal text-[var(--ink)] shadow-none hover:bg-white hover:text-[var(--ink)]',
            !selectedPlan && 'text-[var(--muted)]',
          )}
        >
          <span className="truncate text-left">
            {selectedPlan
              ? `${selectedPlan.name} (${selectedPlan.slug})`
              : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command>
          <CommandInput placeholder="Search plans…" />
          <CommandList>
            <CommandEmpty>No plan found.</CommandEmpty>
            <CommandGroup>
              {plans.map((plan) => (
                <CommandItem
                  key={plan.id}
                  value={`${plan.name} ${plan.slug}`}
                  onSelect={() => {
                    onValueChange(plan.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'size-4',
                      value === plan.id ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {plan.name} ({plan.slug})
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
