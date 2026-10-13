import { useMemo } from 'react'
import type { Meeting } from '#/lib/meetingTool'
import { hintClassName } from '#/lib/ui-classes'
import MeetingRow from '#/components/meetingTool/MeetingRow'
import {
  formatDateHeading,
  groupMeetingsByDate,
  todayYmdLocal,
} from '#/components/meetingTool/meetingViewUtils'

type MeetingByDateViewProps = {
  meetings: Meeting[]
  onCancel: (meetingId: string) => void
  cancellingId?: string | null
}

export default function MeetingByDateView({
  meetings,
  onCancel,
  cancellingId = null,
}: MeetingByDateViewProps) {
  const groups = useMemo(() => groupMeetingsByDate(meetings), [meetings])
  const todayYmd = todayYmdLocal()

  if (groups.length === 0) {
    return <p className={hintClassName}>No upcoming meetings.</p>
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section key={group.ymd}>
          <h3 className="text-xs font-medium text-[var(--muted)]">
            {formatDateHeading(group.ymd, todayYmd)}
          </h3>
          <ul className="mt-1 divide-y divide-[var(--line)] border-b border-[var(--line)]">
            {group.meetings.map((meeting) => (
              <MeetingRow
                key={meeting.id}
                meeting={meeting}
                onCancel={onCancel}
                cancelling={cancellingId === meeting.id}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
