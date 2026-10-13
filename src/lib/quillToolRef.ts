import {
  formatToolRef,
  formatTopicRef,
  formatToolVariableRef,
  listToolDeclarations,
  parseContentToBlocks,
  serializeContentBlocks,
} from '#/lib/contentReferences'
import {
  TOPIC_REF_BLOT,
  shortTopicLabel,
  type TopicRefValue,
} from '#/lib/quillTopicRef'

export const TOOL_REF_BLOT = 'toolRef'
export const TOOL_VARIABLE_REF_BLOT = 'toolVariableRef'

export type ToolRefValue = {
  name: string
  title: string
  as: string
}

export type ToolVariableRefValue = {
  /** Output alias from `{{tool … as="alias"}}`    avoid naming this `ref` (Quill/React). */
  alias: string
  variable: string
  /** Display source tool title/name for chip tooltip. */
  from?: string
}

type QuillStatic = {
  import: (path: string) => unknown
  register: (blot: unknown, suppressWarning?: boolean) => void
  find?: (node: Node, bubble?: boolean) => unknown
}

type DeltaOp = {
  insert?: string | Record<string, unknown>
  attributes?: Record<string, unknown>
}

type DeltaLike = {
  ops?: DeltaOp[]
}

type QuillEditorLike = {
  getContents: () => DeltaLike
  setContents: (delta: DeltaLike | DeltaOp[], source?: string) => void
  clipboard: {
    addMatcher: (
      selector: string | number,
      matcher: (node: Node, delta: DeltaLike) => DeltaLike,
    ) => void
  }
}

type QuillEditorSelectionLike = {
  root: HTMLElement
  focus?: () => void
  setSelection: (index: number, length?: number, source?: string) => void
  getSelection: (focus?: boolean) => { index: number; length: number } | null
  getIndex: (blot: unknown) => number
  getContents: (index?: number, length?: number) => DeltaLike
  deleteText: (index: number, length: number, source?: string) => void
}

type DeltaCtor = new () => {
  insert: (content: unknown, attributes?: unknown) => DeltaLike
}

/** Lucide SquareFunction    tool chip icon. */
const FUNCTION_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M9 17c2 0 2.8-1 2.8-2.8V10c0-2 1-3.3 3.2-3"/><path d="M9 11.2h5.7"/></svg>`

/** Lucide Braces    variable chip icon. */
const BRACES_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/></svg>`

const LABEL_MAX = 24

let toolRegistered = false
let variableRegistered = false

export function shortToolLabel(name: string, title?: string): string {
  const raw = (title?.trim() || name.trim()) || name
  if (raw.length <= LABEL_MAX) return raw
  return `${raw.slice(0, LABEL_MAX - 1)}…`
}

export function shortVariableLabel(variable: string): string {
  const raw = variable.trim() || 'variable'
  if (raw.length <= LABEL_MAX) return raw
  return `${raw.slice(0, LABEL_MAX - 1)}…`
}

function makeChipRemoveButton(className: string): HTMLButtonElement {
  const remove = document.createElement('button')
  remove.type = 'button'
  remove.className = className
  remove.setAttribute('aria-label', 'Remove reference')
  remove.setAttribute('tabindex', '-1')
  remove.textContent = '×'
  return remove
}

function fillToolChip(host: HTMLElement, value: ToolRefValue): void {
  host.replaceChildren()

  const icon = document.createElement('span')
  icon.className = 'ql-tool-ref-icon'
  icon.setAttribute('aria-hidden', 'true')
  icon.innerHTML = FUNCTION_SVG

  const label = document.createElement('span')
  label.className = 'ql-tool-ref-label'
  label.textContent = shortToolLabel(value.name, value.title)

  host.append(icon, label, makeChipRemoveButton('ql-ref-chip-remove'))
}

function fillVariableChip(host: HTMLElement, value: ToolVariableRefValue): void {
  host.replaceChildren()

  const icon = document.createElement('span')
  icon.className = 'ql-tool-var-ref-icon'
  icon.setAttribute('aria-hidden', 'true')
  icon.innerHTML = BRACES_SVG

  const label = document.createElement('span')
  label.className = 'ql-tool-var-ref-label'
  label.textContent = shortVariableLabel(value.variable)

  host.append(icon, label, makeChipRemoveButton('ql-ref-chip-remove'))
}

function readVariableValue(value: unknown): ToolVariableRefValue {
  const raw = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  // Accept legacy `ref` from older deltas while writing `alias`.
  const alias =
    typeof raw.alias === 'string'
      ? raw.alias
      : typeof raw.ref === 'string'
        ? raw.ref
        : ''
  return {
    alias,
    variable: typeof raw.variable === 'string' ? raw.variable : '',
    from: typeof raw.from === 'string' ? raw.from : '',
  }
}

export function registerToolRefBlot(Quill: QuillStatic): void {
  if (toolRegistered) return

  type EmbedCtor = {
    new (...args: unknown[]): object
    create: (value?: unknown) => HTMLElement
  }

  const Embed = Quill.import('blots/embed') as EmbedCtor

  class ToolRefBlot extends (Embed as unknown as new (
    ...args: unknown[]
  ) => object) {
    static blotName = TOOL_REF_BLOT
    static tagName = 'SPAN'
    static className = 'ql-tool-ref'

    static create(value: ToolRefValue): HTMLElement {
      const node = Embed.create.call(this, value) as HTMLElement
      const data: ToolRefValue = {
        name: typeof value?.name === 'string' ? value.name : '',
        title: typeof value?.title === 'string' ? value.title : '',
        as: typeof value?.as === 'string' ? value.as : '',
      }
      node.dataset.toolName = data.name
      node.dataset.toolTitle = data.title
      node.dataset.toolAs = data.as
      // Human tooltip only   never put {{tool…}} wire tokens in title (HTML
      // round-trip / turndown can resurrect them after the chip is deleted).
      node.setAttribute('title', data.title.trim() || data.name)
      fillToolChip(node, data)
      return node
    }

    static value(node: HTMLElement): ToolRefValue {
      return {
        name: node.dataset.toolName ?? '',
        title: node.dataset.toolTitle ?? '',
        as: node.dataset.toolAs ?? '',
      }
    }
  }

  Quill.register(ToolRefBlot, true)
  toolRegistered = true
}

export function registerToolVariableRefBlot(Quill: QuillStatic): void {
  if (variableRegistered) return

  type EmbedCtor = {
    new (...args: unknown[]): object
    create: (value?: unknown) => HTMLElement
  }

  const Embed = Quill.import('blots/embed') as EmbedCtor

  class ToolVariableRefBlot extends (Embed as unknown as new (
    ...args: unknown[]
  ) => object) {
    static blotName = TOOL_VARIABLE_REF_BLOT
    static tagName = 'SPAN'
    static className = 'ql-tool-var-ref'

    static create(value: ToolVariableRefValue): HTMLElement {
      const node = Embed.create.call(this, value) as HTMLElement
      const data = readVariableValue(value)
      node.dataset.toolVarRef = data.alias
      node.dataset.toolVarName = data.variable
      node.dataset.toolVarFrom = data.from ?? ''
      node.setAttribute(
        'title',
        data.from
          ? `${data.variable} · from ${data.from}`
          : formatToolVariableRef(data.alias, data.variable),
      )
      fillVariableChip(node, data)
      return node
    }

    static value(node: HTMLElement): ToolVariableRefValue {
      return {
        alias: node.dataset.toolVarRef ?? '',
        variable: node.dataset.toolVarName ?? '',
        from: node.dataset.toolVarFrom ?? '',
      }
    }
  }

  Quill.register(ToolVariableRefBlot, true)
  variableRegistered = true
}

/** Keep chip spans as embeds when Quill re-parses HTML (paste / defaultValue). */
export function attachToolRefClipboardMatchers(
  editor: QuillEditorLike,
  Quill: QuillStatic,
): void {
  const Delta = Quill.import('delta') as DeltaCtor

  editor.clipboard.addMatcher('span.ql-tool-ref', (node) => {
    const el = node as HTMLElement
    return new Delta().insert({
      [TOOL_REF_BLOT]: {
        name: el.dataset.toolName ?? '',
        title: el.dataset.toolTitle ?? '',
        as: el.dataset.toolAs ?? '',
      } satisfies ToolRefValue,
    })
  })

  editor.clipboard.addMatcher('span.ql-topic-ref', (node) => {
    const el = node as HTMLElement
    return new Delta().insert({
      [TOPIC_REF_BLOT]: {
        id: el.dataset.topicId ?? '',
        name: el.dataset.topicName ?? '',
      } satisfies TopicRefValue,
    })
  })

  editor.clipboard.addMatcher('span.ql-tool-var-ref', (node) => {
    const el = node as HTMLElement
    return new Delta().insert({
      [TOOL_VARIABLE_REF_BLOT]: {
        alias: el.dataset.toolVarRef ?? '',
        variable: el.dataset.toolVarName ?? '',
        from: el.dataset.toolVarFrom ?? '',
      } satisfies ToolVariableRefValue,
    })
  })
}

const REF_CHIP_HOST_SELECTOR =
  '.ql-tool-ref, .ql-topic-ref, .ql-tool-var-ref'

const REF_CHIP_BLOTS = new Set([
  TOPIC_REF_BLOT,
  TOOL_REF_BLOT,
  TOOL_VARIABLE_REF_BLOT,
])

function opIsRefChip(op: DeltaOp | undefined): boolean {
  if (!op?.insert || typeof op.insert !== 'object') return false
  for (const key of Object.keys(op.insert)) {
    if (REF_CHIP_BLOTS.has(key)) return true
  }
  return false
}

/**
 * Click selects a chip embed; × / double-click removes it; Backspace/Delete
 * force-deletes when the embed is selected or immediately before the caret.
 */
export function attachRefChipSelection(
  editor: QuillEditorSelectionLike,
  Quill: QuillStatic,
): () => void {
  if (typeof Quill.find !== 'function') {
    return () => {}
  }
  const findBlot: (node: Node, bubble?: boolean) => unknown = Quill.find.bind(
    Quill,
  )

  function indexOfHost(host: HTMLElement): number | null {
    const blot = findBlot(host, true)
    if (blot == null) return null
    try {
      const index = editor.getIndex(blot)
      return typeof index === 'number' && index >= 0 ? index : null
    } catch {
      return null
    }
  }

  function removeHost(host: HTMLElement): boolean {
    const index = indexOfHost(host)
    if (index == null) return false
    editor.focus?.()
    editor.deleteText(index, 1, 'user')
    editor.setSelection(index, 0, 'user')
    return true
  }

  function onMouseDown(event: MouseEvent) {
    const target = event.target
    if (!(target instanceof Element)) return

    const removeBtn = target.closest('.ql-ref-chip-remove')
    if (removeBtn instanceof HTMLElement && editor.root.contains(removeBtn)) {
      const host = removeBtn.closest(REF_CHIP_HOST_SELECTOR)
      if (host instanceof HTMLElement) {
        event.preventDefault()
        event.stopPropagation()
        removeHost(host)
      }
      return
    }

    const host = target.closest(REF_CHIP_HOST_SELECTOR)
    if (!(host instanceof HTMLElement) || !editor.root.contains(host)) return

    const index = indexOfHost(host)
    if (index == null) return
    event.preventDefault()
    editor.focus?.()
    editor.setSelection(index, 1, 'user')
  }

  function onDblClick(event: MouseEvent) {
    const target = event.target
    if (!(target instanceof Element)) return
    if (target.closest('.ql-ref-chip-remove')) return
    const host = target.closest(REF_CHIP_HOST_SELECTOR)
    if (!(host instanceof HTMLElement) || !editor.root.contains(host)) return
    event.preventDefault()
    event.stopPropagation()
    removeHost(host)
  }

  function deleteRefAt(index: number): boolean {
    const slice = editor.getContents(index, 1)
    const op = slice.ops?.[0]
    if (!opIsRefChip(op)) return false
    editor.deleteText(index, 1, 'user')
    return true
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Backspace' && event.key !== 'Delete') return
    if (event.defaultPrevented) return
    const range = editor.getSelection(true)
    if (!range) return

    if (range.length >= 1) {
      const slice = editor.getContents(range.index, range.length)
      const hasRef = (slice.ops ?? []).some((op) => opIsRefChip(op))
      if (!hasRef) return
      event.preventDefault()
      event.stopPropagation()
      editor.deleteText(range.index, range.length, 'user')
      return
    }

    if (event.key === 'Backspace' && range.index > 0) {
      if (deleteRefAt(range.index - 1)) {
        event.preventDefault()
        event.stopPropagation()
        editor.setSelection(range.index - 1, 0, 'user')
      }
      return
    }

    if (event.key === 'Delete') {
      if (deleteRefAt(range.index)) {
        event.preventDefault()
        event.stopPropagation()
        editor.setSelection(range.index, 0, 'user')
      }
    }
  }

  editor.root.addEventListener('mousedown', onMouseDown)
  editor.root.addEventListener('dblclick', onDblClick)
  editor.root.addEventListener('keydown', onKeyDown, true)
  return () => {
    editor.root.removeEventListener('mousedown', onMouseDown)
    editor.root.removeEventListener('dblclick', onDblClick)
    editor.root.removeEventListener('keydown', onKeyDown, true)
  }
}

/** Serialize Quill delta including topic + tool + tool_variable embeds. */
export function serializeRefsDeltaToPlainText(
  delta: DeltaLike | null | undefined,
): string {
  if (!delta?.ops?.length) return ''
  let out = ''
  for (const op of delta.ops) {
    if (typeof op.insert === 'string') {
      out += op.insert
      continue
    }
    if (op.insert && typeof op.insert === 'object') {
      const topic = op.insert[TOPIC_REF_BLOT] as TopicRefValue | undefined
      if (topic?.id) {
        out += formatTopicRef(topic.id)
        continue
      }
      const tool = op.insert[TOOL_REF_BLOT] as ToolRefValue | undefined
      if (tool?.name) {
        out += formatToolRef(tool.name, tool.as)
        continue
      }
      const variable = readVariableValue(op.insert[TOOL_VARIABLE_REF_BLOT])
      if (variable.alias && variable.variable) {
        out += formatToolVariableRef(variable.alias, variable.variable)
      }
    }
  }
  return out.endsWith('\n') ? out.slice(0, -1) : out
}

/** Expand plain text into delta ops; optional trailing newline for full-doc seeds. */
export function plainTextToRefsDeltaOps(
  plain: string,
  topicNames: Map<string, string>,
  toolTitles: Map<string, string> = new Map(),
  options: { trailingNewline?: boolean } = {},
): DeltaOp[] {
  const trailingNewline = options.trailingNewline !== false
  const ops: DeltaOp[] = []
  const blocks = parseContentToBlocks(plain)

  const aliasToFrom = new Map<string, string>()
  for (const block of blocks) {
    if (block.type === 'tool' && block.as) {
      aliasToFrom.set(
        block.as.toLowerCase(),
        toolTitles.get(block.name.toLowerCase()) ?? block.name,
      )
    }
  }

  for (const block of blocks) {
    if (block.type === 'text') {
      if (block.content) ops.push({ insert: block.content })
      continue
    }
    if (block.type === 'topic') {
      const name = topicNames.get(block.id.toLowerCase()) ?? ''
      ops.push({
        insert: {
          [TOPIC_REF_BLOT]: {
            id: block.id,
            name: shortTopicLabel(block.id, name),
          } satisfies TopicRefValue,
        },
      })
      continue
    }
    if (block.type === 'tool') {
      const title = toolTitles.get(block.name.toLowerCase()) ?? block.name
      ops.push({
        insert: {
          [TOOL_REF_BLOT]: {
            name: block.name,
            title,
            as: block.as ?? '',
          } satisfies ToolRefValue,
        },
      })
      continue
    }
    if (block.type === 'tool_variable') {
      ops.push({
        insert: {
          [TOOL_VARIABLE_REF_BLOT]: {
            alias: block.ref,
            variable: block.variable,
            from: aliasToFrom.get(block.ref.toLowerCase()) ?? block.ref,
          } satisfies ToolVariableRefValue,
        },
      })
      continue
    }
    const token = serializeContentBlocks([block])
    if (token) ops.push({ insert: token })
  }

  if (trailingNewline) ops.push({ insert: '\n' })
  return ops
}

/**
 * Turn leftover `{{tool…}}` / `{{tool_variable…}}` text ops into embeds.
 * Needed when Quill was seeded from HTML/markdown that left tokens as plain text.
 */
export function hydrateContentRefsInEditor(
  editor: QuillEditorLike,
  topicNames: Map<string, string> = new Map(),
  toolTitles: Map<string, string> = new Map(),
): boolean {
  const ops = editor.getContents().ops ?? []
  const needsHydrate = ops.some(
    (op) => typeof op.insert === 'string' && op.insert.includes('{{'),
  )
  if (!needsHydrate) return false

  const next: DeltaOp[] = []
  for (const op of ops) {
    if (typeof op.insert !== 'string' || !op.insert.includes('{{')) {
      next.push(op)
      continue
    }

    const expanded = plainTextToRefsDeltaOps(op.insert, topicNames, toolTitles, {
      trailingNewline: false,
    })
    if (op.attributes) {
      for (const part of expanded) {
        if (typeof part.insert === 'string') {
          next.push({ insert: part.insert, attributes: op.attributes })
        } else {
          next.push(part)
        }
      }
    } else {
      next.push(...expanded)
    }
  }

  editor.setContents({ ops: next }, 'silent')
  return true
}

export type RefChipStatusOpts = {
  enabledTopicIds: Set<string>
  enabledToolNames: Set<string>
  /** Lowercased alias → tool name (any casing). */
  aliasToToolName: Map<string, string>
}

const STATUS_ENABLED = 'ql-ref-chip--enabled'
const STATUS_DISABLED = 'ql-ref-chip--disabled'

function setChipStatus(el: HTMLElement, enabled: boolean): void {
  el.classList.toggle(STATUS_ENABLED, enabled)
  el.classList.toggle(STATUS_DISABLED, !enabled)
}

/** Build alias → tool name from content that declares `{{tool … as=…}}`. */
export function aliasToToolNameFromContent(content: string): Map<string, string> {
  const map = new Map<string, string>()
  for (const decl of listToolDeclarations(content)) {
    const key = decl.as.toLowerCase()
    if (!map.has(key)) map.set(key, decl.name)
  }
  return map
}

/**
 * Tint topic/tool/variable chips green when the referenced entity is enabled,
 * red when it is not (disabled, missing, or unresolved alias).
 */
export function applyRefChipStatus(
  root: HTMLElement,
  opts: RefChipStatusOpts,
): void {
  const toolEnabled = (rawName: string): boolean => {
    const name = rawName.toLowerCase()
    if (!name) return false
    if (opts.enabledToolNames.has(name)) return true
    const underscored = name.replace(/-/g, '_')
    if (opts.enabledToolNames.has(underscored)) return true
    const hyphenated = name.replace(/_/g, '-')
    return opts.enabledToolNames.has(hyphenated)
  }

  for (const el of Array.from(
    root.querySelectorAll<HTMLElement>('.ql-topic-ref'),
  )) {
    const id = (
      el.dataset.topicId ??
      el.getAttribute('data-topic-id') ??
      ''
    ).toLowerCase()
    setChipStatus(el, Boolean(id && opts.enabledTopicIds.has(id)))
  }

  for (const el of Array.from(
    root.querySelectorAll<HTMLElement>('.ql-tool-ref'),
  )) {
    const name =
      el.dataset.toolName ?? el.getAttribute('data-tool-name') ?? ''
    setChipStatus(el, toolEnabled(name))
  }

  for (const el of Array.from(
    root.querySelectorAll<HTMLElement>('.ql-tool-var-ref'),
  )) {
    const alias = (
      el.dataset.toolVarRef ??
      el.getAttribute('data-tool-var-ref') ??
      ''
    ).toLowerCase()
    const toolName = opts.aliasToToolName.get(alias) ?? ''
    setChipStatus(el, toolEnabled(toolName))
  }
}

export const REF_CHIP_STATUS_CSS = `
.ql-topic-ref.ql-ref-chip--enabled .ql-topic-ref-inner,
.ql-editor .ql-topic-ref.ql-ref-chip--enabled > span[contenteditable="false"],
.ql-tool-ref.ql-ref-chip--enabled .ql-tool-ref-inner,
.ql-editor .ql-tool-ref.ql-ref-chip--enabled > span[contenteditable="false"],
.ql-tool-var-ref.ql-ref-chip--enabled .ql-tool-var-ref-inner,
.ql-editor .ql-tool-var-ref.ql-ref-chip--enabled > span[contenteditable="false"] {
  border-color: color-mix(in srgb, #16a34a 45%, var(--line));
  background: color-mix(in srgb, var(--surface) 82%, #16a34a 18%);
}
.ql-topic-ref.ql-ref-chip--disabled .ql-topic-ref-inner,
.ql-editor .ql-topic-ref.ql-ref-chip--disabled > span[contenteditable="false"],
.ql-tool-ref.ql-ref-chip--disabled .ql-tool-ref-inner,
.ql-editor .ql-tool-ref.ql-ref-chip--disabled > span[contenteditable="false"],
.ql-tool-var-ref.ql-ref-chip--disabled .ql-tool-var-ref-inner,
.ql-editor .ql-tool-var-ref.ql-ref-chip--disabled > span[contenteditable="false"] {
  border-color: color-mix(in srgb, #dc2626 40%, var(--line));
  background: color-mix(in srgb, var(--surface) 82%, #dc2626 18%);
}
`

export const TOOL_CHIP_CSS = `
.ql-tool-ref {
  margin: 0 0.12em;
  cursor: default;
  user-select: none;
  vertical-align: middle;
}
.ql-tool-ref-inner,
.ql-editor .ql-tool-ref > span[contenteditable="false"] {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  max-width: 14rem;
  min-width: 0;
  overflow: hidden;
  box-sizing: border-box;
  padding: 0.05rem 0.4rem 0.05rem 0.3rem;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--ink);
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.25;
  vertical-align: middle;
  white-space: nowrap;
}
.ql-tool-ref-icon {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  color: var(--muted);
}
.ql-tool-ref-icon svg {
  display: block;
  width: 12px;
  height: 12px;
}
.ql-tool-ref-label {
  display: inline-block;
  max-width: 12rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}
.ql-ref-chip-remove {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  margin-left: 0.1rem;
  padding: 0;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--muted);
  font-size: 0.85rem;
  line-height: 1;
  cursor: pointer;
}
.ql-ref-chip-remove:hover {
  color: var(--ink);
  background: color-mix(in srgb, var(--ink) 8%, transparent);
}
`

export const TOOL_VARIABLE_CHIP_CSS = `
.ql-tool-var-ref {
  margin: 0 0.12em;
  cursor: default;
  user-select: none;
  vertical-align: middle;
}
.ql-tool-var-ref-inner,
.ql-editor .ql-tool-var-ref > span[contenteditable="false"] {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  max-width: 14rem;
  min-width: 0;
  overflow: hidden;
  box-sizing: border-box;
  padding: 0.05rem 0.4rem 0.05rem 0.3rem;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--ink);
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.25;
  vertical-align: middle;
  white-space: nowrap;
}
.ql-tool-var-ref-icon {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  color: var(--muted);
}
.ql-tool-var-ref-icon svg {
  display: block;
  width: 12px;
  height: 12px;
}
.ql-tool-var-ref-label {
  display: inline-block;
  max-width: 12rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}
`
