import { apiFetch } from '#/lib/api'

export type WhatsAppSettings = {
  apiKeyId: string
  enabled: boolean
  defaultFlow: boolean
  sessionName: string | null
  status: string | null
  meId: string | null
  mePushName: string | null
  lastSyncedAt: string | null
}

function settingsPath(apiKeyId: string) {
  return `/whatsapp/settings?apiKeyId=${encodeURIComponent(apiKeyId)}`
}

export function getWhatsAppSettings(apiKeyId: string) {
  return apiFetch<WhatsAppSettings>(settingsPath(apiKeyId))
}

export function updateWhatsAppSettings(
  apiKeyId: string,
  patch: Partial<Pick<WhatsAppSettings, 'enabled' | 'defaultFlow'>>,
) {
  return apiFetch<WhatsAppSettings>(settingsPath(apiKeyId), {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

function actionPath(apiKeyId: string, action: 'qr' | 'logout' | 'restart') {
  return `/whatsapp/${action}?apiKeyId=${encodeURIComponent(apiKeyId)}`
}

export function getWhatsAppQr(apiKeyId: string) {
  return apiFetch<{ imageBase64: string }>(actionPath(apiKeyId, 'qr'))
}

export function logoutWhatsApp(apiKeyId: string) {
  return apiFetch<WhatsAppSettings>(actionPath(apiKeyId, 'logout'), {
    method: 'POST',
  })
}

export function restartWhatsApp(apiKeyId: string) {
  return apiFetch<WhatsAppSettings>(actionPath(apiKeyId, 'restart'), {
    method: 'POST',
  })
}

export type FlowOption = {
  label: string
  targetNodeId: string
}

export type FlowField = {
  name: string
  label: string
  type: string
  required: boolean
}

export type FlowNode =
  | {
      id: string
      type: 'menu'
      root: boolean
      header: string
      options: FlowOption[]
    }
  | { id: string; type: 'leaf'; root: boolean; leafType: 'text'; body: string }
  | {
      id: string
      type: 'leaf'
      root: boolean
      leafType: 'function_call'
      label: string
      functionName: string
      parameters: string
      askParameters: boolean
    }
  | {
      id: string
      type: 'leaf'
      root: boolean
      leafType: 'agent_support'
      handoffTarget: string
    }
  | {
      id: string
      type: 'leaf'
      root: boolean
      leafType: 'form'
      fields: FlowField[]
    }

function flowPath(apiKeyId: string) {
  return `/whatsapp/flow?apiKeyId=${encodeURIComponent(apiKeyId)}`
}

export function getWhatsAppFlow(apiKeyId: string) {
  return apiFetch<FlowNode[]>(flowPath(apiKeyId))
}

export function saveWhatsAppFlow(apiKeyId: string, nodes: FlowNode[]) {
  return apiFetch<FlowNode[]>(flowPath(apiKeyId), {
    method: 'PUT',
    body: JSON.stringify(nodes),
  })
}
