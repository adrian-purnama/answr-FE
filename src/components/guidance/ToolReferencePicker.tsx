import { useEffect, useState } from 'react'
import { FunctionSquare, Headset } from 'lucide-react'
import Modal from '#/components/ui/Modal'
import { defaultToolAlias } from '#/lib/contentReferences'
import {
  builtinCallLiveAgentTool,
  getLiveAgentSettings,
  type BuiltinReferenceTool,
} from '#/lib/liveAgent'
import {
  builtinMeetingTopicTool,
  listMeetingTopics,
} from '#/lib/meetingTool'
import { listEnabledMcpTools, type McpTool } from '#/lib/mcp'
import { buttonOutlineClassName, hintClassName } from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

export type ToolInsertPayload = {
  name: string
  title: string
  as: string
}

type PickerTool = Pick<McpTool, 'id' | 'name' | 'title' | 'description'> & {
  builtin?: boolean
}

type ToolReferencePickerProps = {
  open: boolean
  onClose: () => void
  apiKeyId: string
  onInsertTool: (payload: ToolInsertPayload) => void
}

export default function ToolReferencePicker({
  open,
  onClose,
  apiKeyId,
  onInsertTool,
}: ToolReferencePickerProps) {
  const [tools, setTools] = useState<PickerTool[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const [mcpResponse, settingsResponse, meetingResponse] =
          await Promise.all([
            listEnabledMcpTools(apiKeyId),
            getLiveAgentSettings(apiKeyId),
            listMeetingTopics(apiKeyId),
          ])
        if (!mcpResponse.success || !mcpResponse.data) {
          throw new Error(mcpResponse.message || 'Failed to load tools')
        }
        if (cancelled) return

        const next: PickerTool[] = [...mcpResponse.data]
        if (settingsResponse.success && settingsResponse.data?.enabled) {
          const builtin: BuiltinReferenceTool = builtinCallLiveAgentTool()
          next.unshift({ ...builtin, builtin: true })
        }
        if (
          meetingResponse.success &&
          meetingResponse.data?.planAllows
        ) {
          for (const topic of meetingResponse.data.topics) {
            if (!topic.enabled) continue
            const builtin = builtinMeetingTopicTool(topic)
            next.unshift({ ...builtin, builtin: true })
          }
        }
        setTools(next)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load tools')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, apiKeyId])

  function insertTool(tool: PickerTool) {
    onInsertTool({
      name: tool.name,
      title: tool.title || tool.name,
      as: defaultToolAlias(tool.name),
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="Insert tool" maxWidth="max-w-lg">
      <p className={cn(hintClassName, 'mb-3')}>
        Click a tool to insert it. Then use Variables to add its output fields.
      </p>

      {error ? <p className="mb-2 text-xs text-red-600">{error}</p> : null}
      {loading ? <p className={hintClassName}>Loading tools…</p> : null}

      {!loading && tools.length === 0 ? (
        <p className={hintClassName}>No enabled tools for this project.</p>
      ) : (
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {tools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => insertTool(tool)}
              className={cn(
                buttonOutlineClassName,
                'flex w-full items-start gap-2 text-left',
              )}
            >
              {tool.builtin ? (
                tool.name.startsWith('book_meeting_') ? (
                  <FunctionSquare className="mt-0.5 size-4 shrink-0" />
                ) : (
                  <Headset className="mt-0.5 size-4 shrink-0" />
                )
              ) : (
                <FunctionSquare className="mt-0.5 size-4 shrink-0" />
              )}
              <span className="min-w-0">
                <span className="block text-sm font-medium">
                  {tool.title || tool.name}
                </span>
                <span className={cn(hintClassName, 'block truncate')}>
                  {tool.name}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  )
}
