import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Calendar, CalendarRange, List, Plus } from 'lucide-react'
import Modal from '#/components/ui/Modal'
import MeetingByDateView from '#/components/meetingTool/MeetingByDateView'
import MeetingCalendarView from '#/components/meetingTool/MeetingCalendarView'
import MeetingListView from '#/components/meetingTool/MeetingListView'
import MeetingTopicDrawer from '#/components/meetingTool/MeetingTopicDrawer'
import {
  calendarMonthRange,
  formatMeetingWhen,
  isUpcoming,
} from '#/components/meetingTool/meetingViewUtils'
import { usePlan } from '#/context/planContext'
import {
  cancelMeeting,
  createMeetingTopic,
  deleteMeetingTopic,
  listMeetingTopics,
  listMeetings,
  type Meeting,
  type MeetingTopic,
} from '#/lib/meetingTool'
import {
  buttonClassName,
  buttonOutlineClassName,
  hintClassName,
  inputClassName,
  projectSectionClassName,
} from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

type MeetingToolSectionProps = {
  apiKeyId: string
}

type UpcomingView = 'list' | 'byDate' | 'calendar'

const UPCOMING_VIEWS: Array<{
  id: UpcomingView
  label: string
  icon: typeof List
}> = [
  { id: 'list', label: 'List', icon: List },
  { id: 'byDate', label: 'By Date', icon: CalendarRange },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
]

function mergeMeetings(prev: Meeting[], next: Meeting[]): Meeting[] {
  const byId = new Map(prev.map((m) => [m.id, m] as const))
  for (const meeting of next) byId.set(meeting.id, meeting)
  return [...byId.values()].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  )
}

export default function MeetingToolSection({
  apiKeyId,
}: MeetingToolSectionProps) {
  const { plan } = usePlan()
  const planAllows = plan?.meetingTool === true
  const maxMeetingTopics = plan?.maxMeetingTopics ?? 0

  const [topics, setTopics] = useState<MeetingTopic[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<MeetingTopic | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [createName, setCreateName] = useState('')
  const [creating, setCreating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<MeetingTopic | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [upcomingView, setUpcomingView] = useState<UpcomingView>('list')
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const [monthLoading, setMonthLoading] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const atLimit = topics.length >= maxMeetingTopics

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [topicsRes, meetingsRes] = await Promise.all([
        listMeetingTopics(apiKeyId),
        listMeetings(apiKeyId),
      ])
      if (!topicsRes.success || !topicsRes.data) {
        toast.error(topicsRes.message || 'Failed to load meeting topics')
        return
      }
      setTopics(topicsRes.data.topics)
      if (meetingsRes.success && meetingsRes.data) {
        setMeetings(meetingsRes.data)
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to load meeting tool',
      )
    } finally {
      setLoading(false)
    }
  }, [apiKeyId])

  useEffect(() => {
    void load()
  }, [load])

  const upcoming = useMemo(
    () =>
      meetings
        .filter(isUpcoming)
        .sort(
          (a, b) =>
            new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
        ),
    [meetings],
  )

  const loadMonth = useCallback(
    async (month: Date) => {
      const range = calendarMonthRange(month)
      setMonthLoading(true)
      try {
        const response = await listMeetings(apiKeyId, range)
        if (!response.success || !response.data) {
          toast.error(response.message || 'Failed to load meetings')
          return
        }
        setMeetings((prev) => mergeMeetings(prev, response.data!))
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to load meetings',
        )
      } finally {
        setMonthLoading(false)
      }
    },
    [apiKeyId],
  )

  useEffect(() => {
    if (upcomingView !== 'calendar') return
    void loadMonth(calendarMonth)
  }, [upcomingView, calendarMonth, loadMonth])

  async function onCancelMeeting(meetingId: string) {
    setCancellingId(meetingId)
    try {
      const response = await cancelMeeting(apiKeyId, meetingId)
      if (!response.success || !response.data) {
        toast.error(response.message || 'Failed to cancel')
        return
      }
      toast.success('Cancelled')
      setMeetings((prev) =>
        prev
          .map((m) => (m.id === meetingId ? response.data! : m))
          .filter((m) => m.status !== 'cancelled'),
      )
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to cancel',
      )
    } finally {
      setCancellingId(null)
    }
  }

  async function onCreate() {
    const name = createName.trim()
    if (!name) {
      toast.error('Name is required')
      return
    }
    setCreating(true)
    try {
      const response = await createMeetingTopic(apiKeyId, name)
      if (!response.success || !response.data) {
        toast.error(response.message || 'Failed to create topic')
        return
      }
      toast.success('Meeting topic created')
      setShowCreate(false)
      setCreateName('')
      setTopics((prev) =>
        [...prev, response.data!].sort((a, b) => a.name.localeCompare(b.name)),
      )
      setSelected(response.data)
      setDrawerOpen(true)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create topic',
      )
    } finally {
      setCreating(false)
    }
  }

  async function onConfirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const response = await deleteMeetingTopic(apiKeyId, deleteTarget.id)
      if (!response.success) {
        toast.error(response.message || 'Failed to delete')
        return
      }
      toast.success('Deleted')
      setTopics((prev) => prev.filter((t) => t.id !== deleteTarget.id))
      setMeetings((prev) =>
        prev.filter((m) => m.meetingTopicId !== deleteTarget.id),
      )
      if (selected?.id === deleteTarget.id) {
        setDrawerOpen(false)
        setSelected(null)
      }
      setDeleteTarget(null)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete topic',
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className={cn(projectSectionClassName, 'space-y-8')}>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="size-5 text-[var(--muted)]" />
            <h1 className="text-xl font-semibold text-[var(--ink)]">
              Meeting topics
            </h1>
          </div>
          <p className={cn(hintClassName, 'mt-1 max-w-xl')}>
            Each topic has its own form, availability, and conflict settings.
            Enable a topic to reference it from guidance.
          </p>
        </div>
        <button
          type="button"
          className={cn(
            buttonClassName,
            'inline-flex h-8 items-center gap-1.5 px-2.5 py-0 text-xs',
          )}
          disabled={!planAllows || atLimit || loading}
          onClick={() => setShowCreate(true)}
        >
          <Plus className="size-3.5" aria-hidden />
          New topic
        </button>
      </header>

      {!planAllows ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Your current plan does not include the Meeting Tool.
        </p>
      ) : atLimit ? (
        <p className={hintClassName}>
          Plan limit reached ({maxMeetingTopics} meeting topics).
        </p>
      ) : (
        <p className={hintClassName}>
          {topics.length} / {maxMeetingTopics} used.
        </p>
      )}

      {loading ? (
        <p className={hintClassName}>Loading…</p>
      ) : topics.length === 0 ? (
        <p className={hintClassName}>
          No meeting topics yet.
          {planAllows && maxMeetingTopics > 0
            ? ' Create one to get started.'
            : ''}
        </p>
      ) : (
        <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {topics.map((topic) => (
            <li key={topic.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-1 py-4 text-left transition hover:bg-[var(--surface)]"
                onClick={() => {
                  setSelected(topic)
                  setDrawerOpen(true)
                }}
              >
                <div>
                  <p className="text-sm font-medium text-[var(--ink)]">
                    {topic.name}
                  </p>
                  <p className={hintClassName}>{topic.toolName}</p>
                </div>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium',
                    topic.enabled
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'bg-[var(--surface)] text-[var(--muted)]',
                  )}
                >
                  {topic.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-[var(--ink)]">
            Upcoming meetings
          </h2>
          <div
            className="inline-flex flex-wrap gap-0.5"
            role="tablist"
            aria-label="Upcoming meetings view"
          >
            {UPCOMING_VIEWS.map((item) => {
              const Icon = item.icon
              const selected = upcomingView === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-1 text-xs font-medium transition',
                    selected
                      ? 'text-[var(--ink)]'
                      : 'text-[var(--muted)] hover:text-[var(--ink)]',
                  )}
                  onClick={() => setUpcomingView(item.id)}
                >
                  <Icon className="size-3.5" />
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>
        {upcomingView === 'list' ? (
          <MeetingListView
            meetings={upcoming}
            onCancel={(id) => void onCancelMeeting(id)}
            cancellingId={cancellingId}
          />
        ) : upcomingView === 'byDate' ? (
          <MeetingByDateView
            meetings={upcoming}
            onCancel={(id) => void onCancelMeeting(id)}
            cancellingId={cancellingId}
          />
        ) : (
          <MeetingCalendarView
            meetings={meetings}
            month={calendarMonth}
            onMonthChange={setCalendarMonth}
            monthLoading={monthLoading}
            onCancel={(id) => void onCancelMeeting(id)}
            cancellingId={cancellingId}
          />
        )}
      </section>

      <MeetingTopicDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        apiKeyId={apiKeyId}
        topic={selected}
        planAllows={planAllows}
        onSaved={(topic) => {
          setSelected(topic)
          setTopics((prev) =>
            prev
              .map((t) => (t.id === topic.id ? topic : t))
              .sort((a, b) => a.name.localeCompare(b.name)),
          )
        }}
        onDelete={() => {
          if (selected) setDeleteTarget(selected)
        }}
      />

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New meeting topic"
      >
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-[var(--muted)]">Name</span>
          <input
            className={inputClassName}
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            placeholder="Product demo"
            autoFocus
          />
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className={buttonOutlineClassName}
            onClick={() => setShowCreate(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className={buttonClassName}
            disabled={creating}
            onClick={() => void onCreate()}
          >
            {creating ? 'Creating…' : 'Create'}
          </button>
        </div>
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete meeting topic"
      >
        <p className="text-sm text-[var(--ink)]">
          Delete “{deleteTarget?.name}”? All meetings for this topic will be
          permanently deleted.
        </p>
        {deleteTarget ? (
          <div className="mt-3 max-h-48 overflow-y-auto border border-[var(--line)] px-3 py-2">
            {(() => {
              const childMeetings = meetings.filter(
                (m) => m.meetingTopicId === deleteTarget.id,
              )
              if (childMeetings.length === 0) {
                return (
                  <p className="text-xs text-[var(--muted)]">
                    No booked meetings will be removed.
                  </p>
                )
              }
              const shown = childMeetings.slice(0, 10)
              const remaining = childMeetings.length - shown.length
              return (
                <ul className="space-y-1.5">
                  {shown.map((meeting) => (
                    <li
                      key={meeting.id}
                      className="text-xs text-[var(--ink)]"
                    >
                      {formatMeetingWhen(meeting)}
                      {meeting.status !== 'scheduled'
                        ? ` · ${meeting.status}`
                        : ''}
                    </li>
                  ))}
                  {remaining > 0 ? (
                    <li className="text-xs text-[var(--muted)]">
                      and {remaining} more
                    </li>
                  ) : null}
                </ul>
              )
            })()}
          </div>
        ) : null}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className={buttonOutlineClassName}
            onClick={() => setDeleteTarget(null)}
          >
            Cancel
          </button>
          <button
            type="button"
            className={buttonClassName}
            disabled={deleting}
            onClick={() => void onConfirmDelete()}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
