import { apiFetch } from '#/lib/api'

export type McpTransport = 'streamable_http' | 'sse'

export type McpAuthType =
  | 'none'
  | 'bearer'
  | 'api_key'
  | 'basic'
  | 'oauth2'
  | 'custom'

export type McpStatus = 'not_synced' | 'synced' | 'error'

export type McpAuthPublicConfig = {
  headerName?: string
  queryParam?: string
  username?: string
  clientId?: string
  tokenUrl?: string
  authorizeUrl?: string
  scopes?: string[]
  hasHeaders?: boolean
  hasQuery?: boolean
  hasSecrets: boolean
}

export type Mcp = {
  id: string
  apiKeyId: string
  name: string
  description: string
  serverUrl: string
  transport: McpTransport
  authentication: {
    type: McpAuthType
    config: McpAuthPublicConfig
  }
  enabled: boolean
  status: McpStatus
  lastSyncedAt: string | null
  lastError: string | null
  createdAt: string
  updatedAt: string
}

export type McpTool = {
  id: string
  apiKeyId: string
  mcpId: string
  name: string
  title: string
  description: string
  inputSchema: Record<string, unknown>
  outputSchema: Record<string, unknown>
  annotations: Record<string, unknown> | null
  enabled: boolean
  render: 'off' | 'deterministic' | 'auto'
  uiTemplateId: string | null
  fieldMap: Record<string, string>
  lastSyncedAt: string | null
  createdAt: string
  updatedAt: string
}

export type McpSyncResult = {
  mcp: Mcp
  tools: McpTool[]
}

export type CreateMcpInput = {
  name: string
  description?: string
  serverUrl: string
  transport?: McpTransport
  authentication?: {
    type: McpAuthType
    config?: Record<string, unknown>
  }
}

export type UpdateMcpInput = {
  name?: string
  description?: string
  serverUrl?: string
  transport?: McpTransport
  authentication?: {
    type: McpAuthType
    config?: Record<string, unknown>
  }
  enabled?: boolean
}

function withApiKey(path: string, apiKeyId: string): string {
  const sep = path.includes('?') ? '&' : '?'
  return `${path}${sep}apiKeyId=${encodeURIComponent(apiKeyId)}`
}

export async function listMcps(apiKeyId: string) {
  return apiFetch<Mcp[]>(withApiKey('/mcps', apiKeyId))
}

export async function createMcp(apiKeyId: string, input: CreateMcpInput) {
  return apiFetch<Mcp>('/mcps', {
    method: 'POST',
    body: JSON.stringify({ apiKeyId, ...input }),
  })
}

export async function updateMcp(
  apiKeyId: string,
  id: string,
  patch: UpdateMcpInput,
) {
  return apiFetch<Mcp>(withApiKey(`/mcps/${id}`, apiKeyId), {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export async function deleteMcp(apiKeyId: string, id: string) {
  return apiFetch<null>(withApiKey(`/mcps/${id}`, apiKeyId), {
    method: 'DELETE',
  })
}

export async function syncMcp(apiKeyId: string, id: string) {
  return apiFetch<McpSyncResult>(withApiKey(`/mcps/${id}/sync`, apiKeyId), {
    method: 'POST',
  })
}

export async function listMcpTools(apiKeyId: string, mcpId: string) {
  return apiFetch<McpTool[]>(withApiKey(`/mcps/${mcpId}/tools`, apiKeyId))
}

/** Tools where both the MCP connection and the tool row are enabled. */
export async function listEnabledMcpTools(apiKeyId: string) {
  return apiFetch<McpTool[]>(withApiKey('/mcps/tools/enabled', apiKeyId))
}

export async function updateMcpTool(
  apiKeyId: string,
  mcpId: string,
  toolId: string,
  patch: {
    enabled?: boolean
    render?: 'off' | 'deterministic' | 'auto'
    uiTemplateId?: string | null
    fieldMap?: Record<string, string>
  },
) {
  return apiFetch<McpTool>(
    withApiKey(`/mcps/${mcpId}/tools/${toolId}`, apiKeyId),
    {
      method: 'PATCH',
      body: JSON.stringify(patch),
    },
  )
}
