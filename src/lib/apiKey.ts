import type { CollaboratorPermissions } from '#/lib/collaborator'

export type ApiKeyStatus = 'active' | 'disabled_plan' | 'revoked'

export const API_KEY_LABEL_MAX = 64
export const API_KEY_DESCRIPTION_MAX = 500

export function formatApiKeyStatusLabel(status: ApiKeyStatus): string {
  switch (status) {
    case 'active':
      return 'Active'
    case 'disabled_plan':
      return 'Disabled by plan'
    case 'revoked':
      return 'Revoked'
  }
}

export type ApiKey = {
  id: string
  label: string
  description: string
  prefix: string
  ipAllowlist: string[]
  lastUsedAt: string | null
  status: ApiKeyStatus
  enhancedRetrieval: boolean
  role?: 'owner' | 'collaborator'
  permissions?: CollaboratorPermissions
}

export type CreatedApiKey = ApiKey & {
  key: string
}

export function parseIpAllowlist(text: string): string[] {
  return text
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function formatIpAllowlistSummary(ips: string[]): string {
  if (ips.length === 0) return 'No IPs allowed'
  if (ips.includes('0.0.0.0')) return 'Allow all IPs'
  return ips.join(', ')
}
