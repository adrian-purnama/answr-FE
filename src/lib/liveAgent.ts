import { apiFetch, apiUpload } from '#/lib/api'
import { listEnabledMcpTools } from '#/lib/mcp'
import { listMeetingTopics } from '#/lib/meetingTool'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const AGENT_TOKEN_KEY = 'sapai_agent_token'

export const MAX_LIVE_AGENT_MEDIA_BYTES = 5 * 1024 * 1024

export type LiveAgent = {
  id: string
  apiKeyId: string
  name: string
  enabled: boolean
  profilePicture: string
  createdAt: string
  updatedAt: string
}

export type LiveAgentMediaOut = {
  mediaId: string
  url: string
}

export type LiveAgentResilience = 'low' | 'medium' | 'high' | 'never'

export const CALL_LIVE_AGENT_TOOL_NAME = 'call_live_agent'

export const CALL_LIVE_AGENT_TOOL_TITLE = 'Call live agent'

export const CALL_LIVE_AGENT_TOOL_DESCRIPTION =
  'Offer the visitor a handoff to a live human agent. Use when guidance or knowledge says to escalate.'

export type BuiltinReferenceTool = {
  id: string
  name: string
  title: string
  description: string
}

export function builtinCallLiveAgentTool(): BuiltinReferenceTool {
  return {
    id: 'builtin-call-live-agent',
    name: CALL_LIVE_AGENT_TOOL_NAME,
    title: CALL_LIVE_AGENT_TOOL_TITLE,
    description: CALL_LIVE_AGENT_TOOL_DESCRIPTION,
  }
}

export const LIVE_AGENT_RESILIENCE_OPTIONS: {
  value: LiveAgentResilience
  label: string
  hint: string
}[] = [
  {
    value: 'low',
    label: 'Low',
    hint: 'Hand off easily when the visitor asks or struggles once.',
  },
  {
    value: 'medium',
    label: 'Medium',
    hint: 'Hand off after a few attempts, a repeated human ask, or when you lack the answer.',
  },
  {
    value: 'high',
    label: 'High',
    hint: 'Strict: clear frustration plus repeated asks and missing info or failed help — not a calm second request.',
  },
  {
    value: 'never',
    label: 'Never',
    hint: 'Visitors are never handed off to a live agent.',
  },
]

export type LiveAgentSettings = {
  enabled: boolean
  code: string
  resilience: LiveAgentResilience
  notifyEmail: string
}

export type LiveAgentMe = {
  id: string
  apiKeyId: string
  name: string
  enabled: boolean
  profilePicture: string
}

export type LiveAgentLoginOut = {
  name: string
  jwt: string
}

export function getAgentToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(AGENT_TOKEN_KEY)
}

export function setAgentToken(jwt: string): void {
  localStorage.setItem(AGENT_TOKEN_KEY, jwt)
}

export function clearAgentToken(): void {
  localStorage.removeItem(AGENT_TOKEN_KEY)
}

async function agentFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<{ success: boolean; message: string; data: T }> {
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  const token = getAgentToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  try {
    return (await response.json()) as {
      success: boolean
      message: string
      data: T
    }
  } catch {
    throw new Error('Invalid server response')
  }
}

function withApiKey(path: string, apiKeyId: string): string {
  const sep = path.includes('?') ? '&' : '?'
  return `${path}${sep}apiKeyId=${encodeURIComponent(apiKeyId)}`
}

export async function listLiveAgents(apiKeyId: string) {
  return apiFetch<LiveAgent[]>(withApiKey('/live-agents', apiKeyId))
}

export async function createLiveAgent(
  apiKeyId: string,
  input: { name: string; password: string; enabled?: boolean },
) {
  return apiFetch<LiveAgent>('/live-agents', {
    method: 'POST',
    body: JSON.stringify({ apiKeyId, ...input }),
  })
}

export async function updateLiveAgent(
  apiKeyId: string,
  id: string,
  patch: { name?: string; enabled?: boolean },
) {
  return apiFetch<LiveAgent>(withApiKey(`/live-agents/${id}`, apiKeyId), {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export async function resetLiveAgentPassword(
  apiKeyId: string,
  id: string,
  password: string,
) {
  return apiFetch<null>(
    withApiKey(`/live-agents/${id}/reset-password`, apiKeyId),
    {
      method: 'POST',
      body: JSON.stringify({ password }),
    },
  )
}

export async function deleteLiveAgent(apiKeyId: string, id: string) {
  return apiFetch<null>(withApiKey(`/live-agents/${id}`, apiKeyId), {
    method: 'DELETE',
  })
}

export async function uploadLiveAgentAvatar(
  apiKeyId: string,
  id: string,
  file: File,
) {
  if (file.size > MAX_LIVE_AGENT_MEDIA_BYTES) {
    throw new Error('Image must be 5MB or smaller')
  }
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed')
  }
  const formData = new FormData()
  formData.append('file', file)
  return apiUpload<LiveAgentMediaOut>(
    withApiKey(`/live-agents/${id}/avatar`, apiKeyId),
    formData,
  )
}

export function liveAgentOwnedMediaPath(
  mediaId: string,
  apiKeyId: string,
): string {
  return `${API_BASE_URL}${withApiKey(`/live-agents/media/${encodeURIComponent(mediaId)}`, apiKeyId)}`
}

export async function getLiveAgentSettings(apiKeyId: string) {
  return apiFetch<LiveAgentSettings>(
    withApiKey('/live-agents/settings', apiKeyId),
  )
}

/** Merge MCP / live-agent / meeting tool titles for reference chip status. */
export async function loadReferenceToolTitles(
  apiKeyId: string,
): Promise<Map<string, string>> {
  const next = new Map<string, string>()
  const [mcpResponse, settingsResponse, meetingResponse] = await Promise.all([
    listEnabledMcpTools(apiKeyId),
    getLiveAgentSettings(apiKeyId),
    listMeetingTopics(apiKeyId),
  ])
  if (mcpResponse.success && mcpResponse.data) {
    for (const tool of mcpResponse.data) {
      next.set(tool.name.toLowerCase(), tool.title || tool.name)
    }
  }
  if (settingsResponse.success && settingsResponse.data?.enabled) {
    next.set(
      CALL_LIVE_AGENT_TOOL_NAME.toLowerCase(),
      CALL_LIVE_AGENT_TOOL_TITLE,
    )
  }
  if (meetingResponse.success && meetingResponse.data?.planAllows) {
    for (const topic of meetingResponse.data.topics) {
      if (!topic.enabled) continue
      const canonical = topic.toolName.toLowerCase()
      next.set(canonical, topic.name)
      // Old guidance chips used hyphenated slug forms.
      const hyphenated = `book_meeting_${topic.slug}`.toLowerCase()
      next.set(hyphenated, topic.name)
      next.set(canonical.replace(/_/g, '-'), topic.name)
    }
  }
  return next
}

export async function updateLiveAgentSettings(
  apiKeyId: string,
  patch: {
    enabled?: boolean
    resilience?: LiveAgentResilience
    notifyEmail?: string
  },
) {
  return apiFetch<LiveAgentSettings>(
    withApiKey('/live-agents/settings', apiKeyId),
    {
      method: 'PATCH',
      body: JSON.stringify(patch),
    },
  )
}

export async function loginLiveAgent(input: {
  name: string
  password: string
  code: string
}) {
  return agentFetch<LiveAgentLoginOut>('/live-agents/login', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function validateLiveAgentSession() {
  return agentFetch<LiveAgentMe>('/live-agents/me')
}

export async function bootstrapLiveAgentAuth(): Promise<LiveAgentMe | null> {
  const token = getAgentToken()
  if (!token) return null
  try {
    const response = await validateLiveAgentSession()
    if (!response.success || !response.data) {
      clearAgentToken()
      return null
    }
    return response.data
  } catch {
    clearAgentToken()
    return null
  }
}

export type LiveAgentTicketStatus = 'queued' | 'claimed' | 'closed'

export type LiveAgentTicket = {
  id: string
  apiKeyId: string
  publicKey: string
  chatSessionId: string
  visitorAuthMode: 'anonymous' | 'authenticated'
  visitorSub: string | null
  visitorClaims: Record<string, unknown>
  status: LiveAgentTicketStatus
  assignedAgentId: string | null
  assignedAgentName: string | null
  assignedAgentProfilePicture: string | null
  latestMessagePreview: string
  queuedAt: string
  claimedAt: string | null
  closedAt: string | null
  rating: { stars: number; feedback: string; submittedAt: string } | null
  queuePosition?: number | null
  createdAt: string
  updatedAt: string
  aiContext?: Array<{
    role: 'user' | 'assistant'
    text: string
    createdAt: string
  }>
}

export type LiveAgentTicketMessage = {
  id: string
  ticketId: string
  senderType: 'visitor' | 'agent' | 'system'
  senderId: string
  text: string
  createdAt: string
}

export async function listAgentTickets(
  status: LiveAgentTicketStatus | 'all' = 'queued',
) {
  return agentFetch<LiveAgentTicket[]>(
    `/live-agents/tickets?status=${encodeURIComponent(status)}`,
  )
}

export async function getAgentTicket(ticketId: string) {
  return agentFetch<LiveAgentTicket>(
    `/live-agents/tickets/${encodeURIComponent(ticketId)}`,
  )
}

export async function listAgentTicketMessages(ticketId: string) {
  return agentFetch<LiveAgentTicketMessage[]>(
    `/live-agents/tickets/${encodeURIComponent(ticketId)}/messages`,
  )
}

export async function claimAgentTicket(ticketId: string) {
  return agentFetch<LiveAgentTicket>(
    `/live-agents/tickets/${encodeURIComponent(ticketId)}/claim`,
    { method: 'POST', body: JSON.stringify({}) },
  )
}

export async function postAgentTicketMessage(ticketId: string, text: string) {
  return agentFetch<LiveAgentTicketMessage>(
    `/live-agents/tickets/${encodeURIComponent(ticketId)}/messages`,
    { method: 'POST', body: JSON.stringify({ text }) },
  )
}

export async function closeAgentTicket(ticketId: string) {
  return agentFetch<LiveAgentTicket>(
    `/live-agents/tickets/${encodeURIComponent(ticketId)}/close`,
    { method: 'POST', body: JSON.stringify({}) },
  )
}
