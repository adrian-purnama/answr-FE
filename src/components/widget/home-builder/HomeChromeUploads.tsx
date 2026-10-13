import { useEffect, useState } from 'react'
import { getToken } from '#/context/authContext'
import { buttonOutlineClassName, hintClassName } from '#/lib/ui-classes'
import { cn } from '#/lib/utils'
import {
  MAX_WIDGET_MEDIA_BYTES,
  uploadWidgetMedia,
  widgetPublicMediaPath,
  type WidgetHomeSettings,
  type WidgetMediaType,
} from '#/lib/widget'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type HomeChromeUploadsProps = {
  value: WidgetHomeSettings
  onChange: (value: WidgetHomeSettings) => void
  apiKeyId: string
  publicKey: string
}

async function fetchOwnedPreviewUrl(
  apiKeyId: string,
  mediaId: string,
): Promise<string | null> {
  const token = getToken()
  const params = new URLSearchParams({ apiKeyId })
  const response = await fetch(
    `${API_BASE_URL}/widgets/media/${encodeURIComponent(mediaId)}?${params}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  )
  if (!response.ok) return null
  const blob = await response.blob()
  return URL.createObjectURL(blob)
}

function MediaSlot({
  label,
  type,
  mediaId,
  apiKeyId,
  publicKey,
  onUploaded,
  onClear,
}: {
  label: string
  type: WidgetMediaType
  mediaId: string
  apiKeyId: string
  publicKey: string
  onUploaded: (mediaId: string) => void
  onClear: () => void
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let revoked: string | null = null
    let cancelled = false

    async function load() {
      setError(null)
      if (!mediaId) {
        setPreviewUrl(null)
        return
      }
      // Prefer public URL when widget is embeddable; fall back to auth blob.
      const publicUrl = widgetPublicMediaPath(publicKey, mediaId)
      try {
        const probe = await fetch(publicUrl, { method: 'HEAD' })
        if (!cancelled && probe.ok) {
          setPreviewUrl(publicUrl)
          return
        }
      } catch {
        // fall through
      }
      const blobUrl = await fetchOwnedPreviewUrl(apiKeyId, mediaId)
      if (!cancelled) {
        revoked = blobUrl
        setPreviewUrl(blobUrl)
      }
    }

    void load()
    return () => {
      cancelled = true
      if (revoked) URL.revokeObjectURL(revoked)
    }
  }, [apiKeyId, mediaId, publicKey])

  async function onFileChange(file: File | undefined) {
    if (!file) return
    setError(null)
    if (file.size > MAX_WIDGET_MEDIA_BYTES) {
      setError('Image must be 5MB or smaller')
      return
    }
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed')
      return
    }
    setUploading(true)
    try {
      const response = await uploadWidgetMedia(apiKeyId, type, file)
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Upload failed')
      }
      const local = URL.createObjectURL(file)
      setPreviewUrl(local)
      onUploaded(response.data.mediaId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-[var(--muted)]">{label}</p>
        {mediaId ? (
          <button
            type="button"
            className="text-xs text-[var(--muted)] hover:text-[var(--ink)]"
            onClick={onClear}
          >
            Clear
          </button>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex size-14 items-center justify-center overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--surface)]">
          {previewUrl ? (
            <img src={previewUrl} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-[10px] text-[var(--muted)]">None</span>
          )}
        </div>
        <label
          className={cn(
            buttonOutlineClassName,
            'cursor-pointer px-3 py-1.5 text-xs',
            uploading && 'pointer-events-none opacity-60',
          )}
        >
          {uploading ? 'Uploading…' : 'Upload'}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              void onFileChange(file)
            }}
          />
        </label>
      </div>
      <p className={hintClassName}>Max 5MB. Stored as widget {type}.</p>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  )
}

export default function HomeChromeUploads({
  value,
  onChange,
  apiKeyId,
  publicKey,
}: HomeChromeUploadsProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <MediaSlot
          label="Logo"
          type="logo"
          mediaId={value.logo}
          apiKeyId={apiKeyId}
          publicKey={publicKey}
          onUploaded={(mediaId) => onChange({ ...value, logo: mediaId })}
          onClear={() => onChange({ ...value, logo: '' })}
        />
        <MediaSlot
          label="Background image"
          type="homeBackground"
          mediaId={value.backgroundImage}
          apiKeyId={apiKeyId}
          publicKey={publicKey}
          onUploaded={(mediaId) =>
            onChange({ ...value, backgroundImage: mediaId })
          }
          onClear={() => onChange({ ...value, backgroundImage: '' })}
        />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <label
            htmlFor="home-background-dim"
            className="text-xs font-medium text-[var(--muted)]"
          >
            Background dim
          </label>
          <span className="text-xs text-[var(--muted)]">
            {Math.round(value.backgroundDim ?? 0)}%
          </span>
        </div>
        <input
          id="home-background-dim"
          type="range"
          min={0}
          max={100}
          step={1}
          value={value.backgroundDim ?? 0}
          onChange={(e) =>
            onChange({
              ...value,
              backgroundDim: Number(e.target.value) || 0,
            })
          }
          className="w-full accent-[var(--ink)]"
        />
        <p className={hintClassName}>
          Darkens the background image (0 = none, 100 = fully dimmed).
        </p>
      </div>
    </div>
  )
}
