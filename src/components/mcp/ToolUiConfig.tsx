import { useMemo, useState, type DragEvent } from 'react'
import { Link } from '@tanstack/react-router'
import type { McpTool } from '#/lib/mcp'
import type { UiTemplate } from '#/lib/uiTemplate'
import { flattenJsonSchemaPaths } from '#/lib/jsonSchemaPaths'
import { Button } from '#/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { cn } from '#/lib/utils'
import { collectBindNames } from '#/uiDesc'

export type ToolUiRenderMode = 'off' | 'deterministic' | 'auto'

export type ToolUiPatch = {
  render?: ToolUiRenderMode
  uiTemplateId?: string | null
  fieldMap?: Record<string, string>
}

const PATH_DRAG_MIME = 'application/x-sapai-output-path'

const RENDER_LABELS: Record<ToolUiRenderMode, string> = {
  off: 'Off',
  deterministic: 'Template',
  auto: 'Auto',
}

function normalizeRender(value: string | undefined): ToolUiRenderMode {
  if (value === 'deterministic' || value === 'auto') return value
  return 'off'
}

function templateRoot(definition: UiTemplate['definition']): unknown {
  if (
    definition &&
    typeof definition === 'object' &&
    'root' in definition
  ) {
    return (definition as { root: unknown }).root
  }
  return definition
}

export default function ToolUiConfig({
  tool,
  templates,
  projectId,
  saving,
  onSave,
}: {
  tool: McpTool
  templates: UiTemplate[]
  projectId: string
  saving: boolean
  onSave: (patch: ToolUiPatch) => void | Promise<void>
}) {
  const [render, setRender] = useState<ToolUiRenderMode>(() =>
    normalizeRender(tool.render),
  )
  const [templateId, setTemplateId] = useState(tool.uiTemplateId ?? '')
  const [fieldMap, setFieldMap] = useState<Record<string, string>>(
    () => ({ ...(tool.fieldMap ?? {}) }),
  )
  const [selectedBind, setSelectedBind] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)

  const selectedTemplate = templates.find((row) => row.id === templateId)
  const binds = useMemo(() => {
    if (!selectedTemplate) return []
    return [...collectBindNames(templateRoot(selectedTemplate.definition))]
  }, [selectedTemplate])

  const outputPaths = useMemo(
    () => flattenJsonSchemaPaths(tool.outputSchema),
    [tool.outputSchema],
  )

  const canSave =
    !saving &&
    (render === 'off' ||
      render === 'auto' ||
      (render === 'deterministic' &&
        templates.length > 0 &&
        Boolean(templateId)))

  function assignPath(bind: string, path: string) {
    setFieldMap((prev) => ({ ...prev, [bind]: path }))
  }

  function clearPath(bind: string) {
    setFieldMap((prev) => {
      const next = { ...prev }
      delete next[bind]
      return next
    })
  }

  function onPathDragStart(event: DragEvent, path: string) {
    event.dataTransfer.setData(PATH_DRAG_MIME, path)
    event.dataTransfer.setData('text/plain', path)
    event.dataTransfer.effectAllowed = 'copy'
  }

  function onBindDragOver(event: DragEvent, bind: string) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    setDropTarget(bind)
  }

  function onBindDrop(event: DragEvent, bind: string) {
    event.preventDefault()
    setDropTarget(null)
    const path =
      event.dataTransfer.getData(PATH_DRAG_MIME) ||
      event.dataTransfer.getData('text/plain')
    if (path.trim()) assignPath(bind, path.trim())
  }

  function handleSave() {
    if (render === 'off') {
      void onSave({
        render: 'off',
        uiTemplateId: null,
        fieldMap: {},
      })
      return
    }
    if (render === 'auto') {
      void onSave({
        render: 'auto',
        uiTemplateId: null,
        fieldMap: {},
      })
      return
    }
    const cleaned: Record<string, string> = {}
    for (const bind of binds) {
      const path = (fieldMap[bind] ?? '').trim()
      if (path) cleaned[bind] = path
    }
    void onSave({
      render: 'deterministic',
      uiTemplateId: templateId || null,
      fieldMap: cleaned,
    })
  }

  return (
    <div className="mt-1 space-y-3 rounded-md border border-[var(--line)] bg-[var(--surface)]/60 p-3">
      <p className="text-xs font-medium tracking-wide text-[var(--muted)] uppercase">
        Chat UI
      </p>

      <div className="space-y-1">
        <span className="text-[11px] text-[var(--muted)]">Render mode</span>
        <Select
          value={render}
          onValueChange={(value) => setRender(normalizeRender(value))}
        >
          <SelectTrigger size="sm" className="w-full">
            <SelectValue placeholder="Render mode" />
          </SelectTrigger>
          <SelectContent className="z-[120]">
            {(Object.keys(RENDER_LABELS) as ToolUiRenderMode[]).map(
              (value) => (
                <SelectItem key={value} value={value}>
                  {RENDER_LABELS[value]}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </div>

      {render === 'off' ? (
        <p className="text-[11px] text-[var(--muted)]">
          Markdown only   no structured card.
        </p>
      ) : null}

      {render === 'auto' ? (
        <p className="text-[11px] text-[var(--muted)]">
          AI builds a card from each successful tool result.
        </p>
      ) : null}

      {render === 'deterministic' ? (
        <>
          {templates.length === 0 ? (
            <p className="text-[11px] text-[var(--muted)]">
              No UI templates yet.{' '}
              <Link
                to="/project/$id/tools/ui"
                params={{ id: projectId }}
                className="font-medium text-[var(--ink)] underline-offset-2 hover:underline"
              >
                Create one in Tools → UI
              </Link>
              .
            </p>
          ) : (
            <div className="space-y-1">
              <span className="text-[11px] text-[var(--muted)]">UI template</span>
              <Select
                value={templateId || undefined}
                onValueChange={setTemplateId}
              >
                <SelectTrigger size="sm" className="w-full">
                  <SelectValue placeholder="Select a template…" />
                </SelectTrigger>
                <SelectContent className="z-[120]">
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {binds.length > 0 ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <p className="text-[11px] text-[var(--muted)]">
                  Select a bind, then click or drag an output field. Only mapped
                  binds show in the card.
                </p>
                <ul className="space-y-1.5">
                  {binds.map((bind) => {
                    const mapped = fieldMap[bind] ?? ''
                    const isSelected = selectedBind === bind
                    const isDrop = dropTarget === bind
                    return (
                      <li key={bind}>
                        <div
                          role="button"
                          tabIndex={0}
                          className={cn(
                            'flex items-center gap-2 rounded-md border px-2 py-1.5 text-left transition-colors',
                            isSelected || isDrop
                              ? 'border-[var(--ink)] bg-[var(--surface)]'
                              : 'border-[var(--line)] bg-transparent',
                          )}
                          onClick={() => setSelectedBind(bind)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              setSelectedBind(bind)
                            }
                          }}
                          onDragOver={(e) => onBindDragOver(e, bind)}
                          onDragLeave={() =>
                            setDropTarget((prev) =>
                              prev === bind ? null : prev,
                            )
                          }
                          onDrop={(e) => onBindDrop(e, bind)}
                        >
                          <span className="w-24 shrink-0 truncate text-[11px] font-medium text-[var(--ink)]">
                            {bind}
                          </span>
                          <span
                            className={cn(
                              'min-w-0 flex-1 truncate font-mono text-[11px]',
                              mapped
                                ? 'text-[var(--ink)]'
                                : 'text-[var(--muted)]',
                            )}
                          >
                            {mapped || 'Drop output field here'}
                          </span>
                          {mapped ? (
                            <button
                              type="button"
                              className="shrink-0 text-[11px] text-[var(--muted)] hover:text-red-600"
                              onClick={(e) => {
                                e.stopPropagation()
                                clearPath(bind)
                              }}
                            >
                              Clear
                            </button>
                          ) : null}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>

              <div className="space-y-1.5">
                <p className="text-[11px] font-medium text-[var(--muted)]">
                  Output fields
                </p>
                {outputPaths.length === 0 ? (
                  <p className="text-[11px] text-[var(--muted)]">
                    No output schema
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {outputPaths.map((path) => (
                      <button
                        key={path}
                        type="button"
                        draggable
                        title={
                          selectedBind
                            ? `Assign to ${selectedBind}`
                            : 'Select a bind first, or drag onto a bind'
                        }
                        className="cursor-grab select-none rounded-md border border-[var(--line)] bg-white px-2 py-0.5 font-mono text-[10px] text-[var(--ink)] shadow-xs transition hover:border-[var(--ink)]/40 active:cursor-grabbing"
                        onDragStart={(e) => onPathDragStart(e, path)}
                        onClick={() => {
                          if (selectedBind) assignPath(selectedBind, path)
                        }}
                      >
                        {path}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : selectedTemplate ? (
            <p className="text-[11px] text-[var(--muted)]">
              This template has no bind slots.
            </p>
          ) : null}
        </>
      ) : null}

      <Button
        type="button"
        className="w-full"
        size="sm"
        disabled={!canSave}
        onClick={handleSave}
      >
        {saving ? 'Saving…' : 'Save UI config'}
      </Button>
    </div>
  )
}
