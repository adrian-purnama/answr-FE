import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Download, Plus, Trash2, UserRound } from 'lucide-react'
import AgentMessageBody, {
  createAuthImageRenderer,
} from '#/components/agentChat/AgentMessageBody'
import { stripUiMarkers } from '#/components/agentChat/agentChatMarkdown'
import SideDrawer from '#/components/ui/SideDrawer'
import { usePlan } from '#/context/planContext'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import {
  deleteLead,
  exportLeads,
  getLeadCaptureSettings,
  LEAD_FIELD_TYPES,
  LEAD_STRATEGY_OPTIONS,
  listLeadMessages,
  listLeads,
  updateLeadCaptureSettings,
  type Lead,
  type LeadMessage,
  type LeadCaptureSettings,
  type LeadCaptureStrategy,
  type LeadFieldConfig,
  type LeadFieldType,
} from '#/lib/leadCapture'
import {
  buttonClassName,
  buttonOutlineClassName,
  hintClassName,
  inputClassNameCompact,
  projectSectionClassName,
} from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

type LeadCaptureSectionProps = {
  apiKeyId: string
}

const FIELD_TYPE_LABELS: Record<LeadFieldType, string> = {
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
  company: 'Company',
  text: 'Text',
}

function newFieldId(): string {
  return crypto.randomUUID()
}

/** Snake-case key derived from the field name. Must start with a letter. */
function keyFromName(name: string): string {
  let key = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40)
  if (!/^[a-z]/.test(key)) {
    key = `field_${key}`.replace(/_+$/g, '').slice(0, 40)
  }
  return key
}

function timeUntilDeletion(expiresAt: string): string {
  const remaining = new Date(expiresAt).getTime() - Date.now()
  if (!Number.isFinite(remaining) || remaining <= 0) return 'Deletes soon'
  const day = 24 * 60 * 60 * 1000
  const hour = 60 * 60 * 1000
  if (remaining >= day) {
    const days = Math.floor(remaining / day)
    return `Deletes in ${days} day${days === 1 ? '' : 's'}`
  }
  if (remaining >= hour) {
    const hours = Math.floor(remaining / hour)
    return `Deletes in ${hours} hour${hours === 1 ? '' : 's'}`
  }
  const minutes = Math.max(1, Math.floor(remaining / 60_000))
  return `Deletes in ${minutes} minute${minutes === 1 ? '' : 's'}`
}

function withUniqueKeys(fields: LeadFieldConfig[]): LeadFieldConfig[] {
  const used = new Set<string>()
  return fields.map((field, order) => {
    const base = keyFromName(field.label) || 'field'
    let key = base
    let n = 2
    while (used.has(key)) {
      const suffix = `_${n}`
      key = `${base.slice(0, 40 - suffix.length)}${suffix}`
      n += 1
    }
    used.add(key)
    return { ...field, key, order }
  })
}

export default function LeadCaptureSection({ apiKeyId }: LeadCaptureSectionProps) {
  const { plan } = usePlan()
  const planAllows = plan?.leadCapture === true
  const renderImage = useMemo(
    () => createAuthImageRenderer(apiKeyId),
    [apiKeyId],
  )

  const [settings, setSettings] = useState<LeadCaptureSettings | null>(null)
  const [fields, setFields] = useState<LeadFieldConfig[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(planAllows)
  const [saving, setSaving] = useState(false)
  const [openLead, setOpenLead] = useState<Lead | null>(null)
  const [chat, setChat] = useState<LeadMessage[] | null>(null)
  const [chatLoading, setChatLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    if (!planAllows) {
      setSettings(null)
      setFields([])
      setLeads([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [settingsRes, leadsRes] = await Promise.all([
        getLeadCaptureSettings(apiKeyId),
        listLeads(apiKeyId),
      ])
      if (!settingsRes.success || !settingsRes.data) {
        toast.error(settingsRes.message || 'Failed to load lead capture')
        return
      }
      setSettings(settingsRes.data)
      setFields(settingsRes.data.fields)
      setLeads(leadsRes.success && leadsRes.data ? leadsRes.data : [])
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to load lead capture',
      )
    } finally {
      setLoading(false)
    }
  }, [apiKeyId, planAllows])

  useEffect(() => {
    void load()
  }, [load])

  async function patch(
    next: Partial<Pick<LeadCaptureSettings, 'enabled' | 'strategy' | 'fields'>>,
  ) {
    setSaving(true)
    try {
      const response = await updateLeadCaptureSettings(apiKeyId, next)
      if (!response.success || !response.data) {
        toast.error(response.message || 'Failed to update lead capture')
        return
      }
      setSettings(response.data)
      setFields(response.data.fields)
      toast.success('Lead capture updated')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update lead capture',
      )
    } finally {
      setSaving(false)
    }
  }

  function openDrawer(lead: Lead) {
    setOpenLead(lead)
    setChat(null)
  }

  async function downloadLeads() {
    setExporting(true)
    try {
      const response = await exportLeads(apiKeyId)
      if (!response.success || !response.data) {
        toast.error(response.message || 'Failed to export leads')
        return
      }
      const blob = new Blob([response.data.csv], {
        type: 'text/csv;charset=utf-8',
      })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'leads.csv'
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to export leads')
    } finally {
      setExporting(false)
    }
  }

  async function viewChat() {
    if (!openLead) return
    setChatLoading(true)
    try {
      const response = await listLeadMessages(apiKeyId, openLead.id)
      if (!response.success || !response.data) {
        toast.error(response.message || 'Failed to load chat')
        return
      }
      setChat(response.data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load chat')
    } finally {
      setChatLoading(false)
    }
  }

  async function removeLead() {
    if (!openLead) return
    setDeleting(true)
    try {
      const response = await deleteLead(apiKeyId, openLead.id)
      if (!response.success) {
        toast.error(response.message || 'Failed to delete lead')
        return
      }
      setLeads((current) => current.filter((lead) => lead.id !== openLead.id))
      setOpenLead(null)
      setChat(null)
      toast.success('Lead deleted')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete lead')
    } finally {
      setDeleting(false)
    }
  }

  function updateField(id: string, patchField: Partial<LeadFieldConfig>) {
    setFields((current) =>
      withUniqueKeys(
        current.map((field) =>
          field.id === id ? { ...field, ...patchField } : field,
        ),
      ),
    )
  }

  function addField() {
    setFields((current) =>
      withUniqueKeys([
        ...current,
        {
          id: newFieldId(),
          key: 'new_field',
          label: 'New field',
          type: 'text',
          required: false,
          order: current.length,
        },
      ]),
    )
  }

  function saveFields() {
    if (fields.some((field) => !field.label.trim())) {
      toast.error('Each field needs a name')
      return
    }
    void patch({ fields: withUniqueKeys(fields) })
  }

  const strategyHint = LEAD_STRATEGY_OPTIONS.find(
    (option) => option.value === settings?.strategy,
  )?.hint

  return (
    <div className={cn(projectSectionClassName, 'min-w-0 space-y-8')}>
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <UserRound className="size-5 text-[var(--muted)]" aria-hidden />
              <h1 className="text-xl font-semibold text-[var(--ink)]">
                Customer Data & Lead Capture
              </h1>
            </div>
            <p className={cn(hintClassName, 'mt-1 max-w-xl')}>
              The agent gathers these details from the conversation and saves a
              lead once every required field is present.
            </p>
          </div>
        </header>

        {!planAllows ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Your current plan does not include Lead Capture.
          </p>
        ) : loading ? (
          <p className={hintClassName}>Loading…</p>
        ) : (
          <div className="space-y-8">
            <section className="space-y-5">
              <label
                htmlFor="lead-capture-enabled"
                className={cn(
                  'inline-flex items-center gap-3',
                  saving && 'pointer-events-none opacity-60',
                )}
              >
                <span className="text-sm font-medium text-[var(--ink)]">
                  Enabled
                </span>
                <span className="relative inline-flex shrink-0">
                  <input
                    id="lead-capture-enabled"
                    type="checkbox"
                    className="peer sr-only"
                    checked={settings?.enabled ?? false}
                    disabled={!settings || saving}
                    onChange={() =>
                      void patch({ enabled: !(settings?.enabled ?? false) })
                    }
                  />
                  <span
                    className={cn(
                      'block h-6 w-11 rounded-full border border-[var(--line)] bg-[var(--surface)] transition',
                      'peer-checked:border-[var(--ink)] peer-checked:bg-[var(--ink)]',
                    )}
                    aria-hidden
                  />
                  <span
                    className={cn(
                      'pointer-events-none absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition',
                      'peer-checked:translate-x-5',
                    )}
                    aria-hidden
                  />
                </span>
              </label>

              <div className="space-y-2">
                <p className="text-sm font-medium text-[var(--ink)]">
                  Lead Capture Strategy
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {LEAD_STRATEGY_OPTIONS.map((option) => {
                    const selected = settings?.strategy === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        disabled={!settings || saving}
                        onClick={() =>
                          void patch({
                            strategy: option.value as LeadCaptureStrategy,
                          })
                        }
                        className={cn(
                          'rounded-md border px-3 py-1.5 text-sm transition',
                          selected
                            ? 'border-[var(--ink)] bg-[var(--ink)] text-white'
                            : 'border-[var(--line)] text-[var(--ink)] hover:bg-[var(--surface)]',
                        )}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
                {strategyHint ? (
                  <p className={hintClassName}>{strategyHint}</p>
                ) : null}
              </div>
            </section>

            <section className="space-y-4 border-t border-[var(--line)] pt-8">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-sm font-medium text-[var(--ink)]">
                    Customer fields
                  </h2>
                  <p className={cn(hintClassName, 'mt-1 max-w-md')}>
                    Required fields must be gathered before a lead is saved.
                    Optional fields are stored when the visitor mentions them.
                  </p>
                </div>
                <button
                  type="button"
                  className={cn(
                    buttonOutlineClassName,
                    'inline-flex h-8 items-center gap-1.5 px-2.5 text-xs',
                  )}
                  disabled={saving}
                  onClick={addField}
                >
                  <Plus className="size-3.5" aria-hidden />
                  Add field
                </button>
              </div>

              {fields.length === 0 ? (
                <p className={hintClassName}>No fields yet.</p>
              ) : (
                <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
                  {fields.map((field) => (
                    <li
                      key={field.id}
                      className="grid items-center gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_9.5rem_6.5rem_2rem]"
                    >
                      <input
                        aria-label="Field name"
                        placeholder="Field name"
                        className={cn(inputClassNameCompact, 'h-9')}
                        value={field.label}
                        disabled={saving}
                        onChange={(event) =>
                          updateField(field.id, { label: event.target.value })
                        }
                      />
                      <Select
                        value={field.type}
                        disabled={saving}
                        onValueChange={(value) => {
                          if (
                            (LEAD_FIELD_TYPES as readonly string[]).includes(
                              value,
                            )
                          ) {
                            updateField(field.id, {
                              type: value as LeadFieldType,
                            })
                          }
                        }}
                      >
                        <SelectTrigger
                          aria-label="Field type"
                          className="h-9 w-full"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LEAD_FIELD_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {FIELD_TYPE_LABELS[type]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <label className="inline-flex items-center gap-2 text-sm text-[var(--ink)]">
                        <input
                          type="checkbox"
                          className="size-3.5"
                          checked={field.required}
                          disabled={saving}
                          onChange={(event) =>
                            updateField(field.id, {
                              required: event.target.checked,
                            })
                          }
                        />
                        Required
                      </label>
                      <button
                        type="button"
                        className="inline-flex size-8 items-center justify-center rounded-md text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)]"
                        aria-label={`Remove ${field.label || 'field'}`}
                        disabled={saving}
                        onClick={() =>
                          setFields((current) =>
                            withUniqueKeys(
                              current.filter((item) => item.id !== field.id),
                            ),
                          )
                        }
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <button
                type="button"
                className={cn(buttonClassName, 'h-8 px-3 text-xs')}
                disabled={saving || !settings}
                onClick={saveFields}
              >
                Save fields
              </button>
            </section>

            <section className="space-y-3 border-t border-[var(--line)] pt-8">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-medium text-[var(--ink)]">Leads</h2>
                  <p className={cn(hintClassName, 'mt-1 max-w-md')}>
                    Each lead is deleted 30 days after it is saved. Export the
                    list before then.
                  </p>
                </div>
                <button
                  type="button"
                  className={cn(
                    buttonOutlineClassName,
                    'inline-flex h-8 items-center gap-1.5 px-3 text-xs',
                  )}
                  disabled={exporting || leads.length === 0}
                  onClick={() => void downloadLeads()}
                >
                  <Download className="size-3.5" aria-hidden />
                  Export CSV
                </button>
              </div>
              {leads.length === 0 ? (
                <p className={hintClassName}>No leads yet.</p>
              ) : (
                <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
                  {leads.map((lead) => (
                    <li key={lead.id}>
                      <button
                        type="button"
                        className="flex w-full items-start justify-between gap-4 py-3 text-left transition hover:bg-[var(--surface)]"
                        onClick={() => openDrawer(lead)}
                      >
                        <div className="min-w-0 space-y-1">
                          <p className="text-sm text-[var(--ink)]">
                            {lead.fieldValues.length > 0
                              ? lead.fieldValues
                                  .map((item) => `${item.label}: ${item.value}`)
                                  .join(' · ')
                              : 'No details yet'}
                          </p>
                          {lead.summary ? (
                            <p className={cn(hintClassName, 'line-clamp-2')}>
                              {lead.summary}
                            </p>
                          ) : null}
                        </div>
                        <span className="shrink-0 text-xs text-red-700/70">
                          {timeUntilDeletion(lead.expiresAt)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      <SideDrawer
        open={openLead !== null}
        onClose={() => setOpenLead(null)}
        label="Lead"
        size="md"
        statusLabel={
          openLead ? (
            <span className="text-sm text-red-700/70">
              {timeUntilDeletion(openLead.expiresAt)}. Export before it is
              deleted.
            </span>
          ) : null
        }
        actions={
          openLead ? (
            <button
              type="button"
              className={cn(
                buttonOutlineClassName,
                'inline-flex h-8 items-center gap-1.5 px-3 text-xs text-red-700',
              )}
              disabled={deleting}
              onClick={() => void removeLead()}
            >
              <Trash2 className="size-3.5" aria-hidden />
              Delete
            </button>
          ) : null
        }
      >
        {openLead ? (
          <div className="space-y-6">
            <dl className="space-y-3">
              {openLead.fieldValues.map((field) => (
                <div key={field.fieldId}>
                  <dt className={hintClassName}>{field.label}</dt>
                  <dd className="text-sm text-[var(--ink)]">{field.value}</dd>
                </div>
              ))}
              <div>
                <dt className={hintClassName}>Summary</dt>
                <dd className="text-sm text-[var(--ink)]">
                  {openLead.summary || 'No summary yet.'}
                </dd>
              </div>
            </dl>
            {chat === null ? (
              <button
                type="button"
                className={cn(buttonOutlineClassName, 'h-8 px-3 text-xs')}
                disabled={chatLoading}
                onClick={() => void viewChat()}
              >
                {chatLoading ? 'Loading chat…' : 'View chat'}
              </button>
            ) : chat.length === 0 ? (
              <p className={hintClassName}>No messages in this chat.</p>
            ) : (
              <ol className="space-y-3">
                {chat.map((message, index) => {
                  const isUser = message.role === 'user'
                  return (
                    <li
                      key={`${message.createdAt}-${index}`}
                      className={cn(
                        'rounded-lg border px-3 py-2.5',
                        isUser
                          ? 'border-[var(--line)] bg-[var(--surface)]'
                          : 'border-transparent bg-transparent',
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                          {isUser ? 'Visitor' : 'Assistant'}
                        </span>
                        <span className="text-[11px] text-[var(--muted)]">
                          {new Date(message.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-1.5 text-[var(--ink)]">
                        <AgentMessageBody
                          text={stripUiMarkers(message.text)}
                          streaming={false}
                          darkMode={false}
                          renderImage={renderImage}
                        />
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}
          </div>
        ) : null}
      </SideDrawer>
    </div>
  )
}
