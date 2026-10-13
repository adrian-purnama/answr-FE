import { useEffect, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  LoaderCircle,
  Pencil,
  RefreshCw,
} from 'lucide-react'
import DrawerDetails from '#/components/ui/DrawerDetails'
import SideDrawer from '#/components/ui/SideDrawer'
import ToolUiConfig, {
  type ToolUiPatch,
} from '#/components/mcp/ToolUiConfig'
import type { Mcp, McpTool } from '#/lib/mcp'
import {
  buildJsonSchemaTree,
  type JsonSchemaTreeNode,
} from '#/lib/jsonSchemaPaths'
import type { UiTemplate } from '#/lib/uiTemplate'
import { buttonOutlineClassName } from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

type McpDrawerProps = {
  open: boolean
  onClose: () => void
  projectId: string
  mcp: Mcp | null
  tools: McpTool[]
  toolsLoading: boolean
  syncing: boolean
  templates: UiTemplate[]
  onSync: () => void | Promise<void>
  onEdit: () => void
  onToggleMcpEnabled: () => void | Promise<void>
  onToggleToolEnabled: (tool: McpTool) => void | Promise<void>
  onSaveToolUi: (tool: McpTool, patch: ToolUiPatch) => void | Promise<void>
  toolUiSavingId: string | null
}

function StatusPill({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium',
        enabled
          ? 'bg-emerald-50 text-emerald-800'
          : 'bg-[var(--surface)] text-[var(--muted)]',
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          enabled ? 'bg-emerald-500' : 'bg-[var(--muted)]',
        )}
      />
      {enabled ? 'Enabled' : 'Disabled'}
    </span>
  )
}

function SyncStatusPill({ status }: { status: Mcp['status'] }) {
  const label =
    status === 'synced'
      ? 'Synced'
      : status === 'error'
        ? 'Error'
        : 'Not synced'
  const tone =
    status === 'synced'
      ? 'bg-emerald-50 text-emerald-800'
      : status === 'error'
        ? 'bg-red-50 text-red-700'
        : 'bg-[var(--surface)] text-[var(--muted)]'
  const dot =
    status === 'synced'
      ? 'bg-emerald-500'
      : status === 'error'
        ? 'bg-red-500'
        : 'bg-[var(--muted)]'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium',
        tone,
      )}
    >
      <span className={cn('size-1.5 rounded-full', dot)} />
      {label}
    </span>
  )
}

type SchemaProperty = {
  name: string
  type: string
  required: boolean
  description?: string
}

function schemaTypeLabel(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map(String).join(' | ')
  }
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (typeof record.type === 'string') return record.type
  }
  return 'unknown'
}

function parseSchemaProperties(
  inputSchema: Record<string, unknown>,
): SchemaProperty[] {
  const properties = inputSchema.properties
  if (!properties || typeof properties !== 'object' || Array.isArray(properties)) {
    return []
  }
  const required = new Set(
    Array.isArray(inputSchema.required)
      ? inputSchema.required.filter(
          (item): item is string => typeof item === 'string',
        )
      : [],
  )
  return Object.entries(properties as Record<string, unknown>).map(
    ([name, def]) => {
      const record =
        def && typeof def === 'object' && !Array.isArray(def)
          ? (def as Record<string, unknown>)
          : {}
      return {
        name,
        type: schemaTypeLabel(record.type ?? record),
        required: required.has(name),
        description:
          typeof record.description === 'string'
            ? record.description
            : undefined,
      }
    },
  )
}

function SchemaPropertyList({
  properties,
  emptyLabel,
}: {
  properties: SchemaProperty[]
  emptyLabel: string
}) {
  if (properties.length === 0) {
    return <p className="mt-1.5 text-xs text-[var(--muted)]">{emptyLabel}</p>
  }

  return (
    <ul className="mt-1.5 space-y-1">
      {properties.map((property) => (
        <li key={property.name}>
          <details className="group/prop">
            <summary className="cursor-pointer list-none font-mono text-sm text-[var(--ink)] [&::-webkit-details-marker]:hidden">
              <span className="inline-flex items-center gap-1">
                <ChevronRight className="size-3.5 shrink-0 text-[var(--muted)] transition group-open/prop:rotate-90" />
                {property.name}
              </span>
            </summary>
            <div className="mt-1 space-y-0.5 pl-5 text-xs text-[var(--muted)]">
              <p>
                type: <span className="text-[var(--ink)]">{property.type}</span>
              </p>
              <p>{property.required ? 'required' : 'optional'}</p>
              {property.description ? <p>{property.description}</p> : null}
            </div>
          </details>
        </li>
      ))}
    </ul>
  )
}

function NestedSchemaTree({
  nodes,
  emptyLabel,
}: {
  nodes: JsonSchemaTreeNode[]
  emptyLabel: string
}) {
  if (nodes.length === 0) {
    return <p className="mt-1.5 text-xs text-[var(--muted)]">{emptyLabel}</p>
  }

  return (
    <ul className="mt-1.5 space-y-1">
      {nodes.map((node) => (
        <li key={node.path}>
          <details className="group/prop" open={node.children.length > 0}>
            <summary className="cursor-pointer list-none font-mono text-sm text-[var(--ink)] [&::-webkit-details-marker]:hidden">
              <span className="inline-flex min-w-0 items-center gap-1">
                <ChevronRight className="size-3.5 shrink-0 text-[var(--muted)] transition group-open/prop:rotate-90" />
                <span className="truncate">{node.name}</span>
                <span className="shrink-0 text-[10px] text-[var(--muted)]">
                  {node.type}
                </span>
              </span>
            </summary>
            <div className="mt-1 space-y-1 pl-5 text-xs text-[var(--muted)]">
              <p>
                path:{' '}
                <span className="font-mono text-[var(--ink)]">{node.path}</span>
              </p>
              <p>{node.required ? 'required' : 'optional'}</p>
              {node.description ? <p>{node.description}</p> : null}
              {node.children.length > 0 ? (
                <NestedSchemaTree nodes={node.children} emptyLabel="" />
              ) : null}
            </div>
          </details>
        </li>
      ))}
    </ul>
  )
}

function ToolSchemaDetails({ tool }: { tool: McpTool }) {
  const inputProperties = parseSchemaProperties(tool.inputSchema)
  const outputTree = buildJsonSchemaTree(tool.outputSchema)

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium tracking-wide text-[var(--muted)] uppercase">
          Parameters (in)
        </p>
        <SchemaPropertyList
          properties={inputProperties}
          emptyLabel="No input parameters"
        />
      </div>

      <div>
        <p className="text-xs font-medium tracking-wide text-[var(--muted)] uppercase">
          Output schema
        </p>
        <NestedSchemaTree
          nodes={outputTree}
          emptyLabel="No output schema"
        />
      </div>
    </div>
  )
}

export default function McpDrawer({
  open,
  onClose,
  projectId,
  mcp,
  tools,
  toolsLoading,
  syncing,
  templates,
  onSync,
  onEdit,
  onToggleMcpEnabled,
  onToggleToolEnabled,
  onSaveToolUi,
  toolUiSavingId,
}: McpDrawerProps) {
  const [collapsedToolIds, setCollapsedToolIds] = useState<Set<string>>(
    () => new Set(),
  )

  useEffect(() => {
    setCollapsedToolIds(new Set(tools.map((tool) => tool.id)))
  }, [tools])

  function toggleToolCollapsed(toolId: string) {
    setCollapsedToolIds((prev) => {
      const next = new Set(prev)
      if (next.has(toolId)) next.delete(toolId)
      else next.add(toolId)
      return next
    })
  }

  function collapseAllTools() {
    setCollapsedToolIds(new Set(tools.map((tool) => tool.id)))
  }

  function expandAllTools() {
    setCollapsedToolIds(new Set())
  }

  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      label="MCP"
      size="lg"
      details={
        mcp ? (
          <DrawerDetails
            createdAt={mcp.createdAt}
            updatedAt={mcp.updatedAt}
            statusRows={[
              {
                label: 'Enable',
                value: <StatusPill enabled={mcp.enabled} />,
              },
              {
                label: 'Synced',
                value: <SyncStatusPill status={mcp.status} />,
              },
              ...(mcp.lastError
                ? [
                    {
                      label: 'Error',
                      value: (
                        <span className="text-red-600" title={mcp.lastError}>
                          {mcp.lastError}
                        </span>
                      ),
                    },
                  ]
                : []),
              {
                label: 'Transport',
                value: mcp.transport,
              },
              {
                label: 'Auth',
                value: mcp.authentication.type,
              },
            ]}
            actions={
              <>
                <button
                  type="button"
                  className={cn(
                    buttonOutlineClassName,
                    'flex w-full items-center justify-center gap-1.5 text-xs',
                  )}
                  disabled={syncing}
                  onClick={onEdit}
                >
                  <Pencil className="size-3.5" aria-hidden />
                  Edit
                </button>
                <button
                  type="button"
                  className={cn(
                    buttonOutlineClassName,
                    'flex w-full items-center justify-center gap-1.5 text-xs',
                  )}
                  disabled={syncing}
                  onClick={() => void onSync()}
                >
                  {syncing ? (
                    <LoaderCircle className="size-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="size-3.5" aria-hidden />
                  )}
                  Resync
                </button>
                <button
                  type="button"
                  className={cn(
                    buttonOutlineClassName,
                    'w-full text-xs',
                    !mcp.enabled && 'bg-[var(--surface)] text-[var(--ink)]',
                  )}
                  disabled={syncing}
                  onClick={() => void onToggleMcpEnabled()}
                >
                  {mcp.enabled ? 'Disable' : 'Enable'}
                </button>
              </>
            }
          />
        ) : null
      }
    >
      {mcp ? (
        <div className="space-y-8">
          <div className="space-y-3">
            <h2 className="text-2xl font-medium text-[var(--ink)]">
              {mcp.name}
            </h2>
            {mcp.description ? (
              <p className="text-sm text-[var(--muted)]">{mcp.description}</p>
            ) : null}
            <div>
              <p className="text-xs text-[var(--muted)]">Server URL</p>
              <p className="break-all text-sm text-[var(--ink)]">
                {mcp.serverUrl}
              </p>
            </div>
            {mcp.lastError ? (
              <div className="space-y-2">
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {mcp.lastError}
                </p>
                <button
                  type="button"
                  className="text-sm font-medium text-red-700 underline-offset-2 hover:underline"
                  onClick={onEdit}
                >
                  Edit connection to fix
                </button>
              </div>
            ) : null}
            {!mcp.enabled ? (
              <p className="rounded-md bg-[var(--surface)] px-3 py-2 text-sm text-[var(--muted)]">
                This MCP is disabled. Tools stay listed but will not be used by
                the agent. Enable it in Details to use them.
              </p>
            ) : null}
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="text-sm font-medium text-[var(--ink)]">Tools</h3>
                <p className="mt-0.5 text-xs text-[var(--muted)]">
                  {tools.length} synced
                </p>
              </div>
              {tools.length > 0 ? (
                <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
                  <button
                    type="button"
                    className="underline-offset-2 hover:text-[var(--ink)] hover:underline"
                    onClick={collapseAllTools}
                  >
                    Collapse all
                  </button>
                  <button
                    type="button"
                    className="underline-offset-2 hover:text-[var(--ink)] hover:underline"
                    onClick={expandAllTools}
                  >
                    Expand all
                  </button>
                </div>
              ) : null}
            </div>

            {toolsLoading ? (
              <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
                Loading tools…
              </div>
            ) : tools.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                No tools yet. Resync this MCP to load tools from the server.
              </p>
            ) : (
              <div className="space-y-8">
                {tools.map((tool) => {
                  const inactive = !mcp.enabled || !tool.enabled
                  const isCollapsed = collapsedToolIds.has(tool.id)
                  return (
                    <section
                      key={tool.id}
                      className={cn(
                        'group/tool relative border-t border-[var(--line)] pt-6 first:border-t-0 first:pt-0',
                        inactive && 'opacity-70',
                      )}
                    >
                      <div className="flex items-start gap-1">
                        <button
                          type="button"
                          className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center text-[var(--muted)] transition hover:text-[var(--ink)]"
                          aria-expanded={!isCollapsed}
                          aria-label={
                            isCollapsed
                              ? `Expand ${tool.name}`
                              : `Collapse ${tool.name}`
                          }
                          onClick={() => toggleToolCollapsed(tool.id)}
                        >
                          {isCollapsed ? (
                            <ChevronRight className="size-4" />
                          ) : (
                            <ChevronDown className="size-4" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            className={cn(
                              'block w-full min-w-0 text-left text-xl font-semibold text-[var(--ink)]',
                              isCollapsed
                                ? 'truncate'
                                : 'break-words whitespace-normal',
                            )}
                            onClick={() => toggleToolCollapsed(tool.id)}
                          >
                            {tool.title?.trim() || tool.name}
                          </button>

                          {tool.description ? (
                            <p
                              className={cn(
                                'mt-1 text-sm text-[var(--muted)]',
                                isCollapsed
                                  ? 'truncate'
                                  : 'whitespace-pre-wrap break-words',
                              )}
                            >
                              {tool.description}
                            </p>
                          ) : null}

                          {!isCollapsed ? (
                            <div className="mt-1.5 flex items-center gap-2">
                              <StatusPill enabled={tool.enabled} />
                              <button
                                type="button"
                                className="text-[11px] text-[var(--muted)] underline-offset-2 hover:text-[var(--ink)] hover:underline"
                                onClick={() => void onToggleToolEnabled(tool)}
                              >
                                {tool.enabled ? 'Disable tool' : 'Enable tool'}
                              </button>
                            </div>
                          ) : null}
                        </div>

                        {isCollapsed ? (
                          <span className="flex shrink-0 items-center gap-1.5">
                            <StatusPill enabled={tool.enabled} />
                          </span>
                        ) : null}
                      </div>

                      {!isCollapsed ? (
                        <div className="mt-4 min-w-0 overflow-x-hidden pl-8">
                          {!tool.enabled ? (
                            <p className="mb-3 text-xs text-[var(--muted)]">
                              Tool disabled   it will not be available to the
                              agent.
                            </p>
                          ) : null}
                          <ToolUiConfig
                            key={`${tool.id}:${tool.render}:${tool.uiTemplateId ?? ''}`}
                            tool={tool}
                            templates={templates}
                            projectId={projectId}
                            saving={toolUiSavingId === tool.id}
                            onSave={(patch) => onSaveToolUi(tool, patch)}
                          />
                          <details className="group/schema mt-4 rounded-md border border-[var(--line)]">
                            <summary className="cursor-pointer list-none px-3 py-2 text-xs font-medium tracking-wide text-[var(--muted)] uppercase [&::-webkit-details-marker]:hidden">
                              <span className="inline-flex items-center gap-1.5">
                                <ChevronRight className="size-3.5 shrink-0 transition group-open/schema:rotate-90" />
                                Parameters &amp; output schema
                              </span>
                            </summary>
                            <div className="border-t border-[var(--line)] px-3 py-3">
                              <ToolSchemaDetails tool={tool} />
                            </div>
                          </details>
                        </div>
                      ) : null}
                    </section>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </SideDrawer>
  )
}
