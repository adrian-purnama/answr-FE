import { getToken } from '#/context/authContext'

export interface ApiResponseDto<T = null> {
  success: boolean
  message: string
  data: T
  /** Present on 429 responses for client countdowns. */
  retryAfterSeconds?: number
}

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponseDto<T>> {
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')

  const token = getToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  let body: ApiResponseDto<T>
  try {
    body = (await response.json()) as ApiResponseDto<T>
  } catch {
    throw new Error('Invalid server response')
  }

  return body
}

/** Multipart upload    does not set Content-Type so the browser can add the boundary. */
export async function apiUpload<T>(
  path: string,
  formData: FormData,
  options: { method?: 'POST' | 'PATCH' } = {},
): Promise<ApiResponseDto<T>> {
  const headers = new Headers()
  const token = getToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'POST',
    headers,
    body: formData,
  })

  let body: ApiResponseDto<T>
  try {
    body = (await response.json()) as ApiResponseDto<T>
  } catch {
    throw new Error('Invalid server response')
  }

  return body
}

export function toAbsoluteMediaUrl(path: string | null): string | null {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${API_BASE_URL}${path}`
}
