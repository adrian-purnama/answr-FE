import { apiFetch } from '#/lib/api'

export const LEAD_FIELD_TYPES = [
  'name',
  'email',
  'phone',
  'company',
  'text',
] as const

export type LeadFieldType = (typeof LEAD_FIELD_TYPES)[number]

export const LEAD_CAPTURE_STRATEGIES = [
  'subtle',
  'aggressive',
  'adaptive',
] as const

export type LeadCaptureStrategy = (typeof LEAD_CAPTURE_STRATEGIES)[number]

export type LeadFieldConfig = {
  id: string
  key: string
  label: string
  type: LeadFieldType
  required: boolean
  order: number
}

export type LeadCaptureSettings = {
  apiKeyId: string
  enabled: boolean
  strategy: LeadCaptureStrategy
  fields: LeadFieldConfig[]
}

export type LeadFieldValue = {
  fieldId: string
  key: string
  label: string
  value: string
}

export type Lead = {
  id: string
  apiKeyId: string
  chatSessionId: string
  status: 'gathering' | 'lead' | 'qualified' | 'hot'
  fieldValues: LeadFieldValue[]
  summary: string
  createdAt: string
  updatedAt: string
  expiresAt: string
}

export const LEAD_STRATEGY_OPTIONS: Array<{
  value: LeadCaptureStrategy
  label: string
  hint: string
}> = [
  {
    value: 'subtle',
    label: 'Subtle',
    hint: 'Ask for missing required details only when the conversation already makes it natural.',
  },
  {
    value: 'aggressive',
    label: 'Aggressive',
    hint: 'Ask for missing required details before the lead is saved.',
  },
  {
    value: 'adaptive',
    label: 'Adaptive',
    hint: 'Ask sooner when buying intent is strong, and wait when it is not.',
  },
]

function settingsPath(apiKeyId: string) {
  return `/lead-capture/settings?apiKeyId=${encodeURIComponent(apiKeyId)}`
}

export function getLeadCaptureSettings(apiKeyId: string) {
  return apiFetch<LeadCaptureSettings>(settingsPath(apiKeyId))
}

export function updateLeadCaptureSettings(
  apiKeyId: string,
  patch: Partial<Pick<LeadCaptureSettings, 'enabled' | 'strategy' | 'fields'>>,
) {
  return apiFetch<LeadCaptureSettings>(settingsPath(apiKeyId), {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export type LeadMessage = {
  role: 'user' | 'assistant'
  text: string
  createdAt: string
}

function leadsPath(apiKeyId: string, suffix = '') {
  return `/lead-capture/leads${suffix}?apiKeyId=${encodeURIComponent(apiKeyId)}`
}

export function listLeads(apiKeyId: string) {
  return apiFetch<Lead[]>(leadsPath(apiKeyId))
}

export function exportLeads(apiKeyId: string) {
  return apiFetch<{ csv: string }>(leadsPath(apiKeyId, '/export'))
}

export function deleteLead(apiKeyId: string, leadId: string) {
  return apiFetch<null>(leadsPath(apiKeyId, `/${leadId}`), { method: 'DELETE' })
}

export function listLeadMessages(apiKeyId: string, leadId: string) {
  return apiFetch<LeadMessage[]>(leadsPath(apiKeyId, `/${leadId}/messages`))
}
