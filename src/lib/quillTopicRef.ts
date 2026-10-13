import {
  formatTopicRef,
  parseContentToBlocks,
  serializeContentBlocks,
} from '#/lib/contentReferences'

export const TOPIC_REF_BLOT = 'topicRef'

export type TopicRefValue = {
  id: string
  name: string
}

type QuillStatic = {
  import: (path: string) => unknown
  register: (blot: unknown, suppressWarning?: boolean) => void
}

type DeltaOp = {
  insert?: string | Record<string, unknown>
}

type DeltaLike = {
  ops?: DeltaOp[]
}

const WAYPOINTS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="4.5" r="2.5"/><path d="m10.2 6.3-1.5 4.2a2 2 0 0 0 .9 2.4l.7.4"/><path d="m13.8 6.3 1.5 4.2a2 2 0 0 1-.9 2.4l-.7.4"/><circle cx="4.5" cy="19.5" r="2.5"/><circle cx="19.5" cy="19.5" r="2.5"/><path d="m7 17.5 5-3 5 3"/></svg>`

const LABEL_MAX = 24

let registered = false

export function shortTopicLabel(id: string, name?: string): string {
  const trimmed = name?.trim()
  const raw = trimmed || (id.length <= 8 ? id : `${id.slice(0, 6)}…`)
  if (raw.length <= LABEL_MAX) return raw
  return `${raw.slice(0, LABEL_MAX - 1)}…`
}

function fillChip(host: HTMLElement, value: TopicRefValue): void {
  host.replaceChildren()

  const icon = document.createElement('span')
  icon.className = 'ql-topic-ref-icon'
  icon.setAttribute('aria-hidden', 'true')
  icon.innerHTML = WAYPOINTS_SVG

  const label = document.createElement('span')
  label.className = 'ql-topic-ref-label'
  label.textContent = shortTopicLabel(value.id, value.name)

  const remove = document.createElement('button')
  remove.type = 'button'
  remove.className = 'ql-ref-chip-remove'
  remove.setAttribute('aria-label', 'Remove reference')
  remove.setAttribute('tabindex', '-1')
  remove.textContent = '×'

  host.append(icon, label, remove)
}

/** Read-only / DOM helper    mirrors Quill contentNode chip markup. */
export function buildTopicChipElement(value: TopicRefValue): HTMLSpanElement {
  const node = document.createElement('span')
  node.className = 'ql-topic-ref'
  node.dataset.topicId = value.id
  node.dataset.topicName = value.name
  node.setAttribute('title', value.name.trim() || formatTopicRef(value.id))

  const inner = document.createElement('span')
  inner.className = 'ql-topic-ref-inner'
  fillChip(inner, value)
  node.append(inner)
  return node
}

export function registerTopicRefBlot(Quill: QuillStatic): void {
  if (registered) return

  type EmbedCtor = {
    new (...args: unknown[]): object
    create: (value?: unknown) => HTMLElement
    blotName?: string
    tagName?: string
    className?: string
  }

  const Embed = Quill.import('blots/embed') as EmbedCtor

  class TopicRefBlot extends (Embed as unknown as new (
    ...args: unknown[]
  ) => object) {
    static blotName = TOPIC_REF_BLOT
    static tagName = 'SPAN'
    static className = 'ql-topic-ref'

    static create(value: TopicRefValue): HTMLElement {
      const node = Embed.create.call(this, value) as HTMLElement
      const data: TopicRefValue = {
        id: typeof value?.id === 'string' ? value.id : '',
        name: typeof value?.name === 'string' ? value.name : '',
      }
      node.dataset.topicId = data.id
      node.dataset.topicName = data.name
      node.setAttribute('title', data.name.trim() || formatTopicRef(data.id))
      // Children are moved into Quill's contentNode wrapper on construct.
      fillChip(node, data)
      return node
    }

    static value(node: HTMLElement): TopicRefValue {
      return {
        id: node.dataset.topicId ?? '',
        name: node.dataset.topicName ?? '',
      }
    }
  }

  Quill.register(TopicRefBlot, true)
  registered = true
}

export function serializeDeltaToPlainText(
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
      const ref = op.insert[TOPIC_REF_BLOT] as TopicRefValue | undefined
      if (ref?.id) out += formatTopicRef(ref.id)
    }
  }
  return out.endsWith('\n') ? out.slice(0, -1) : out
}

export function plainTextToDeltaOps(
  plain: string,
  names: Map<string, string>,
): DeltaOp[] {
  const ops: DeltaOp[] = []
  const blocks = parseContentToBlocks(plain)

  for (const block of blocks) {
    if (block.type === 'text') {
      if (block.content) ops.push({ insert: block.content })
      continue
    }
    if (block.type === 'topic') {
      const name = names.get(block.id.toLowerCase()) ?? ''
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
    const token = serializeContentBlocks([block])
    if (token) ops.push({ insert: token })
  }

  ops.push({ insert: '\n' })
  return ops
}

/**
 * Quill Embed DOM:
 *   span.ql-topic-ref
 *     \uFEFF
 *     span[contenteditable=false]   ← style this as the chip
 *       icon + label
 *     \uFEFF
 * Read-only DOM uses span.ql-topic-ref > span.ql-topic-ref-inner instead.
 */
export const TOPIC_CHIP_CSS = `
.ql-topic-ref {
  margin: 0 0.12em;
  cursor: default;
  user-select: none;
  vertical-align: middle;
}
.ql-topic-ref-inner,
.ql-editor .ql-topic-ref > span[contenteditable="false"] {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  max-width: 11rem;
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
.ql-topic-ref-icon {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  color: var(--muted);
}
.ql-topic-ref-icon svg {
  display: block;
  width: 12px;
  height: 12px;
}
.ql-topic-ref-label {
  display: inline-block;
  max-width: 9rem;
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
