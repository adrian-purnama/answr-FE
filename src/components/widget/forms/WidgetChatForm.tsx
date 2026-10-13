import { useEffect, useRef, useState } from 'react'
import ToggleRow from '#/components/widget/forms/ToggleRow'
import {
  WidgetFormSection,
  hintClassName,
  inputClassName,
  widgetFieldLabelClassName,
} from '#/components/widget/forms/widgetFormUi'
import { getToken } from '#/context/authContext'
import { buttonOutlineClassName } from '#/lib/ui-classes'
import { cn } from '#/lib/utils'
import {
  MAX_WIDGET_MEDIA_BYTES,
  uploadWidgetMedia,
  widgetPublicMediaPath,
  type WidgetChatSettings,
} from '#/lib/widget'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

type WidgetChatFormProps = {
  value: WidgetChatSettings
  onChange: (value: WidgetChatSettings) => void
  apiKeyId: string
  publicKey: string
}

export default function WidgetChatForm({
  value,
  onChange,
  apiKeyId,
  publicKey,
}: WidgetChatFormProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [questionDraft, setQuestionDraft] = useState('')

  useEffect(() => {
    let revoked: string | null = null
    let cancelled = false

    async function load() {
      if (!value.agentProfilePicture) {
        setPreviewUrl(null)
        return
      }
      const publicUrl = widgetPublicMediaPath(
        publicKey,
        value.agentProfilePicture,
      )
      try {
        const probe = await fetch(publicUrl, { method: 'HEAD' })
        if (!cancelled && probe.ok) {
          setPreviewUrl(publicUrl)
          return
        }
      } catch {
        // fall through
      }
      const token = getToken()
      const params = new URLSearchParams({ apiKeyId })
      const response = await fetch(
        `${API_BASE_URL}/widgets/media/${encodeURIComponent(value.agentProfilePicture)}?${params}`,
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
  }, [apiKeyId, publicKey, value.agentProfilePicture])

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
      const response = await uploadWidgetMedia(apiKeyId, 'agentAvatar', file)
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Upload failed')
      }
      onChange({ ...value, agentProfilePicture: response.data.mediaId })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function addQuestion() {
    const next = questionDraft.trim()
    if (!next) return
    onChange({
      ...value,
      initialQuestions: [...value.initialQuestions, next],
    })
    setQuestionDraft('')
  }

  return (
    <div className="space-y-6">
      <WidgetFormSection title="Availability">
        <ToggleRow
          id="widget-section-chat"
          label="Enable Chat"
          description="Messages tab where visitors start conversations with your agent."
          checked={value.enabled}
          onChange={(enabled) => onChange({ ...value, enabled })}
        />
      </WidgetFormSection>

      <WidgetFormSection
        title="Agent"
        description="Name, avatar, and greeting shown in Messages."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={widgetFieldLabelClassName} htmlFor="widget-agent-name">
              Agent name
            </label>
            <input
              id="widget-agent-name"
              className={inputClassName}
              value={value.agentName}
              onChange={(e) => onChange({ ...value, agentName: e.target.value })}
            />
          </div>
          <div>
            <label
              className={widgetFieldLabelClassName}
              htmlFor="widget-agent-description"
            >
              Agent description
            </label>
            <input
              id="widget-agent-description"
              className={inputClassName}
              value={value.agentDescription}
              onChange={(e) =>
                onChange({ ...value, agentDescription: e.target.value })
              }
              placeholder="The team can also help"
            />
          </div>
        </div>

        <div>
          <label
            className={widgetFieldLabelClassName}
            htmlFor="widget-agent-initial-message"
          >
            Initial message
          </label>
          <textarea
            id="widget-agent-initial-message"
            className={cn(inputClassName, 'min-h-20 resize-y')}
            value={value.agentInitialMessage}
            onChange={(e) =>
              onChange({ ...value, agentInitialMessage: e.target.value })
            }
            placeholder={
              'Hi {{claims.name || ""}}!\nHow can we help you?'
            }
          />
          <p className={`mt-1.5 ${hintClassName}`}>
            Optional personalization:{' '}
            <code className="text-xs">{'{{claims.field || "fallback"}}'}</code>{' '}
            uses visitor JWT claims (falls back when missing).
          </p>
        </div>

        <div>
          <label className={widgetFieldLabelClassName}>Agent avatar</label>
          <div className="flex items-center gap-3">
            <div className="flex size-14 items-center justify-center overflow-hidden rounded-full border border-[var(--line)] bg-[var(--surface)]">
              {previewUrl ? (
                <img src={previewUrl} alt="" className="size-full object-cover" />
              ) : (
                <span className="text-[10px] text-[var(--muted)]">None</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={cn(buttonOutlineClassName, 'px-3 py-1.5 text-xs')}
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
              >
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
              {value.agentProfilePicture ? (
                <button
                  type="button"
                  className={cn(buttonOutlineClassName, 'px-3 py-1.5 text-xs')}
                  onClick={() =>
                    onChange({ ...value, agentProfilePicture: '' })
                  }
                >
                  Clear
                </button>
              ) : null}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                void onFileChange(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </div>
          <p className={`mt-1.5 ${hintClassName}`}>Max 5MB. Shown in Messages.</p>
          {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
        </div>
      </WidgetFormSection>

      <WidgetFormSection
        title="Suggested questions"
        description="Shown as tappable chips under the agent greeting before the first reply."
      >
        <ToggleRow
          id="widget-enable-followup-questions"
          label="Suggest follow-up questions"
          description="After each agent reply, show relevant follow-up chips the visitor can tap."
          checked={value.enableFollowupQuestions}
          onChange={(enableFollowupQuestions) =>
            onChange({ ...value, enableFollowupQuestions })
          }
        />
        <div className="mt-3 flex gap-2">
          <input
            className={inputClassName}
            value={questionDraft}
            onChange={(e) => setQuestionDraft(e.target.value)}
            placeholder="Add a suggested question"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addQuestion()
              }
            }}
          />
          <button
            type="button"
            className={cn(buttonOutlineClassName, 'shrink-0 px-3 py-2 text-xs')}
            onClick={addQuestion}
          >
            Add
          </button>
        </div>
        {value.initialQuestions.length === 0 ? (
          <p className={hintClassName}>No suggested questions yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--line)] border-t border-[var(--line)]">
            {value.initialQuestions.map((question, index) => (
              <li
                key={`${question}-${index}`}
                className="flex items-center justify-between gap-2 py-3 text-sm"
              >
                <span className="min-w-0 truncate text-[var(--ink)]">
                  {question}
                </span>
                <button
                  type="button"
                  className="shrink-0 text-xs text-[var(--muted)] hover:text-red-600"
                  onClick={() =>
                    onChange({
                      ...value,
                      initialQuestions: value.initialQuestions.filter(
                        (_, i) => i !== index,
                      ),
                    })
                  }
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </WidgetFormSection>
    </div>
  )
}
