import { apiFetch } from '#/lib/api'

export type UiTemplate = {
  id: string
  apiKeyId: string
  name: string
  description: string
  definition: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export type CreateUiTemplateInput = {
  name: string
  description?: string
  definition: Record<string, unknown>
}

export type UpdateUiTemplateInput = {
  name?: string
  description?: string
  definition?: Record<string, unknown>
}

function withApiKey(path: string, apiKeyId: string): string {
  const sep = path.includes('?') ? '&' : '?'
  return `${path}${sep}apiKeyId=${encodeURIComponent(apiKeyId)}`
}

export async function listUiTemplates(apiKeyId: string) {
  return apiFetch<UiTemplate[]>(withApiKey('/ui-templates', apiKeyId))
}

export async function createUiTemplate(
  apiKeyId: string,
  input: CreateUiTemplateInput,
) {
  return apiFetch<UiTemplate>('/ui-templates', {
    method: 'POST',
    body: JSON.stringify({ apiKeyId, ...input }),
  })
}

export async function updateUiTemplate(
  apiKeyId: string,
  id: string,
  patch: UpdateUiTemplateInput,
) {
  return apiFetch<UiTemplate>(withApiKey(`/ui-templates/${id}`, apiKeyId), {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export async function deleteUiTemplate(apiKeyId: string, id: string) {
  return apiFetch<null>(withApiKey(`/ui-templates/${id}`, apiKeyId), {
    method: 'DELETE',
  })
}

export type GenerateUiTemplateFromToolResult = {
  definition: Record<string, unknown>
  suggestedName: string
  binds: string[]
}

export async function generateUiTemplateFromTool(
  apiKeyId: string,
  input: { mcpId: string; toolId: string },
) {
  return apiFetch<GenerateUiTemplateFromToolResult>(
    '/ui-templates/generate-from-tool',
    {
      method: 'POST',
      body: JSON.stringify({ apiKeyId, ...input }),
    },
  )
}
