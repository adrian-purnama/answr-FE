import { apiFetch } from '#/lib/api'

export const BOOK_MEETING_TOOL_PREFIX = 'book_meeting_'

export const MEETING_FIELD_TYPES = [
  'email',
  'firstName',
  'lastName',
  'company',
  'phone',
  'text',
] as const

export type MeetingFieldType = (typeof MEETING_FIELD_TYPES)[number]

export type MeetingFieldConfig = {
  id: string
  type: MeetingFieldType
  label: string
  required: boolean
  order: number
  sendConfirmation?: boolean
}

export type MeetingTimeRange = {
  startTime: string
  endTime: string
}

export type MeetingAvailabilityWindow = MeetingTimeRange & {
  capacity: number
}

export type WeeklyDaySchedule = {
  dayOfWeek: number
  enabled: boolean
  windows: MeetingAvailabilityWindow[]
  breaks: MeetingTimeRange[]
}

export type MeetingTopic = {
  id: string
  apiKeyId: string
  name: string
  slug: string
  toolName: string
  enabled: boolean
  allowConflict: boolean
  timezone: string
  slotDurationMinutes: number
  bookingHorizonDays: number
  fields: MeetingFieldConfig[]
  weeklySchedule: WeeklyDaySchedule[]
  blackoutDates: string[]
  createdAt: string
  updatedAt: string
}

export type MeetingTopicList = {
  topics: MeetingTopic[]
  planAllows: boolean
  maxMeetingTopics: number
}

export type UpdateMeetingTopic = Partial<{
  name: string
  enabled: boolean
  allowConflict: boolean
  timezone: string
  slotDurationMinutes: number
  bookingHorizonDays: number
  fields: MeetingFieldConfig[]
  weeklySchedule: WeeklyDaySchedule[]
  blackoutDates: string[]
}>

export type MeetingFieldValue = {
  fieldId: string
  type: MeetingFieldType
  label: string
  value: string
}

export type Meeting = {
  id: string
  apiKeyId: string
  meetingTopicId: string
  topicName: string | null
  startsAt: string
  timezone: string
  durationMinutes: number
  fieldValues: MeetingFieldValue[]
  chatSessionId: string | null
  status: 'scheduled' | 'cancelled' | 'completed'
  createdAt: string
  updatedAt: string
}

export type MeetingSlot = {
  startsAt: string
  endsAt: string
  capacity: number
  bookedCount: number
  remainingCapacity: number
}

export type MeetingAvailability = {
  meetingTopicId: string
  timezone: string
  slotDurationMinutes: number
  allowConflict: boolean
  availableSlots: MeetingSlot[]
  unavailableSlots: MeetingSlot[]
}

export type MeetingBookingPayload = {
  action: 'create_meeting'
  meetingTopicId: string
  topicName: string
  timezone: string
  slotDurationMinutes: number
  bookingHorizonDays: number
  allowConflict: boolean
  fields: MeetingFieldConfig[]
  weeklySchedule: WeeklyDaySchedule[]
  blackoutDates: string[]
}

export type BookMeetingSuccess = {
  meetingId: string
  meetingTopicId: string
  startsAt: string
  timezone: string
  status: string
  durationMinutes: number
}

export type BookMeetingConflict = {
  code: 'SLOT_UNAVAILABLE'
  availability: MeetingAvailability
}

export type BuiltinReferenceTool = {
  id: string
  name: string
  title: string
  description: string
}

export function builtinMeetingTopicTool(
  topic: Pick<MeetingTopic, 'id' | 'name' | 'toolName'>,
): BuiltinReferenceTool {
  return {
    id: `builtin-meeting-${topic.id}`,
    name: topic.toolName,
    title: topic.name,
    description: `Book a meeting for ${topic.name}`,
  }
}

export const DAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

export const FIELD_TYPE_LABELS: Record<MeetingFieldType, string> = {
  email: 'Email',
  firstName: 'First name',
  lastName: 'Last name',
  company: 'Company',
  phone: 'Phone',
  text: 'Text',
}

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/

function timeToMinutes(value: string): number {
  const [h, m] = value.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

function minutesToTime(total: number): string {
  const clamped = Math.max(0, Math.min(24 * 60, total))
  const h = Math.floor(clamped / 60)
  const m = clamped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Subtract break intervals from a window → contiguous open segments. */
export function subtractBreaksFromWindow(
  window: MeetingTimeRange,
  breaks: MeetingTimeRange[],
): MeetingTimeRange[] {
  let segments: MeetingTimeRange[] = [
    { startTime: window.startTime, endTime: window.endTime },
  ]
  const sortedBreaks = [...breaks].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
  )

  for (const brk of sortedBreaks) {
    const next: MeetingTimeRange[] = []
    const bStart = timeToMinutes(brk.startTime)
    const bEnd = timeToMinutes(brk.endTime)
    for (const seg of segments) {
      const sStart = timeToMinutes(seg.startTime)
      const sEnd = timeToMinutes(seg.endTime)
      if (bEnd <= sStart || bStart >= sEnd) {
        next.push(seg)
        continue
      }
      if (bStart > sStart) {
        next.push({ startTime: seg.startTime, endTime: brk.startTime })
      }
      if (bEnd < sEnd) {
        next.push({ startTime: brk.endTime, endTime: seg.endTime })
      }
    }
    segments = next.filter(
      (s) => timeToMinutes(s.startTime) < timeToMinutes(s.endTime),
    )
  }
  return segments
}

/**
 * Next non-overlapping break inside day windows.
 * Prefers a 60-minute block; falls back to a shorter gap (≥15 min).
 */
export function suggestNextBreak(
  windows: MeetingAvailabilityWindow[],
  existingBreaks: MeetingTimeRange[],
): MeetingTimeRange | null {
  const preferredMinutes = 60
  const minMinutes = 15
  const free: MeetingTimeRange[] = []
  for (const window of windows) {
    free.push(...subtractBreaksFromWindow(window, existingBreaks))
  }
  free.sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
  )

  for (const seg of free) {
    const start = timeToMinutes(seg.startTime)
    const end = timeToMinutes(seg.endTime)
    const len = end - start
    if (len >= preferredMinutes) {
      return {
        startTime: minutesToTime(start),
        endTime: minutesToTime(start + preferredMinutes),
      }
    }
  }
  for (const seg of free) {
    const start = timeToMinutes(seg.startTime)
    const end = timeToMinutes(seg.endTime)
    const len = end - start
    if (len >= minMinutes) {
      return {
        startTime: minutesToTime(start),
        endTime: minutesToTime(end),
      }
    }
  }
  return null
}

function rangesOverlap(a: MeetingTimeRange, b: MeetingTimeRange): boolean {
  return (
    timeToMinutes(a.startTime) < timeToMinutes(b.endTime) &&
    timeToMinutes(b.startTime) < timeToMinutes(a.endTime)
  )
}

function isBreakInsideWindows(
  brk: MeetingTimeRange,
  windows: MeetingAvailabilityWindow[],
): boolean {
  const bStart = timeToMinutes(brk.startTime)
  const bEnd = timeToMinutes(brk.endTime)
  const covered = new Set<number>()
  for (const w of windows) {
    const wStart = timeToMinutes(w.startTime)
    const wEnd = timeToMinutes(w.endTime)
    for (let m = wStart; m < wEnd; m++) covered.add(m)
  }
  for (let m = bStart; m < bEnd; m++) {
    if (!covered.has(m)) return false
  }
  return true
}

/** Client-side schedule validation (backend remains source of truth). */
export function validateWeeklySchedule(
  schedule: WeeklyDaySchedule[],
): string | null {
  const seen = new Set<number>()
  for (let di = 0; di < schedule.length; di++) {
    const day = schedule[di]!
    if (
      !Number.isInteger(day.dayOfWeek) ||
      day.dayOfWeek < 0 ||
      day.dayOfWeek > 6
    ) {
      return `Invalid dayOfWeek at index ${di}`
    }
    if (seen.has(day.dayOfWeek)) {
      return 'Each weekday may appear only once'
    }
    seen.add(day.dayOfWeek)

    for (let i = 0; i < day.windows.length; i++) {
      const w = day.windows[i]!
      if (!TIME_RE.test(w.startTime) || !TIME_RE.test(w.endTime)) {
        return `${DAY_LABELS[day.dayOfWeek]} window times must be HH:mm`
      }
      if (w.startTime >= w.endTime) {
        return `${DAY_LABELS[day.dayOfWeek]} window end must be after start`
      }
      if (
        !Number.isInteger(w.capacity) ||
        w.capacity < 1 ||
        w.capacity > 500
      ) {
        return `${DAY_LABELS[day.dayOfWeek]} capacity must be 1–500`
      }
      for (let j = i + 1; j < day.windows.length; j++) {
        if (rangesOverlap(w, day.windows[j]!)) {
          return `${DAY_LABELS[day.dayOfWeek]} windows must not overlap`
        }
      }
    }

    for (let i = 0; i < day.breaks.length; i++) {
      const b = day.breaks[i]!
      if (!TIME_RE.test(b.startTime) || !TIME_RE.test(b.endTime)) {
        return `${DAY_LABELS[day.dayOfWeek]} break times must be HH:mm`
      }
      if (b.startTime >= b.endTime) {
        return `${DAY_LABELS[day.dayOfWeek]} break end must be after start`
      }
      for (let j = i + 1; j < day.breaks.length; j++) {
        if (rangesOverlap(b, day.breaks[j]!)) {
          return `${DAY_LABELS[day.dayOfWeek]} breaks must not overlap`
        }
      }
      if (!isBreakInsideWindows(b, day.windows)) {
        return `${DAY_LABELS[day.dayOfWeek]} breaks must fall within windows`
      }
    }
  }
  return null
}

/** Ensure all 7 weekdays exist for the admin editor. */
export function ensureFullWeeklySchedule(
  schedule: WeeklyDaySchedule[],
): WeeklyDaySchedule[] {
  const byDay = new Map(schedule.map((d) => [d.dayOfWeek, d] as const))
  return DAY_LABELS.map((_, dayOfWeek) => {
    const existing = byDay.get(dayOfWeek)
    if (existing) {
      return {
        dayOfWeek,
        enabled: existing.enabled,
        windows: existing.windows.map((w) => ({ ...w })),
        breaks: existing.breaks.map((b) => ({ ...b })),
      }
    }
    return {
      dayOfWeek,
      enabled: false,
      windows: [],
      breaks: [],
    }
  })
}

export function listMeetingTopics(apiKeyId: string) {
  return apiFetch<MeetingTopicList>(
    `/meeting-tool/topics?apiKeyId=${encodeURIComponent(apiKeyId)}`,
  )
}

export function createMeetingTopic(apiKeyId: string, name: string) {
  return apiFetch<MeetingTopic>(
    `/meeting-tool/topics?apiKeyId=${encodeURIComponent(apiKeyId)}`,
    {
      method: 'POST',
      body: JSON.stringify({ name }),
    },
  )
}

export function getMeetingTopic(apiKeyId: string, topicId: string) {
  return apiFetch<MeetingTopic>(
    `/meeting-tool/topics/${encodeURIComponent(topicId)}?apiKeyId=${encodeURIComponent(apiKeyId)}`,
  )
}

export function updateMeetingTopic(
  apiKeyId: string,
  topicId: string,
  patch: UpdateMeetingTopic,
) {
  return apiFetch<MeetingTopic>(
    `/meeting-tool/topics/${encodeURIComponent(topicId)}?apiKeyId=${encodeURIComponent(apiKeyId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(patch),
    },
  )
}

export function deleteMeetingTopic(apiKeyId: string, topicId: string) {
  return apiFetch<null>(
    `/meeting-tool/topics/${encodeURIComponent(topicId)}?apiKeyId=${encodeURIComponent(apiKeyId)}`,
    { method: 'DELETE' },
  )
}

export function listMeetings(
  apiKeyId: string,
  range?: { from: string; to: string },
) {
  const query = new URLSearchParams({ apiKeyId })
  if (range) {
    query.set('from', range.from)
    query.set('to', range.to)
  }
  return apiFetch<Meeting[]>(`/meeting-tool/meetings?${query.toString()}`)
}

export function cancelMeeting(apiKeyId: string, meetingId: string) {
  return apiFetch<Meeting>(
    `/meeting-tool/meetings/${encodeURIComponent(meetingId)}/cancel?apiKeyId=${encodeURIComponent(apiKeyId)}`,
    { method: 'PATCH' },
  )
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export async function getPublicMeetingAvailability(
  publicKey: string,
  params: {
    sessionId: string
    meetingTopicId: string
    from: string
    to: string
  },
): Promise<{
  success: boolean
  message: string
  data: MeetingAvailability | null
}> {
  const query = new URLSearchParams({
    sessionId: params.sessionId,
    meetingTopicId: params.meetingTopicId,
    from: params.from,
    to: params.to,
  })
  const response = await fetch(
    `${API_BASE_URL}/widgets/public/${encodeURIComponent(publicKey)}/meetings/availability?${query.toString()}`,
  )
  return (await response.json()) as {
    success: boolean
    message: string
    data: MeetingAvailability | null
  }
}

export async function bookPublicMeeting(
  publicKey: string,
  body: {
    sessionId: string
    meetingTopicId: string
    startsAt: string
    fieldValues: Array<{ fieldId: string; value: string }>
  },
): Promise<{
  success: boolean
  message: string
  data: BookMeetingSuccess | BookMeetingConflict | null
}> {
  const response = await fetch(
    `${API_BASE_URL}/widgets/public/${encodeURIComponent(publicKey)}/meetings`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
  return (await response.json()) as {
    success: boolean
    message: string
    data: BookMeetingSuccess | BookMeetingConflict | null
  }
}

export function newFieldId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `field_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}
