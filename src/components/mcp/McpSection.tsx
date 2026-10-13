import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useParams } from '@tanstack/react-router'
import toast from 'react-hot-toast'
import {
  LoaderCircle,
  Plug,
  Plus,
  Trash2,
} from 'lucide-react'
import McpDrawer from '#/components/mcp/McpDrawer'
import Modal from '#/components/ui/Modal'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import {
  createMcp,
  deleteMcp,
  listMcpTools,
  listMcps,
  syncMcp,
  updateMcp,
  updateMcpTool,
  type CreateMcpInput,
  type Mcp,
  type McpAuthType,
  type McpTool,
  type McpTransport,
} from '#/lib/mcp'
import { listUiTemplates, type UiTemplate } from '#/lib/uiTemplate'
import type { ToolUiPatch } from '#/components/mcp/ToolUiConfig'
import {
  buttonClassName,
  buttonOutlineClassName,
  cardClassName,
  hintClassName,
  inputClassName,
  projectSectionClassName,
} from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

type McpSectionProps = {
  apiKeyId: string
}

const AUTH_TYPE_LABELS: Record<McpAuthType, string> = {
  none: 'None',
  bearer: 'Bearer token',
  api_key: 'API key',
  basic: 'Basic auth',
  oauth2: 'OAuth 2.0',
  custom: 'Custom headers',
}

const TRANSPORT_LABELS: Record<McpTransport, string> = {
  streamable_http: 'Streamable HTTP (default)',
  sse: 'SSE',
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

function IconAction({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-md text-[var(--muted)] transition',
        'hover:bg-[var(--surface)] hover:text-[var(--ink)] disabled:pointer-events-none disabled:opacity-30',
        danger && 'hover:bg-red-50 hover:text-red-600',
      )}
    >
      {children}
    </button>
  )
}

function McpSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className={cn(cardClassName, 'animate-pulse p-5')}>
          <div className="mb-3 h-4 w-40 bg-[var(--surface)]" />
          <div className="h-3 w-3/4 bg-[var(--surface)]" />
        </div>
      ))}
    </div>
  )
}

function buildAuthConfig(
  type: McpAuthType,
  fields: {
    token: string
    headerName: string
    apiKey: string
    queryParam: string
    username: string
    password: string
    clientId: string
    clientSecret: string
    tokenUrl: string
    authorizeUrl: string
    accessToken: string
    customHeadersJson: string
  },
  options: { forUpdate?: boolean } = {},
): Record<string, unknown> {
  const forUpdate = options.forUpdate === true
  switch (type) {
    case 'none':
      return {}
    case 'bearer': {
      const config: Record<string, unknown> = {}
      if (fields.token.trim()) config.token = fields.token.trim()
      if (fields.headerName.trim()) config.headerName = fields.headerName.trim()
      return config
    }
    case 'api_key': {
      const config: Record<string, unknown> = {}
      if (fields.apiKey.trim()) config.apiKey = fields.apiKey.trim()
      if (fields.headerName.trim()) config.headerName = fields.headerName.trim()
      if (fields.queryParam.trim()) config.queryParam = fields.queryParam.trim()
      return config
    }
    case 'basic': {
      const config: Record<string, unknown> = {}
      if (fields.username.trim()) config.username = fields.username.trim()
      if (fields.password) config.password = fields.password
      return config
    }
    case 'oauth2': {
      const config: Record<string, unknown> = {}
      if (fields.clientId.trim()) config.clientId = fields.clientId.trim()
      if (fields.tokenUrl.trim()) config.tokenUrl = fields.tokenUrl.trim()
      if (fields.clientSecret) config.clientSecret = fields.clientSecret
      if (fields.authorizeUrl.trim()) {
        config.authorizeUrl = fields.authorizeUrl.trim()
      }
      if (fields.accessToken.trim()) {
        config.accessToken = fields.accessToken.trim()
      }
      return config
    }
    case 'custom': {
      const raw = fields.customHeadersJson.trim()
      if (!raw || raw === '{}') {
        return forUpdate ? {} : {}
      }
      try {
        const parsed = JSON.parse(raw) as unknown
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('headers must be a JSON object')
        }
        return { headers: parsed as Record<string, string> }
      } catch {
        throw new Error('Custom headers must be valid JSON object')
      }
    }
    default:
      return {}
  }
}

export default function McpSection({ apiKeyId }: McpSectionProps) {
  const { id: projectId } = useParams({
    from: '/_authenticated/project/$id',
  })
  const [items, setItems] = useState<Mcp[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [selected, setSelected] = useState<Mcp | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [tools, setTools] = useState<McpTool[]>([])
  const [toolsLoading, setToolsLoading] = useState(false)
  const [templates, setTemplates] = useState<UiTemplate[]>([])
  const [toolUiSavingId, setToolUiSavingId] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editingMcp, setEditingMcp] = useState<Mcp | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Mcp | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [serverUrl, setServerUrl] = useState('')
  const [transport, setTransport] =
    useState<McpTransport>('streamable_http')
  const [authType, setAuthType] = useState<McpAuthType>('none')
  const [token, setToken] = useState('')
  const [headerName, setHeaderName] = useState('')
  const [apiKeyField, setApiKeyField] = useState('')
  const [queryParam, setQueryParam] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [tokenUrl, setTokenUrl] = useState('')
  const [authorizeUrl, setAuthorizeUrl] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [customHeadersJson, setCustomHeadersJson] = useState('{}')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [mcpResponse, templateResponse] = await Promise.all([
        listMcps(apiKeyId),
        listUiTemplates(apiKeyId),
      ])
      if (!mcpResponse.success || !mcpResponse.data) {
        toast.error(mcpResponse.message || 'Failed to load MCP connections')
        return
      }
      setItems(mcpResponse.data)
      if (templateResponse.success && templateResponse.data) {
        setTemplates(templateResponse.data)
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to load MCP connections',
      )
    } finally {
      setLoading(false)
    }
  }, [apiKeyId])

  useEffect(() => {
    void load()
  }, [load])

  const loadTools = useCallback(
    async (mcpId: string) => {
      setToolsLoading(true)
      try {
        const response = await listMcpTools(apiKeyId, mcpId)
        if (!response.success || !response.data) {
          toast.error(response.message || 'Failed to load tools')
          setTools([])
          return
        }
        setTools(response.data)
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to load tools',
        )
        setTools([])
      } finally {
        setToolsLoading(false)
      }
    },
    [apiKeyId],
  )

  function openMcp(item: Mcp) {
    setSelected(item)
    setDrawerOpen(true)
    void loadTools(item.id)
  }

  function resetForm() {
    setName('')
    setDescription('')
    setServerUrl('')
    setTransport('streamable_http')
    setAuthType('none')
    setToken('')
    setHeaderName('')
    setApiKeyField('')
    setQueryParam('')
    setUsername('')
    setPassword('')
    setClientId('')
    setClientSecret('')
    setTokenUrl('')
    setAuthorizeUrl('')
    setAccessToken('')
    setCustomHeadersJson('{}')
  }

  function fillFormFromMcp(mcp: Mcp) {
    const config = mcp.authentication.config
    setName(mcp.name)
    setDescription(mcp.description)
    setServerUrl(mcp.serverUrl)
    setTransport(mcp.transport)
    setAuthType(mcp.authentication.type)
    setToken('')
    setHeaderName(config.headerName ?? '')
    setApiKeyField('')
    setQueryParam(config.queryParam ?? '')
    setUsername(config.username ?? '')
    setPassword('')
    setClientId(config.clientId ?? '')
    setClientSecret('')
    setTokenUrl(config.tokenUrl ?? '')
    setAuthorizeUrl(config.authorizeUrl ?? '')
    setAccessToken('')
    setCustomHeadersJson('{}')
  }

  function openCreateForm() {
    setEditingMcp(null)
    resetForm()
    setFormOpen(true)
  }

  function openEditForm(mcp: Mcp) {
    setEditingMcp(mcp)
    fillFormFromMcp(mcp)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingMcp(null)
    resetForm()
  }

  async function handleSave() {
    const trimmedName = name.trim()
    const trimmedUrl = serverUrl.trim()
    if (!trimmedName) {
      toast.error('Name is required')
      return
    }
    if (!trimmedUrl) {
      toast.error('Server URL is required')
      return
    }

    const forUpdate = Boolean(editingMcp)
    let authentication: CreateMcpInput['authentication']
    try {
      authentication = {
        type: authType,
        config: buildAuthConfig(
          authType,
          {
            token,
            headerName,
            apiKey: apiKeyField,
            queryParam,
            username,
            password,
            clientId,
            clientSecret,
            tokenUrl,
            authorizeUrl,
            accessToken,
            customHeadersJson,
          },
          { forUpdate },
        ),
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invalid auth config')
      return
    }

    setSaving(true)
    try {
      let mcpId = editingMcp?.id

      if (editingMcp) {
        const updated = await updateMcp(apiKeyId, editingMcp.id, {
          name: trimmedName,
          description: description.trim(),
          serverUrl: trimmedUrl,
          transport,
          authentication,
        })
        if (!updated.success || !updated.data) {
          toast.error(updated.message || 'Failed to update MCP connection')
          return
        }
        mcpId = updated.data.id
      } else {
        const created = await createMcp(apiKeyId, {
          name: trimmedName,
          description: description.trim(),
          serverUrl: trimmedUrl,
          transport,
          authentication,
        })
        if (!created.success || !created.data) {
          toast.error(created.message || 'Failed to create MCP connection')
          return
        }
        mcpId = created.data.id
      }

      const synced = await syncMcp(apiKeyId, mcpId)
      closeForm()
      await load()

      if (!synced.success || !synced.data) {
        toast.error(
          synced.message ||
            (forUpdate
              ? 'Saved, but sync failed    edit and try again'
              : 'Created, but sync failed'),
        )
        const fallback = (await listMcps(apiKeyId)).data?.find(
          (row) => row.id === mcpId,
        )
        if (fallback) openMcp(fallback)
        return
      }

      setSelected(synced.data.mcp)
      setTools(synced.data.tools)
      setDrawerOpen(true)
      toast.success(forUpdate ? 'MCP updated' : 'MCP connected')
    } finally {
      setSaving(false)
    }
  }

  async function handleSync(mcp: Mcp) {
    setSyncingId(mcp.id)
    try {
      const response = await syncMcp(apiKeyId, mcp.id)
      if (!response.success || !response.data) {
        toast.error(response.message || 'Failed to sync MCP')
        await load()
        return
      }
      setItems((prev) =>
        prev.map((row) =>
          row.id === response.data!.mcp.id ? response.data!.mcp : row,
        ),
      )
      if (selected?.id === mcp.id) {
        setSelected(response.data.mcp)
        setTools(response.data.tools)
      }
      toast.success('MCP synced')
    } finally {
      setSyncingId(null)
    }
  }

  async function toggleMcpEnabled(mcp: Mcp) {
    const response = await updateMcp(apiKeyId, mcp.id, {
      enabled: !mcp.enabled,
    })
    if (!response.success || !response.data) {
      toast.error(response.message || 'Failed to update MCP')
      return
    }
    setItems((prev) =>
      prev.map((row) => (row.id === response.data!.id ? response.data! : row)),
    )
    if (selected?.id === mcp.id) {
      setSelected(response.data)
    }
  }

  async function toggleToolEnabled(tool: McpTool) {
    if (!selected) return
    const response = await updateMcpTool(apiKeyId, selected.id, tool.id, {
      enabled: !tool.enabled,
    })
    if (!response.success || !response.data) {
      toast.error(response.message || 'Failed to update tool')
      return
    }
    setTools((prev) =>
      prev.map((row) => (row.id === response.data!.id ? response.data! : row)),
    )
  }

  async function saveToolUi(tool: McpTool, patch: ToolUiPatch) {
    if (!selected) return
    setToolUiSavingId(tool.id)
    try {
      const response = await updateMcpTool(apiKeyId, selected.id, tool.id, patch)
      if (!response.success || !response.data) {
        toast.error(response.message || 'Failed to save tool UI config')
        return
      }
      setTools((prev) =>
        prev.map((row) =>
          row.id === response.data!.id ? response.data! : row,
        ),
      )
      toast.success('Tool UI config saved')
    } finally {
      setToolUiSavingId(null)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const id = deleteTarget.id
      const response = await deleteMcp(apiKeyId, id)
      if (!response.success) {
        toast.error(response.message || 'Failed to delete MCP')
        return
      }
      if (selected?.id === id) {
        setDrawerOpen(false)
        setSelected(null)
        setTools([])
      }
      setDeleteTarget(null)
      await load()
      toast.success('MCP deleted')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      className={cn(
        projectSectionClassName,
        'min-w-0 max-w-full overflow-x-hidden',
      )}
    >
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-medium text-[var(--ink)]">MCP</h1>
          <p className={cn(hintClassName, 'mt-1')}>
            Connect MCP servers, sync tools, and enable or disable them for
            this project.
          </p>
        </div>
        <button
          type="button"
          className={cn(
            buttonClassName,
            'inline-flex h-8 items-center gap-1.5 px-2.5 py-0 text-xs',
          )}
          disabled={saving}
          onClick={openCreateForm}
        >
          <Plus className="size-3.5" aria-hidden />
          Connect MCP
        </button>
      </div>

      <div className="mt-8">
        {loading ? (
          <McpSkeleton />
        ) : items.length === 0 ? (
          <div
            className={cn(
              cardClassName,
              'flex flex-col items-start gap-4 p-8',
            )}
          >
            <div className="rounded-md bg-[var(--surface)] p-3 text-[var(--muted)]">
              <Plug className="size-6" aria-hidden />
            </div>
            <div>
              <p className="font-medium text-[var(--ink)]">
                No MCP connections yet
              </p>
              <p className={cn(hintClassName, 'mt-1')}>
                Connect a Streamable HTTP MCP server to sync its tools into
                this project.
              </p>
            </div>
            <button
              type="button"
              className={cn(
                buttonClassName,
                'inline-flex h-8 items-center gap-1.5 px-2.5 py-0 text-xs',
              )}
              onClick={openCreateForm}
            >
              <Plus className="size-3.5" aria-hidden />
              Connect MCP
            </button>
          </div>
        ) : (
          <ul className="min-w-0 max-w-full space-y-2">
            {items.map((item) => (
              <li key={item.id} className="min-w-0 max-w-full">
                <div
                  className={cn(
                    'group flex min-w-0 max-w-full items-center gap-3 border-b border-[var(--line)] px-1 py-4 transition',
                    'hover:bg-[var(--surface)]/60',
                  )}
                >
                  <button
                    type="button"
                    className="w-0 min-w-0 flex-1 overflow-hidden text-left"
                    onClick={() => openMcp(item)}
                  >
                    <span className="flex min-w-0 max-w-full items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-[15px] font-medium">
                        {item.name}
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        <SyncStatusPill status={item.status} />
                        <StatusPill enabled={item.enabled} />
                      </span>
                    </span>
                    <span className="mt-1 block max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm text-[var(--muted)]">
                      {item.serverUrl}
                    </span>
                    {item.lastError ? (
                      <span className="mt-1 block max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs text-red-600">
                        {item.lastError}
                      </span>
                    ) : (
                      <span className="mt-1 block max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs text-[var(--muted)]">
                        Updated {new Date(item.updatedAt).toLocaleString()}
                      </span>
                    )}
                  </button>
                  <IconAction
                    label={`Delete ${item.name}`}
                    danger
                    onClick={() => setDeleteTarget(item)}
                  >
                    <Trash2 className="size-4" />
                  </IconAction>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <McpDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        projectId={projectId}
        mcp={selected}
        tools={tools}
        toolsLoading={toolsLoading}
        syncing={selected ? syncingId === selected.id : false}
        templates={templates}
        onSync={() => {
          if (selected) void handleSync(selected)
        }}
        onEdit={() => {
          if (selected) openEditForm(selected)
        }}
        onToggleMcpEnabled={() => {
          if (selected) void toggleMcpEnabled(selected)
        }}
        onToggleToolEnabled={(tool) => void toggleToolEnabled(tool)}
        onSaveToolUi={(tool, patch) => void saveToolUi(tool, patch)}
        toolUiSavingId={toolUiSavingId}
      />

      <Modal
        open={formOpen}
        onClose={() => {
          if (!saving) closeForm()
        }}
        title={editingMcp ? 'Edit MCP' : 'Connect MCP'}
        maxWidth="max-w-lg"
      >
        <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <label className="block space-y-1.5">
            <span className="text-sm text-[var(--ink)]">Name</span>
            <input
              className={inputClassName}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="My MCP server"
              disabled={saving}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm text-[var(--ink)]">Description</span>
            <input
              className={inputClassName}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional"
              disabled={saving}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm text-[var(--ink)]">Server URL</span>
            <input
              className={inputClassName}
              value={serverUrl}
              onChange={(event) => setServerUrl(event.target.value)}
              placeholder="https://example.com/mcp"
              disabled={saving}
            />
          </label>
          <div className="space-y-1.5">
            <span className="text-sm text-[var(--ink)]">Transport</span>
            <Select
              value={transport}
              onValueChange={(value) =>
                setTransport(value as McpTransport)
              }
              disabled={saving}
            >
              <SelectTrigger className="h-10 w-full px-3">
                <SelectValue placeholder="Select transport" />
              </SelectTrigger>
              <SelectContent className="z-[120]">
                {(Object.keys(TRANSPORT_LABELS) as McpTransport[]).map(
                  (value) => (
                    <SelectItem key={value} value={value}>
                      {TRANSPORT_LABELS[value]}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <span className="text-sm text-[var(--ink)]">Authentication</span>
            <Select
              value={authType}
              onValueChange={(value) => setAuthType(value as McpAuthType)}
              disabled={saving}
            >
              <SelectTrigger className="h-10 w-full px-3">
                <SelectValue placeholder="Select authentication" />
              </SelectTrigger>
              <SelectContent className="z-[120]">
                {(Object.keys(AUTH_TYPE_LABELS) as McpAuthType[]).map(
                  (value) => (
                    <SelectItem key={value} value={value}>
                      {AUTH_TYPE_LABELS[value]}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          {authType === 'bearer' ? (
            <>
              <label className="block space-y-1.5">
                <span className="text-sm text-[var(--ink)]">Token</span>
                <input
                  className={inputClassName}
                  type="password"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  placeholder={
                    editingMcp?.authentication.config.hasSecrets
                      ? 'Leave blank to keep existing'
                      : undefined
                  }
                  disabled={saving}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm text-[var(--ink)]">
                  Header name (optional)
                </span>
                <input
                  className={inputClassName}
                  value={headerName}
                  onChange={(event) => setHeaderName(event.target.value)}
                  placeholder="Authorization"
                  disabled={saving}
                />
              </label>
            </>
          ) : null}

          {authType === 'api_key' ? (
            <>
              <label className="block space-y-1.5">
                <span className="text-sm text-[var(--ink)]">API key</span>
                <input
                  className={inputClassName}
                  type="password"
                  value={apiKeyField}
                  onChange={(event) => setApiKeyField(event.target.value)}
                  placeholder={
                    editingMcp?.authentication.config.hasSecrets
                      ? 'Leave blank to keep existing'
                      : undefined
                  }
                  disabled={saving}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm text-[var(--ink)]">
                  Header name (optional)
                </span>
                <input
                  className={inputClassName}
                  value={headerName}
                  onChange={(event) => setHeaderName(event.target.value)}
                  placeholder="X-API-Key"
                  disabled={saving}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm text-[var(--ink)]">
                  Query param (optional)
                </span>
                <input
                  className={inputClassName}
                  value={queryParam}
                  onChange={(event) => setQueryParam(event.target.value)}
                  disabled={saving}
                />
              </label>
            </>
          ) : null}

          {authType === 'basic' ? (
            <>
              <label className="block space-y-1.5">
                <span className="text-sm text-[var(--ink)]">Username</span>
                <input
                  className={inputClassName}
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  disabled={saving}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm text-[var(--ink)]">Password</span>
                <input
                  className={inputClassName}
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={
                    editingMcp?.authentication.config.hasSecrets
                      ? 'Leave blank to keep existing'
                      : undefined
                  }
                  disabled={saving}
                />
              </label>
            </>
          ) : null}

          {authType === 'oauth2' ? (
            <>
              <p className={hintClassName}>
                Interactive OAuth is not supported yet. Provide an access token
                to sync.
                {editingMcp
                  ? ' Leave secrets blank to keep existing values.'
                  : ''}
              </p>
              <label className="block space-y-1.5">
                <span className="text-sm text-[var(--ink)]">Client ID</span>
                <input
                  className={inputClassName}
                  value={clientId}
                  onChange={(event) => setClientId(event.target.value)}
                  disabled={saving}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm text-[var(--ink)]">Token URL</span>
                <input
                  className={inputClassName}
                  value={tokenUrl}
                  onChange={(event) => setTokenUrl(event.target.value)}
                  disabled={saving}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm text-[var(--ink)]">
                  Client secret (optional)
                </span>
                <input
                  className={inputClassName}
                  type="password"
                  value={clientSecret}
                  onChange={(event) => setClientSecret(event.target.value)}
                  placeholder={
                    editingMcp?.authentication.config.hasSecrets
                      ? 'Leave blank to keep existing'
                      : undefined
                  }
                  disabled={saving}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm text-[var(--ink)]">
                  Authorize URL (optional)
                </span>
                <input
                  className={inputClassName}
                  value={authorizeUrl}
                  onChange={(event) => setAuthorizeUrl(event.target.value)}
                  disabled={saving}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm text-[var(--ink)]">Access token</span>
                <input
                  className={inputClassName}
                  type="password"
                  value={accessToken}
                  onChange={(event) => setAccessToken(event.target.value)}
                  placeholder={
                    editingMcp?.authentication.config.hasSecrets
                      ? 'Leave blank to keep existing'
                      : undefined
                  }
                  disabled={saving}
                />
              </label>
            </>
          ) : null}

          {authType === 'custom' ? (
            <label className="block space-y-1.5">
              <span className="text-sm text-[var(--ink)]">
                Headers (JSON object)
              </span>
              <textarea
                className={cn(inputClassName, 'min-h-24 font-mono text-xs')}
                value={customHeadersJson}
                onChange={(event) => setCustomHeadersJson(event.target.value)}
                placeholder={
                  editingMcp
                    ? 'Leave {} to keep existing headers'
                    : undefined
                }
                disabled={saving}
              />
            </label>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className={buttonOutlineClassName}
              disabled={saving}
              onClick={closeForm}
            >
              Cancel
            </button>
            <button
              type="button"
              className={buttonClassName}
              disabled={saving}
              onClick={() => void handleSave()}
            >
              {saving ? (
                <span className="inline-flex items-center gap-2">
                  <LoaderCircle className="size-4 animate-spin" aria-hidden />
                  {editingMcp ? 'Saving…' : 'Connecting…'}
                </span>
              ) : editingMcp ? (
                'Save & sync'
              ) : (
                'Connect'
              )}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => {
          if (!deleting) setDeleteTarget(null)
        }}
        title="Delete MCP"
      >
        <p className="text-sm text-[var(--muted)]">
          Delete{' '}
          <span className="font-medium text-[var(--ink)]">
            {deleteTarget?.name}
          </span>{' '}
          and all synced tools? This cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className={buttonOutlineClassName}
            disabled={deleting}
            onClick={() => setDeleteTarget(null)}
          >
            Cancel
          </button>
          <button
            type="button"
            className={cn(buttonClassName, 'bg-red-600 hover:bg-red-700')}
            disabled={deleting}
            onClick={() => void handleDelete()}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
