import type { Meeting } from '#/lib/meetingTool'

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function ymdFromDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

export function ymdInMeetingTz(iso: string, timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timeZone || 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date(iso))
    const y = parts.find((p) => p.type === 'year')?.value
    const m = parts.find((p) => p.type === 'month')?.value
    const d = parts.find((p) => p.type === 'day')?.value
    if (y && m && d) return `${y}-${m}-${d}`
  } catch {
    /* fall through */
  }
  return iso.slice(0, 10)
}

export function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(Date.UTC(y!, m! - 1, d! + days))
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`
}

export function todayYmdLocal(): string {
  return ymdFromDate(new Date())
}

export function formatMeetingTime(meeting: Meeting): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: meeting.timezone || 'UTC',
    }).format(new Date(meeting.startsAt))
  } catch {
    return meeting.startsAt
  }
}

export function formatMeetingWhen(meeting: Meeting): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: meeting.timezone || 'UTC',
    }).format(new Date(meeting.startsAt))
  } catch {
    return meeting.startsAt
  }
}

export function formatDateHeading(ymd: string, todayYmd: string): string {
  if (ymd === todayYmd) return 'Today'
  if (ymd === addDaysYmd(todayYmd, 1)) return 'Tomorrow'
  const [y, m, d] = ymd.split('-').map(Number)
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date(y!, m! - 1, d!))
}

export function attendeeSummary(meeting: Meeting): string {
  const byType = new Map(
    meeting.fieldValues.map((f) => [f.type, f.value.trim()] as const),
  )
  const name = [byType.get('firstName'), byType.get('lastName')]
    .filter(Boolean)
    .join(' ')
  if (name) return name
  const email = byType.get('email')
  if (email) return email
  const rest = meeting.fieldValues.map((f) => f.value.trim()).filter(Boolean)
  return rest.join(' · ') || 'No attendee info'
}

export function isUpcoming(meeting: Meeting, now = Date.now()): boolean {
  return (
    meeting.status === 'scheduled' &&
    new Date(meeting.startsAt).getTime() >= now - 60_000
  )
}

export function groupMeetingsByDate(
  meetings: Meeting[],
): Array<{ ymd: string; meetings: Meeting[] }> {
  const groups = new Map<string, Meeting[]>()
  const sorted = [...meetings].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  )
  for (const meeting of sorted) {
    const ymd = ymdInMeetingTz(meeting.startsAt, meeting.timezone)
    const list = groups.get(ymd) ?? []
    list.push(meeting)
    groups.set(ymd, list)
  }
  return [...groups.entries()].map(([ymd, items]) => ({
    ymd,
    meetings: items,
  }))
}

/** Inclusive YYYY-MM-DD window covering the month plus outside-day padding. */
export function calendarMonthRange(month: Date): { from: string; to: string } {
  const start = new Date(month.getFullYear(), month.getMonth(), 1)
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0)
  start.setDate(start.getDate() - 6)
  end.setDate(end.getDate() + 6)
  return { from: ymdFromDate(start), to: ymdFromDate(end) }
}
