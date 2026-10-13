import { apiFetch } from '#/lib/api'

export type CollaboratorPermissions = {
  overview: boolean
  performance: boolean
  gaps: boolean
  train: { articleSnippet: boolean; guidance: boolean }
  test: boolean
  tools: {
    liveAgent: boolean
    meeting: boolean
    mcp: boolean
    leadCapture: boolean
    whatsApp: boolean
  }
  widget: boolean
}

export type ApiKeyCollaborator = {
  id: string
  apiKeyId: string
  userId: string
  email: string | null
  permissions: CollaboratorPermissions
  createdAt: string
  updatedAt: string
}

export const COLLABORATOR_PERMISSION_FIELDS: {
  key: string
  label: string
  get: (p: CollaboratorPermissions) => boolean
  set: (p: CollaboratorPermissions, value: boolean) => CollaboratorPermissions
}[] = [
  {
    key: 'overview',
    label: 'Overview',
    get: (p) => p.overview,
    set: (p, value) => ({ ...p, overview: value }),
  },
  {
    key: 'performance',
    label: 'Performance',
    get: (p) => p.performance,
    set: (p, value) => ({ ...p, performance: value }),
  },
  {
    key: 'gaps',
    label: 'Gaps',
    get: (p) => p.gaps,
    set: (p, value) => ({ ...p, gaps: value }),
  },
  {
    key: 'train.articleSnippet',
    label: 'Articles & Snippets',
    get: (p) => p.train.articleSnippet,
    set: (p, value) => ({ ...p, train: { ...p.train, articleSnippet: value } }),
  },
  {
    key: 'train.guidance',
    label: 'Guidance',
    get: (p) => p.train.guidance,
    set: (p, value) => ({ ...p, train: { ...p.train, guidance: value } }),
  },
  {
    key: 'test',
    label: 'Test',
    get: (p) => p.test,
    set: (p, value) => ({ ...p, test: value }),
  },
  {
    key: 'tools.liveAgent',
    label: 'Live Agent',
    get: (p) => p.tools.liveAgent,
    set: (p, value) => ({ ...p, tools: { ...p.tools, liveAgent: value } }),
  },
  {
    key: 'tools.meeting',
    label: 'Meeting',
    get: (p) => p.tools.meeting,
    set: (p, value) => ({ ...p, tools: { ...p.tools, meeting: value } }),
  },
  {
    key: 'tools.mcp',
    label: 'MCP',
    get: (p) => p.tools.mcp,
    set: (p, value) => ({ ...p, tools: { ...p.tools, mcp: value } }),
  },
  {
    key: 'tools.leadCapture',
    label: 'Customer Data & Lead Capture',
    get: (p) => p.tools.leadCapture,
    set: (p, value) => ({ ...p, tools: { ...p.tools, leadCapture: value } }),
  },
  {
    key: 'tools.whatsApp',
    label: 'WhatsApp',
    get: (p) => p.tools.whatsApp,
    set: (p, value) => ({ ...p, tools: { ...p.tools, whatsApp: value } }),
  },
  {
    key: 'widget',
    label: 'Widget',
    get: (p) => p.widget,
    set: (p, value) => ({ ...p, widget: value }),
  },
]

export function listCollaborators(apiKeyId: string) {
  return apiFetch<ApiKeyCollaborator[]>(
    `/api-keys/${encodeURIComponent(apiKeyId)}/collaborators`,
  )
}

export function updateCollaboratorPermissions(
  apiKeyId: string,
  userId: string,
  permissions: CollaboratorPermissions,
) {
  return apiFetch<ApiKeyCollaborator>(
    `/api-keys/${encodeURIComponent(apiKeyId)}/collaborators/${encodeURIComponent(userId)}`,
    { method: 'PATCH', body: JSON.stringify({ permissions }) },
  )
}

export function removeCollaborator(apiKeyId: string, userId: string) {
  return apiFetch<null>(
    `/api-keys/${encodeURIComponent(apiKeyId)}/collaborators/${encodeURIComponent(userId)}`,
    { method: 'DELETE' },
  )
}
