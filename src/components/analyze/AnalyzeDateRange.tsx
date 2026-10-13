import { useState } from 'react'
import { CalendarIcon } from 'lucide-react'
import { Calendar } from '#/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import { buttonOutlineClassName, hintClassName } from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

type AnalyzeDateRangeProps = {
  lookbackDays: number
  min: string
  max: string
  from: string
  to: string
  onChange: (next: { from: string; to: string }) => void
}

function dateFromYmd(ymd: string): Date {
  const [year, month, day] = ymd.split('-').map(Number)
  return new Date(year!, month! - 1, day!)
}

function ymdFromLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatYmd(ymd: string) {
  return dateFromYmd(ymd).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function DayPickerField({
  label,
  value,
  min,
  max,
  onPick,
}: {
  label: string
  value: string
  min: string
  max: string
  onPick: (ymd: string) => void
}) {
  const [open, setOpen] = useState(false)
  const minDate = dateFromYmd(min)
  const maxDate = dateFromYmd(max)
  const selected = dateFromYmd(value)

  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className={cn(hintClassName, 'text-xs')}>{label}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              buttonOutlineClassName,
              'inline-flex items-center gap-2 text-left font-normal',
            )}
          >
            <CalendarIcon className="size-4 shrink-0" />
            <span>{formatYmd(value)}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected}
            startMonth={minDate}
            endMonth={maxDate}
            disabled={{ before: minDate, after: maxDate }}
            onSelect={(date) => {
              if (!date) return
              onPick(ymdFromLocalDate(date))
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
    </label>
  )
}

export default function AnalyzeDateRange({
  lookbackDays,
  min,
  max,
  from,
  to,
  onChange,
}: AnalyzeDateRangeProps) {
  return (
    <div
      className="flex flex-wrap items-end gap-3"
      title={`Plan lookback: ${lookbackDays} day${lookbackDays === 1 ? '' : 's'}`}
    >
      <DayPickerField
        label="From"
        value={from}
        min={min}
        max={to < max ? to : max}
        onPick={(nextFrom) => onChange({ from: nextFrom, to })}
      />
      <DayPickerField
        label="To"
        value={to}
        min={from > min ? from : min}
        max={max}
        onPick={(nextTo) => onChange({ from, to: nextTo })}
      />
    </div>
  )
}
