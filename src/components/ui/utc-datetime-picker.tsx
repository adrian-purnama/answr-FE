import { useState } from 'react'
import { CalendarIcon } from 'lucide-react'
import { Calendar } from '#/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import { buttonOutlineClassName, hintClassName, inputClassName } from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

type UtcDateTimePickerProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  /** Show a Now control that sets the current UTC wall clock. */
  showNow?: boolean
}

const pad = (n: number) => String(n).padStart(2, '0')

function utcNowLocalValue(): string {
  const now = new Date()
  return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}T${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}`
}

/** Parse `YYYY-MM-DDTHH:mm` (UTC wall clock) for calendar + time controls. */
function parseUtcLocal(value: string): {
  calendarDate: Date
  hours: number
  minutes: number
} | null {
  if (!value.includes('T')) return null
  const [datePart, timePart = '00:00'] = value.split('T')
  const [y, m, d] = datePart.split('-').map(Number)
  const [hh, mm] = timePart.split(':').map(Number)
  if (
    !y ||
    !m ||
    !d ||
    Number.isNaN(y) ||
    Number.isNaN(m) ||
    Number.isNaN(d) ||
    Number.isNaN(hh) ||
    Number.isNaN(mm)
  ) {
    return null
  }
  // Local Date whose Y/M/D match the UTC calendar day we want highlighted.
  return {
    calendarDate: new Date(y, m - 1, d),
    hours: Math.min(23, Math.max(0, hh ?? 0)),
    minutes: Math.min(59, Math.max(0, mm ?? 0)),
  }
}

function formatUtcLocal(
  calendarDate: Date,
  hours: number,
  minutes: number,
): string {
  return `${calendarDate.getFullYear()}-${pad(calendarDate.getMonth() + 1)}-${pad(calendarDate.getDate())}T${pad(hours)}:${pad(minutes)}`
}

function formatDisplay(value: string): string {
  const parsed = parseUtcLocal(value)
  if (!parsed) return ''
  const { calendarDate, hours, minutes } = parsed
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  return `${months[calendarDate.getMonth()]} ${calendarDate.getDate()}, ${calendarDate.getFullYear()} ${pad(hours)}:${pad(minutes)} UTC`
}

export function UtcDateTimePicker({
  id,
  value,
  onChange,
  placeholder = 'Pick date & time (UTC)',
  disabled = false,
  className,
  showNow = false,
}: UtcDateTimePickerProps) {
  const [open, setOpen] = useState(false)
  const parsed = parseUtcLocal(value)
  const selected = parsed?.calendarDate
  const hours = parsed?.hours ?? 0
  const minutes = parsed?.minutes ?? 0

  function commit(nextDate: Date, nextHours: number, nextMinutes: number) {
    onChange(formatUtcLocal(nextDate, nextHours, nextMinutes))
  }

  function setToNow() {
    onChange(utcNowLocalValue())
  }

  return (
    <div className={cn('flex items-stretch gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            disabled={disabled}
            className={cn(
              buttonOutlineClassName,
              'inline-flex min-w-0 flex-1 items-center justify-start gap-2 text-left font-normal',
              !value && 'text-[var(--muted)]',
            )}
          >
            <CalendarIcon className="size-4 shrink-0 opacity-70" aria-hidden />
            <span className="truncate">
              {value ? formatDisplay(value) : placeholder}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected ?? new Date()}
            captionLayout="dropdown"
            onSelect={(date) => {
              if (!date) return
              commit(date, hours, minutes)
            }}
          />
          <div className="flex flex-wrap items-center gap-2 border-t border-[var(--line)] px-3 py-3">
            <span className={cn(hintClassName, 'shrink-0 text-xs')}>
              Time UTC
            </span>
            <select
              aria-label="Hours (UTC)"
              value={hours}
              onChange={(e) => {
                const base = selected ?? new Date()
                commit(base, Number(e.target.value), minutes)
              }}
              className={cn(inputClassName, 'w-16 px-2 py-1.5 tabular-nums')}
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {pad(h)}
                </option>
              ))}
            </select>
            <span className="text-[var(--muted)]" aria-hidden>
              :
            </span>
            <select
              aria-label="Minutes (UTC)"
              value={minutes}
              onChange={(e) => {
                const base = selected ?? new Date()
                commit(base, hours, Number(e.target.value))
              }}
              className={cn(inputClassName, 'w-16 px-2 py-1.5 tabular-nums')}
            >
              {Array.from({ length: 60 }, (_, m) => (
                <option key={m} value={m}>
                  {pad(m)}
                </option>
              ))}
            </select>
            {showNow ? (
              <button
                type="button"
                disabled={disabled}
                className={cn(buttonOutlineClassName, 'px-3 py-1.5 text-sm')}
                onClick={() => {
                  setToNow()
                }}
              >
                Now
              </button>
            ) : null}
            <button
              type="button"
              className={cn(buttonOutlineClassName, 'ml-auto px-3 py-1.5 text-sm')}
              onClick={() => setOpen(false)}
            >
              Done
            </button>
          </div>
        </PopoverContent>
      </Popover>
      {showNow ? (
        <button
          type="button"
          disabled={disabled}
          className={cn(buttonOutlineClassName, 'shrink-0 px-3 py-2 text-sm')}
          onClick={setToNow}
          title="Set to current UTC date and time"
        >
          Now
        </button>
      ) : null}
    </div>
  )
}
