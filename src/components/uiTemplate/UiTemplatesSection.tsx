import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Blocks,
  Code2,
  Eye,
  LayoutTemplate,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react'
import {
  createUiTemplate,
  deleteUiTemplate,
  generateUiTemplateFromTool,
  listUiTemplates,
  updateUiTemplate,
  type UiTemplate,
} from '#/lib/uiTemplate'
import { listMcps, listMcpTools, type Mcp, type McpTool } from '#/lib/mcp'
import { flattenJsonSchemaPaths } from '#/lib/jsonSchemaPaths'
import { Button } from '#/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import {
  cardClassName,
  hintClassName,
  inputClassName,
  projectSectionClassName,
} from '#/lib/ui-classes'
import { cn } from '#/lib/utils'
import {
  parseUiDesc,
  UiDescRenderer,
  collectBindNames,
  uiTemplateSamples,
  type UiDesc,
} from '#/uiDesc'
import UiDescBuilder, {
  blankUiTemplateDefinition,
} from '#/components/uiTemplate/UiDescBuilder'

type EditorMode = 'builder' | 'json'

function stringifyDefinition(definition: UiDesc | Record<string, unknown>) {
  return JSON.stringify(definition, null, 2)
}

export default function UiTemplatesSection({ apiKeyId }: { apiKeyId: string }) {
  const [templates, setTemplates] = useState<UiTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [definitionJson, setDefinitionJson] = useState(() =>
    stringifyDefinition(blankUiTemplateDefinition),
  )
  const [editorMode, setEditorMode] = useState<EditorMode>('builder')
  const [busy, setBusy] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [builderKey, setBuilderKey] = useState(0)
  const [sampleKey, setSampleKey] = useState(0)
  const [mcps, setMcps] = useState<Mcp[]>([])
  const [mcpTools, setMcpTools] = useState<McpTool[]>([])
  const [aiMcpId, setAiMcpId] = useState('')
  const [aiToolId, setAiToolId] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [toolsLoading, setToolsLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await listUiTemplates(apiKeyId)
      if (!response.success || !response.data) {
        toast.error(response.message || 'Failed to load UI templates')
        return
      }
      setTemplates(response.data)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to load UI templates',
      )
    } finally {
      setLoading(false)
    }
  }, [apiKeyId])

  const loadMcps = useCallback(async () => {
    try {
      const response = await listMcps(apiKeyId)
      if (!response.success || !response.data) return
      setMcps(response.data.filter((mcp) => mcp.enabled))
    } catch {
      /* library still usable without MCP list */
    }
  }, [apiKeyId])

  useEffect(() => {
    void load()
    void loadMcps()
  }, [load, loadMcps])

  useEffect(() => {
    if (!aiMcpId) {
      setMcpTools([])
      setAiToolId('')
      return
    }
    let cancelled = false
    setToolsLoading(true)
    void (async () => {
      try {
        const response = await listMcpTools(apiKeyId, aiMcpId)
        if (cancelled) return
        if (!response.success || !response.data) {
          setMcpTools([])
          setAiToolId('')
          return
        }
        const withLeaves = response.data.filter(
          (tool) => flattenJsonSchemaPaths(tool.outputSchema).length > 0,
        )
        setMcpTools(withLeaves)
        setAiToolId((prev) =>
          withLeaves.some((t) => t.id === prev) ? prev : '',
        )
      } catch {
        if (!cancelled) {
          setMcpTools([])
          setAiToolId('')
        }
      } finally {
        if (!cancelled) setToolsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [apiKeyId, aiMcpId])

  const selectedAiTool = useMemo(
    () => mcpTools.find((t) => t.id === aiToolId) ?? null,
    [mcpTools, aiToolId],
  )

  const canAiGenerate =
    Boolean(aiMcpId && aiToolId && selectedAiTool) && !aiGenerating && !busy

  const preview = useMemo(() => {
    try {
      const parsed = JSON.parse(definitionJson) as unknown
      const result = parseUiDesc(parsed)
      return result.success ? result.data : null
    } catch {
      return null
    }
  }, [definitionJson])

  const binds = useMemo(() => {
    if (!preview) return []
    return [...collectBindNames(preview.root)]
  }, [preview])

  function resetEditor() {
    setEditingId(null)
    setName('')
    setDefinitionJson(stringifyDefinition(blankUiTemplateDefinition))
    setEditorMode('builder')
    setBuilderKey((k) => k + 1)
    setSampleKey((k) => k + 1)
  }

  function applyDefinition(definition: UiDesc | Record<string, unknown>) {
    setDefinitionJson(stringifyDefinition(definition))
  }

  function loadSample(sampleId: string) {
    const sample = uiTemplateSamples.find((row) => row.id === sampleId)
    if (!sample) return
    applyDefinition(sample.definition)
    if (!name.trim()) setName(sample.label)
    setEditorMode('builder')
    setBuilderKey((k) => k + 1)
    setSampleKey((k) => k + 1)
  }

  async function handleAiGenerate() {
    if (!aiMcpId || !aiToolId) {
      toast.error('Select an MCP tool with an output schema')
      return
    }
    setAiGenerating(true)
    try {
      const response = await generateUiTemplateFromTool(apiKeyId, {
        mcpId: aiMcpId,
        toolId: aiToolId,
      })
      if (!response.success || !response.data) {
        toast.error(response.message || 'Failed to generate UI template')
        return
      }
      const { definition, suggestedName, binds: genBinds } = response.data
      const parsed = parseUiDesc(definition)
      if (!parsed.success) {
        toast.error(
          parsed.error.issues[0]?.message || 'Generated template is invalid',
        )
        return
      }
      applyDefinition(parsed.data)
      if (!name.trim()) setName(suggestedName)
      setEditorMode('builder')
      setBuilderKey((k) => k + 1)
      toast.success(
        genBinds.length > 0
          ? `Generated template (${genBinds.length} binds)`
          : 'Generated template',
      )
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to generate UI template',
      )
    } finally {
      setAiGenerating(false)
    }
  }

  function switchMode(mode: EditorMode) {
    if (mode === 'builder' && !preview) {
      toast.error('Fix JSON before using the builder')
      return
    }
    setEditorMode(mode)
  }

  async function handleCreate() {
    const trimmed = name.trim()
    if (!trimmed) {
      toast.error('Name is required')
      return
    }
    let definition: Record<string, unknown>
    try {
      definition = JSON.parse(definitionJson) as Record<string, unknown>
    } catch {
      toast.error('Definition must be valid JSON')
      return
    }
    const parsed = parseUiDesc(definition)
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || 'Invalid UI definition')
      return
    }

    setBusy(true)
    try {
      if (editingId) {
        const response = await updateUiTemplate(apiKeyId, editingId, {
          name: trimmed,
          definition: parsed.data as unknown as Record<string, unknown>,
        })
        if (!response.success) {
          toast.error(response.message || 'Failed to save template')
          return
        }
        toast.success('Template saved')
      } else {
        const response = await createUiTemplate(apiKeyId, {
          name: trimmed,
          definition: parsed.data as unknown as Record<string, unknown>,
        })
        if (!response.success) {
          toast.error(response.message || 'Failed to create template')
          return
        }
        toast.success('Template created')
      }
      resetEditor()
      await load()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save template',
      )
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(id: string) {
    setBusy(true)
    try {
      const response = await deleteUiTemplate(apiKeyId, id)
      if (!response.success) {
        toast.error(response.message || 'Failed to delete template')
        return
      }
      if (editingId === id) resetEditor()
      toast.success('Template deleted')
      await load()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete template',
      )
    } finally {
      setBusy(false)
    }
  }

  function startEdit(template: UiTemplate) {
    setEditingId(template.id)
    setName(template.name)
    applyDefinition(template.definition)
    setEditorMode(parseUiDesc(template.definition).success ? 'builder' : 'json')
    setBuilderKey((k) => k + 1)
  }

  return (
    <div
      className={cn(
        projectSectionClassName,
        'min-w-0 max-w-full space-y-6 overflow-x-hidden sm:space-y-8',
      )}
    >
      <header className="min-w-0 space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--ink)] sm:text-2xl">
          UI templates
        </h1>
        <p className={cn(hintClassName, 'max-w-xl text-sm')}>
          Compose chat cards from blocks, preview them, then attach to MCP tools
          under Tools → MCP.
        </p>
      </header>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)] lg:gap-8">
        <section
          className={cn(cardClassName, 'min-w-0 max-w-full space-y-4 p-4 sm:p-5')}
        >
          <div className="flex min-w-0 items-start gap-2">
            <LayoutTemplate
              className="mt-0.5 size-4 shrink-0 text-[var(--muted)]"
              aria-hidden
            />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-[var(--ink)]">
                Library
              </h2>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                {loading
                  ? 'Loading…'
                  : `${templates.length} template${templates.length === 1 ? '' : 's'}`}
              </p>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-[var(--muted)]">Loading templates…</p>
          ) : templates.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              No templates yet. Build one below, or start from a sample.
            </p>
          ) : (
            <ul className="min-w-0 space-y-2">
              {templates.map((template) => {
                const bindList = [
                  ...collectBindNames(
                    template.definition &&
                      typeof template.definition === 'object' &&
                      'root' in template.definition
                      ? (template.definition as { root: unknown }).root
                      : template.definition,
                  ),
                ]
                return (
                  <li
                    key={template.id}
                    className="flex min-w-0 items-center justify-between gap-2 rounded-md border border-[var(--line)] px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--ink)]">
                        {template.name}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-[var(--muted)]">
                        {bindList.length > 0
                          ? bindList.join(', ')
                          : 'No binds'}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label={`Edit ${template.name}`}
                        onClick={() => startEdit(template)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-red-600 hover:text-red-700"
                        aria-label={`Delete ${template.name}`}
                        disabled={busy}
                        onClick={() => void handleDelete(template.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section
          className={cn(cardClassName, 'min-w-0 max-w-full space-y-4 p-4 sm:p-5')}
        >
          <div className="flex min-w-0 items-start gap-2">
            <Blocks
              className="mt-0.5 size-4 shrink-0 text-[var(--muted)]"
              aria-hidden
            />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-[var(--ink)]">
                {editingId ? 'Edit template' : 'New template'}
              </h2>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                Name it, pick blocks or JSON, then save.
              </p>
            </div>
          </div>

          <label className="block min-w-0 space-y-1.5">
            <span className="text-xs font-medium text-[var(--ink)]">Name</span>
            <input
              className={cn(inputClassName, 'h-9 w-full min-w-0 px-3 py-2 text-sm')}
              placeholder="Template name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          {!editingId ? (
            <>
              <div className="min-w-0 space-y-2 rounded-md border border-[var(--line)] bg-[var(--surface)] p-3">
                <div className="flex items-center gap-1.5">
                  <Sparkles
                    className="size-3.5 shrink-0 text-[var(--muted)]"
                    aria-hidden
                  />
                  <span className="text-xs font-semibold text-[var(--ink)]">
                    AI create
                  </span>
                </div>
                <p className="text-[10px] text-[var(--muted)]">
                  Generate a template from an MCP tool output schema (DeepSeek
                  when quota allows, otherwise Bonsai). Only tools that declare
                  an output schema appear in the Tool list — sync the MCP after
                  adding schemas on the server.
                </p>
                <div className="grid min-w-0 gap-2 sm:grid-cols-2">
                  <label className="block min-w-0 space-y-1">
                    <span className="text-[10px] font-medium text-[var(--muted)]">
                      MCP
                    </span>
                    <Select
                      value={aiMcpId || undefined}
                      onValueChange={(value) => {
                        setAiMcpId(value)
                        setAiToolId('')
                      }}
                    >
                      <SelectTrigger size="sm" className="w-full min-w-0">
                        <SelectValue placeholder="Select MCP…" />
                      </SelectTrigger>
                      <SelectContent className="z-[120]">
                        {mcps.map((mcp) => (
                          <SelectItem key={mcp.id} value={mcp.id}>
                            {mcp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </label>
                  <label className="block min-w-0 space-y-1">
                    <span className="text-[10px] font-medium text-[var(--muted)]">
                      Tool
                    </span>
                    <Select
                      value={aiToolId || undefined}
                      onValueChange={setAiToolId}
                      disabled={!aiMcpId || toolsLoading}
                    >
                      <SelectTrigger size="sm" className="w-full min-w-0">
                        <SelectValue
                          placeholder={
                            !aiMcpId
                              ? 'Pick MCP first…'
                              : toolsLoading
                                ? 'Loading…'
                                : mcpTools.length === 0
                                  ? 'No tools with output schema'
                                  : 'Select tool…'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="z-[120]">
                        {mcpTools.map((tool) => (
                          <SelectItem key={tool.id} value={tool.id}>
                            {tool.title || tool.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </label>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!canAiGenerate}
                  onClick={() => void handleAiGenerate()}
                >
                  <Sparkles className="size-3.5" aria-hidden />
                  {aiGenerating ? 'Generating…' : 'Generate'}
                </Button>
              </div>

              <div className="min-w-0 space-y-1.5">
                <span className="text-xs font-medium text-[var(--ink)]">
                  Start from sample
                </span>
                <Select
                  key={sampleKey}
                  onValueChange={(value) => loadSample(value)}
                >
                  <SelectTrigger size="sm" className="w-full min-w-0">
                    <SelectValue placeholder="Choose a sample…" />
                  </SelectTrigger>
                  <SelectContent className="z-[120]">
                    {uiTemplateSamples.map((sample) => (
                      <SelectItem key={sample.id} value={sample.id}>
                        {sample.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-[var(--muted)]">
                  Loads a ready-made layout you can edit.
                </p>
              </div>
            </>
          ) : null}

          <div className="flex min-w-0 gap-1 rounded-md border border-[var(--line)] p-0.5">
            {(
              [
                ['builder', 'Builder', Blocks],
                ['json', 'JSON', Code2],
              ] as const
            ).map(([mode, label, Icon]) => (
              <button
                key={mode}
                type="button"
                className={cn(
                  'inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded px-2 py-1.5 text-xs font-medium',
                  editorMode === mode
                    ? 'bg-[var(--ink)] text-[var(--surface)]'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]',
                )}
                onClick={() => switchMode(mode)}
              >
                <Icon className="size-3.5 shrink-0" aria-hidden />
                {label}
              </button>
            ))}
          </div>

          {editorMode === 'builder' && preview ? (
            <div className="min-w-0 max-w-full">
              <UiDescBuilder
                key={builderKey}
                value={preview}
                onChange={(next) => applyDefinition(next)}
              />
            </div>
          ) : (
            <textarea
              className={cn(
                inputClassName,
                'min-h-52 w-full min-w-0 font-mono text-[11px]',
              )}
              value={definitionJson}
              onChange={(e) => setDefinitionJson(e.target.value)}
              spellCheck={false}
            />
          )}

          {binds.length > 0 ? (
            <p className="min-w-0 wrap-break-word text-[11px] text-[var(--muted)]">
              Binds: {binds.join(', ')}
            </p>
          ) : null}

          <div className="min-w-0 max-w-full space-y-2 rounded-md border border-[var(--line)] bg-[var(--surface)] p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wide text-[var(--muted)] uppercase">
              <Eye className="size-3.5 shrink-0" aria-hidden />
              Preview
            </div>
            {preview ? (
              <div className="min-w-0 max-w-full overflow-x-hidden">
                <UiDescRenderer root={preview.root} darkMode={false} />
              </div>
            ) : (
              <p className="text-[11px] text-amber-700">
                Definition is not valid UI JSON yet.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={busy}
              onClick={() => void handleCreate()}
            >
              <Plus className="size-3.5" aria-hidden />
              {editingId ? 'Save template' : 'Create template'}
            </Button>
            {editingId ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetEditor}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  )
}
