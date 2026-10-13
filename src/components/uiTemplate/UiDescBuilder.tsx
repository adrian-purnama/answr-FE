import { useState, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Gauge,
  Image,
  LayoutGrid,
  List,
  Minus,
  MousePointerClick,
  PieChart,
  Rows3,
  SquareStack,
  Table2,
  Type,
} from 'lucide-react'
import type { UiDesc, UiNode } from '#/uiDesc'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import {
  buttonOutlineClassName,
  inputClassNameCompact,
} from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

const builderInputClassName = cn(
  inputClassNameCompact,
  'px-2.5 py-1.5 text-xs leading-snug',
)

const CHILD_NODE_TYPES = [
  'text',
  'keyValue',
  'status',
  'metric',
  'metricGrid',
  'progress',
  'chart',
  'divider',
  'media',
  'table',
  'buttonGroup',
  'stack',
] as const

type ChildNodeType = (typeof CHILD_NODE_TYPES)[number]
type NodeType = ChildNodeType | 'card'

const STATUS_VALUES = ['pending', 'paid', 'failed', 'expired'] as const
const CHART_VARIANTS = ['bar', 'line', 'pie', 'donut'] as const

const NODE_META: Record<
  NodeType,
  { label: string; hint: string; icon: LucideIcon }
> = {
  text: { label: 'Text', hint: 'A line or paragraph', icon: Type },
  keyValue: { label: 'Details', hint: 'Label / value rows', icon: List },
  status: { label: 'Status', hint: 'Pending, paid, failed…', icon: Gauge },
  metric: { label: 'Metric', hint: 'Big number + label', icon: Gauge },
  metricGrid: {
    label: 'Metric grid',
    hint: '2–3 column stats',
    icon: LayoutGrid,
  },
  progress: { label: 'Progress', hint: 'Quota / percent bar', icon: Gauge },
  chart: {
    label: 'Chart',
    hint: 'Bar, line, pie, donut',
    icon: PieChart,
  },
  divider: { label: 'Divider', hint: 'Horizontal rule', icon: Minus },
  media: { label: 'Image', hint: 'URL, data URL, or payload', icon: Image },
  table: { label: 'Table', hint: 'Headers and rows', icon: Table2 },
  buttonGroup: {
    label: 'Buttons',
    hint: 'Actions the user can tap',
    icon: MousePointerClick,
  },
  stack: { label: 'Group', hint: 'Stack blocks vertically', icon: Rows3 },
  card: { label: 'Card', hint: 'Titled container', icon: SquareStack },
}

export const blankUiTemplateDefinition: UiDesc = {
  version: 1,
  root: {
    type: 'card',
    title: 'Untitled',
    children: [],
  },
}

function createNode(type: ChildNodeType | 'card'): UiNode {
  switch (type) {
    case 'text':
      return { type: 'text', content: '', tone: 'default' }
    case 'keyValue':
      return { type: 'keyValue', rows: [{ label: 'Label', value: '' }] }
    case 'status':
      return { type: 'status', value: 'pending', label: '' }
    case 'metric':
      return { type: 'metric', label: 'Metric', value: '0' }
    case 'metricGrid':
      return {
        type: 'metricGrid',
        columns: 2,
        items: [
          { label: 'Metric A', value: '0' },
          { label: 'Metric B', value: '0' },
        ],
      }
    case 'progress':
      return { type: 'progress', label: 'Progress', value: 40, max: 100 }
    case 'chart':
      return {
        type: 'chart',
        variant: 'bar',
        title: 'Chart',
        series: [
          { label: 'A', value: 40 },
          { label: 'B', value: 55 },
          { label: 'C', value: 30 },
        ],
      }
    case 'divider':
      return { type: 'divider' }
    case 'media':
      return { type: 'media', kind: 'url', src: '', alt: '' }
    case 'table':
      return { type: 'table', headers: ['Column'], rows: [['']] }
    case 'buttonGroup':
      return {
        type: 'buttonGroup',
        buttons: [{ actionId: 'action', label: 'Action' }],
      }
    case 'stack':
      return { type: 'stack', children: [] }
    case 'card':
      return { type: 'card', title: '', children: [] }
  }
}

function nodeSummary(node: UiNode): string {
  switch (node.type) {
    case 'card':
      return node.title?.trim() || `${node.children.length} blocks`
    case 'stack':
      return `${node.children.length} blocks`
    case 'text': {
      const text = (node.content ?? '').trim()
      return text ? text.slice(0, 40) : 'Empty text'
    }
    case 'keyValue':
      return `${node.rows.length} row${node.rows.length === 1 ? '' : 's'}`
    case 'status':
      return node.label?.trim() || node.value || 'Status'
    case 'metric':
      return `${node.label || 'Metric'}: ${node.value || ' '}`
    case 'metricGrid':
      return `${node.items.length} metrics`
    case 'progress':
      return node.label?.trim() || `${node.value ?? 0}/${node.max ?? 100}`
    case 'chart':
      return `${node.variant ?? 'bar'} · ${(node.series ?? []).length} points`
    case 'divider':
      return 'Rule'
    case 'media':
      return node.kind === 'payload'
        ? 'Payload image'
        : (node.src ?? '').trim() || 'Image'
    case 'table':
      return `${node.headers.length} cols · ${node.rows.length} rows`
    case 'buttonGroup':
      return `${node.buttons.length} button${node.buttons.length === 1 ? '' : 's'}`
  }
}

function FieldLabel({ children }: { children: string }) {
  return (
    <span className="text-[11px] text-[var(--muted)]">{children}</span>
  )
}

function BindSection({ children }: { children: ReactNode }) {
  return (
    <details className="rounded-md border border-[var(--line)] bg-[var(--surface)]/50 px-2.5 py-2">
      <summary className="cursor-pointer text-[11px] font-medium text-[var(--muted)]">
        Link to tool data (bind)
      </summary>
      <p className="mt-1.5 text-[10px] leading-relaxed text-[var(--muted)]">
        Name used when mapping this template on an MCP tool.
      </p>
      <div className="mt-2 space-y-2">{children}</div>
    </details>
  )
}

function AddBlockControl({
  onAdd,
}: {
  onAdd: (type: ChildNodeType) => void
}) {
  const [resetKey, setResetKey] = useState(0)

  return (
    <div className="space-y-1">
      <Select
        key={resetKey}
        onValueChange={(value) => {
          if (!value) return
          onAdd(value as ChildNodeType)
          setResetKey((key) => key + 1)
        }}
      >
        <SelectTrigger size="sm" className="w-full">
          <SelectValue placeholder="+ Add block…" />
        </SelectTrigger>
        <SelectContent className="z-[120]">
          {CHILD_NODE_TYPES.map((type) => {
            const Icon = NODE_META[type].icon
            return (
              <SelectItem key={type} value={type}>
                <span className="inline-flex items-center gap-2">
                  <Icon className="size-3.5 opacity-70" aria-hidden />
                  {NODE_META[type].label}
                </span>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
      <p className="text-[10px] text-[var(--muted)]">
        Metrics and charts for stats · Details for label/value rows
      </p>
    </div>
  )
}

function ChildrenEditor({
  nodes,
  pathPrefix,
  expandedPath,
  setExpandedPath,
  onChange,
}: {
  nodes: UiNode[]
  pathPrefix: string
  expandedPath: string | null
  setExpandedPath: (path: string | null) => void
  onChange: (next: UiNode[]) => void
}) {
  function updateAt(index: number, next: UiNode) {
    onChange(nodes.map((child, i) => (i === index ? next : child)))
  }

  function removeAt(index: number) {
    const removedPath = pathPrefix ? `${pathPrefix}.${index}` : String(index)
    if (expandedPath === removedPath || expandedPath?.startsWith(`${removedPath}.`)) {
      setExpandedPath(null)
    }
    onChange(nodes.filter((_, i) => i !== index))
  }

  function move(index: number, delta: number) {
    const target = index + delta
    if (target < 0 || target >= nodes.length) return
    const next = [...nodes]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item!)
    onChange(next)
    const from = pathPrefix ? `${pathPrefix}.${index}` : String(index)
    const to = pathPrefix ? `${pathPrefix}.${target}` : String(target)
    if (expandedPath === from || expandedPath?.startsWith(`${from}.`)) {
      setExpandedPath(
        expandedPath === from
          ? to
          : expandedPath.replace(from, to),
      )
    }
  }

  return (
    <div className="space-y-2">
      {nodes.map((child, index) => {
        const path = pathPrefix ? `${pathPrefix}.${index}` : String(index)
        return (
          <NodeEditor
            key={`${child.type}-${index}`}
            node={child}
            path={path}
            expandedPath={expandedPath}
            setExpandedPath={setExpandedPath}
            onChange={(next) => updateAt(index, next)}
            onRemove={() => removeAt(index)}
            onMoveUp={() => move(index, -1)}
            onMoveDown={() => move(index, 1)}
            canMoveUp={index > 0}
            canMoveDown={index < nodes.length - 1}
          />
        )
      })}
      <AddBlockControl
        onAdd={(type) => {
          const nextIndex = nodes.length
          onChange([...nodes, createNode(type)])
          setExpandedPath(
            pathPrefix ? `${pathPrefix}.${nextIndex}` : String(nextIndex),
          )
        }}
      />
    </div>
  )
}

function NodeEditor({
  node,
  path,
  expandedPath,
  setExpandedPath,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  isRoot = false,
}: {
  node: UiNode
  path: string
  expandedPath: string | null
  setExpandedPath: (path: string | null) => void
  onChange: (next: UiNode) => void
  onRemove?: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  canMoveUp?: boolean
  canMoveDown?: boolean
  isRoot?: boolean
}) {
  const expanded =
    isRoot ||
    expandedPath === path ||
    (expandedPath?.startsWith(`${path}.`) ?? false)
  const meta = NODE_META[node.type]
  const Icon = meta.icon

  function toggle() {
    if (isRoot) return
    setExpandedPath(expanded ? null : path)
  }

  return (
    <div className="min-w-0 max-w-full rounded-md border border-[var(--line)] bg-[var(--surface)]/40">
      <div className="flex min-w-0 items-center gap-1 px-2.5 py-2">
        <button
          type="button"
          className={cn(
            'min-w-0 flex-1 text-left',
            isRoot ? 'cursor-default' : 'cursor-pointer',
          )}
          onClick={toggle}
          disabled={isRoot}
        >
          <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--ink)]">
            <Icon className="size-3.5 shrink-0 text-[var(--muted)]" aria-hidden />
            {meta.label}
            {!isRoot ? (
              <span className="ml-0.5 font-normal text-[var(--muted)]">
                {expanded ? '▾' : '▸'}
              </span>
            ) : null}
          </span>
          <span className="mt-0.5 block truncate pl-5 text-[10px] text-[var(--muted)]">
            {nodeSummary(node)}
          </span>
        </button>
        <div className="flex shrink-0 gap-0.5">
          {onMoveUp ? (
            <button
              type="button"
              className="px-1.5 text-[11px] text-[var(--muted)] hover:text-[var(--ink)] disabled:opacity-40"
              disabled={!canMoveUp}
              onClick={onMoveUp}
              aria-label="Move up"
            >
              ↑
            </button>
          ) : null}
          {onMoveDown ? (
            <button
              type="button"
              className="px-1.5 text-[11px] text-[var(--muted)] hover:text-[var(--ink)] disabled:opacity-40"
              disabled={!canMoveDown}
              onClick={onMoveDown}
              aria-label="Move down"
            >
              ↓
            </button>
          ) : null}
          {onRemove ? (
            <button
              type="button"
              className="px-1.5 text-[11px] text-red-600 hover:underline"
              onClick={onRemove}
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>

      {expanded ? (
        <div className="min-w-0 space-y-2 border-t border-[var(--line)] px-2.5 py-2.5">
          {node.type === 'card' ? (
            <>
              <label className="block space-y-1">
                <FieldLabel>Title</FieldLabel>
                <input
                  className={builderInputClassName}
                  value={node.title ?? ''}
                  onChange={(e) =>
                    onChange({ ...node, title: e.target.value })
                  }
                />
              </label>
              <ChildrenEditor
                nodes={node.children}
                pathPrefix={path}
                expandedPath={expandedPath}
                setExpandedPath={setExpandedPath}
                onChange={(children) => onChange({ ...node, children })}
              />
            </>
          ) : null}

          {node.type === 'stack' ? (
            <ChildrenEditor
              nodes={node.children}
              pathPrefix={path}
              expandedPath={expandedPath}
              setExpandedPath={setExpandedPath}
              onChange={(children) => onChange({ ...node, children })}
            />
          ) : null}

          {node.type === 'text' ? (
            <>
              <label className="block space-y-1">
                <FieldLabel>Content</FieldLabel>
                <textarea
                  className={cn(builderInputClassName, 'min-h-16 text-xs')}
                  value={node.content ?? ''}
                  onChange={(e) =>
                    onChange({ ...node, content: e.target.value })
                  }
                />
              </label>
              <div className="space-y-1">
                <FieldLabel>Tone</FieldLabel>
                <Select
                  value={node.tone ?? 'default'}
                  onValueChange={(value) =>
                    onChange({
                      ...node,
                      tone: value as 'default' | 'muted' | 'emphasis',
                    })
                  }
                >
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[120]">
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="muted">Muted</SelectItem>
                    <SelectItem value="emphasis">Emphasis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <BindSection>
                <label className="block space-y-1">
                  <FieldLabel>Bind name</FieldLabel>
                  <input
                    className={builderInputClassName}
                    placeholder="e.g. title"
                    value={node.bind ?? ''}
                    onChange={(e) =>
                      onChange({
                        ...node,
                        bind: e.target.value.trim() || undefined,
                      })
                    }
                  />
                </label>
              </BindSection>
            </>
          ) : null}

          {node.type === 'status' ? (
            <>
              <div className="space-y-1">
                <FieldLabel>Value</FieldLabel>
                <Select
                  value={node.value ?? 'pending'}
                  onValueChange={(value) =>
                    onChange({
                      ...node,
                      value: value as (typeof STATUS_VALUES)[number],
                    })
                  }
                >
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[120]">
                    {STATUS_VALUES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <label className="block space-y-1">
                <FieldLabel>Label</FieldLabel>
                <input
                  className={builderInputClassName}
                  value={node.label ?? ''}
                  onChange={(e) =>
                    onChange({ ...node, label: e.target.value })
                  }
                />
              </label>
              <BindSection>
                <label className="block space-y-1">
                  <FieldLabel>Bind name</FieldLabel>
                  <input
                    className={builderInputClassName}
                    placeholder="e.g. status"
                    value={node.bind ?? ''}
                    onChange={(e) =>
                      onChange({
                        ...node,
                        bind: e.target.value.trim() || undefined,
                      })
                    }
                  />
                </label>
              </BindSection>
            </>
          ) : null}

          {node.type === 'keyValue' ? (
            <>
              {node.rows.map((row, index) => (
                <div
                  key={index}
                  className="space-y-2 rounded border border-[var(--line)] p-2"
                >
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="block space-y-1">
                      <FieldLabel>Label</FieldLabel>
                      <input
                        className={builderInputClassName}
                        value={row.label}
                        onChange={(e) => {
                          const rows = node.rows.map((r, i) =>
                            i === index ? { ...r, label: e.target.value } : r,
                          )
                          onChange({ ...node, rows })
                        }}
                      />
                    </label>
                    <label className="block space-y-1">
                      <FieldLabel>Value</FieldLabel>
                      <input
                        className={builderInputClassName}
                        value={row.value ?? ''}
                        onChange={(e) => {
                          const rows = node.rows.map((r, i) =>
                            i === index ? { ...r, value: e.target.value } : r,
                          )
                          onChange({ ...node, rows })
                        }}
                      />
                    </label>
                  </div>
                  <BindSection>
                    <label className="block space-y-1">
                      <FieldLabel>Bind name</FieldLabel>
                      <input
                        className={builderInputClassName}
                        placeholder="e.g. amount"
                        value={row.bind ?? ''}
                        onChange={(e) => {
                          const rows = node.rows.map((r, i) =>
                            i === index
                              ? {
                                  ...r,
                                  bind: e.target.value.trim() || undefined,
                                }
                              : r,
                          )
                          onChange({ ...node, rows })
                        }}
                      />
                    </label>
                  </BindSection>
                  <button
                    type="button"
                    className="text-[11px] text-red-600 hover:underline"
                    onClick={() =>
                      onChange({
                        ...node,
                        rows: node.rows.filter((_, i) => i !== index),
                      })
                    }
                  >
                    Remove row
                  </button>
                </div>
              ))}
              <button
                type="button"
                className={cn(buttonOutlineClassName, 'text-[10px]')}
                onClick={() =>
                  onChange({
                    ...node,
                    rows: [...node.rows, { label: 'Label', value: '' }],
                  })
                }
              >
                Add row
              </button>
            </>
          ) : null}

          {node.type === 'media' ? (
            <>
              <div className="space-y-1">
                <FieldLabel>Source type</FieldLabel>
                <Select
                  value={node.kind}
                  onValueChange={(value) => {
                    const kind = value as 'url' | 'dataUrl' | 'payload'
                    if (kind === 'payload') {
                      onChange({
                        type: 'media',
                        kind: 'payload',
                        payload: '',
                        encoding: 'raw',
                        alt: node.alt,
                      })
                    } else {
                      onChange({
                        type: 'media',
                        kind,
                        src: '',
                        alt: node.alt,
                      })
                    }
                  }}
                >
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[120]">
                    <SelectItem value="url">URL</SelectItem>
                    <SelectItem value="dataUrl">Data URL</SelectItem>
                    <SelectItem value="payload">Payload (e.g. QR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {node.kind === 'payload' ? (
                <>
                  <label className="block space-y-1">
                    <FieldLabel>Placeholder payload</FieldLabel>
                    <textarea
                      className={cn(
                        builderInputClassName,
                        'min-h-16 font-mono text-[11px]',
                      )}
                      value={node.payload ?? ''}
                      onChange={(e) =>
                        onChange({ ...node, payload: e.target.value })
                      }
                    />
                  </label>
                  <div className="space-y-1">
                    <FieldLabel>Encoding</FieldLabel>
                    <Select
                      value={node.encoding ?? 'raw'}
                      onValueChange={(value) =>
                        onChange({
                          ...node,
                          encoding: value as 'raw' | 'base64',
                        })
                      }
                    >
                      <SelectTrigger size="sm" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[120]">
                        <SelectItem value="raw">raw</SelectItem>
                        <SelectItem value="base64">base64</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <BindSection>
                    <label className="block space-y-1">
                      <FieldLabel>Bind payload</FieldLabel>
                      <input
                        className={builderInputClassName}
                        placeholder="e.g. qr"
                        value={node.bindPayload ?? ''}
                        onChange={(e) =>
                          onChange({
                            ...node,
                            bindPayload: e.target.value.trim() || undefined,
                          })
                        }
                      />
                    </label>
                  </BindSection>
                </>
              ) : (
                <>
                  <label className="block space-y-1">
                    <FieldLabel>Image URL</FieldLabel>
                    <input
                      className={builderInputClassName}
                      value={node.src ?? ''}
                      onChange={(e) =>
                        onChange({ ...node, src: e.target.value })
                      }
                    />
                  </label>
                  <BindSection>
                    <label className="block space-y-1">
                      <FieldLabel>Bind src</FieldLabel>
                      <input
                        className={builderInputClassName}
                        placeholder="e.g. imageUrl"
                        value={node.bindSrc ?? ''}
                        onChange={(e) =>
                          onChange({
                            ...node,
                            bindSrc: e.target.value.trim() || undefined,
                          })
                        }
                      />
                    </label>
                  </BindSection>
                </>
              )}
              <label className="block space-y-1">
                <FieldLabel>Alt text</FieldLabel>
                <input
                  className={builderInputClassName}
                  value={node.alt ?? ''}
                  onChange={(e) => onChange({ ...node, alt: e.target.value })}
                />
              </label>
            </>
          ) : null}

          {node.type === 'table' ? (
            <>
              <label className="block space-y-1">
                <FieldLabel>Headers (comma-separated)</FieldLabel>
                <input
                  className={builderInputClassName}
                  value={node.headers.join(', ')}
                  onChange={(e) => {
                    const headers = e.target.value
                      .split(',')
                      .map((part) => part.trim())
                      .filter(Boolean)
                    const colCount = Math.max(headers.length, 1)
                    const rows = node.rows.map((row) => {
                      const next = [...row]
                      while (next.length < colCount) next.push('')
                      return next.slice(0, colCount)
                    })
                    onChange({
                      ...node,
                      headers: headers.length > 0 ? headers : ['Column'],
                      rows,
                    })
                  }}
                />
              </label>
              <BindSection>
                <label className="block space-y-1">
                  <FieldLabel>Bind rows</FieldLabel>
                  <input
                    className={builderInputClassName}
                    placeholder="e.g. plans"
                    value={node.bindRows ?? ''}
                    onChange={(e) =>
                      onChange({
                        ...node,
                        bindRows: e.target.value.trim() || undefined,
                      })
                    }
                  />
                </label>
              </BindSection>
              {node.rows.map((row, rowIndex) => (
                <div key={rowIndex} className="flex flex-wrap items-end gap-2">
                  {row.map((cell, colIndex) => (
                    <label
                      key={colIndex}
                      className="block min-w-0 flex-1 space-y-1"
                    >
                      <FieldLabel>
                        {node.headers[colIndex] ?? `Col ${colIndex + 1}`}
                      </FieldLabel>
                      <input
                        className={builderInputClassName}
                        value={cell}
                        onChange={(e) => {
                          const rows = node.rows.map((r, ri) =>
                            ri === rowIndex
                              ? r.map((c, ci) =>
                                  ci === colIndex ? e.target.value : c,
                                )
                              : r,
                          )
                          onChange({ ...node, rows })
                        }}
                      />
                    </label>
                  ))}
                  <button
                    type="button"
                    className="text-[11px] text-red-600 hover:underline"
                    onClick={() =>
                      onChange({
                        ...node,
                        rows: node.rows.filter((_, i) => i !== rowIndex),
                      })
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className={cn(buttonOutlineClassName, 'text-[10px]')}
                onClick={() =>
                  onChange({
                    ...node,
                    rows: [...node.rows, node.headers.map(() => '')],
                  })
                }
              >
                Add row
              </button>
            </>
          ) : null}

          {node.type === 'buttonGroup' ? (
            <>
              {node.buttons.map((button, index) => (
                <div
                  key={index}
                  className="grid gap-2 rounded border border-[var(--line)] p-2 sm:grid-cols-[1fr_1fr_auto]"
                >
                  <label className="block space-y-1">
                    <FieldLabel>Label</FieldLabel>
                    <input
                      className={builderInputClassName}
                      value={button.label}
                      onChange={(e) => {
                        const buttons = node.buttons.map((b, i) =>
                          i === index ? { ...b, label: e.target.value } : b,
                        )
                        onChange({ ...node, buttons })
                      }}
                    />
                  </label>
                  <label className="block space-y-1">
                    <FieldLabel>Action id</FieldLabel>
                    <input
                      className={builderInputClassName}
                      value={button.actionId}
                      onChange={(e) => {
                        const buttons = node.buttons.map((b, i) =>
                          i === index
                            ? { ...b, actionId: e.target.value }
                            : b,
                        )
                        onChange({ ...node, buttons })
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    className="self-end text-[11px] text-red-600 hover:underline"
                    onClick={() =>
                      onChange({
                        ...node,
                        buttons: node.buttons.filter((_, i) => i !== index),
                      })
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className={cn(buttonOutlineClassName, 'text-[10px]')}
                onClick={() =>
                  onChange({
                    ...node,
                    buttons: [
                      ...node.buttons,
                      { actionId: 'action', label: 'Action' },
                    ],
                  })
                }
              >
                Add button
              </button>
            </>
          ) : null}

          {node.type === 'metric' ? (
            <>
              <label className="block space-y-1">
                <FieldLabel>Label</FieldLabel>
                <input
                  className={builderInputClassName}
                  value={node.label ?? ''}
                  onChange={(e) =>
                    onChange({ ...node, label: e.target.value })
                  }
                />
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="block space-y-1">
                  <FieldLabel>Value</FieldLabel>
                  <input
                    className={builderInputClassName}
                    value={node.value ?? ''}
                    onChange={(e) =>
                      onChange({ ...node, value: e.target.value })
                    }
                  />
                </label>
                <label className="block space-y-1">
                  <FieldLabel>Unit</FieldLabel>
                  <input
                    className={builderInputClassName}
                    value={node.unit ?? ''}
                    onChange={(e) =>
                      onChange({
                        ...node,
                        unit: e.target.value.trim() || undefined,
                      })
                    }
                  />
                </label>
              </div>
              <BindSection>
                <label className="block space-y-1">
                  <FieldLabel>Bind value</FieldLabel>
                  <input
                    className={builderInputClassName}
                    placeholder="e.g. requests"
                    value={node.bind ?? ''}
                    onChange={(e) =>
                      onChange({
                        ...node,
                        bind: e.target.value.trim() || undefined,
                      })
                    }
                  />
                </label>
                <label className="block space-y-1">
                  <FieldLabel>Bind label</FieldLabel>
                  <input
                    className={builderInputClassName}
                    placeholder="e.g. metricLabel"
                    value={node.bindLabel ?? ''}
                    onChange={(e) =>
                      onChange({
                        ...node,
                        bindLabel: e.target.value.trim() || undefined,
                      })
                    }
                  />
                </label>
              </BindSection>
            </>
          ) : null}

          {node.type === 'metricGrid' ? (
            <>
              <div className="space-y-1">
                <FieldLabel>Columns</FieldLabel>
                <Select
                  value={String(node.columns ?? 2)}
                  onValueChange={(value) =>
                    onChange({
                      ...node,
                      columns: value === '3' ? 3 : 2,
                    })
                  }
                >
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[120]">
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {node.items.map((item, index) => (
                <div
                  key={index}
                  className="space-y-2 rounded border border-[var(--line)] p-2"
                >
                  <div className="grid gap-2 sm:grid-cols-3">
                    <label className="block space-y-1">
                      <FieldLabel>Label</FieldLabel>
                      <input
                        className={builderInputClassName}
                        value={item.label ?? ''}
                        onChange={(e) => {
                          const items = node.items.map((row, i) =>
                            i === index ? { ...row, label: e.target.value } : row,
                          )
                          onChange({ ...node, items })
                        }}
                      />
                    </label>
                    <label className="block space-y-1">
                      <FieldLabel>Value</FieldLabel>
                      <input
                        className={builderInputClassName}
                        value={item.value ?? ''}
                        onChange={(e) => {
                          const items = node.items.map((row, i) =>
                            i === index ? { ...row, value: e.target.value } : row,
                          )
                          onChange({ ...node, items })
                        }}
                      />
                    </label>
                    <label className="block space-y-1">
                      <FieldLabel>Unit</FieldLabel>
                      <input
                        className={builderInputClassName}
                        value={item.unit ?? ''}
                        onChange={(e) => {
                          const items = node.items.map((row, i) =>
                            i === index
                              ? {
                                  ...row,
                                  unit: e.target.value.trim() || undefined,
                                }
                              : row,
                          )
                          onChange({ ...node, items })
                        }}
                      />
                    </label>
                  </div>
                  <BindSection>
                    <label className="block space-y-1">
                      <FieldLabel>Bind value</FieldLabel>
                      <input
                        className={builderInputClassName}
                        value={item.bind ?? ''}
                        onChange={(e) => {
                          const items = node.items.map((row, i) =>
                            i === index
                              ? {
                                  ...row,
                                  bind: e.target.value.trim() || undefined,
                                }
                              : row,
                          )
                          onChange({ ...node, items })
                        }}
                      />
                    </label>
                  </BindSection>
                  <button
                    type="button"
                    className="text-[11px] text-red-600 hover:underline"
                    onClick={() =>
                      onChange({
                        ...node,
                        items: node.items.filter((_, i) => i !== index),
                      })
                    }
                  >
                    Remove metric
                  </button>
                </div>
              ))}
              <button
                type="button"
                className={cn(buttonOutlineClassName, 'text-[10px]')}
                onClick={() =>
                  onChange({
                    ...node,
                    items: [
                      ...node.items,
                      { label: 'Metric', value: '0' },
                    ],
                  })
                }
              >
                Add metric
              </button>
            </>
          ) : null}

          {node.type === 'progress' ? (
            <>
              <label className="block space-y-1">
                <FieldLabel>Label</FieldLabel>
                <input
                  className={builderInputClassName}
                  value={node.label ?? ''}
                  onChange={(e) =>
                    onChange({ ...node, label: e.target.value })
                  }
                />
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="block space-y-1">
                  <FieldLabel>Value</FieldLabel>
                  <input
                    type="number"
                    className={builderInputClassName}
                    value={node.value ?? 0}
                    onChange={(e) =>
                      onChange({
                        ...node,
                        value: Number(e.target.value) || 0,
                      })
                    }
                  />
                </label>
                <label className="block space-y-1">
                  <FieldLabel>Max</FieldLabel>
                  <input
                    type="number"
                    className={builderInputClassName}
                    value={node.max ?? 100}
                    onChange={(e) =>
                      onChange({
                        ...node,
                        max: Number(e.target.value) || 100,
                      })
                    }
                  />
                </label>
              </div>
              <BindSection>
                <label className="block space-y-1">
                  <FieldLabel>Bind value</FieldLabel>
                  <input
                    className={builderInputClassName}
                    value={node.bind ?? ''}
                    onChange={(e) =>
                      onChange({
                        ...node,
                        bind: e.target.value.trim() || undefined,
                      })
                    }
                  />
                </label>
                <label className="block space-y-1">
                  <FieldLabel>Bind max</FieldLabel>
                  <input
                    className={builderInputClassName}
                    value={node.bindMax ?? ''}
                    onChange={(e) =>
                      onChange({
                        ...node,
                        bindMax: e.target.value.trim() || undefined,
                      })
                    }
                  />
                </label>
              </BindSection>
            </>
          ) : null}

          {node.type === 'chart' ? (
            <>
              <div className="space-y-1">
                <FieldLabel>Variant</FieldLabel>
                <Select
                  value={node.variant ?? 'bar'}
                  onValueChange={(value) =>
                    onChange({
                      ...node,
                      variant: value as (typeof CHART_VARIANTS)[number],
                    })
                  }
                >
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[120]">
                    {CHART_VARIANTS.map((variant) => (
                      <SelectItem key={variant} value={variant}>
                        <span className="inline-flex items-center gap-2">
                          {variant === 'bar' || variant === 'line' ? (
                            <BarChart3 className="size-3.5 opacity-70" />
                          ) : (
                            <PieChart className="size-3.5 opacity-70" />
                          )}
                          {variant}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <label className="block space-y-1">
                <FieldLabel>Title</FieldLabel>
                <input
                  className={builderInputClassName}
                  value={node.title ?? ''}
                  onChange={(e) =>
                    onChange({ ...node, title: e.target.value })
                  }
                />
              </label>
              {(node.series ?? []).map((point, index) => (
                <div
                  key={index}
                  className="grid gap-2 rounded border border-[var(--line)] p-2 sm:grid-cols-[1fr_1fr_auto]"
                >
                  <label className="block space-y-1">
                    <FieldLabel>Label</FieldLabel>
                    <input
                      className={builderInputClassName}
                      value={point.label}
                      onChange={(e) => {
                        const series = (node.series ?? []).map((row, i) =>
                          i === index ? { ...row, label: e.target.value } : row,
                        )
                        onChange({ ...node, series })
                      }}
                    />
                  </label>
                  <label className="block space-y-1">
                    <FieldLabel>Value</FieldLabel>
                    <input
                      type="number"
                      className={builderInputClassName}
                      value={point.value}
                      onChange={(e) => {
                        const series = (node.series ?? []).map((row, i) =>
                          i === index
                            ? { ...row, value: Number(e.target.value) || 0 }
                            : row,
                        )
                        onChange({ ...node, series })
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    className="self-end text-[11px] text-red-600 hover:underline"
                    onClick={() =>
                      onChange({
                        ...node,
                        series: (node.series ?? []).filter(
                          (_, i) => i !== index,
                        ),
                      })
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className={cn(buttonOutlineClassName, 'text-[10px]')}
                onClick={() =>
                  onChange({
                    ...node,
                    series: [
                      ...(node.series ?? []),
                      { label: 'Point', value: 10 },
                    ],
                  })
                }
              >
                Add point
              </button>
              <BindSection>
                <label className="block space-y-1">
                  <FieldLabel>Bind series</FieldLabel>
                  <input
                    className={builderInputClassName}
                    placeholder="e.g. channels"
                    value={node.bindSeries ?? ''}
                    onChange={(e) =>
                      onChange({
                        ...node,
                        bindSeries: e.target.value.trim() || undefined,
                      })
                    }
                  />
                </label>
              </BindSection>
            </>
          ) : null}

          {node.type === 'divider' ? (
            <p className="text-[11px] text-[var(--muted)]">
              Horizontal rule   no settings.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export default function UiDescBuilder({
  value,
  onChange,
}: {
  value: UiDesc
  onChange: (next: UiDesc) => void
}) {
  const [expandedPath, setExpandedPath] = useState<string | null>(null)

  return (
    <div className="min-w-0 max-w-full space-y-2">
      <p className="text-[11px] text-[var(--muted)]">
        Click a block to edit. Add metrics or charts for stats cards.
      </p>
      <NodeEditor
        node={value.root}
        path="root"
        isRoot
        expandedPath={expandedPath}
        setExpandedPath={setExpandedPath}
        onChange={(root) => onChange({ ...value, root })}
      />
    </div>
  )
}

