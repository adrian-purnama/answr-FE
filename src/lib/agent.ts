import { getToken } from '#/context/authContext'
import type { ApiResponseDto } from '#/lib/api'
import type { MeetingBookingPayload } from '#/lib/meetingTool'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export type AgentInfluenceTopic = {
  id: string
  name: string
  articleId: string
}

export type AgentInfluenceArticle = {
  id: string
  title: string
}

export type AgentInfluenceChunk = {
  id: string
  topicId: string
  articleId: string
  preview: string
}

export type AgentInfluenceGuidance = {
  id: string
  name: string
}

export type AgentInfluenceTool = {
  name: string
  alias: string
  ok: boolean
  error?: string
  arguments?: Record<string, unknown>
  result?: unknown
}

export type AgentInfluenceDeclaredTool = {
  name: string
  alias: string
}

export type AgentInfluence = {
  topics: AgentInfluenceTopic[]
  articles: AgentInfluenceArticle[]
  chunks: AgentInfluenceChunk[]
  guidances: AgentInfluenceGuidance[]
  tools: AgentInfluenceTool[]
  declaredTools: AgentInfluenceDeclaredTool[]
}

export function emptyAgentInfluence(): AgentInfluence {
  return {
    topics: [],
    articles: [],
    chunks: [],
    guidances: [],
    tools: [],
    declaredTools: [],
  }
}

export function influenceSourceCount(influence: AgentInfluence): number {
  return (
    influence.topics.length +
    influence.articles.length +
    influence.chunks.length +
    influence.guidances.length +
    influence.tools.length +
    (influence.declaredTools?.length ?? 0)
  )
}

/** Visible sources shown in the UI (chunks are stored but not displayed). */
export function influenceVisibleSourceCount(influence: AgentInfluence): number {
  return (
    influence.topics.length +
    influence.articles.length +
    influence.guidances.length +
    influence.tools.length +
    (influence.declaredTools?.length ?? 0)
  )
}

export function mergeInfluences(
  items: Array<AgentInfluence | null | undefined>,
): AgentInfluence {
  const topics = new Map<string, AgentInfluenceTopic>()
  const articles = new Map<string, AgentInfluenceArticle>()
  const chunks = new Map<string, AgentInfluenceChunk>()
  const guidances = new Map<string, AgentInfluenceGuidance>()
  const tools = new Map<string, AgentInfluenceTool>()
  const declaredTools = new Map<string, AgentInfluenceDeclaredTool>()

  for (const item of items) {
    if (!item) continue
    for (const topic of item.topics) topics.set(topic.id, topic)
    for (const article of item.articles) articles.set(article.id, article)
    for (const chunk of item.chunks) chunks.set(chunk.id, chunk)
    for (const guidance of item.guidances) guidances.set(guidance.id, guidance)
    for (const tool of item.tools ?? []) {
      tools.set(`${tool.name}:${tool.alias}`, tool)
    }
    for (const tool of item.declaredTools ?? []) {
      declaredTools.set(`${tool.name}:${tool.alias}`, tool)
    }
  }

  return {
    topics: [...topics.values()],
    articles: [...articles.values()],
    chunks: [...chunks.values()],
    guidances: [...guidances.values()],
    tools: [...tools.values()],
    declaredTools: [...declaredTools.values()],
  }
}

type AgentSseEvent =
  | { type: 'token'; text: string }
  | { type: 'status'; step: string }
  | {
      type: 'tool_ui'
      kind: 'live_agent' | 'meeting'
      status: 'loading' | 'error'
      meetingTopicId?: string
      topicName?: string
      message?: string
    }
  | {
      type: 'ui'
      format: 'ui' | 'openui'
      payload: unknown
    }
  | {
      type: 'done'
      influence?: AgentInfluence
      followupQuestions?: unknown
      liveAgentOffer?: unknown
      meetingBooking?: unknown
      requestFeedback?: unknown
    }
  | { type: 'followup_questions'; followupQuestions?: unknown }
  | { type: 'error'; message: string }

export type AgentSseUiEvent = {
  type: 'ui'
  format: 'ui' | 'openui'
  payload: unknown
}

export type AgentToolUiEvent = {
  kind: 'live_agent' | 'meeting'
  status: 'loading' | 'error'
  meetingTopicId?: string
  topicName?: string
  message?: string
}

export type LiveAgentOffer = {
  message: string
  action: 'create_live_agent_ticket'
}

export type PublicWidgetChatResult = {
  influence: AgentInfluence
  followupQuestions: string[]
  liveAgentOffer: LiveAgentOffer | null
  meetingBooking: MeetingBookingPayload | null
  requestFeedback: boolean
}

function normalizeFollowupQuestions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const out: string[] = []
  for (const item of raw) {
    if (typeof item !== 'string') continue
    const question = item.trim()
    if (!question) continue
    out.push(question)
    if (out.length >= 3) break
  }
  return out
}

function normalizeLiveAgentOffer(raw: unknown): LiveAgentOffer | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  if (record.action !== 'create_live_agent_ticket') return null
  const message =
    typeof record.message === 'string' && record.message.trim()
      ? record.message.trim()
      : 'Would you like to talk to a live agent?'
  return { message, action: 'create_live_agent_ticket' }
}

function normalizeMeetingBooking(raw: unknown): MeetingBookingPayload | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  if (record.action !== 'create_meeting') return null
  if (
    typeof record.meetingTopicId !== 'string' ||
    !record.meetingTopicId.trim()
  ) {
    return null
  }
  if (typeof record.topicName !== 'string' || !record.topicName.trim()) {
    return null
  }
  if (typeof record.timezone !== 'string' || !record.timezone.trim()) return null
  if (
    typeof record.slotDurationMinutes !== 'number' ||
    !Number.isFinite(record.slotDurationMinutes)
  ) {
    return null
  }
  if (
    typeof record.bookingHorizonDays !== 'number' ||
    !Number.isFinite(record.bookingHorizonDays)
  ) {
    return null
  }
  if (typeof record.allowConflict !== 'boolean') return null
  if (!Array.isArray(record.fields)) return null
  if (!Array.isArray(record.weeklySchedule)) return null
  if (!Array.isArray(record.blackoutDates)) return null

  const weeklySchedule: MeetingBookingPayload['weeklySchedule'] = []
  for (const item of record.weeklySchedule) {
    if (!item || typeof item !== 'object') continue
    const day = item as Record<string, unknown>
    if (
      typeof day.dayOfWeek !== 'number' ||
      !Number.isInteger(day.dayOfWeek) ||
      day.dayOfWeek < 0 ||
      day.dayOfWeek > 6
    ) {
      continue
    }
    if (typeof day.enabled !== 'boolean') continue
    if (!Array.isArray(day.windows) || !Array.isArray(day.breaks)) continue

    const windows: MeetingBookingPayload['weeklySchedule'][number]['windows'] =
      []
    for (const w of day.windows) {
      if (!w || typeof w !== 'object') continue
      const win = w as Record<string, unknown>
      if (
        typeof win.startTime !== 'string' ||
        typeof win.endTime !== 'string' ||
        typeof win.capacity !== 'number' ||
        !Number.isInteger(win.capacity) ||
        win.capacity < 1
      ) {
        continue
      }
      windows.push({
        startTime: win.startTime,
        endTime: win.endTime,
        capacity: win.capacity,
      })
    }

    const breaks: MeetingBookingPayload['weeklySchedule'][number]['breaks'] =
      []
    for (const b of day.breaks) {
      if (!b || typeof b !== 'object') continue
      const brk = b as Record<string, unknown>
      if (typeof brk.startTime !== 'string' || typeof brk.endTime !== 'string') {
        continue
      }
      breaks.push({ startTime: brk.startTime, endTime: brk.endTime })
    }

    weeklySchedule.push({
      dayOfWeek: day.dayOfWeek,
      enabled: day.enabled,
      windows,
      breaks,
    })
  }

  const blackoutDates: string[] = []
  for (const item of record.blackoutDates) {
    if (typeof item !== 'string' || !item.trim()) continue
    blackoutDates.push(item.trim())
  }

  return {
    action: 'create_meeting',
    meetingTopicId: record.meetingTopicId.trim(),
    topicName: record.topicName.trim(),
    timezone: record.timezone.trim(),
    slotDurationMinutes: record.slotDurationMinutes,
    bookingHorizonDays: record.bookingHorizonDays,
    allowConflict: record.allowConflict,
    fields: record.fields as MeetingBookingPayload['fields'],
    weeklySchedule,
    blackoutDates,
  }
}

function normalizeToolUi(raw: unknown): AgentToolUiEvent | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  if (record.kind !== 'live_agent' && record.kind !== 'meeting') return null
  if (record.status !== 'loading' && record.status !== 'error') return null
  return {
    kind: record.kind,
    status: record.status,
    ...(typeof record.meetingTopicId === 'string'
      ? { meetingTopicId: record.meetingTopicId }
      : {}),
    ...(typeof record.topicName === 'string' ? { topicName: record.topicName } : {}),
    ...(typeof record.message === 'string' ? { message: record.message } : {}),
  }
}

function withApiKey(path: string, apiKeyId: string) {
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}apiKeyId=${encodeURIComponent(apiKeyId)}`
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ApiResponseDto
    if (body.message) return body.message
  } catch {
    // fall through
  }
  return `Request failed (${response.status})`
}

function normalizeInfluence(raw: unknown): AgentInfluence {
  if (!raw || typeof raw !== 'object') return emptyAgentInfluence()
  const record = raw as Partial<AgentInfluence>
  return {
    topics: Array.isArray(record.topics)
      ? record.topics.map((topic) => ({
          id: topic.id,
          name: topic.name,
          articleId: topic.articleId ?? '',
        }))
      : [],
    articles: Array.isArray(record.articles) ? record.articles : [],
    chunks: Array.isArray(record.chunks) ? record.chunks : [],
    guidances: Array.isArray(record.guidances) ? record.guidances : [],
    tools: Array.isArray(record.tools)
      ? record.tools.map((tool) => ({
          name: tool.name,
          alias: tool.alias,
          ok: tool.ok !== false,
          ...(tool.error ? { error: tool.error } : {}),
          ...(tool.arguments !== undefined
            ? { arguments: tool.arguments }
            : {}),
          ...(tool.result !== undefined ? { result: tool.result } : {}),
        }))
      : [],
    declaredTools: Array.isArray(record.declaredTools)
      ? record.declaredTools.map((tool) => ({
          name: tool.name,
          alias: tool.alias,
        }))
      : [],
  }
}

async function readAgentSseStream(
  response: Response,
  options: {
    onToken: (text: string) => void
    onStatus?: (step: string) => void
    onToolUi?: (event: AgentToolUiEvent) => void
    onUi?: (event: AgentSseUiEvent) => void
    /** Fires when the reply is complete so the UI can unlock before follow-ups. */
    onDone?: (result: PublicWidgetChatResult) => void
    onFollowupQuestions?: (questions: string[]) => void
  },
): Promise<PublicWidgetChatResult> {
  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  if (!response.body) {
    throw new Error('Empty stream response')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let influence = emptyAgentInfluence()
  let followupQuestions: string[] = []
  let liveAgentOffer: LiveAgentOffer | null = null
  let meetingBooking: MeetingBookingPayload | null = null
  let requestFeedback = false
  let sawDone = false

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n\n')
    buffer = parts.pop() ?? ''

    for (const part of parts) {
      const dataLine = part
        .split('\n')
        .map((line) => line.trimEnd())
        .find((line) => line.startsWith('data:'))
      if (!dataLine) continue

      const raw = dataLine.slice('data:'.length).trim()
      if (!raw || raw === '[DONE]') continue

      let event: AgentSseEvent
      try {
        event = JSON.parse(raw) as AgentSseEvent
      } catch {
        continue
      }

      if (event.type === 'token') {
        options.onToken(event.text)
      } else if (event.type === 'status') {
        const step = typeof event.step === 'string' ? event.step.trim() : ''
        if (step) options.onStatus?.(step)
      } else if (event.type === 'tool_ui') {
        const ui = normalizeToolUi(event)
        if (ui) options.onToolUi?.(ui)
      } else if (event.type === 'ui') {
        if (event.format === 'ui' || event.format === 'openui') {
          options.onUi?.({
            type: 'ui',
            format: event.format,
            payload: event.payload,
          })
        }
      } else if (event.type === 'error') {
        throw new Error(event.message || 'Agent stream failed')
      } else if (event.type === 'done') {
        sawDone = true
        influence = normalizeInfluence(event.influence)
        followupQuestions = normalizeFollowupQuestions(event.followupQuestions)
        liveAgentOffer = normalizeLiveAgentOffer(event.liveAgentOffer)
        meetingBooking = normalizeMeetingBooking(event.meetingBooking)
        requestFeedback = event.requestFeedback === true
        options.onDone?.({
          influence,
          followupQuestions,
          liveAgentOffer,
          meetingBooking,
          requestFeedback,
        })
        // Keep reading for optional late `followup_questions` events.
      } else if (event.type === 'followup_questions') {
        followupQuestions = normalizeFollowupQuestions(event.followupQuestions)
        options.onFollowupQuestions?.(followupQuestions)
      }
    }
  }

  if (!sawDone) {
    throw new Error('Chat stream ended before the reply finished')
  }

  return { influence, followupQuestions, liveAgentOffer, meetingBooking, requestFeedback }
}

/**
 * Streams authenticated test-agent tokens via SSE.
 * Resolves with influence + optional UI payloads from the final `done` event.
 */
export async function streamTestAgentChat(options: {
  apiKeyId: string
  sessionId: string
  message: string
  signal?: AbortSignal
  onToken: (text: string) => void
  onStatus?: (step: string) => void
  onToolUi?: (event: AgentToolUiEvent) => void
  onUi?: (event: AgentSseUiEvent) => void
  onDone?: (result: PublicWidgetChatResult) => void
  onFollowupQuestions?: (questions: string[]) => void
}): Promise<PublicWidgetChatResult> {
  const headers = new Headers({
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  })
  const token = getToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(
    `${API_BASE_URL}${withApiKey('/agents/test-chat', options.apiKeyId)}`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sessionId: options.sessionId,
        message: options.message,
      }),
      signal: options.signal,
    },
  )

  return readAgentSseStream(response, options)
}

/**
 * Streams public widget agent tokens via SSE (visitor identity enforced server-side).
 */
export async function streamPublicWidgetChat(options: {
  publicKey: string
  sessionId: string
  message: string
  signal?: AbortSignal
  onToken: (text: string) => void
  onStatus?: (step: string) => void
  onToolUi?: (event: AgentToolUiEvent) => void
  onUi?: (event: AgentSseUiEvent) => void
  onDone?: (result: PublicWidgetChatResult) => void
  onFollowupQuestions?: (questions: string[]) => void
}): Promise<PublicWidgetChatResult> {
  const headers = new Headers({
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  })

  const response = await fetch(
    `${API_BASE_URL}/agents/public/${encodeURIComponent(options.publicKey)}/chat`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sessionId: options.sessionId,
        message: options.message,
      }),
      signal: options.signal,
    },
  )

  return readAgentSseStream(response, options)
}

