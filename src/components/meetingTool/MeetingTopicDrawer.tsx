import { useEffect, useMemo, useState, type ReactNode } from 'react'
import toast from 'react-hot-toast'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { Calendar } from '#/components/ui/calendar'
import DrawerDetails from '#/components/ui/DrawerDetails'
import SideDrawer from '#/components/ui/SideDrawer'
import {
  DAY_LABELS,
  FIELD_TYPE_LABELS,
  MEETING_FIELD_TYPES,
  ensureFullWeeklySchedule,
  newFieldId,
  suggestNextBreak,
  updateMeetingTopic,
  validateWeeklySchedule,
  type MeetingAvailabilityWindow,
  type MeetingFieldConfig,
  type MeetingFieldType,
  type MeetingTimeRange,
  type MeetingTopic,
  type WeeklyDaySchedule,
} from '#/lib/meetingTool'
import {
  buttonOutlineClassName,
  inputClassNameCompact,
} from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

type MeetingTopicDrawerProps = {
  open: boolean
  onClose: () => void
  apiKeyId: string
  topic: MeetingTopic | null
  onSaved: (topic: MeetingTopic) => void
  onDelete: () => void
  planAllows: boolean
}

const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Jakarta',
  'Australia/Sydney',
]

const MEETING_DRAWER_CONTENT = 'max-w-3xl px-5 py-6 sm:px-8 sm:py-8'

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function ymdFromDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

function dateFromYmd(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y!, m! - 1, d!)
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
      {children}
    </h3>
  )
}

function StatusPill({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium',
        enabled
          ? 'bg-emerald-50 text-emerald-800'
          : 'bg-[var(--surface)] text-[var(--muted)]',
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          enabled ? 'bg-emerald-500' : 'bg-[var(--muted)]',
        )}
      />
      {enabled ? 'Enabled' : 'Disabled'}
    </span>
  )
}

export default function MeetingTopicDrawer({
  open,
  onClose,
  apiKeyId,
  topic,
  onSaved,
  onDelete,
  planAllows,
}: MeetingTopicDrawerProps) {
  const [draft, setDraft] = useState<MeetingTopic | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && topic) {
      setDraft({
        ...topic,
        fields: [...topic.fields].sort((a, b) => a.order - b.order),
        weeklySchedule: ensureFullWeeklySchedule(topic.weeklySchedule ?? []),
        blackoutDates: [...topic.blackoutDates],
      })
    }
  }, [open, topic])

  const fields = useMemo(
    () => [...(draft?.fields ?? [])].sort((a, b) => a.order - b.order),
    [draft?.fields],
  )

  const schedule = useMemo(
    () => ensureFullWeeklySchedule(draft?.weeklySchedule ?? []),
    [draft?.weeklySchedule],
  )

  const blackoutDatesSelected = useMemo(
    () => (draft?.blackoutDates ?? []).map(dateFromYmd),
    [draft?.blackoutDates],
  )

  if (!draft) {
    return (
      <SideDrawer
        open={open}
        onClose={onClose}
        label="Meeting topic"
        size="lg"
        contentClassName={MEETING_DRAWER_CONTENT}
      >
        <p className="text-xs text-[var(--muted)]">Select a meeting topic.</p>
      </SideDrawer>
    )
  }

  async function save(
    patch: Parameters<typeof updateMeetingTopic>[2],
    options?: { quiet?: boolean },
  ) {
    if (!draft) return
    if (patch.weeklySchedule) {
      const error = validateWeeklySchedule(patch.weeklySchedule)
      if (error) {
        toast.error(error)
        return
      }
    }
    setSaving(true)
    try {
      const response = await updateMeetingTopic(apiKeyId, draft.id, patch)
      if (!response.success || !response.data) {
        toast.error(response.message || 'Failed to save')
        return
      }
      setDraft({
        ...response.data,
        weeklySchedule: ensureFullWeeklySchedule(
          response.data.weeklySchedule ?? [],
        ),
      })
      onSaved(response.data)
      if (!options?.quiet) toast.success('Saved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  function saveSchedule(next: WeeklyDaySchedule[]) {
    void save({ weeklySchedule: next })
  }

  function updateDay(dayOfWeek: number, patch: Partial<WeeklyDaySchedule>) {
    const next = schedule.map((day) =>
      day.dayOfWeek === dayOfWeek ? { ...day, ...patch } : day,
    )
    saveSchedule(next)
  }

  function updateWindow(
    dayOfWeek: number,
    windowIndex: number,
    patch: Partial<MeetingAvailabilityWindow>,
  ) {
    const next = schedule.map((day) => {
      if (day.dayOfWeek !== dayOfWeek) return day
      const windows = day.windows.map((w, i) =>
        i === windowIndex ? { ...w, ...patch } : w,
      )
      return { ...day, windows }
    })
    saveSchedule(next)
  }

  function updateBreak(
    dayOfWeek: number,
    breakIndex: number,
    patch: Partial<MeetingTimeRange>,
  ) {
    const next = schedule.map((day) => {
      if (day.dayOfWeek !== dayOfWeek) return day
      const breaks = day.breaks.map((b, i) =>
        i === breakIndex ? { ...b, ...patch } : b,
      )
      return { ...day, breaks }
    })
    saveSchedule(next)
  }

  function addBreak(day: WeeklyDaySchedule) {
    const suggested = suggestNextBreak(day.windows, day.breaks)
    if (!suggested) {
      toast.error('No free gap for another break')
      return
    }
    updateDay(day.dayOfWeek, {
      breaks: [...day.breaks, suggested],
    })
  }

  function moveField(index: number, direction: -1 | 1) {
    const next = [...fields]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    const tmp = next[index]!
    next[index] = next[target]!
    next[target] = tmp
    void save({ fields: next.map((f, i) => ({ ...f, order: i })) })
  }

  function updateFieldLocal(index: number, patch: Partial<MeetingFieldConfig>) {
    const next = fields.map((f, i) => (i === index ? { ...f, ...patch } : f))
    void save({ fields: next.map((f, i) => ({ ...f, order: i })) })
  }

  function addField(type: MeetingFieldType) {
    const field: MeetingFieldConfig = {
      id: newFieldId(),
      type,
      label: FIELD_TYPE_LABELS[type],
      required: type === 'email',
      order: fields.length,
    }
    void save({ fields: [...fields, field] })
  }

  function removeField(index: number) {
    const next = fields.filter((_, i) => i !== index)
    void save({ fields: next.map((f, i) => ({ ...f, order: i })) })
  }

  function setBlackoutDates(nextDates: Date[] | undefined) {
    const next = [...new Set((nextDates ?? []).map(ymdFromDate))].sort()
    void save({ blackoutDates: next }, { quiet: true })
  }

  const iconBtn = cn(buttonOutlineClassName, 'px-2 py-1.5 text-xs')
  const rowInput = cn(inputClassNameCompact, 'w-full text-xs')

  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      label={draft.name}
      size="lg"
      contentClassName={MEETING_DRAWER_CONTENT}
      statusLabel={<StatusPill enabled={draft.enabled} />}
      details={
        <DrawerDetails
          createdAt={draft.createdAt}
          updatedAt={draft.updatedAt}
          statusRows={[
            { label: 'Tool', value: draft.toolName },
            {
              label: 'Status',
              value: <StatusPill enabled={draft.enabled} />,
            },
          ]}
          actions={
            <>
              <button
                type="button"
                className={cn(
                  buttonOutlineClassName,
                  'w-full text-xs',
                  !draft.enabled && 'bg-[var(--surface)] text-[var(--ink)]',
                )}
                disabled={saving}
                onClick={() => {
                  if (!draft.enabled && !planAllows) {
                    toast.error('Your plan does not include the Meeting Tool')
                    return
                  }
                  void save({ enabled: !draft.enabled })
                }}
              >
                {draft.enabled ? 'Disable' : 'Enable'}
              </button>
              <button
                type="button"
                className={cn(
                  buttonOutlineClassName,
                  'w-full text-xs text-red-600 hover:bg-red-50 hover:text-red-700',
                )}
                onClick={onDelete}
              >
                <Trash2 className="mr-1.5 inline size-3.5" aria-hidden />
                Delete topic
              </button>
            </>
          }
        >
          <label className="block space-y-1">
            <span className="text-xs text-[var(--muted)]">Name</span>
            <input
              className={rowInput}
              defaultValue={draft.name}
              key={`name-${draft.id}-${draft.name}`}
              disabled={saving}
              onBlur={(e) => {
                const name = e.target.value.trim()
                if (name && name !== draft.name) void save({ name })
              }}
            />
          </label>
          <label className="flex items-center justify-between gap-3 border-y border-[var(--line)] py-2">
            <span className="text-sm text-[var(--ink)]">Allow overlaps</span>
            <input
              type="checkbox"
              className="size-3.5"
              checked={draft.allowConflict}
              disabled={saving}
              onChange={(e) => void save({ allowConflict: e.target.checked })}
            />
          </label>
        </DrawerDetails>
      }
    >
      <div className="space-y-0">
        <section className="space-y-3 pb-5">
          <SectionTitle>Schedule</SectionTitle>
          <div className="grid grid-cols-3 gap-2">
            <label className="min-w-0 space-y-1">
              <span className="text-xs text-[var(--muted)]">Timezone</span>
              <select
                className={rowInput}
                value={draft.timezone}
                disabled={saving}
                onChange={(e) => void save({ timezone: e.target.value })}
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
                {!COMMON_TIMEZONES.includes(draft.timezone) ? (
                  <option value={draft.timezone}>{draft.timezone}</option>
                ) : null}
              </select>
            </label>
            <label className="min-w-0 space-y-1">
              <span className="text-xs text-[var(--muted)]">Slot (min)</span>
              <input
                type="number"
                min={5}
                max={480}
                className={rowInput}
                defaultValue={draft.slotDurationMinutes}
                disabled={saving}
                onBlur={(e) => {
                  const value = Number(e.target.value)
                  if (
                    Number.isFinite(value) &&
                    value !== draft.slotDurationMinutes
                  ) {
                    void save({ slotDurationMinutes: value })
                  }
                }}
              />
            </label>
            <label className="min-w-0 space-y-1">
              <span className="text-xs text-[var(--muted)]">Horizon</span>
              <input
                type="number"
                min={1}
                max={365}
                className={rowInput}
                defaultValue={draft.bookingHorizonDays}
                disabled={saving}
                onBlur={(e) => {
                  const value = Number(e.target.value)
                  if (
                    Number.isFinite(value) &&
                    value !== draft.bookingHorizonDays
                  ) {
                    void save({ bookingHorizonDays: value })
                  }
                }}
              />
            </label>
          </div>
        </section>

        {/* Fields */}
        <section className="space-y-3 border-t border-[var(--line)] py-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SectionTitle>Fields</SectionTitle>
            <div className="flex flex-wrap gap-1">
              {MEETING_FIELD_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={cn(iconBtn, 'flex items-center gap-1 border border-[var(--line)] px-1.5 py-1 rounded-sm')}
                  disabled={saving}
                  onClick={() => addField(type)}
                >
                  <Plus className="size-3" />
                  {FIELD_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>
          <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {fields.map((field, index) => (
              <li
                key={field.id}
                className="flex flex-wrap items-center gap-2 py-2"
              >
                <span className="w-16 shrink-0 text-xs text-[var(--muted)]">
                  {FIELD_TYPE_LABELS[field.type]}
                </span>
                <input
                  className={cn(rowInput, 'min-w-[7rem] flex-1')}
                  defaultValue={field.label}
                  disabled={saving}
                  onBlur={(e) => {
                    const label = e.target.value.trim()
                    if (label && label !== field.label) {
                      updateFieldLocal(index, { label })
                    }
                  }}
                />
                <label className="flex items-center gap-1 text-xs text-[var(--muted)]">
                  <input
                    type="checkbox"
                    className="size-3.5"
                    checked={field.required}
                    disabled={saving}
                    onChange={(e) =>
                      updateFieldLocal(index, { required: e.target.checked })
                    }
                  />
                  Req
                </label>
                {field.type === 'email' ? (
                  <label className="flex items-center gap-1 text-xs text-[var(--muted)]">
                    <input
                      type="checkbox"
                      className="size-3.5"
                      checked={Boolean(field.sendConfirmation)}
                      disabled={saving}
                      onChange={(e) =>
                        updateFieldLocal(index, {
                          sendConfirmation: e.target.checked,
                        })
                      }
                    />
                    Send confirmation
                  </label>
                ) : null}
                <button
                  type="button"
                  className={iconBtn}
                  disabled={saving || index === 0}
                  onClick={() => moveField(index, -1)}
                >
                  <ArrowUp className="size-3" />
                </button>
                <button
                  type="button"
                  className={iconBtn}
                  disabled={saving || index === fields.length - 1}
                  onClick={() => moveField(index, 1)}
                >
                  <ArrowDown className="size-3" />
                </button>
                <button
                  type="button"
                  className={iconBtn}
                  disabled={saving}
                  onClick={() => removeField(index)}
                >
                  <Trash2 className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Weekly   one card per day */}
        <section className="space-y-3 border-t border-[var(--line)] py-5">
          <SectionTitle>Weekly hours</SectionTitle>
          <ul className="space-y-2">
            {schedule.map((day) => (
              <li
                key={day.dayOfWeek}
                className="rounded-md border border-[var(--line)] px-3 py-2.5 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-[var(--ink)]">
                    {DAY_LABELS[day.dayOfWeek]}
                  </span>
                  <label className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                    On
                    <input
                      type="checkbox"
                      className="size-3.5"
                      checked={day.enabled}
                      disabled={saving}
                      onChange={(e) => {
                        const enabled = e.target.checked
                        updateDay(day.dayOfWeek, {
                          enabled,
                          windows:
                            enabled && day.windows.length === 0
                              ? [
                                  {
                                    startTime: '09:00',
                                    endTime: '17:00',
                                    capacity: 1,
                                  },
                                ]
                              : day.windows,
                        })
                      }}
                    />
                  </label>
                </div>

                {day.enabled ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--muted)]">
                        Windows
                      </span>
                      <button
                        type="button"
                        className={iconBtn}
                        disabled={saving}
                        onClick={() =>
                          updateDay(day.dayOfWeek, {
                            windows: [
                              ...day.windows,
                              {
                                startTime: '09:00',
                                endTime: '12:00',
                                capacity: 1,
                              },
                            ],
                          })
                        }
                      >
                        <Plus className="size-3" />
                      </button>
                    </div>
                    {day.windows.map((window, wi) => (
                      <div
                        key={`${day.dayOfWeek}-w-${wi}`}
                        className="grid grid-cols-[1fr_1fr_4.5rem_auto] items-center gap-1.5"
                      >
                        <input
                          type="time"
                          className={rowInput}
                          value={window.startTime}
                          disabled={saving}
                          aria-label="Window start"
                          onChange={(e) =>
                            updateWindow(day.dayOfWeek, wi, {
                              startTime: e.target.value,
                            })
                          }
                        />
                        <input
                          type="time"
                          className={rowInput}
                          value={window.endTime}
                          disabled={saving}
                          aria-label="Window end"
                          onChange={(e) =>
                            updateWindow(day.dayOfWeek, wi, {
                              endTime: e.target.value,
                            })
                          }
                        />
                        <input
                          type="number"
                          min={1}
                          max={500}
                          className={rowInput}
                          defaultValue={window.capacity}
                          key={`${day.dayOfWeek}-cap-${wi}-${window.capacity}`}
                          disabled={saving}
                          aria-label="Capacity"
                          title="Capacity"
                          onBlur={(e) => {
                            const capacity = Number(e.target.value)
                            if (
                              !Number.isInteger(capacity) ||
                              capacity === window.capacity
                            ) {
                              return
                            }
                            updateWindow(day.dayOfWeek, wi, { capacity })
                          }}
                        />
                        <button
                          type="button"
                          className={iconBtn}
                          disabled={saving}
                          onClick={() =>
                            updateDay(day.dayOfWeek, {
                              windows: day.windows.filter((_, i) => i !== wi),
                            })
                          }
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    ))}

                    <div className="flex items-center justify-between border-t border-[var(--line)] pt-2">
                      <span className="text-xs text-[var(--muted)]">Breaks</span>
                      <button
                        type="button"
                        className={iconBtn}
                        disabled={saving || day.windows.length === 0}
                        onClick={() => addBreak(day)}
                      >
                        <Plus className="size-3" />
                      </button>
                    </div>
                    {day.breaks.map((brk, bi) => (
                      <div
                        key={`${day.dayOfWeek}-b-${bi}`}
                        className="grid grid-cols-[1fr_1fr_auto] items-center gap-1.5"
                      >
                        <input
                          type="time"
                          className={rowInput}
                          value={brk.startTime}
                          disabled={saving}
                          aria-label="Break start"
                          onChange={(e) =>
                            updateBreak(day.dayOfWeek, bi, {
                              startTime: e.target.value,
                            })
                          }
                        />
                        <input
                          type="time"
                          className={rowInput}
                          value={brk.endTime}
                          disabled={saving}
                          aria-label="Break end"
                          onChange={(e) =>
                            updateBreak(day.dayOfWeek, bi, {
                              endTime: e.target.value,
                            })
                          }
                        />
                        <button
                          type="button"
                          className={iconBtn}
                          disabled={saving}
                          onClick={() =>
                            updateDay(day.dayOfWeek, {
                              breaks: day.breaks.filter((_, i) => i !== bi),
                            })
                          }
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        {/* Blackouts   inline calendar (popover was under drawer z-index) */}
        <section className="space-y-3 border-t border-[var(--line)] pt-5">
          <SectionTitle>Blackout dates</SectionTitle>
          <div className="w-fit rounded-md border border-[var(--line)] bg-white">
            <Calendar
              mode="multiple"
              selected={blackoutDatesSelected}
              onSelect={(dates) => setBlackoutDates(dates)}
              disabled={saving}
            />
          </div>
          {draft.blackoutDates.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {draft.blackoutDates.map((date) => (
                <li
                  key={date}
                  className="inline-flex items-center gap-1.5 border border-[var(--line)] px-2 py-0.5 text-xs text-[var(--ink)]"
                >
                  {date}
                  <button
                    type="button"
                    disabled={saving}
                    aria-label={`Remove ${date}`}
                    className="text-[var(--muted)] hover:text-[var(--ink)]"
                    onClick={() =>
                      void save(
                        {
                          blackoutDates: draft.blackoutDates.filter(
                            (d) => d !== date,
                          ),
                        },
                        { quiet: true },
                      )
                    }
                  >
                    <Trash2 className="size-3" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[var(--muted)]">None selected</p>
          )}
        </section>
      </div>
    </SideDrawer>
  )
}
