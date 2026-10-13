import type { Meeting } from '#/lib/meetingTool'
import { buttonOutlineClassName, hintClassName } from '#/lib/ui-classes'
import { cn } from '#/lib/utils'
import {
  attendeeSummary,
  formatMeetingTime,
  formatMeetingWhen,
} from '#/components/meetingTool/meetingViewUtils'

type MeetingRowProps = {
  meeting: Meeting
  onCancel: (meetingId: string) => void
  cancelling?: boolean
  showDate?: boolean
}

export default function MeetingRow({
  meeting,
  onCancel,
  cancelling = false,
  showDate = false,
}: MeetingRowProps) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="text-sm text-[var(--ink)]">
          <span className="font-medium">
            {showDate ? formatMeetingWhen(meeting) : formatMeetingTime(meeting)}
          </span>
          {meeting.topicName ? ` · ${meeting.topicName}` : ''}
        </p>
        <p className={hintClassName}>{attendeeSummary(meeting)}</p>
        <p className={cn(hintClassName, 'text-[11px]')}>
          {meeting.timezone || 'UTC'} · {meeting.status}
        </p>
      </div>
      {meeting.status === 'scheduled' ? (
        <button
          type="button"
          className={buttonOutlineClassName}
          disabled={cancelling}
          onClick={() => onCancel(meeting.id)}
        >
          {cancelling ? 'Cancelling…' : 'Cancel'}
        </button>
      ) : null}
    </li>
  )
}
