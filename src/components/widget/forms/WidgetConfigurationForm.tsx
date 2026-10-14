import { useEffect, useState, type KeyboardEvent } from 'react'
import { Copy, X } from 'lucide-react'
import toast from 'react-hot-toast'
import ToggleRow from '#/components/widget/forms/ToggleRow'
import {
  WidgetFormSection,
  hintClassName,
  inputClassName,
  widgetFieldLabelClassName,
} from '#/components/widget/forms/widgetFormUi'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { getToken } from '#/context/authContext'
import {
  MAX_WIDGET_MEDIA_BYTES,
  normalizeEmbedDomain,
  uploadWidgetMedia,
  visitorJwtAudience,
  widgetPublicMediaPath,
  VISITOR_JWT_ALGORITHM_VALUES,
  WIDGET_ACCESS_MODE_VALUES,
  type VisitorJwtAlgorithm,
  type WidgetAccessMode,
  type WidgetLoginPrompt,
} from '#/lib/widget'
import { buttonOutlineClassName } from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const BADGE_ACCEPT = 'image/png,image/jpeg,image/jpg,image/gif,.png,.jpg,.jpeg,.gif'

function isBadgeMime(type: string): boolean {
  const t = type.toLowerCase()
  return (
    t === 'image/png' ||
    t === 'image/jpeg' ||
    t === 'image/jpg' ||
    t === 'image/gif'
  )
}

function BadgeImageField({
  badgeImage,
  onBadgeImageChange,
  apiKeyId,
  publicKey,
}: {
  badgeImage: string
  onBadgeImageChange: (badgeImage: string) => void
  apiKeyId: string
  publicKey: string
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let revoked: string | null = null
    let cancelled = false

    async function load() {
      if (!badgeImage) {
        setPreviewUrl(null)
        return
      }
      const publicUrl = widgetPublicMediaPath(publicKey, badgeImage)
      try {
        const probe = await fetch(publicUrl, { method: 'HEAD' })
        if (!cancelled && probe.ok) {
          setPreviewUrl(publicUrl)
          return
        }
      } catch {
        // fall through to owned fetch
      }
      const token = getToken()
      const params = new URLSearchParams({ apiKeyId })
      const response = await fetch(
        `${API_BASE_URL}/widgets/media/${encodeURIComponent(badgeImage)}?${params}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      )
      if (!response.ok || cancelled) return
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      revoked = url
      if (!cancelled) setPreviewUrl(url)
    }

    void load()
    return () => {
      cancelled = true
      if (revoked) URL.revokeObjectURL(revoked)
    }
  }, [apiKeyId, badgeImage, publicKey])

  async function onFileChange(file: File | undefined) {
    if (!file) return
    setError(null)
    if (file.size > MAX_WIDGET_MEDIA_BYTES) {
      setError('Image must be 5MB or smaller')
      return
    }
    if (!isBadgeMime(file.type)) {
      setError('Badge must be PNG, JPG, or GIF')
      return
    }
    setUploading(true)
    try {
      const response = await uploadWidgetMedia(apiKeyId, 'badge', file)
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Upload failed')
      }
      onBadgeImageChange(response.data.mediaId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className={widgetFieldLabelClassName}>Badge image</p>
          <p className={hintClassName}>
            Closed launcher icon. PNG, JPG, or GIF   shown as-is (no crop).
          </p>
        </div>
        {badgeImage ? (
          <button
            type="button"
            className="text-xs text-[var(--muted)] hover:text-[var(--ink)]"
            onClick={() => onBadgeImageChange('')}
          >
            Clear
          </button>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex size-20 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface)]">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt=""
              className="max-h-20 max-w-20 object-contain"
            />
          ) : (
            <span className="text-[10px] text-[var(--muted)]">Default</span>
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
            accept={BADGE_ACCEPT}
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
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  )
}

function DomainChipsInput({
  domains,
  onChange,
}: {
  domains: string[]
  onChange: (domains: string[]) => void
}) {
  const [draft, setDraft] = useState('')

  function addDomain(raw: string) {
    const domain = normalizeEmbedDomain(raw)
    if (!domain) return
    if (domains.some((d) => normalizeEmbedDomain(d) === domain)) {
      setDraft('')
      return
    }
    onChange([...domains, domain])
    setDraft('')
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addDomain(draft)
    }
    if (event.key === 'Backspace' && !draft && domains.length > 0) {
      onChange(domains.slice(0, -1))
    }
  }

  return (
    <div className="space-y-2">
      <label
        htmlFor="widget-allowed-domains"
        className={widgetFieldLabelClassName}
      >
        Allowed domains
      </label>
      <p className={hintClassName}>
        Press Enter to add. Embed only loads on these hosts.
      </p>
      <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2 py-1.5">
        {domains.map((domain) => (
          <span
            key={domain}
            className="inline-flex max-w-full items-center gap-1 rounded-full bg-[var(--ink)] px-2.5 py-1 text-xs font-medium text-white"
          >
            <span className="truncate">{domain}</span>
            <button
              type="button"
              className="rounded-full p-0.5 text-white/80 transition hover:bg-white/15 hover:text-white"
              aria-label={`Remove ${domain}`}
              onClick={() => onChange(domains.filter((d) => d !== domain))}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          id="widget-allowed-domains"
          className="min-w-[8rem] flex-1 border-0 bg-transparent px-1 py-1 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => {
            if (draft.trim()) addDomain(draft)
          }}
          placeholder={domains.length === 0 ? 'localhost:3000' : 'Add domain'}
        />
      </div>
    </div>
  )
}

function CopyField({ label, value }: { label: string; value: string }) {
  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value)
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Failed to copy')
    }
  }

  return (
    <div className="space-y-2">
      <p className={widgetFieldLabelClassName}>{label}</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <code className="min-w-0 flex-1 break-all rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--ink)]">
          {value}
        </code>
        <button
          type="button"
          onClick={() => void copyValue()}
          className={cn(buttonOutlineClassName, 'inline-flex shrink-0 items-center gap-1.5')}
        >
          <Copy className="size-4" aria-hidden />
          Copy
        </button>
      </div>
    </div>
  )
}

const ACCESS_MODE_LABELS: Record<WidgetAccessMode, string> = {
  authenticated: 'Authenticated only',
  anonymous: 'Anonymous only',
  both: 'Both',
}

type WidgetConfigurationFormProps = {
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  darkMode: boolean
  onDarkModeChange: (darkMode: boolean) => void
  badgeImage: string
  onBadgeImageChange: (badgeImage: string) => void
  apiKeyId: string
  accessMode: WidgetAccessMode
  onAccessModeChange: (accessMode: WidgetAccessMode) => void
  loginPrompt: WidgetLoginPrompt
  onLoginPromptChange: (loginPrompt: WidgetLoginPrompt) => void
  visitorJwtPublicKeyPem: string
  onVisitorJwtPublicKeyPemChange: (pem: string) => void
  visitorJwtAlgorithm: VisitorJwtAlgorithm
  onVisitorJwtAlgorithmChange: (algorithm: VisitorJwtAlgorithm) => void
  visitorJwtIssuer: string
  onVisitorJwtIssuerChange: (issuer: string) => void
  publicKey: string
  embedPath: string
  allowedDomains: string[]
  onAllowedDomainsChange: (domains: string[]) => void
}

export default function WidgetConfigurationForm({
  enabled,
  onEnabledChange,
  darkMode,
  onDarkModeChange,
  badgeImage,
  onBadgeImageChange,
  apiKeyId,
  accessMode,
  onAccessModeChange,
  loginPrompt,
  onLoginPromptChange,
  visitorJwtPublicKeyPem,
  onVisitorJwtPublicKeyPemChange,
  visitorJwtAlgorithm,
  onVisitorJwtAlgorithmChange,
  visitorJwtIssuer,
  onVisitorJwtIssuerChange,
  publicKey,
  embedPath,
  allowedDomains,
  onAllowedDomainsChange,
}: WidgetConfigurationFormProps) {
  const audience = visitorJwtAudience(publicKey)
  const origin =
    typeof window === 'undefined' ? '' : window.location.origin
  const installSnippet = `<script src="${origin}/widget.js" data-public-key="${publicKey}" async></script>`

  return (
    <div className="space-y-6">
      <WidgetFormSection
        title="General"
        description="Enablement, appearance, and which hosts may load the embed."
      >
        <div className="divide-y divide-[var(--line)]">
          <div className="pb-4">
            <ToggleRow
              id="widget-enabled"
              label="Widget enabled"
              description="When off, the public embed will not load for anyone."
              checked={enabled}
              onChange={onEnabledChange}
            />
          </div>
          <div className="py-4">
            <ToggleRow
              id="widget-dark-mode"
              label="Dark mode"
              description="Use a dark surface for the widget panel and navigation."
              checked={darkMode}
              onChange={onDarkModeChange}
            />
          </div>
        </div>
        <BadgeImageField
          badgeImage={badgeImage}
          onBadgeImageChange={onBadgeImageChange}
          apiKeyId={apiKeyId}
          publicKey={publicKey}
        />
        <DomainChipsInput
          domains={allowedDomains}
          onChange={onAllowedDomainsChange}
        />
      </WidgetFormSection>

      <WidgetFormSection
        title="Access"
        description="Who may use this widget: signed-in visitors only, guests only, or either."
      >
        <div>
          <label
            htmlFor="widget-access-mode"
            className={widgetFieldLabelClassName}
          >
            Access mode
          </label>
          <Select
            value={accessMode}
            onValueChange={(value) => {
              if (
                (WIDGET_ACCESS_MODE_VALUES as readonly string[]).includes(value)
              ) {
                onAccessModeChange(value as WidgetAccessMode)
              }
            }}
          >
            <SelectTrigger id="widget-access-mode" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WIDGET_ACCESS_MODE_VALUES.map((value) => (
                <SelectItem key={value} value={value}>
                  {ACCESS_MODE_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {accessMode === 'both' ? (
          <div className="space-y-4 border-t border-[var(--line)] pt-4">
            <ToggleRow
              id="widget-login-prompt"
              label="Show login prompt"
              description="When the visitor is anonymous, show a short message encouraging them to log in on the host site."
              checked={loginPrompt.enabled}
              onChange={(enabledPrompt) =>
                onLoginPromptChange({ ...loginPrompt, enabled: enabledPrompt })
              }
            />
            {loginPrompt.enabled ? (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="widget-login-prompt-message"
                    className={widgetFieldLabelClassName}
                  >
                    Prompt message
                  </label>
                  <textarea
                    id="widget-login-prompt-message"
                    className={cn(inputClassName, 'min-h-20 resize-y')}
                    value={loginPrompt.message}
                    onChange={(event) =>
                      onLoginPromptChange({
                        ...loginPrompt,
                        message: event.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label
                    htmlFor="widget-login-prompt-link"
                    className={widgetFieldLabelClassName}
                  >
                    Login link
                  </label>
                  <p className={`mb-1.5 ${hintClassName}`}>
                    Optional. When set, anonymous visitors see a button that
                    opens this URL.
                  </p>
                  <input
                    id="widget-login-prompt-link"
                    type="url"
                    placeholder="https://example.com/login"
                    className={inputClassName}
                    value={loginPrompt.loginLink}
                    onChange={(event) =>
                      onLoginPromptChange({
                        ...loginPrompt,
                        loginLink: event.target.value,
                      })
                    }
                  />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </WidgetFormSection>

      {accessMode !== 'anonymous' ? (
      <WidgetFormSection
        title="Visitor JWT"
        description="Your backend signs a short-lived visitor JWT with your private key. Register the matching public key here. Never send your primary session JWT to the widget."
      >
        <div>
          <label
            htmlFor="widget-visitor-alg"
            className={widgetFieldLabelClassName}
          >
            Algorithm
          </label>
          <Select
            value={visitorJwtAlgorithm}
            onValueChange={(value) => {
              if (
                (VISITOR_JWT_ALGORITHM_VALUES as readonly string[]).includes(
                  value,
                )
              ) {
                onVisitorJwtAlgorithmChange(value as VisitorJwtAlgorithm)
              }
            }}
          >
            <SelectTrigger id="widget-visitor-alg" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VISITOR_JWT_ALGORITHM_VALUES.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label
            htmlFor="widget-visitor-issuer"
            className={widgetFieldLabelClassName}
          >
            Expected issuer (`iss`)
          </label>
          <input
            id="widget-visitor-issuer"
            className={inputClassName}
            value={visitorJwtIssuer}
            onChange={(event) => onVisitorJwtIssuerChange(event.target.value)}
            placeholder="https://your-app.example"
          />
        </div>
        <div>
          <label
            htmlFor="widget-visitor-pem"
            className={widgetFieldLabelClassName}
          >
            Public key (PEM)
          </label>
          <textarea
            id="widget-visitor-pem"
            className={cn(inputClassName, 'min-h-32 resize-y font-mono text-xs')}
            value={visitorJwtPublicKeyPem}
            onChange={(event) =>
              onVisitorJwtPublicKeyPemChange(event.target.value)
            }
            placeholder="-----BEGIN PUBLIC KEY-----"
            spellCheck={false}
          />
        </div>
        <CopyField label="Audience (`aud`)" value={audience} />
        <p className={hintClassName}>
          Required claims: `sub`, `iss`, `aud`, `exp`, `iat`. Optional flat
          `claims` object. Host passes the token via{' '}
          <code className="text-xs">
            window.SapAiWidget.setVisitorToken(token)
          </code>
          .
        </p>
      </WidgetFormSection>
      ) : null}

      <WidgetFormSection
        title="Embed"
        description="Add this script to your site. The widget positions, sizes and animates itself; no CSS is added to your page."
      >
        <CopyField label="Install snippet" value={installSnippet} />
        <p className={hintClassName}>
          Place it anywhere in your HTML. Optional controls:{' '}
          <code className="text-xs">window.SapAiWidget.open()</code>,{' '}
          <code className="text-xs">close()</code>, and{' '}
          <code className="text-xs">setVisitorToken(token)</code>.
        </p>
        <div className="space-y-2">
          <p className="text-sm font-medium text-[var(--ink)]">
            Optional script attributes
          </p>
          <ul className={`list-disc space-y-1.5 pl-5 ${hintClassName}`}>
            <li>
              <code className="text-xs">data-on-error-load</code> (default{' '}
              <code className="text-xs">true</code>) —{' '}
              <code className="text-xs">true</code>: show the “Widget
              unavailable” card when the widget fails to load (not found,
              disabled, domain blocked, etc.).{' '}
              <code className="text-xs">false</code>: hide the iframe entirely
              (no error UI).
            </li>
            <li>
              <code className="text-xs">data-wait-until-loaded</code> (default{' '}
              <code className="text-xs">false</code>) —{' '}
              <code className="text-xs">true</code>: keep the widget hidden until
              config load succeeds (no loading pulse).{' '}
              <code className="text-xs">false</code>: show the loading state
              immediately.
            </li>
          </ul>
          <pre className="overflow-x-auto rounded-md border border-[var(--line)] bg-[var(--paper)] p-3 text-xs text-[var(--ink)]">
            {`<script
  src="${origin}/widget.js"
  data-public-key="${publicKey}"
  data-on-error-load="false"
  data-wait-until-loaded="true"
  async
></script>`}
          </pre>
        </div>
        <CopyField label="Public key" value={publicKey} />
        <CopyField label="Embed URL" value={embedPath} />
      </WidgetFormSection>
    </div>
  )
}
