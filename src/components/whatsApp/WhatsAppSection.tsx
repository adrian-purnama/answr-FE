import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react'
import toast from 'react-hot-toast'
import {
  Braces,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Flag,
  Headset,
  ListPlus,
  LogOut,
  MessageCircle,
  MessageCircleQuestion,
  MessageSquare,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  SquarePlus,
  Trash2,
  X,
  Zap,
  ZoomIn,
  ZoomOut,
  type LucideIcon,
} from 'lucide-react'
import { usePlan } from '#/context/planContext'
import {
  getWhatsAppFlow,
  getWhatsAppQr,
  getWhatsAppSettings,
  logoutWhatsApp,
  restartWhatsApp,
  saveWhatsAppFlow,
  updateWhatsAppSettings,
  type FlowNode,
  type WhatsAppSettings,
} from '#/lib/whatsApp'
import { getLeadCaptureSettings } from '#/lib/leadCapture'
import { listEnabledMcpTools, type McpTool } from '#/lib/mcp'
import {
  hintClassName,
  inputClassNameCompact,
  projectSectionClassName,
} from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

type WhatsAppSectionProps = {
  apiKeyId: string
}

const iconButtonClassName =
  'flex size-8 items-center justify-center rounded-md border border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)] disabled:opacity-50'

function statusLabel(status: string): string {
  if (status === 'WORKING') return 'Working'
  if (status === 'SCAN_QR_CODE') return 'Ready to scan'
  if (status === 'FAILED') return 'Failed'
  if (status === 'STARTING') return 'Starting'
  return status
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === 'WORKING'
      ? 'bg-emerald-50 text-emerald-800'
      : status === 'SCAN_QR_CODE'
        ? 'bg-amber-50 text-amber-900'
        : status === 'FAILED'
          ? 'bg-red-50 text-red-800'
          : 'bg-[var(--surface)] text-[var(--muted)]'
  const dot =
    status === 'WORKING'
      ? 'bg-emerald-500'
      : status === 'SCAN_QR_CODE'
        ? 'bg-amber-500'
        : status === 'FAILED'
          ? 'bg-red-500'
          : 'bg-[var(--muted)]'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium',
        tone,
      )}
    >
      <span className={cn('size-1.5 rounded-full', dot)} aria-hidden />
      {statusLabel(status)}
    </span>
  )
}

export default function WhatsAppSection({ apiKeyId }: WhatsAppSectionProps) {
  const { plan } = usePlan()
  const planAllows = plan?.whatsApp === true

  const [settings, setSettings] = useState<WhatsAppSettings | null>(null)
  const [loading, setLoading] = useState(planAllows)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [qrSrc, setQrSrc] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(false)

  const load = useCallback(async (quiet = false) => {
    if (!planAllows) {
      setSettings(null)
      setLoading(false)
      return
    }
    if (quiet) setRefreshing(true)
    else setLoading(true)
    try {
      const response = await getWhatsAppSettings(apiKeyId)
      if (!response.success || !response.data) {
        toast.error(response.message || 'Failed to load WhatsApp settings')
        return
      }
      setSettings(response.data)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to load WhatsApp settings',
      )
    } finally {
      if (quiet) setRefreshing(false)
      else setLoading(false)
    }
  }, [apiKeyId, planAllows])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!planAllows || !settings?.enabled || settings.status !== 'SCAN_QR_CODE') {
      setQrSrc(null)
      return
    }
    let cancelled = false
    setQrLoading(true)
    void (async () => {
      try {
        const response = await getWhatsAppQr(apiKeyId)
        if (cancelled) return
        if (!response.success || !response.data?.imageBase64) {
          toast.error(response.message || 'Failed to load WhatsApp QR')
          setQrSrc(null)
          return
        }
        setQrSrc(`data:image/png;base64,${response.data.imageBase64}`)
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error ? error.message : 'Failed to load WhatsApp QR',
          )
          setQrSrc(null)
        }
      } finally {
        if (!cancelled) setQrLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [apiKeyId, planAllows, settings?.enabled, settings?.status])

  async function patch(
    next: Partial<Pick<WhatsAppSettings, 'enabled' | 'defaultFlow'>>,
  ) {
    if (!settings || saving) return
    if (next.enabled === undefined && next.defaultFlow === undefined) return
    const previous = settings
    setSettings({ ...settings, ...next })
    setSaving(true)
    try {
      const response = await updateWhatsAppSettings(apiKeyId, next)
      if (!response.success || !response.data) {
        setSettings(previous)
        toast.error(response.message || 'Failed to update WhatsApp settings')
        return
      }
      setSettings(response.data)
      toast.success(
        next.defaultFlow !== undefined
          ? response.data.defaultFlow
            ? 'Flow on'
            : 'Flow off'
          : response.data.enabled
            ? 'WhatsApp enabled'
            : 'WhatsApp disabled',
      )
    } catch (error) {
      setSettings(previous)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update WhatsApp settings',
      )
    } finally {
      setSaving(false)
    }
  }

  async function runSessionAction(action: 'logout' | 'restart') {
    if (!settings || saving) return
    setSaving(true)
    try {
      const response =
        action === 'logout'
          ? await logoutWhatsApp(apiKeyId)
          : await restartWhatsApp(apiKeyId)
      if (!response.success || !response.data) {
        toast.error(
          response.message ||
            (action === 'logout'
              ? 'Failed to log out WhatsApp'
              : 'Failed to restart WhatsApp'),
        )
        return
      }
      setSettings(response.data)
      toast.success(action === 'logout' ? 'WhatsApp logged out' : 'WhatsApp restarted')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update WhatsApp',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={cn(projectSectionClassName, 'min-w-0 space-y-8')}>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <MessageCircle className="size-5 text-[var(--muted)]" aria-hidden />
            <h1 className="text-xl font-semibold text-[var(--ink)]">WhatsApp</h1>
          </div>
          <p className={cn(hintClassName, 'mt-1 max-w-xl')}>
            Enable WhatsApp for this project when your plan includes the channel.
          </p>
        </div>
      </header>

      {!planAllows ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Your current plan does not include WhatsApp.
        </p>
      ) : loading ? (
        <p className={hintClassName}>Loading…</p>
      ) : (
        <section className="space-y-5">
          <label
            htmlFor="whatsapp-enabled"
            className={cn(
              'inline-flex items-center gap-3',
              saving && 'pointer-events-none opacity-60',
            )}
          >
            <span className="text-sm font-medium text-[var(--ink)]">Enabled</span>
            <span className="relative inline-flex shrink-0">
              <input
                id="whatsapp-enabled"
                type="checkbox"
                className="peer sr-only"
                checked={settings?.enabled ?? false}
                disabled={!settings || saving}
                onChange={() =>
                  void patch({ enabled: !(settings?.enabled ?? false) })
                }
              />
              <span
                className={cn(
                  'block h-6 w-11 rounded-full border border-[var(--line)] bg-[var(--surface)] transition',
                  'peer-checked:border-[var(--ink)] peer-checked:bg-[var(--ink)]',
                )}
                aria-hidden
              />
              <span
                className={cn(
                  'pointer-events-none absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition',
                  'peer-checked:translate-x-5',
                )}
                aria-hidden
              />
            </span>
          </label>
          <label
            htmlFor="whatsapp-flow"
            className={cn(
              'inline-flex items-center gap-3',
              saving && 'pointer-events-none opacity-60',
            )}
          >
            <span className="text-sm font-medium text-[var(--ink)]">Flow</span>
            <span className="relative inline-flex shrink-0">
              <input
                id="whatsapp-flow"
                type="checkbox"
                className="peer sr-only"
                checked={settings?.defaultFlow ?? false}
                disabled={!settings || saving}
                onChange={() =>
                  void patch({ defaultFlow: !(settings?.defaultFlow ?? false) })
                }
              />
              <span
                className={cn(
                  'block h-6 w-11 rounded-full border border-[var(--line)] bg-[var(--surface)] transition',
                  'peer-checked:border-[var(--ink)] peer-checked:bg-[var(--ink)]',
                )}
                aria-hidden
              />
              <span
                className={cn(
                  'pointer-events-none absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition',
                  'peer-checked:translate-x-5',
                )}
                aria-hidden
              />
            </span>
          </label>
          {settings?.defaultFlow ? <FlowBuilder apiKeyId={apiKeyId} /> : null}
          {settings?.enabled ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                {settings.mePushName ? (
                  <p className="text-sm font-medium text-[var(--ink)]">
                    {settings.mePushName}
                  </p>
                ) : null}
                {settings.status ? <StatusPill status={settings.status} /> : null}
                <span className="h-4 w-px bg-[var(--line)]" aria-hidden />
                <button
                  type="button"
                  className={iconButtonClassName}
                  aria-label="Refresh"
                  disabled={saving || refreshing}
                  onClick={() => void load(true)}
                >
                  <RefreshCw
                    className={cn('size-4', refreshing && 'animate-spin')}
                    aria-hidden
                  />
                </button>
                {settings.status === 'WORKING' ? (
                  <button
                    type="button"
                    className={iconButtonClassName}
                    aria-label="Log out"
                    disabled={saving}
                    onClick={() => void runSessionAction('logout')}
                  >
                    <LogOut className="size-4" aria-hidden />
                  </button>
                ) : null}
                {settings.status === 'FAILED' ? (
                  <button
                    type="button"
                    className={iconButtonClassName}
                    aria-label="Restart"
                    disabled={saving}
                    onClick={() => void runSessionAction('restart')}
                  >
                    <RotateCcw className="size-4" aria-hidden />
                  </button>
                ) : null}
              </div>
              {settings.status === 'SCAN_QR_CODE' ? (
                <div className="space-y-2">
                  <p className={hintClassName}>
                    Scan this QR code in WhatsApp to connect.
                  </p>
                  {qrLoading ? (
                    <p className={hintClassName}>Loading QR…</p>
                  ) : qrSrc ? (
                    <img
                      src={qrSrc}
                      alt="WhatsApp QR code"
                      className="size-56 rounded-md border border-[var(--line)] bg-white p-2"
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      )}
    </div>
  )
}

function nodeTitle(node: FlowNode): string {
  if (node.type === 'menu') return node.header.trim() || 'Menu'
  if (node.leafType === 'text') return 'Text'
  if (node.leafType === 'function_call') return node.label.trim() || node.functionName.trim() || 'Function'
  if (node.leafType === 'agent_support') return node.handoffTarget.trim() || 'Agent'
  return 'Form'
}

type CanvasPoint = { x: number; y: number }

type FlowLink = { key: string; from: CanvasPoint; to: CanvasPoint }

function canvasPoint(
  canvas: HTMLElement,
  clientX: number,
  clientY: number,
  scale: number,
): CanvasPoint {
  const rect = canvas.getBoundingClientRect()
  return {
    x: Math.round((clientX - rect.left) / scale),
    y: Math.round((clientY - rect.top) / scale),
  }
}

function boxPoint(
  origin: DOMRect,
  box: DOMRect,
  edge: 'center' | 'left',
  scale: number,
): CanvasPoint {
  const x = edge === 'center' ? box.left + box.width / 2 : box.left
  return {
    x: Math.round((x - origin.left) / scale),
    y: Math.round((box.top + box.height / 2 - origin.top) / scale),
  }
}

const FLOW_COLUMN = 360
const FLOW_ROW = 280

function defaultPlaces(nodes: FlowNode[]): Record<string, CanvasPoint> {
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const root = nodes.find((node) => node.root) ?? nodes[0]
  const columns: string[][] = []
  const seen = new Set<string>()
  const queue: { id: string; depth: number }[] = root ? [{ id: root.id, depth: 0 }] : []
  while (queue.length > 0) {
    const item = queue.shift()
    if (!item || seen.has(item.id) || !byId.has(item.id)) continue
    seen.add(item.id)
    const column = columns[item.depth] ?? []
    columns[item.depth] = column
    column.push(item.id)
    const node = byId.get(item.id)
    if (node?.type !== 'menu') continue
    for (const option of node.options) {
      if (!seen.has(option.targetNodeId)) {
        queue.push({ id: option.targetNodeId, depth: item.depth + 1 })
      }
    }
  }
  const loose = nodes.filter((node) => !seen.has(node.id)).map((node) => node.id)
  if (loose.length > 0) {
    const column = columns[0] ?? []
    columns[0] = column
    column.push(...loose)
  }
  const places: Record<string, CanvasPoint> = {}
  columns.forEach((column, columnIndex) => {
    column.forEach((id, rowIndex) => {
      places[id] = { x: 48 + columnIndex * FLOW_COLUMN, y: 48 + rowIndex * FLOW_ROW }
    })
  })
  return places
}

function mergePlaces(
  nodes: FlowNode[],
  current: Record<string, CanvasPoint>,
): Record<string, CanvasPoint> {
  const ids = nodes.map((node) => node.id)
  if (ids.length === 0) return {}
  if (ids.length === Object.keys(current).length && ids.every((id) => current[id])) {
    return current
  }
  if (ids.every((id) => !current[id])) return defaultPlaces(nodes)
  const next: Record<string, CanvasPoint> = {}
  for (const id of ids) {
    const place = current[id]
    if (place) next[id] = place
  }
  const missing = ids.filter((id) => !next[id])
  const maxX = Object.values(next).reduce((max, point) => Math.max(max, point.x), 48)
  missing.forEach((id, index) => {
    next[id] = { x: maxX + FLOW_COLUMN, y: 48 + index * FLOW_ROW }
  })
  return next
}

function flowCurve(from: CanvasPoint, to: CanvasPoint): string {
  const bend = Math.max(48, Math.abs(to.x - from.x) / 2)
  return `M ${from.x} ${from.y} C ${from.x + bend} ${from.y}, ${to.x - bend} ${to.y}, ${to.x} ${to.y}`
}

function sameLinks(left: FlowLink[], right: FlowLink[]): boolean {
  if (left.length !== right.length) return false
  return left.every((link, index) => {
    const other = right[index]
    return (
      other !== undefined &&
      link.key === other.key &&
      link.from.x === other.from.x &&
      link.from.y === other.from.y &&
      link.to.x === other.to.x &&
      link.to.y === other.to.y
    )
  })
}

function menuNode(id: string, root: boolean): FlowNode {
  return { id, type: 'menu', root, header: '', options: [] }
}

function leafNode(
  id: string,
  root: boolean,
  leafType: 'text' | 'function_call' | 'agent_support' | 'form',
): FlowNode {
  if (leafType === 'text') return { id, type: 'leaf', root, leafType, body: '' }
  if (leafType === 'function_call') {
    return {
      id,
      type: 'leaf',
      root,
      leafType,
      label: '',
      functionName: '',
      parameters: '',
      askParameters: false,
    }
  }
  if (leafType === 'agent_support') {
    return { id, type: 'leaf', root, leafType, handoffTarget: '' }
  }
  return { id, type: 'leaf', root, leafType, fields: [] }
}

function flowErrors(nodes: FlowNode[]): string[] {
  if (nodes.length === 0) return []
  const errors: string[] = []
  const ids = new Set(nodes.map((node) => node.id))
  if (ids.size !== nodes.length) errors.push('Node ids must be unique')
  if (nodes.filter((node) => node.root).length !== 1) {
    errors.push('Choose one root node')
  }
  for (const node of nodes) {
    if (node.type !== 'menu') continue
    const labels = new Set<string>()
    for (const option of node.options) {
      const label = option.label.trim()
      if (!label) errors.push('Every option needs a label')
      else if (label === 'Back') errors.push('Back is reserved')
      else if (labels.has(label)) errors.push(`Duplicate option “${label}”`)
      else labels.add(label)
      if (!ids.has(option.targetNodeId)) errors.push('Every option needs a target')
    }
  }
  return [...new Set(errors)]
}

function FlowBuilder({ apiKeyId }: { apiKeyId: string }) {
  const [nodes, setNodes] = useState<FlowNode[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const errors = flowErrors(nodes)
  const selected = nodes.find((node) => node.id === selectedId) ?? null

  useEffect(() => {
    let cancelled = false
    void getWhatsAppFlow(apiKeyId)
      .then((response) => {
        if (cancelled) return
        if (!response.success || !response.data) {
          toast.error(response.message || 'Failed to load flow')
          return
        }
        setNodes(response.data)
        setSelectedId(response.data[0]?.id ?? null)
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : 'Failed to load flow')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [apiKeyId])

  function replace(id: string, next: FlowNode) {
    setNodes((current) => current.map((node) => (node.id === id ? next : node)))
  }

  function addNode(kind: 'menu' | 'leaf') {
    const id = crypto.randomUUID()
    const root = nodes.length === 0
    const node = kind === 'menu' ? menuNode(id, root) : leafNode(id, root, 'text')
    setNodes((current) => [...current, node])
    setSelectedId(id)
  }

  function removeNode(id: string) {
    setNodes((current) => current.filter((node) => node.id !== id))
    setSelectedId((current) => (current === id ? null : current))
  }

  function makeRoot(id: string) {
    setNodes((current) => current.map((node) => ({ ...node, root: node.id === id })))
  }

  function connect(nodeId: string, optionIndex: number, targetNodeId: string) {
    setNodes((current) =>
      current.map((node) => {
        if (node.id !== nodeId || node.type !== 'menu') return node
        return {
          ...node,
          options: node.options.map((option, index) =>
            index === optionIndex ? { ...option, targetNodeId } : option,
          ),
        }
      }),
    )
  }

  async function save() {
    if (saving || errors.length > 0) return
    setSaving(true)
    try {
      const response = await saveWhatsAppFlow(apiKeyId, nodes)
      if (!response.success || !response.data) {
        toast.error(response.message || 'Failed to save flow')
        return
      }
      setNodes(response.data)
      toast.success('Flow saved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save flow')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className={hintClassName}>Loading flow…</p>

  return (
    <div className="space-y-4 rounded-md border border-[var(--line)] p-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={iconButtonClassName}
          aria-label="Add menu"
          title="Add menu"
          onClick={() => addNode('menu')}
        >
          <ListPlus className="size-4" />
        </button>
        <button
          type="button"
          className={iconButtonClassName}
          aria-label="Add leaf"
          title="Add leaf"
          onClick={() => addNode('leaf')}
        >
          <SquarePlus className="size-4" />
        </button>
        <button
          type="button"
          className={iconButtonClassName}
          aria-label="Delete"
          title="Delete"
          disabled={!selected}
          onClick={() => selected && removeNode(selected.id)}
        >
          <Trash2 className="size-4" />
        </button>
        <button
          type="button"
          className={iconButtonClassName}
          aria-label="Root"
          title="Root"
          disabled={!selected || selected.root}
          onClick={() => selected && makeRoot(selected.id)}
        >
          <Flag className="size-4" />
        </button>
        <button
          type="button"
          className={iconButtonClassName}
          aria-label="Save"
          title="Save"
          disabled={saving || errors.length > 0}
          onClick={() => void save()}
        >
          <Save className="size-4" />
        </button>
      </div>
      {errors.length > 0 ? (
        <ul className="list-disc pl-5 text-sm text-red-700">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}
      <FlowCanvas
        apiKeyId={apiKeyId}
        nodes={nodes}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onChange={replace}
        onConnect={connect}
      />
    </div>
  )
}

function FlowCanvas({
  apiKeyId,
  nodes,
  selectedId,
  onSelect,
  onChange,
  onConnect,
}: {
  apiKeyId: string
  nodes: FlowNode[]
  selectedId: string | null
  onSelect: (id: string) => void
  onChange: (id: string, next: FlowNode) => void
  onConnect: (nodeId: string, optionIndex: number, targetNodeId: string) => void
}) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef({ x: 0, y: 0, scale: 1 })
  const dragRef = useRef<{ nodeId: string; optionIndex: number } | null>(null)
  const panRef = useRef<{ x: number; y: number; viewX: number; viewY: number } | null>(null)
  const cardDragRef = useRef<{
    id: string
    x: number
    y: number
    origin: CanvasPoint
  } | null>(null)
  const [view, setView] = useState(viewRef.current)
  const [places, setPlaces] = useState<Record<string, CanvasPoint>>({})
  const [links, setLinks] = useState<FlowLink[]>([])
  const [draft, setDraft] = useState<{ from: CanvasPoint; to: CanvasPoint } | null>(null)

  function setViewBoth(next: { x: number; y: number; scale: number }) {
    viewRef.current = next
    setView(next)
  }

  useLayoutEffect(() => {
    setPlaces((current) => mergePlaces(nodes, current))
  }, [nodes])

  const measure = useCallback(() => {
    const canvas = worldRef.current
    if (!canvas) return
    const origin = canvas.getBoundingClientRect()
    const scale = viewRef.current.scale || 1
    const next: FlowLink[] = []
    for (const node of nodes) {
      if (node.type !== 'menu') continue
      node.options.forEach((option, index) => {
        if (!option.targetNodeId) return
        const portId = `${node.id}:${index}`
        const handle = [...canvas.querySelectorAll<HTMLElement>('[data-port]')].find(
          (element) => element.dataset.port === portId,
        )
        const target = [...canvas.querySelectorAll<HTMLElement>('[data-node-id]')].find(
          (element) => element.dataset.nodeId === option.targetNodeId,
        )
        if (!handle || !target) return
        next.push({
          key: `${node.id}:${index}`,
          from: boxPoint(origin, handle.getBoundingClientRect(), 'center', scale),
          to: boxPoint(origin, target.getBoundingClientRect(), 'left', scale),
        })
      })
    }
    setLinks((current) => (sameLinks(current, next) ? current : next))
  }, [nodes])

  useLayoutEffect(() => {
    measure()
  }, [measure, places])

  useEffect(() => {
    const world = worldRef.current
    if (!world) return
    const observer = new ResizeObserver(() => measure())
    observer.observe(world)
    for (const card of world.querySelectorAll('[data-node-id]')) observer.observe(card)
    return () => observer.disconnect()
  }, [measure, nodes, places])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    function onWheel(event: WheelEvent) {
      event.preventDefault()
      const current = viewRef.current
      if (event.ctrlKey) {
        const rect = viewport!.getBoundingClientRect()
        const px = event.clientX - rect.left
        const py = event.clientY - rect.top
        const nextScale = Math.min(2, Math.max(0.35, current.scale * (event.deltaY < 0 ? 1.08 : 0.92)))
        const ratio = nextScale / current.scale
        setViewBoth({
          scale: nextScale,
          x: px - (px - current.x) * ratio,
          y: py - (py - current.y) * ratio,
        })
        return
      }
      setViewBoth({
        ...current,
        x: current.x - event.deltaX,
        y: current.y - event.deltaY,
      })
    }
    viewport.addEventListener('wheel', onWheel, { passive: false })
    return () => viewport.removeEventListener('wheel', onWheel)
  }, [])

  function zoomBy(factor: number) {
    const viewport = viewportRef.current
    if (!viewport) return
    const current = viewRef.current
    const rect = viewport.getBoundingClientRect()
    const px = rect.width / 2
    const py = rect.height / 2
    const nextScale = Math.min(2, Math.max(0.35, current.scale * factor))
    const ratio = nextScale / current.scale
    setViewBoth({
      scale: nextScale,
      x: px - (px - current.x) * ratio,
      y: py - (py - current.y) * ratio,
    })
  }

  function onPortPointerDown(
    event: PointerEvent<HTMLButtonElement>,
    nodeId: string,
    optionIndex: number,
  ) {
    const canvas = worldRef.current
    if (!canvas) return
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { nodeId, optionIndex }
    const scale = viewRef.current.scale || 1
    setDraft({
      from: boxPoint(
        canvas.getBoundingClientRect(),
        event.currentTarget.getBoundingClientRect(),
        'center',
        scale,
      ),
      to: canvasPoint(canvas, event.clientX, event.clientY, scale),
    })
  }

  function onPortPointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (!dragRef.current) return
    const canvas = worldRef.current
    if (!canvas) return
    const to = canvasPoint(canvas, event.clientX, event.clientY, viewRef.current.scale || 1)
    setDraft((current) => (current ? { ...current, to } : current))
  }

  function onPortPointerUp(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current
    dragRef.current = null
    setDraft(null)
    if (!drag || event.type === 'pointercancel') return
    const hit = document.elementFromPoint(event.clientX, event.clientY)
    const targetId = hit?.closest<HTMLElement>('[data-node-id]')?.dataset.nodeId
    if (!targetId || targetId === drag.nodeId) return
    if (!nodes.some((node) => node.id === targetId)) return
    onConnect(drag.nodeId, drag.optionIndex, targetId)
  }

  function onViewportPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!(event.target instanceof Element) || event.target.closest('[data-node-id], button')) {
      return
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    panRef.current = {
      x: event.clientX,
      y: event.clientY,
      viewX: viewRef.current.x,
      viewY: viewRef.current.y,
    }
  }

  function onViewportPointerMove(event: PointerEvent<HTMLDivElement>) {
    const pan = panRef.current
    if (!pan) return
    setViewBoth({
      ...viewRef.current,
      x: pan.viewX + event.clientX - pan.x,
      y: pan.viewY + event.clientY - pan.y,
    })
  }

  function onViewportPointerUp() {
    panRef.current = null
  }

  function onCardPointerDown(event: PointerEvent<HTMLElement>, id: string) {
    event.stopPropagation()
    if (!(event.target instanceof Element)) return
    if (event.target.closest('input, textarea, select, button, label, a')) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    cardDragRef.current = {
      id,
      x: event.clientX,
      y: event.clientY,
      origin: places[id] ?? { x: 48, y: 48 },
    }
    onSelect(id)
  }

  function onCardPointerMove(event: PointerEvent<HTMLElement>) {
    const drag = cardDragRef.current
    if (!drag) return
    const scale = viewRef.current.scale || 1
    setPlaces((current) => ({
      ...current,
      [drag.id]: {
        x: Math.round(drag.origin.x + (event.clientX - drag.x) / scale),
        y: Math.round(drag.origin.y + (event.clientY - drag.y) / scale),
      },
    }))
  }

  function onCardPointerUp() {
    cardDragRef.current = null
  }

  return (
    <div
      ref={viewportRef}
      className="relative h-[32rem] cursor-grab overflow-hidden rounded-md border border-[var(--line)] bg-[var(--surface)] active:cursor-grabbing"
      onPointerDown={onViewportPointerDown}
      onPointerMove={onViewportPointerMove}
      onPointerUp={onViewportPointerUp}
      onPointerCancel={onViewportPointerUp}
    >
      {nodes.length === 0 ? (
        <p className={cn(hintClassName, 'p-6')}>Add a node to start the flow.</p>
      ) : (
        <div
          ref={worldRef}
          className="absolute top-0 left-0 bg-[radial-gradient(circle,var(--line)_1px,transparent_1px)] [background-size:16px_16px]"
          style={{
            width: 4000,
            height: 2400,
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
            transformOrigin: '0 0',
          }}
        >
          {nodes.map((node) => (
            <article
              key={node.id}
              data-node-id={node.id}
              className={cn(
                'absolute w-72 cursor-grab space-y-3 rounded-md border bg-white p-3 [&_button]:cursor-pointer [&_input]:cursor-text [&_select]:cursor-text [&_textarea]:cursor-text',
                node.id === selectedId ? 'border-[var(--ink)]' : 'border-[var(--line)]',
              )}
              style={{
                left: places[node.id]?.x ?? 48,
                top: places[node.id]?.y ?? 48,
              }}
              onPointerDown={(event) => onCardPointerDown(event, node.id)}
              onPointerMove={onCardPointerMove}
              onPointerUp={onCardPointerUp}
              onPointerCancel={onCardPointerUp}
            >
              <p className="text-xs font-medium text-[var(--muted)]">
                {node.root ? 'Root · ' : ''}
                {node.type === 'menu' ? 'Menu' : nodeTitle(node)}
              </p>
              {node.type === 'menu' ? (
                <MenuEditor
                  node={node}
                  onChange={(next) => onChange(node.id, next)}
                  onPortPointerDown={(event, optionIndex) =>
                    onPortPointerDown(event, node.id, optionIndex)
                  }
                  onPortPointerMove={onPortPointerMove}
                  onPortPointerUp={onPortPointerUp}
                />
              ) : (
                <LeafEditor
                  apiKeyId={apiKeyId}
                  node={node}
                  onChange={(next) => onChange(node.id, next)}
                />
              )}
            </article>
          ))}
          <svg
            className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible"
            aria-hidden
          >
            <defs>
              <marker
                id="whatsapp-flow-arrow"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L6,3 L0,6" fill="none" stroke="var(--ink)" />
              </marker>
            </defs>
            {links.map((link) => (
              <path
                key={link.key}
                d={flowCurve(link.from, link.to)}
                fill="none"
                stroke="var(--ink)"
                strokeWidth="1.5"
                markerEnd="url(#whatsapp-flow-arrow)"
              />
            ))}
            {draft ? (
              <path
                d={flowCurve(draft.from, draft.to)}
                fill="none"
                stroke="var(--ink)"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                markerEnd="url(#whatsapp-flow-arrow)"
              />
            ) : null}
          </svg>
        </div>
      )}
      <div className="absolute top-3 right-3 z-30 flex gap-1">
        <button
          type="button"
          className="flex size-8 items-center justify-center rounded-md border border-[var(--line)] bg-white text-[var(--ink)]"
          aria-label="Zoom in"
          title="Zoom in"
          onClick={() => zoomBy(1.1)}
        >
          <ZoomIn className="size-4" />
        </button>
        <button
          type="button"
          className="flex size-8 items-center justify-center rounded-md border border-[var(--line)] bg-white text-[var(--ink)]"
          aria-label="Zoom out"
          title="Zoom out"
          onClick={() => zoomBy(0.9)}
        >
          <ZoomOut className="size-4" />
        </button>
      </div>
    </div>
  )
}

function MenuEditor({
  node,
  onChange,
  onPortPointerDown,
  onPortPointerMove,
  onPortPointerUp,
}: {
  node: Extract<FlowNode, { type: 'menu' }>
  onChange: (next: FlowNode) => void
  onPortPointerDown: (
    event: PointerEvent<HTMLButtonElement>,
    optionIndex: number,
  ) => void
  onPortPointerMove: (event: PointerEvent<HTMLButtonElement>) => void
  onPortPointerUp: (event: PointerEvent<HTMLButtonElement>) => void
}) {
  function setOptions(options: Extract<FlowNode, { type: 'menu' }>['options']) {
    onChange({ ...node, options })
  }

  function move(index: number, direction: -1 | 1) {
    const next = index + direction
    if (next < 0 || next >= node.options.length) return
    const options = node.options.slice()
    const [item] = options.splice(index, 1)
    if (!item) return
    options.splice(next, 0, item)
    setOptions(options)
  }

  return (
    <div className="space-y-3">
      <label className="block space-y-1 text-sm text-[var(--ink)]">
        Header
        <input
          className={cn(inputClassNameCompact, 'w-full')}
          value={node.header}
          onChange={(event) => onChange({ ...node, header: event.target.value })}
        />
      </label>
      {node.options.map((option, index) => (
        <div key={`${node.id}-${index}`} className="space-y-1">
          <input
            className={cn(inputClassNameCompact, 'w-full')}
            placeholder="Label"
            value={option.label}
            onChange={(event) =>
              setOptions(
                node.options.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, label: event.target.value } : item,
                ),
              )
            }
          />
          <div className="flex items-center gap-1">
            <button
              type="button"
              className={iconButtonClassName}
              aria-label="Move option up"
              title="Move option up"
              onClick={() => move(index, -1)}
            >
              <ChevronUp className="size-4" />
            </button>
            <button
              type="button"
              className={iconButtonClassName}
              aria-label="Move option down"
              title="Move option down"
              onClick={() => move(index, 1)}
            >
              <ChevronDown className="size-4" />
            </button>
            <button
              type="button"
              className={iconButtonClassName}
              aria-label="Remove option"
              title="Remove option"
              onClick={() => setOptions(node.options.filter((_, itemIndex) => itemIndex !== index))}
            >
              <X className="size-4" />
            </button>
            <button
              type="button"
              data-port={`${node.id}:${index}`}
              aria-label={`Drag ${option.label.trim() || `option ${index + 1}`} to a node`}
              title="Drag to a node"
              className={cn(
                'ml-auto size-4 shrink-0 touch-none rounded-full border border-[var(--ink)]',
                option.targetNodeId ? 'bg-[var(--ink)]' : 'bg-white',
              )}
              onPointerDown={(event) => onPortPointerDown(event, index)}
              onPointerMove={onPortPointerMove}
              onPointerUp={onPortPointerUp}
              onPointerCancel={onPortPointerUp}
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        className={iconButtonClassName}
        aria-label="Add option"
        title="Add option"
        onClick={() => setOptions([...node.options, { label: '', targetNodeId: '' }])}
      >
        <Plus className="size-4" />
      </button>
    </div>
  )
}

function LeafEditor({
  apiKeyId,
  node,
  onChange,
}: {
  apiKeyId: string
  node: Extract<FlowNode, { type: 'leaf' }>
  onChange: (next: FlowNode) => void
}) {
  function setType(leafType: Extract<FlowNode, { type: 'leaf' }>['leafType']) {
    onChange(leafNode(node.id, node.root, leafType))
  }

  return (
    <div className="space-y-3">
      <IconMenu
        value={node.leafType}
        options={[
          { value: 'text', icon: MessageSquare, label: 'Text' },
          { value: 'function_call', icon: Zap, label: 'Function call' },
          { value: 'agent_support', icon: Headset, label: 'Agent support' },
          { value: 'form', icon: ClipboardList, label: 'Form' },
        ]}
        onChange={setType}
      />
      {node.leafType === 'text' ? (
        <label className="block space-y-1 text-sm text-[var(--ink)]">
          Message
          <textarea
            className={cn(inputClassNameCompact, 'w-full')}
            rows={3}
            value={node.body}
            onChange={(event) => onChange({ ...node, body: event.target.value })}
          />
        </label>
      ) : null}
      {node.leafType === 'function_call' ? (
        <FunctionFields apiKeyId={apiKeyId} node={node} onChange={onChange} />
      ) : null}
      {node.leafType === 'agent_support' ? (
        <label className="block space-y-1 text-sm text-[var(--ink)]">
          Handoff target
          <input
            className={cn(inputClassNameCompact, 'w-full')}
            value={node.handoffTarget}
            onChange={(event) => onChange({ ...node, handoffTarget: event.target.value })}
          />
        </label>
      ) : null}
      {node.leafType === 'form' ? <FormPreview apiKeyId={apiKeyId} /> : null}
    </div>
  )
}

function FunctionFields({
  apiKeyId,
  node,
  onChange,
}: {
  apiKeyId: string
  node: Extract<FlowNode, { leafType: 'function_call' }>
  onChange: (next: FlowNode) => void
}) {
  const [tools, setTools] = useState<McpTool[]>([])

  useEffect(() => {
    let cancelled = false
    void listEnabledMcpTools(apiKeyId).then((response) => {
      if (cancelled || !response.success || !response.data) return
      setTools(response.data)
    })
    return () => {
      cancelled = true
    }
  }, [apiKeyId])

  const names = new Set(tools.map((tool) => tool.name))
  const options = node.functionName && !names.has(node.functionName)
    ? [{ id: node.functionName, name: node.functionName, title: node.functionName }, ...tools]
    : tools

  return (
    <>
      <label className="block space-y-1 text-sm text-[var(--ink)]">
        Label
        <input
          className={cn(inputClassNameCompact, 'w-full')}
          value={node.label}
          onChange={(event) => onChange({ ...node, label: event.target.value })}
        />
      </label>
      <label className="block space-y-1 text-sm text-[var(--ink)]">
        Function
        <select
          className={cn(inputClassNameCompact, 'w-full')}
          value={node.functionName}
          onChange={(event) => onChange({ ...node, functionName: event.target.value })}
        >
          <option value="">Select a function</option>
          {options.map((tool) => (
            <option key={tool.id} value={tool.name}>
              {tool.title || tool.name}
            </option>
          ))}
        </select>
      </label>
      <IconMenu
        value={node.askParameters ? 'ask' : 'parameter'}
        options={[
          { value: 'parameter', icon: Braces, label: 'Parameters' },
          { value: 'ask', icon: MessageCircleQuestion, label: 'Ask parameters' },
        ]}
        onChange={(mode) =>
          onChange({
            ...node,
            askParameters: mode === 'ask',
            parameters: mode === 'ask' ? '' : node.parameters,
          })
        }
      />
      {node.askParameters ? null : (
        <label className="block space-y-1 text-sm text-[var(--ink)]">
          Parameters
          <input
            className={cn(inputClassNameCompact, 'w-full')}
            value={node.parameters}
            onChange={(event) => onChange({ ...node, parameters: event.target.value })}
          />
        </label>
      )}
    </>
  )
}

function FormPreview({ apiKeyId }: { apiKeyId: string }) {
  const [lines, setLines] = useState<string[]>(['Loading…'])

  useEffect(() => {
    let cancelled = false
    void getLeadCaptureSettings(apiKeyId).then((response) => {
      if (cancelled) return
      if (!response.success || !response.data?.enabled) {
        setLines(['Lead capture is off.'])
        return
      }
      const required = response.data.fields
        .filter((field) => field.required)
        .sort((left, right) => left.order - right.order)
      setLines(required.length > 0 ? required.map((field) => field.label) : ['No required fields.'])
    })
    return () => {
      cancelled = true
    }
  }, [apiKeyId])

  return <p className="whitespace-pre-wrap text-sm text-[var(--ink)]">{lines.join('\n')}</p>
}

function IconMenu<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: Array<{ value: T; icon: LucideIcon; label: string }>
  onChange: (value: T) => void
}) {
  const [open, setOpen] = useState(false)
  const current = options.find((option) => option.value === value) ?? options[0]
  if (!current) return null
  const CurrentIcon = current.icon

  return (
    <div className="relative">
      <button
        type="button"
        className={iconButtonClassName}
        aria-label={current.label}
        title={current.label}
        onClick={() => setOpen((shown) => !shown)}
      >
        <CurrentIcon className="size-4" />
      </button>
      {open ? (
        <div className="absolute z-30 mt-1 flex gap-1 rounded-md border border-[var(--line)] bg-white p-1">
          {options.map((option) => {
            const OptionIcon = option.icon
            return (
              <button
                key={option.value}
                type="button"
                className={cn(iconButtonClassName, option.value === value && 'text-[var(--ink)]')}
                aria-label={option.label}
                title={option.label}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
              >
                <OptionIcon className="size-4" />
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
