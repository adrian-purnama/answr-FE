import { useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Calendar } from '#/components/ui/calendar'
import MeetingRow from '#/components/meetingTool/MeetingRow'
import {
  formatDateHeading,
  todayYmdLocal,
  ymdFromDate,
  ymdInMeetingTz,
} from '#/components/meetingTool/meetingViewUtils'
import type { Meeting } from '#/lib/meetingTool'
import { hintClassName } from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

type MeetingCalendarViewProps = {
  meetings: Meeting[]
  month: Date
  onMonthChange: (month: Date) => void
  monthLoading?: boolean
  onCancel: (meetingId: string) => void
  cancellingId?: string | null
}

export default function MeetingCalendarView({
  meetings,
  month,
  onMonthChange,
  monthLoading = false,
  onCancel,
  cancellingId = null,
}: MeetingCalendarViewProps) {
  const [selectedYmd, setSelectedYmd] = useState<string | null>(
    todayYmdLocal(),
  )
  const todayYmd = todayYmdLocal()

  const countByYmd = useMemo(() => {
    const counts = new Map<string, number>()
    for (const meeting of meetings) {
      if (meeting.status !== 'scheduled') continue
      const ymd = ymdInMeetingTz(meeting.startsAt, meeting.timezone)
      counts.set(ymd, (counts.get(ymd) ?? 0) + 1)
    }
    return counts
  }, [meetings])

  const dayMeetings = useMemo(() => {
    if (!selectedYmd) return []
    return meetings
      .filter(
        (m) =>
          m.status === 'scheduled' &&
          ymdInMeetingTz(m.startsAt, m.timezone) === selectedYmd,
      )
      .sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      )
  }, [meetings, selectedYmd])

  const selectedDate = selectedYmd
    ? (() => {
        const [y, m, d] = selectedYmd.split('-').map(Number)
        return new Date(y!, m! - 1, d!)
      })()
    : undefined

  return (
    <div className="flex min-w-0 flex-col gap-5 md:flex-row md:items-start">
      <div className="relative min-w-0 w-fit max-w-full">
        {monthLoading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
            <Loader2 className="size-4 animate-spin text-[var(--muted)]" />
          </div>
        ) : null}
        <Calendar
          mode="single"
          month={month}
          onMonthChange={(next) => {
            onMonthChange(next)
            setSelectedYmd(null)
          }}
          selected={selectedDate}
          onSelect={(date) => {
            setSelectedYmd(date ? ymdFromDate(date) : null)
          }}
          modifiers={{
            booked: (date) => (countByYmd.get(ymdFromDate(date)) ?? 0) > 0,
          }}
          modifiersClassNames={{
            booked:
              '[&_button]:relative [&_button]:after:absolute [&_button]:after:bottom-0.5 [&_button]:after:left-1/2 [&_button]:after:size-1 [&_button]:after:-translate-x-1/2 [&_button]:after:rounded-full [&_button]:after:bg-[var(--ink)]',
          }}
          className="w-full max-w-none bg-transparent p-0 [--cell-size:2.25rem] sm:[--cell-size:2.5rem]"
        />
      </div>
      <div className="min-w-0 flex-1">
        {selectedYmd ? (
          <>
            <h3 className="text-xs font-medium text-[var(--muted)]">
              {formatDateHeading(selectedYmd, todayYmd)}
            </h3>
            {dayMeetings.length === 0 ? (
              <p className={cn(hintClassName, 'mt-2')}>
                No meetings on this date.
              </p>
            ) : (
              <ul className="mt-1 divide-y divide-[var(--line)] border-b border-[var(--line)]">
                {dayMeetings.map((meeting) => (
                  <MeetingRow
                    key={meeting.id}
                    meeting={meeting}
                    onCancel={onCancel}
                    cancelling={cancellingId === meeting.id}
                  />
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className={hintClassName}>Select a date to see meetings.</p>
        )}
      </div>
    </div>
  )
}
