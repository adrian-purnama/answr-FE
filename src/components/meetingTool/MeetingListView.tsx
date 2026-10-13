import type { Meeting } from '#/lib/meetingTool'
import { hintClassName } from '#/lib/ui-classes'
import MeetingRow from '#/components/meetingTool/MeetingRow'

type MeetingListViewProps = {
  meetings: Meeting[]
  onCancel: (meetingId: string) => void
  cancellingId?: string | null
}

export default function MeetingListView({
  meetings,
  onCancel,
  cancellingId = null,
}: MeetingListViewProps) {
  if (meetings.length === 0) {
    return <p className={hintClassName}>No upcoming meetings.</p>
  }

  return (
    <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
      {meetings.map((meeting) => (
        <MeetingRow
          key={meeting.id}
          meeting={meeting}
          showDate
          onCancel={onCancel}
          cancelling={cancellingId === meeting.id}
        />
      ))}
    </ul>
  )
}
