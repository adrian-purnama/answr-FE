import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Calendar } from '#/components/ui/calendar'
import {
  bookPublicMeeting,
  getPublicMeetingAvailability,
  type BookMeetingConflict,
  type BookMeetingSuccess,
  type MeetingAvailability,
  type MeetingBookingPayload,
  type MeetingSlot,
  type WeeklyDaySchedule,
} from '#/lib/meetingTool'
import { cn } from '#/lib/utils'

type WidgetMeetingBookingProps = {
  publicKey: string
  sessionId: string
  payload: MeetingBookingPayload
  darkMode?: boolean
  onBooked: (result: BookMeetingSuccess) => void
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function ymdInTz(iso: string, timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date(iso))
    const y = parts.find((p) => p.type === 'year')?.value
    const m = parts.find((p) => p.type === 'month')?.value
    const d = parts.find((p) => p.type === 'day')?.value
    return `${y}-${m}-${d}`
  } catch {
    return iso.slice(0, 10)
  }
}

function timeLabelInTz(iso: string, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone,
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function todayYmdInTz(timeZone: string): string {
  return ymdInTz(new Date().toISOString(), timeZone)
}

function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(Date.UTC(y!, m! - 1, d! + days))
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`
}

function monthBounds(year: number, month: number): { from: string; to: string } {
  const from = `${year}-${pad2(month)}-01`
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const to = `${year}-${pad2(month)}-${pad2(lastDay)}`
  return { from, to }
}

function parseYmd(ymd: string): { year: number; month: number; day: number } {
  const [y, m, d] = ymd.split('-').map(Number)
  return { year: y!, month: m!, day: d! }
}

/** Calendar cell date → YMD label (local components used as topic-day labels). */
function dateToYmd(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

function ymdToDate(ymd: string): Date {
  const { year, month, day } = parseYmd(ymd)
  return new Date(year, month - 1, day)
}

function dowForYmd(ymd: string, timeZone: string): number {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
  }).format(new Date(`${ymd}T12:00:00Z`))
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }
  return map[weekday] ?? 0
}

function isWeeklyOpenDay(
  ymd: string,
  weeklySchedule: WeeklyDaySchedule[],
  timeZone: string,
): boolean {
  if (!weeklySchedule.length) return false
  const dow = dowForYmd(ymd, timeZone)
  const day = weeklySchedule.find((d) => d.dayOfWeek === dow)
  return Boolean(day?.enabled && day.windows.length > 0)
}

function slotChipLabel(slot: MeetingSlot, timeZone: string): string {
  const start = timeLabelInTz(slot.startsAt, timeZone)
  const end = timeLabelInTz(slot.endsAt, timeZone)
  const range = `${start}–${end}`
  if (slot.capacity > 1 || slot.remainingCapacity < slot.capacity) {
    if (slot.remainingCapacity <= 0) {
      return `${range} · full`
    }
    return `${range} · ${slot.remainingCapacity} spot${slot.remainingCapacity === 1 ? '' : 's'} left`
  }
  return range
}

export default function WidgetMeetingBooking({
  publicKey,
  sessionId,
  payload,
  darkMode = false,
  onBooked,
}: WidgetMeetingBookingProps) {
  const todayYmd = useMemo(
    () => todayYmdInTz(payload.timezone),
    [payload.timezone],
  )
  const horizonEndYmd = useMemo(
    () => addDaysYmd(todayYmd, Math.max(1, payload.bookingHorizonDays) - 1),
    [todayYmd, payload.bookingHorizonDays],
  )
  const todayParts = parseYmd(todayYmd)
  const blackouts = useMemo(
    () => new Set(payload.blackoutDates ?? []),
    [payload.blackoutDates],
  )

  const [fields, setFields] = useState(() =>
    Object.fromEntries(payload.fields.map((f) => [f.id, ''])),
  )
  const [month, setMonth] = useState(() =>
    ymdToDate(`${todayParts.year}-${pad2(todayParts.month)}-01`),
  )
  const [availableSlots, setAvailableSlots] = useState<MeetingSlot[]>([])
  const [unavailableSlots, setUnavailableSlots] = useState<MeetingSlot[]>([])
  const [rangeLoading, setRangeLoading] = useState(true)
  const [rangeError, setRangeError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<BookMeetingSuccess | null>(null)
  const cacheRef = useRef(
    new Map<
      string,
      Pick<MeetingAvailability, 'availableSlots' | 'unavailableSlots'>
    >(),
  )

  const orderedFields = useMemo(
    () => [...payload.fields].sort((a, b) => a.order - b.order),
    [payload.fields],
  )

  const viewYear = month.getFullYear()
  const viewMonth = month.getMonth() + 1
  const horizonParts = parseYmd(horizonEndYmd)
  const minMonth = new Date(todayParts.year, todayParts.month - 1, 1)
  const maxMonth = new Date(horizonParts.year, horizonParts.month - 1, 1)

  useEffect(() => {
    let cancelled = false
    const bounds = monthBounds(viewYear, viewMonth)
    const from = bounds.from < todayYmd ? todayYmd : bounds.from
    const to = bounds.to > horizonEndYmd ? horizonEndYmd : bounds.to
    const cacheKey = `${payload.meetingTopicId}|${from}|${to}`

    async function load() {
      if (from > to) {
        setAvailableSlots([])
        setUnavailableSlots([])
        setRangeLoading(false)
        setRangeError(null)
        return
      }
      const cached = cacheRef.current.get(cacheKey)
      if (cached) {
        setAvailableSlots(cached.availableSlots)
        setUnavailableSlots(cached.unavailableSlots)
        setRangeLoading(false)
        setRangeError(null)
        return
      }
      setRangeLoading(true)
      setRangeError(null)
      try {
        const response = await getPublicMeetingAvailability(publicKey, {
          sessionId,
          meetingTopicId: payload.meetingTopicId,
          from,
          to,
        })
        if (cancelled) return
        if (!response.success || !response.data) {
          setRangeError(response.message || 'Failed to load availability')
          setAvailableSlots([])
          setUnavailableSlots([])
          return
        }
        cacheRef.current.set(cacheKey, {
          availableSlots: response.data.availableSlots,
          unavailableSlots: response.data.unavailableSlots,
        })
        setAvailableSlots(response.data.availableSlots)
        setUnavailableSlots(response.data.unavailableSlots)
      } catch (err) {
        if (cancelled) return
        setRangeError(
          err instanceof Error ? err.message : 'Failed to load availability',
        )
        setAvailableSlots([])
        setUnavailableSlots([])
      } finally {
        if (!cancelled) setRangeLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [
    horizonEndYmd,
    payload.meetingTopicId,
    publicKey,
    sessionId,
    todayYmd,
    viewMonth,
    viewYear,
  ])

  const bookableYmds = useMemo(() => {
    const set = new Set<string>()
    for (const slot of availableSlots) {
      set.add(ymdInTz(slot.startsAt, payload.timezone))
    }
    return set
  }, [availableSlots, payload.timezone])

  const busyOnlyYmds = useMemo(() => {
    const set = new Set<string>()
    for (const slot of unavailableSlots) {
      const ymd = ymdInTz(slot.startsAt, payload.timezone)
      if (!bookableYmds.has(ymd)) set.add(ymd)
    }
    return set
  }, [unavailableSlots, bookableYmds, payload.timezone])

  function dayKind(
    ymd: string,
  ): 'bookable' | 'unavailable' | 'closed' {
    if (ymd < todayYmd || ymd > horizonEndYmd) return 'closed'
    if (blackouts.has(ymd)) return 'closed'
    if (!isWeeklyOpenDay(ymd, payload.weeklySchedule, payload.timezone)) {
      return 'closed'
    }
    if (bookableYmds.has(ymd)) return 'bookable'
    if (busyOnlyYmds.has(ymd)) return 'unavailable'
    // Open weekday in range, but no free slots returned for this month fetch.
    return 'unavailable'
  }

  const timesForDate = useMemo(() => {
    if (!selectedDate) {
      return { available: [] as MeetingSlot[], unavailable: [] as MeetingSlot[] }
    }
    const available = availableSlots.filter(
      (s) => ymdInTz(s.startsAt, payload.timezone) === selectedDate,
    )
    const unavailable = unavailableSlots.filter(
      (s) => ymdInTz(s.startsAt, payload.timezone) === selectedDate,
    )
    return { available, unavailable }
  }, [
    availableSlots,
    unavailableSlots,
    selectedDate,
    payload.timezone,
  ])

  async function submit() {
    setError(null)
    for (const field of orderedFields) {
      if (field.required && !fields[field.id]?.trim()) {
        setError(`${field.label} is required`)
        return
      }
    }
    if (!selectedSlot) {
      setError('Select a date and time')
      return
    }

    setSubmitting(true)
    try {
      const response = await bookPublicMeeting(publicKey, {
        sessionId,
        meetingTopicId: payload.meetingTopicId,
        startsAt: selectedSlot,
        fieldValues: orderedFields.map((f) => ({
          fieldId: f.id,
          value: fields[f.id] ?? '',
        })),
      })

      if (
        !response.success &&
        response.data &&
        'code' in response.data &&
        response.data.code === 'SLOT_UNAVAILABLE'
      ) {
        const conflict = response.data as BookMeetingConflict
        const bounds = monthBounds(viewYear, viewMonth)
        const from = bounds.from < todayYmd ? todayYmd : bounds.from
        const to = bounds.to > horizonEndYmd ? horizonEndYmd : bounds.to
        const cacheKey = `${payload.meetingTopicId}|${from}|${to}`
        cacheRef.current.set(cacheKey, {
          availableSlots: conflict.availability.availableSlots,
          unavailableSlots: conflict.availability.unavailableSlots,
        })
        setAvailableSlots(conflict.availability.availableSlots)
        setUnavailableSlots(conflict.availability.unavailableSlots)
        setSelectedSlot(null)
        setError('That time is no longer available. Please choose another.')
        return
      }

      if (!response.success || !response.data || !('meetingId' in response.data)) {
        setError(response.message || 'Failed to book meeting')
        return
      }

      const success = response.data as BookMeetingSuccess
      setDone(success)
      onBooked(success)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to book meeting')
    } finally {
      setSubmitting(false)
    }
  }

  const shell = cn(
    'mt-3 w-full max-w-sm rounded-2xl border px-3 py-3 text-left',
    darkMode
      ? 'border-white/15 bg-white/5 text-white'
      : 'border-neutral-200 bg-white text-neutral-950',
  )
  const inputCls = cn(
    'mt-1 w-full rounded-lg border px-2.5 py-2 text-sm outline-none',
    darkMode
      ? 'border-white/20 bg-black/20 text-white placeholder:text-white/40'
      : 'border-neutral-200 bg-white text-neutral-950',
  )
  const muted = darkMode ? 'text-white/65' : 'text-neutral-500'
  const chipBase =
    'rounded-lg border px-2.5 py-1.5 text-xs transition disabled:opacity-40'
  const chipIdle = darkMode
    ? 'border-white/20 hover:bg-white/10'
    : 'border-neutral-200 hover:bg-white'
  const chipActive = darkMode
    ? 'border-white bg-white text-black'
    : 'border-neutral-950 bg-neutral-950 text-white'
  const chipBusy = darkMode
    ? 'border-red-400/40 bg-red-950/40 text-red-300 line-through'
    : 'border-red-300 bg-red-50 text-red-600 line-through'

  const selectedDateObj = selectedDate ? ymdToDate(selectedDate) : undefined

  if (done) {
    return (
      <div className={shell}>
        <p className="text-sm font-medium">Meeting arranged</p>
        <p className={cn('mt-1 text-xs', muted)}>
          {timeLabelInTz(done.startsAt, done.timezone)} · {done.timezone}
        </p>
      </div>
    )
  }

  return (
    <div className={shell}>
      <p className="text-sm font-medium">Book a meeting</p>
      <p className={cn('mt-0.5 text-xs', muted)}>
        {payload.topicName} · Times in {payload.timezone}
      </p>

      <div className="mt-3 space-y-2">
        {orderedFields.map((field) => (
          <label key={field.id} className="block text-xs">
            <span>
              {field.label}
              {field.required ? ' *' : ''}
            </span>
            <input
              className={inputCls}
              type={
                field.type === 'email'
                  ? 'email'
                  : field.type === 'phone'
                    ? 'tel'
                    : 'text'
              }
              value={fields[field.id] ?? ''}
              onChange={(e) =>
                setFields((prev) => ({ ...prev, [field.id]: e.target.value }))
              }
              disabled={submitting}
            />
          </label>
        ))}
      </div>

      <div className="relative mt-3">
        {rangeLoading ? (
          <div
            className={cn(
              'absolute inset-0 z-10 flex items-center justify-center rounded-lg',
              darkMode ? 'bg-black/40' : 'bg-white/70',
            )}
          >
            <Loader2 className="size-4 animate-spin" aria-hidden />
          </div>
        ) : null}

        <Calendar
          mode="single"
          month={month}
          onMonthChange={(next) => {
            const clamped =
              next < minMonth ? minMonth : next > maxMonth ? maxMonth : next
            setMonth(clamped)
            setSelectedDate(null)
            setSelectedSlot(null)
          }}
          selected={selectedDateObj}
          onSelect={(date) => {
            if (!date) {
              setSelectedDate(null)
              setSelectedSlot(null)
              return
            }
            const ymd = dateToYmd(date)
            if (dayKind(ymd) !== 'bookable') return
            setSelectedDate(ymd)
            setSelectedSlot(null)
          }}
          disabled={(date) => {
            const ymd = dateToYmd(date)
            return dayKind(ymd) !== 'bookable' || submitting || rangeLoading
          }}
          startMonth={minMonth}
          endMonth={maxMonth}
          modifiers={{
            bookable: (date) => dayKind(dateToYmd(date)) === 'bookable',
            unavailable: (date) => dayKind(dateToYmd(date)) === 'unavailable',
            closed: (date) => dayKind(dateToYmd(date)) === 'closed',
          }}
          modifiersClassNames={{
            bookable: darkMode
              ? '[&_button]:bg-white/10 [&_button]:text-white'
              : '[&_button]:bg-neutral-100',
            unavailable:
              '[&_button]:bg-red-500/15 [&_button]:text-red-600 [&_button]:line-through dark:[&_button]:text-red-300',
            closed:
              '[&_button]:bg-red-500/10 [&_button]:text-red-500/80 [&_button]:opacity-70',
          }}
          className={cn(
            'rounded-lg border w-full max-w-none',
            darkMode
              ? 'border-white/15 bg-transparent text-white'
              : 'border-neutral-200 bg-white',
          )}
        />

        <p className={cn('mt-2 text-[10px] leading-relaxed', muted)}>
          Selectable days have open times. Red days cannot be booked (closed
          schedule, blackout, outside horizon, or fully booked).
        </p>

        {rangeError ? (
          <p className="mt-2 text-xs text-red-500">{rangeError}</p>
        ) : null}
      </div>

      {selectedDate ? (
        <div className="mt-3">
          <p className="text-xs font-medium">Time</p>
          <div className="mt-1.5 flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
            {timesForDate.available.map((slot) => (
              <button
                key={slot.startsAt}
                type="button"
                className={cn(
                  chipBase,
                  selectedSlot === slot.startsAt ? chipActive : chipIdle,
                )}
                disabled={submitting || rangeLoading}
                onClick={() => setSelectedSlot(slot.startsAt)}
              >
                {slotChipLabel(slot, payload.timezone)}
              </button>
            ))}
            {timesForDate.unavailable.map((slot) => (
              <button
                key={`busy-${slot.startsAt}`}
                type="button"
                className={cn(chipBase, chipBusy)}
                disabled
                title="Fully booked"
              >
                {slotChipLabel(slot, payload.timezone)}
              </button>
            ))}
            {timesForDate.available.length === 0 &&
            timesForDate.unavailable.length === 0 &&
            !rangeLoading ? (
              <p className={cn('text-xs', muted)}>
                No available times on this date.
              </p>
            ) : null}
            {timesForDate.available.length === 0 &&
            timesForDate.unavailable.length > 0 &&
            !rangeLoading ? (
              <p className={cn('w-full text-xs', muted)}>
                No available times   all periods are fully booked.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-2 text-xs text-red-500">{error}</p> : null}

      <button
        type="button"
        disabled={submitting || rangeLoading}
        onClick={() => void submit()}
        className={cn(
          'mt-3 inline-flex w-full items-center justify-center rounded-full px-3 py-2 text-xs font-medium transition',
          darkMode
            ? 'bg-white text-black hover:bg-white/90'
            : 'bg-neutral-950 text-white hover:opacity-90',
          (submitting || rangeLoading) && 'opacity-60',
        )}
      >
        {submitting ? 'Booking…' : 'Confirm meeting'}
      </button>
    </div>
  )
}
