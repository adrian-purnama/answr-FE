import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type Ref,
} from 'react'
import 'react-quill-new/dist/quill.snow.css'
import { CaseUpper, Braces, FunctionSquare, Waypoints } from 'lucide-react'
import TopicReferencePicker from '#/components/guidance/TopicReferencePicker'
import ToolReferencePicker, {
  type ToolInsertPayload,
} from '#/components/guidance/ToolReferencePicker'
import VariableReferencePicker, {
  type VariableInsertPayload,
} from '#/components/guidance/VariableReferencePicker'
import { loadTopicRefLookup } from '#/lib/article'
import {
  formatToolRef,
  formatTopicRef,
  formatToolVariableRef,
  parseContentToBlocks,
  serializeContentBlocks,
} from '#/lib/contentReferences'
import { loadReferenceToolTitles } from '#/lib/liveAgent'
import {
  registerTopicRefBlot,
  shortTopicLabel,
  TOPIC_CHIP_CSS,
  TOPIC_REF_BLOT,
  type TopicRefValue,
} from '#/lib/quillTopicRef'
import {
  aliasToToolNameFromContent,
  applyRefChipStatus,
  attachRefChipSelection,
  attachToolRefClipboardMatchers,
  plainTextToRefsDeltaOps,
  REF_CHIP_STATUS_CSS,
  registerToolRefBlot,
  registerToolVariableRefBlot,
  serializeRefsDeltaToPlainText,
  shortToolLabel,
  shortVariableLabel,
  TOOL_CHIP_CSS,
  TOOL_REF_BLOT,
  TOOL_VARIABLE_CHIP_CSS,
  TOOL_VARIABLE_REF_BLOT,
  type ToolRefValue,
  type ToolVariableRefValue,
} from '#/lib/quillToolRef'
import { cn } from '#/lib/utils'

type QuillEditorApi = {
  getSelection: (focus?: boolean) => { index: number; length: number } | null
  getLength: () => number
  getContents: () => { ops?: Array<{ insert?: string | Record<string, unknown> }> }
  getIndex: (blot: unknown) => number
  setContents: (ops: Array<{ insert?: string | Record<string, unknown> }>, source?: string) => void
  insertEmbed: (index: number, type: string, value: unknown, source?: string) => void
  insertText: (index: number, text: string, source?: string) => void
  setSelection: (index: number, length?: number, source?: string) => void
  focus: () => void
  root: HTMLElement
}

type ReactQuillHandle = {
  getEditor: () => QuillEditorApi
}

type QuillProps = {
  theme?: string
  defaultValue?: string
  modules?: Record<string, unknown>
  formats?: string[]
  placeholder?: string
  onChange?: () => void
}

type GuidanceContentEditorProps = {
  apiKeyId: string
  contentKey: string
  value: string
  placeholder?: string
  canEdit?: boolean
  maxCharacters: number
  onSave: (plainText: string) => void | Promise<void>
  onDraftChange?: (plainText: string) => void
  className?: string
}

function TopicChip({
  id,
  name,
  enabled,
}: TopicRefValue & { enabled: boolean }) {
  const label = shortTopicLabel(id, name)
  return (
    <span
      className={cn(
        'ql-topic-ref',
        enabled ? 'ql-ref-chip--enabled' : 'ql-ref-chip--disabled',
      )}
      data-topic-id={id}
      title={name?.trim() || formatTopicRef(id)}
    >
      <span className="ql-topic-ref-inner">
        <span className="ql-topic-ref-icon" aria-hidden>
          <Waypoints className="size-3" />
        </span>
        <span className="ql-topic-ref-label">{label}</span>
      </span>
    </span>
  )
}

function ToolChip({
  name,
  title,
  as,
  enabled,
}: ToolRefValue & { enabled: boolean }) {
  return (
    <span
      className={cn(
        'ql-tool-ref',
        enabled ? 'ql-ref-chip--enabled' : 'ql-ref-chip--disabled',
      )}
      data-tool-name={name}
      title={formatToolRef(name, as)}
    >
      <span className="ql-tool-ref-inner">
        <span className="ql-tool-ref-icon" aria-hidden>
          <FunctionSquare className="size-3" />
        </span>
        <span className="ql-tool-ref-label">{shortToolLabel(name, title)}</span>
      </span>
    </span>
  )
}

function VariableChip({
  alias,
  variable,
  from,
  enabled,
}: {
  alias: string
  variable: string
  from?: string
  enabled: boolean
}) {
  return (
    <span
      className={cn(
        'ql-tool-var-ref',
        enabled ? 'ql-ref-chip--enabled' : 'ql-ref-chip--disabled',
      )}
      data-tool-var-ref={alias}
      title={
        from
          ? `${variable} · from ${from}`
          : formatToolVariableRef(alias, variable)
      }
    >
      <span className="ql-tool-var-ref-inner">
        <span className="ql-tool-var-ref-icon" aria-hidden>
          <Braces className="size-3" />
        </span>
        <span className="ql-tool-var-ref-label">
          {shortVariableLabel(variable)}
        </span>
      </span>
    </span>
  )
}

function ReadOnlyContent({
  value,
  names,
  enabledTopicIds,
  toolTitles,
  emptyLabel,
  clickable,
  onActivate,
}: {
  value: string
  names: Map<string, string>
  enabledTopicIds: Set<string>
  toolTitles: Map<string, string>
  emptyLabel: string
  clickable: boolean
  onActivate?: () => void
}) {
  const blocks = parseContentToBlocks(value)
  const empty = value.length === 0

  const aliasToFrom = new Map<string, string>()
  const aliasToToolName = aliasToToolNameFromContent(value)
  for (const block of blocks) {
    if (block.type === 'tool' && block.as) {
      aliasToFrom.set(
        block.as.toLowerCase(),
        toolTitles.get(block.name.toLowerCase()) ?? block.name,
      )
    }
  }

  return (
    <div
      className={cn(
        'min-h-24 text-sm leading-relaxed text-[var(--ink)]',
        clickable &&
          'cursor-text rounded-md transition hover:bg-[var(--surface)]/50',
      )}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={
        clickable
          ? () => {
              onActivate?.()
            }
          : undefined
      }
      onKeyDown={
        clickable
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onActivate?.()
              }
            }
          : undefined
      }
    >
      {empty ? (
        <span className="text-[var(--muted)]">{emptyLabel}</span>
      ) : (
        <p className="whitespace-pre-wrap">
          {blocks.map((block, index) => {
            if (block.type === 'text') {
              return <span key={`t-${index}`}>{block.content}</span>
            }
            if (block.type === 'topic') {
              const name = names.get(block.id.toLowerCase()) ?? ''
              return (
                <TopicChip
                  key={`r-${block.id}-${index}`}
                  id={block.id}
                  name={name}
                  enabled={enabledTopicIds.has(block.id.toLowerCase())}
                />
              )
            }
            if (block.type === 'tool') {
              const title =
                toolTitles.get(block.name.toLowerCase()) ?? block.name
              return (
                <ToolChip
                  key={`tool-${block.name}-${index}`}
                  name={block.name}
                  title={title}
                  as={block.as ?? ''}
                  enabled={toolTitles.has(block.name.toLowerCase())}
                />
              )
            }
            if (block.type === 'tool_variable') {
              const toolName =
                aliasToToolName.get(block.ref.toLowerCase())?.toLowerCase() ??
                ''
              return (
                <VariableChip
                  key={`var-${block.ref}-${block.variable}-${index}`}
                  alias={block.ref}
                  variable={block.variable}
                  from={aliasToFrom.get(block.ref.toLowerCase()) ?? block.ref}
                  enabled={Boolean(
                    toolName && toolTitles.has(toolName),
                  )}
                />
              )
            }
            return (
              <span key={`x-${index}`}>{serializeContentBlocks([block])}</span>
            )
          })}
        </p>
      )}
    </div>
  )
}

export default function GuidanceContentEditor({
  apiKeyId,
  contentKey,
  value,
  placeholder = 'Type guidance…',
  canEdit = false,
  maxCharacters,
  onSave,
  onDraftChange,
  className,
}: GuidanceContentEditorProps) {
  const quillRef = useRef<ReactQuillHandle | null>(null)
  const cursorIndexRef = useRef(0)
  const valueAtEditStartRef = useRef(value)

  const [editing, setEditing] = useState(false)
  const [editSession, setEditSession] = useState(0)
  const [topicPickerOpen, setTopicPickerOpen] = useState(false)
  const [toolPickerOpen, setToolPickerOpen] = useState(false)
  const [variablePickerOpen, setVariablePickerOpen] = useState(false)
  const [livePlain, setLivePlain] = useState(value)
  const [names, setNames] = useState<Map<string, string>>(() => new Map())
  const [enabledTopicIds, setEnabledTopicIds] = useState<Set<string>>(
    () => new Set(),
  )
  const [toolTitles, setToolTitles] = useState<Map<string, string>>(
    () => new Map(),
  )
  const [characterCount, setCharacterCount] = useState(value.length)
  const [Quill, setQuill] = useState<
    ComponentType<QuillProps & { ref?: Ref<ReactQuillHandle> }> | null
  >(null)
  const [seedReady, setSeedReady] = useState(false)
  const quillStaticRef = useRef<Parameters<typeof registerToolRefBlot>[0] | null>(
    null,
  )
  const detachChipSelectionRef = useRef<(() => void) | null>(null)

  const modules = useMemo(
    () => ({
      toolbar: false,
      clipboard: { matchVisual: false },
    }),
    [],
  )

  const loadTopicNames = useCallback(async () => {
    const { names: nextNames, enabledIds } = await loadTopicRefLookup(apiKeyId)
    setNames(nextNames)
    setEnabledTopicIds(enabledIds)
  }, [apiKeyId])

  const loadToolTitles = useCallback(async () => {
    const next = await loadReferenceToolTitles(apiKeyId)
    setToolTitles(next)
  }, [apiKeyId])

  useEffect(() => {
    void loadTopicNames()
    void loadToolTitles()
  }, [loadTopicNames, loadToolTitles, contentKey])

  const skipValueSyncRef = useRef(false)

  useEffect(() => {
    if (!canEdit) setEditing(false)
  }, [canEdit])

  useEffect(() => {
    setEditing(false)
    setTopicPickerOpen(false)
    setToolPickerOpen(false)
    setVariablePickerOpen(false)
    setSeedReady(false)
    setLivePlain(value)
    setCharacterCount(value.length)
  }, [contentKey])

  useEffect(() => {
    if (editing) return
    if (skipValueSyncRef.current) {
      skipValueSyncRef.current = false
      return
    }
    setLivePlain(value)
  }, [value, editing])

  useEffect(() => {
    if (!editing || Quill) return
    let cancelled = false
    void import('react-quill-new').then((mod) => {
      if (cancelled) return
      const QuillStatic = (mod as { Quill?: unknown }).Quill as
        | Parameters<typeof registerTopicRefBlot>[0]
        | undefined
      if (QuillStatic) {
        registerTopicRefBlot(QuillStatic)
        registerToolRefBlot(QuillStatic)
        registerToolVariableRefBlot(QuillStatic)
        quillStaticRef.current = QuillStatic
      }
      setQuill(
        () =>
          mod.default as ComponentType<
            QuillProps & { ref?: Ref<ReactQuillHandle> }
          >,
      )
    })
    return () => {
      cancelled = true
    }
  }, [editing, Quill])

  useEffect(() => {
    if (!editing || !seedReady) return
    const editor = quillRef.current?.getEditor()
    if (!editor) return
    applyRefChipStatus(editor.root, {
      enabledTopicIds,
      enabledToolNames: new Set(toolTitles.keys()),
      aliasToToolName: aliasToToolNameFromContent(livePlain),
    })
  }, [editing, seedReady, names, enabledTopicIds, toolTitles, livePlain])

  function seedEditor(editor: QuillEditorApi) {
    const ops = plainTextToRefsDeltaOps(
      valueAtEditStartRef.current,
      names,
      toolTitles,
    )
    editor.setContents(ops, 'silent')
    if (quillStaticRef.current) {
      attachToolRefClipboardMatchers(
        editor as unknown as Parameters<typeof attachToolRefClipboardMatchers>[0],
        quillStaticRef.current,
      )
      detachChipSelectionRef.current?.()
      detachChipSelectionRef.current = attachRefChipSelection(
        editor as unknown as Parameters<typeof attachRefChipSelection>[0],
        quillStaticRef.current,
      )
    }
    const plain = serializeRefsDeltaToPlainText(editor.getContents())
    applyRefChipStatus(editor.root, {
      enabledTopicIds,
      enabledToolNames: new Set(toolTitles.keys()),
      aliasToToolName: aliasToToolNameFromContent(plain),
    })
    setLivePlain(plain)
    setCharacterCount(plain.length)
    setSeedReady(true)
    editor.focus()
  }

  function startEditing() {
    if (!canEdit) return
    valueAtEditStartRef.current = value
    setSeedReady(false)
    setEditSession((s) => s + 1)
    setEditing(true)
  }

  function rememberCursor() {
    const editor = quillRef.current?.getEditor()
    if (!editor) return
    const range = editor.getSelection(true)
    cursorIndexRef.current = range?.index ?? Math.max(0, editor.getLength() - 1)
  }

  function syncPlainFromEditor(): string {
    const editor = quillRef.current?.getEditor()
    if (!editor) return valueAtEditStartRef.current
    const plain = serializeRefsDeltaToPlainText(editor.getContents())
    setLivePlain(plain)
    setCharacterCount(plain.length)
    onDraftChange?.(plain)
    return plain
  }

  function finishEditing() {
    const plain = syncPlainFromEditor()
    if (plain.length > maxCharacters) return
    valueAtEditStartRef.current = plain
    setLivePlain(plain)
    skipValueSyncRef.current = true
    void onSave(plain)
    detachChipSelectionRef.current?.()
    detachChipSelectionRef.current = null
    setEditing(false)
    setTopicPickerOpen(false)
    setToolPickerOpen(false)
    setVariablePickerOpen(false)
  }

  function cancelEditing() {
    onDraftChange?.(valueAtEditStartRef.current)
    setLivePlain(valueAtEditStartRef.current)
    setCharacterCount(valueAtEditStartRef.current.length)
    detachChipSelectionRef.current?.()
    detachChipSelectionRef.current = null
    setEditing(false)
    setTopicPickerOpen(false)
    setToolPickerOpen(false)
    setVariablePickerOpen(false)
  }

  function insertAtCursor(
    fn: (editor: QuillEditorApi, index: number) => number,
  ) {
    const editor = quillRef.current?.getEditor()
    if (!editor) return

    const range = editor.getSelection(true)
    const index =
      range?.index ??
      cursorIndexRef.current ??
      Math.max(0, editor.getLength() - 1)

    editor.focus()
    const nextIndex = fn(editor, index)
    editor.setSelection(nextIndex, 0)
    cursorIndexRef.current = nextIndex
    syncPlainFromEditor()
  }

  function handleInsertTopic(topicId: string, topicName: string) {
    insertAtCursor((editor, index) => {
      editor.insertEmbed(
        index,
        TOPIC_REF_BLOT,
        {
          id: topicId,
          name: topicName,
        } satisfies TopicRefValue,
        'user',
      )
      return index + 1
    })
    setNames((prev) => {
      const next = new Map(prev)
      next.set(topicId.toLowerCase(), topicName)
      return next
    })
    setEnabledTopicIds((prev) => {
      const next = new Set(prev)
      next.add(topicId.toLowerCase())
      return next
    })
    setTopicPickerOpen(false)
  }

  function handleInsertTool(payload: ToolInsertPayload) {
    insertAtCursor((editor, index) => {
      editor.insertEmbed(
        index,
        TOOL_REF_BLOT,
        {
          name: payload.name,
          title: payload.title,
          as: payload.as,
        } satisfies ToolRefValue,
        'user',
      )
      return index + 1
    })
    setToolTitles((prev) => {
      const next = new Map(prev)
      next.set(payload.name.toLowerCase(), payload.title)
      return next
    })
    setToolPickerOpen(false)
  }

  function handleInsertVariable(payload: VariableInsertPayload) {
    insertAtCursor((editor, index) => {
      editor.insertEmbed(
        index,
        TOOL_VARIABLE_REF_BLOT,
        {
          alias: payload.ref,
          variable: payload.variable,
          from: payload.from,
        } satisfies ToolVariableRefValue,
        'user',
      )
      return index + 1
    })
    setVariablePickerOpen(false)
  }

  const charactersLeft = Math.max(0, maxCharacters - characterCount)
  const overCharacterLimit = characterCount > maxCharacters

  if (!editing || !canEdit) {
    return (
      <div className={cn(className)}>
        <style>{TOPIC_CHIP_CSS}</style>
        <style>{TOOL_CHIP_CSS}</style>
        <style>{TOOL_VARIABLE_CHIP_CSS}</style>
        <style>{REF_CHIP_STATUS_CSS}</style>
        <ReadOnlyContent
          value={value}
          names={names}
          enabledTopicIds={enabledTopicIds}
          toolTitles={toolTitles}
          emptyLabel={canEdit ? 'Click to write…' : 'Empty'}
          clickable={canEdit}
          onActivate={startEditing}
        />
      </div>
    )
  }

  return (
    <div className={cn('guidance-quill min-w-0 space-y-3', className)}>
      <style>{TOPIC_CHIP_CSS}</style>
      <style>{TOOL_CHIP_CSS}</style>
      <style>{TOOL_VARIABLE_CHIP_CSS}</style>
      <style>{REF_CHIP_STATUS_CSS}</style>
      <style>{`
        .guidance-quill .ql-container.ql-snow { border: none; font-size: 0.875rem; }
        .guidance-quill .ql-editor { min-height: 12rem; padding: 0.5rem 0; }
        .guidance-quill .ql-toolbar.ql-snow { display: none; }
      `}</style>

      <div className="flex items-center gap-1">
        <button
          type="button"
          title="Insert topic reference"
          aria-label="Insert topic reference"
          className="inline-flex size-8 items-center justify-center rounded-md text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--ink)]"
          onMouseDown={(e) => {
            e.preventDefault()
            rememberCursor()
          }}
          onClick={() => {
            rememberCursor()
            setTopicPickerOpen(true)
          }}
        >
          <Waypoints className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          title="Insert tool"
          aria-label="Insert tool"
          className="inline-flex size-8 items-center justify-center rounded-md text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--ink)]"
          onMouseDown={(e) => {
            e.preventDefault()
            rememberCursor()
          }}
          onClick={() => {
            rememberCursor()
            setToolPickerOpen(true)
          }}
        >
          <FunctionSquare className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          title="Insert variable"
          aria-label="Insert variable"
          className="inline-flex size-8 items-center justify-center rounded-md text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--ink)]"
          onMouseDown={(e) => {
            e.preventDefault()
            rememberCursor()
          }}
          onClick={() => {
            rememberCursor()
            setVariablePickerOpen(true)
          }}
        >
          <Braces className="size-4" aria-hidden />
        </button>
      </div>

      {!Quill ? (
        <div className="min-h-24 animate-pulse rounded-md bg-[var(--surface)]" />
      ) : (
        <Quill
          key={`${contentKey}-${editSession}`}
          ref={(instance: ReactQuillHandle | null) => {
            quillRef.current = instance
            if (instance && !seedReady) {
              requestAnimationFrame(() => {
                try {
                  seedEditor(instance.getEditor())
                } catch {
                  setSeedReady(true)
                }
              })
            }
          }}
          theme="snow"
          modules={modules}
          formats={[TOPIC_REF_BLOT, TOOL_REF_BLOT, TOOL_VARIABLE_REF_BLOT]}
          placeholder={placeholder}
          onChange={() => {
            syncPlainFromEditor()
          }}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p
          className={cn(
            'inline-flex items-center gap-1.5 text-xs text-[var(--muted)]',
            overCharacterLimit && 'text-red-600',
          )}
          title={`${charactersLeft} of ${maxCharacters} characters left`}
        >
          <CaseUpper className="size-4.5 shrink-0" aria-hidden />
          {charactersLeft}/{maxCharacters}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-md px-2.5 py-1 text-xs text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)]"
            onClick={cancelEditing}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-md bg-[var(--ink)] px-2.5 py-1 text-xs text-white hover:opacity-90 disabled:opacity-40"
            disabled={overCharacterLimit}
            onClick={finishEditing}
          >
            Done
          </button>
        </div>
      </div>

      <TopicReferencePicker
        open={topicPickerOpen}
        onClose={() => setTopicPickerOpen(false)}
        apiKeyId={apiKeyId}
        onInsertTopic={handleInsertTopic}
      />
      <ToolReferencePicker
        open={toolPickerOpen}
        onClose={() => setToolPickerOpen(false)}
        apiKeyId={apiKeyId}
        onInsertTool={handleInsertTool}
      />
      <VariableReferencePicker
        open={variablePickerOpen}
        onClose={() => setVariablePickerOpen(false)}
        apiKeyId={apiKeyId}
        content={livePlain}
        onInsertVariable={handleInsertVariable}
      />
    </div>
  )
}
