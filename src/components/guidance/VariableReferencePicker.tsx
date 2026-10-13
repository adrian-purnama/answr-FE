import { useEffect, useMemo, useState } from 'react'
import { Braces } from 'lucide-react'
import Modal from '#/components/ui/Modal'
import { listToolDeclarations } from '#/lib/contentReferences'
import {
  builtinCallLiveAgentTool,
  CALL_LIVE_AGENT_TOOL_NAME,
  getLiveAgentSettings,
} from '#/lib/liveAgent'
import {
  builtinMeetingTopicTool,
  listMeetingTopics,
  type MeetingTopic,
} from '#/lib/meetingTool'
import { listEnabledMcpTools, type McpTool } from '#/lib/mcp'
import { buttonOutlineClassName, hintClassName } from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

export type VariableInsertPayload = {
  ref: string
  variable: string
  from: string
}

type VariableReferencePickerProps = {
  open: boolean
  onClose: () => void
  apiKeyId: string
  /** Current editor plain text    used to discover declared tool aliases. */
  content: string
  onInsertVariable: (payload: VariableInsertPayload) => void
}

/** Collect dotted property paths from a JSON-schema-ish object. */
export function schemaFieldPaths(
  schema: Record<string, unknown>,
  prefix = '',
  depth = 0,
): string[] {
  if (depth > 4) return []
  const paths: string[] = []

  const props = schema.properties
  if (props && typeof props === 'object' && !Array.isArray(props)) {
    for (const [key, value] of Object.entries(
      props as Record<string, unknown>,
    )) {
      const path = prefix ? `${prefix}.${key}` : key
      paths.push(path)
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        paths.push(
          ...schemaFieldPaths(value as Record<string, unknown>, path, depth + 1),
        )
      }
    }
    return paths
  }

  if (!schema.type && Object.keys(schema).length > 0) {
    for (const key of Object.keys(schema)) {
      if (['type', 'required', 'additionalProperties', '$schema'].includes(key)) {
        continue
      }
      const path = prefix ? `${prefix}.${key}` : key
      paths.push(path)
    }
  }

  return paths
}

type VariableOption = {
  ref: string
  variable: string
  from: string
}

export default function VariableReferencePicker({
  open,
  onClose,
  apiKeyId,
  content,
  onInsertVariable,
}: VariableReferencePickerProps) {
  const [tools, setTools] = useState<McpTool[]>([])
  const [liveAgentEnabled, setLiveAgentEnabled] = useState(false)
  const [meetingTopics, setMeetingTopics] = useState<MeetingTopic[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const declarations = useMemo(
    () => listToolDeclarations(content),
    [content],
  )

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
        if (!cancelled) {
          setTools(mcpResponse.data)
          setLiveAgentEnabled(
            Boolean(settingsResponse.success && settingsResponse.data?.enabled),
          )
          setMeetingTopics(
            meetingResponse.success && meetingResponse.data?.planAllows
              ? meetingResponse.data.topics.filter((t) => t.enabled)
              : [],
          )
        }
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

  const options = useMemo(() => {
    const byName = new Map(
      tools.map((tool) => [tool.name.toLowerCase(), tool]),
    )
    if (
      liveAgentEnabled &&
      !byName.has(CALL_LIVE_AGENT_TOOL_NAME.toLowerCase())
    ) {
      const builtin = builtinCallLiveAgentTool()
      byName.set(builtin.name.toLowerCase(), {
        id: builtin.id,
        apiKeyId,
        mcpId: '',
        name: builtin.name,
        title: builtin.title,
        description: builtin.description,
        inputSchema: { type: 'object', properties: {} },
        outputSchema: {
          type: 'object',
          properties: { offered: { type: 'boolean' } },
        },
        annotations: null,
        enabled: true,
        render: 'off',
        uiTemplateId: null,
        fieldMap: {},
        lastSyncedAt: null,
        createdAt: '',
        updatedAt: '',
      })
    }
    for (const topic of meetingTopics) {
      if (byName.has(topic.toolName.toLowerCase())) continue
      const builtin = builtinMeetingTopicTool(topic)
      byName.set(builtin.name.toLowerCase(), {
        id: builtin.id,
        apiKeyId,
        mcpId: '',
        name: builtin.name,
        title: builtin.title,
        description: builtin.description,
        inputSchema: { type: 'object', properties: {} },
        outputSchema: {
          type: 'object',
          properties: { presented: { type: 'boolean' } },
        },
        annotations: null,
        enabled: true,
        render: 'off',
        uiTemplateId: null,
        fieldMap: {},
        lastSyncedAt: null,
        createdAt: '',
        updatedAt: '',
      })
    }
    const out: VariableOption[] = []
    const seen = new Set<string>()

    for (const decl of declarations) {
      const tool = byName.get(decl.name.toLowerCase())
      const from = tool?.title || tool?.name || decl.name
      const schema =
        tool?.outputSchema && typeof tool.outputSchema === 'object'
          ? tool.outputSchema
          : {}
      const fields = schemaFieldPaths(schema)
      for (const field of fields) {
        const key = `${decl.as.toLowerCase()}.${field.toLowerCase()}`
        if (seen.has(key)) continue
        seen.add(key)
        out.push({
          ref: decl.as,
          variable: field,
          from,
        })
      }
    }
    return out
  }, [apiKeyId, declarations, liveAgentEnabled, meetingTopics, tools])

  function insertVariable(option: VariableOption) {
    onInsertVariable({
      ref: option.ref,
      variable: option.variable,
      from: option.from,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Insert variable"
      maxWidth="max-w-lg"
    >
      <p className={cn(hintClassName, 'mb-3')}>
        Click a variable to insert it. Only fields from tools already in this
        content are listed.
      </p>

      {error ? <p className="mb-2 text-xs text-red-600">{error}</p> : null}
      {loading ? <p className={hintClassName}>Loading…</p> : null}

      {!loading && declarations.length === 0 ? (
        <p className={hintClassName}>
          No tools declared yet. Insert a tool first, then add variables.
        </p>
      ) : null}

      {!loading && declarations.length > 0 && options.length === 0 ? (
        <p className={hintClassName}>
          Declared tools have no output fields to pick from.
        </p>
      ) : null}

      {options.length > 0 ? (
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {options.map((option) => {
            const key = `${option.ref}.${option.variable}`
            return (
              <button
                key={key}
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition hover:bg-[var(--surface)]"
                onClick={() => insertVariable(option)}
              >
                <Braces
                  className="size-3.5 shrink-0 text-[var(--muted)]"
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-[var(--ink)]">
                    {option.variable}
                  </span>
                  <span className="block truncate text-xs text-[var(--muted)]">
                    from {option.from}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      ) : null}

      <div className="mt-4 flex justify-end">
        <button type="button" className={buttonOutlineClassName} onClick={onClose}>
          Close
        </button>
      </div>
    </Modal>
  )
}
