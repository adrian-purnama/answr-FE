import type { FormEvent, ReactNode } from 'react'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Info, LoaderCircle, Pencil, Plus, Trash2 } from 'lucide-react'
import Modal from '#/components/ui/Modal'
import { apiFetch } from '#/lib/api'
import {
  emptyPlanForm,
  formValuesToPayload,
  planToFormValues,
  type Plan,
  type PlanFormValues,
} from '#/lib/plan'
import {
  buttonClassName,
  buttonOutlineClassName,
  cardClassName,
  hintClassName,
  inputClassName,
} from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

const FIELD_HELP: Record<string, { title: string; body: string }> = {
  slug: {
    title: 'Slug',
    body: 'URL-safe unique identifier for this plan (e.g. "free", "pro"). Used in APIs and internal references. Lowercase only.',
  },
  name: {
    title: 'Name',
    body: 'Display name shown to users on the pricing page and in their account.',
  },
  description: {
    title: 'Description',
    body: 'Short summary of what this plan offers. Shown on the public pricing page under the plan name.',
  },
  priceLabel: {
    title: 'Price label ($)',
    body: 'The price advertised on the pricing page (e.g. 29 for "$29"). Can differ from the billed amount when you want a promotional or round number display.',
  },
  pricePerMonth: {
    title: 'Price per month ($)',
    body: 'Actual monthly amount billed. If this differs from the price label, the pricing page shows “Billed at $X/mo” under the advertised price.',
  },
  priceNote: {
    title: 'Price note',
    body: 'Short billing note under the price (e.g. “Billed monthly”, “Free forever”). Helps set expectations about billing cadence.',
  },
  accentColor: {
    title: 'Accent color',
    body: 'Hex color used as the plan’s visual accent (list stripe, pricing highlights). Must be a valid #RGB or #RRGGBB value.',
  },
  order: {
    title: 'Display order',
    body: 'Sort order for plans on the pricing page and in admin lists. Lower numbers appear first.',
  },
  maxApiKeys: {
    title: 'Max API keys',
    body: 'Maximum number of API keys a user on this plan can create. Use 0 to allow none (existing keys are disabled to match). Creating another key is blocked once this limit is reached.',
  },
  maxRequestsPerMinute: {
    title: 'Max requests / minute',
    body: 'Rate limit for API requests. Users on this plan can send at most this many requests per minute across their keys.',
  },
  maxArticles: {
    title: 'Max articles',
    body: 'Maximum number of training articles a user can create on this plan across their projects.',
  },
  maxTopicsPerArticle: {
    title: 'Max topics / article',
    body: 'Maximum number of topics (sections) allowed inside a single training article.',
  },
  maxImagesPerTopic: {
    title: 'Max images / topic',
    body: 'Maximum number of images that can be attached to one topic within an article.',
  },
  maxCharactersPerTopic: {
    title: 'Max characters / topic',
    body: 'Maximum character length for a single topic’s content. Longer content is rejected when saving.',
  },
  maxSnippets: {
    title: 'Max snippets',
    body: 'Maximum number of standalone knowledge snippets a user can create per project on this plan.',
  },
  maxImagesPerSnippet: {
    title: 'Max images / snippet',
    body: 'Maximum number of images that can be attached to one standalone snippet.',
  },
  maxCharactersPerSnippet: {
    title: 'Max characters / snippet',
    body: 'Maximum character length for a single snippet’s content. Longer content is rejected when saving.',
  },
  maxGuidances: {
    title: 'Max guidances',
    body: 'Maximum number of agent guidance documents a user can create per project on this plan.',
  },
  maxCharactersPerGuidance: {
    title: 'Max characters / guidance',
    body: 'Maximum character length for a single guidance’s content. Longer content is rejected when saving.',
  },
  maxLiveAgents: {
    title: 'Max live agents',
    body: 'Maximum number of live agents a user can register per project on this plan. Set to 0 to disallow creating agents even if Live Agent is on.',
  },
  liveAgent: {
    title: 'Live Agent',
    body: 'When on, projects on this plan can enable live-agent handoff from the AI agent and manage live agents.',
  },
  meetingTool: {
    title: 'Meeting Tool',
    body: 'When on, projects on this plan can enable and use the Meeting Tool for booking meetings through the AI agent.',
  },
  leadCapture: {
    title: 'Lead Capture',
    body: 'When on, projects on this plan can collect customer details from conversations and save leads inside SapAi.',
  },
  whatsApp: {
    title: 'WhatsApp',
    body: 'When on, projects on this plan can enable the WhatsApp channel and manage WhatsApp settings.',
  },
  maxMeetingTopics: {
    title: 'Max meeting topics',
    body: 'Maximum number of meeting topics a user can create per project on this plan. Set to 0 to disallow creating topics even if Meeting Tool is on.',
  },
  batchTestGroupAmount: {
    title: 'Max batch test groups',
    body: 'Maximum number of batch test groups a user can create per project on this plan.',
  },
  questionsPerBatchTestGroup: {
    title: 'Max questions / batch test group',
    body: 'Maximum number of questions allowed inside a single batch test group on this plan.',
  },
  isActive: {
    title: 'Active',
    body: 'When off, the plan is inactive. Inactive plans are hidden from public pricing and should not be offered to new subscribers.',
  },
  showOnPricingPage: {
    title: 'Show on pricing page',
    body: 'When on, this plan appears on the public /pricing page (only if the plan is also active). Turn off to keep a plan internal or legacy.',
  },
  analyticsLookbackDays: {
    title: 'Analytics lookback days',
    body: 'How many days of chat analytics history users on this plan may query. Enforced server-side on all analytics reporting and drill-down endpoints. Typical values: 7, 30, 90, or 365.',
  },
  deepseekQuotaPerPeriod: {
    title: 'DeepSeek tokens / period window',
    body: 'Soft token budget (input + output) for one quota window on DeepSeek. Set to 0 to keep replies on local Ollama. A turn may slightly overshoot; the next turn falls back to Ollama. Window length is set by Quota window days.',
  },
  quotaWindowDays: {
    title: 'Quota window days',
    body: 'Leave empty so the quota covers the whole plan period. Set a number (e.g. 30) to reset the DeepSeek budget every N days within the period. Open-ended plans treat empty as 30 days.',
  },
  isDefaultPlan: {
    title: 'Default plan',
    body: 'Only one plan can be the default. New users are automatically assigned this plan. You must assign another default before deleting the current one.',
  },
}

type HelpKey = keyof typeof FIELD_HELP

export default function PlansAdminForm() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PlanFormValues>(emptyPlanForm)
  const [helpKey, setHelpKey] = useState<HelpKey | null>(null)

  const loadPlans = useCallback(async () => {
    const response = await apiFetch<Plan[]>('/admin/plans')
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to load plans')
    }
    setPlans(response.data)
  }, [])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        await loadPlans()
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error ? error.message : 'Failed to load plans',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [loadPlans])

  function startCreate() {
    setEditingId(null)
    const nextOrder =
      plans.length > 0 ? Math.max(...plans.map((p) => p.order)) + 1 : 0
    setForm({ ...emptyPlanForm(), order: String(nextOrder) })
  }

  function startEdit(plan: Plan) {
    setEditingId(plan.id)
    setForm(planToFormValues(plan))
  }

  function updateField<K extends keyof PlanFormValues>(
    key: K,
    value: PlanFormValues[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.slug.trim() || !form.name.trim() || !form.description.trim()) {
      toast.error('Slug, name, and description are required')
      return
    }

    const payload = formValuesToPayload(form)

    if (
      !Number.isFinite(payload.pricePerMonth) ||
      !Number.isFinite(payload.priceLabel) ||
      !Number.isFinite(payload.maxApiKeys) ||
      !Number.isFinite(payload.maxRequestsPerMinute) ||
      !Number.isFinite(payload.maxArticles) ||
      !Number.isFinite(payload.maxTopicsPerArticle) ||
      !Number.isFinite(payload.maxImagesPerTopic) ||
      !Number.isFinite(payload.maxCharactersPerTopic) ||
      !Number.isFinite(payload.maxSnippets) ||
      !Number.isFinite(payload.maxImagesPerSnippet) ||
      !Number.isFinite(payload.maxCharactersPerSnippet) ||
      !Number.isFinite(payload.maxGuidances) ||
      !Number.isFinite(payload.maxCharactersPerGuidance) ||
      !Number.isFinite(payload.maxLiveAgents) ||
      !Number.isFinite(payload.maxMeetingTopics) ||
      !Number.isFinite(payload.batchTestGroupAmount) ||
      !Number.isFinite(payload.questionsPerBatchTestGroup) ||
      !Number.isFinite(payload.analyticsLookbackDays) ||
      !Number.isFinite(payload.deepseekQuotaPerPeriod) ||
      (payload.quotaWindowDays !== null &&
        !Number.isFinite(payload.quotaWindowDays)) ||
      !Number.isFinite(payload.order)
    ) {
      toast.error('Numeric fields must be valid numbers')
      return
    }

    setSaving(true)

    try {
      const response = editingId
        ? await apiFetch<Plan>(`/admin/plans/${editingId}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
          })
        : await apiFetch<Plan>('/admin/plans', {
            method: 'POST',
            body: JSON.stringify(payload),
          })

      if (!response.success) {
        toast.error(response.message || 'Failed to save plan')
        return
      }

      await loadPlans()
      if (editingId) {
        toast.success('Plan updated')
      } else {
        toast.success('Plan created')
        if (response.data) startEdit(response.data)
      }
    } catch {
      toast.error('Unable to reach the server. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(plan: Plan) {
    if (plan.isDefaultPlan) {
      toast.error('Assign another default plan before deleting this one')
      return
    }

    const confirmed = window.confirm(
      `Delete plan "${plan.name}"? This cannot be undone.`,
    )
    if (!confirmed) return

    setDeletingId(plan.id)

    try {
      const response = await apiFetch<null>(`/admin/plans/${plan.id}`, {
        method: 'DELETE',
      })

      if (!response.success) {
        toast.error(response.message || 'Failed to delete plan')
        return
      }

      if (editingId === plan.id) {
        startCreate()
      }

      await loadPlans()
      toast.success('Plan deleted')
    } catch {
      toast.error('Unable to reach the server. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const help = helpKey ? FIELD_HELP[helpKey] : null

  if (loading) {
    return (
      <div className={`flex items-center gap-2 py-16 ${hintClassName}`}>
        <LoaderCircle className="size-4 animate-spin" aria-hidden />
        Loading plans…
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-medium text-[var(--ink)]">All plans</h2>
            <p className={`mt-1 ${hintClassName}`}>
              {plans.length} plan{plans.length === 1 ? '' : 's'} configured.
            </p>
          </div>
          <button type="button" onClick={startCreate} className={buttonClassName}>
            <Plus className="size-4" aria-hidden />
            New plan
          </button>
        </div>

        {plans.length === 0 ? (
          <p className={`${cardClassName} px-4 py-8 text-center ${hintClassName}`}>
            No plans yet. Create your first plan below.
          </p>
        ) : (
          <ul className="space-y-3">
            {plans.map((plan) => (
              <li
                key={plan.id}
                className={cn(
                  cardClassName,
                  'flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between',
                  editingId === plan.id && 'border-[var(--ink)]',
                )}
                style={{ borderLeftWidth: 4, borderLeftColor: plan.accentColor }}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-[var(--ink)]">{plan.name}</h3>
                    <span className="text-xs text-[var(--muted)]">/{plan.slug}</span>
                    {plan.isDefaultPlan ? (
                      <span className="rounded-full bg-[var(--ink)] px-2 py-0.5 text-xs font-medium text-white">
                        Default
                      </span>
                    ) : null}
                    {plan.isActive ? (
                      <span className="rounded-full border border-[var(--line)] px-2 py-0.5 text-xs text-[var(--ink)]">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full border border-[var(--line)] px-2 py-0.5 text-xs text-[var(--muted)]">
                        Inactive
                      </span>
                    )}
                    {plan.showOnPricingPage ? (
                      <span className="rounded-full border border-[var(--line)] px-2 py-0.5 text-xs text-[var(--ink)]">
                        On pricing
                      </span>
                    ) : null}
                  </div>
                  <p className={`mt-1 ${hintClassName}`}>{plan.description}</p>
                  <p className="mt-2 text-sm text-[var(--ink)]">
                    ${plan.priceLabel}/mo · order {plan.order}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(plan)}
                    className={`${buttonOutlineClassName} px-3 py-2 text-sm`}
                  >
                    <Pencil className="size-3.5" aria-hidden />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(plan)}
                    disabled={deletingId === plan.id || plan.isDefaultPlan}
                    className="inline-flex items-center gap-1.5 border border-[var(--line)] bg-white px-3 py-2 text-sm text-red-600 transition hover:border-red-300 disabled:opacity-50"
                  >
                    {deletingId === plan.id ? (
                      <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
                    ) : (
                      <Trash2 className="size-3.5" aria-hidden />
                    )}
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form className="space-y-8 border-t border-[var(--line)] pt-8" onSubmit={handleSubmit}>
        <div>
          <h2 className="text-base font-medium text-[var(--ink)]">
            {editingId ? 'Edit plan' : 'Create plan'}
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {editingId
              ? 'Update plan details and visibility.'
              : 'Add a new subscription plan.'}
          </p>
        </div>

        <FormSection
          title="Basics"
          description="Identity and how this plan appears in lists."
        >
          <Field
            label="Slug"
            htmlFor="plan-slug"
            helpKey="slug"
            onHelp={setHelpKey}
          >
            <input
              id="plan-slug"
              type="text"
              value={form.slug}
              onChange={(e) => updateField('slug', e.target.value.toLowerCase())}
              className={inputClassName}
              placeholder="pro"
              required
            />
          </Field>
          <Field
            label="Name"
            htmlFor="plan-name"
            helpKey="name"
            onHelp={setHelpKey}
          >
            <input
              id="plan-name"
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              className={inputClassName}
              required
            />
          </Field>
          <Field
            label="Description"
            htmlFor="plan-description"
            className="sm:col-span-2"
            helpKey="description"
            onHelp={setHelpKey}
          >
            <textarea
              id="plan-description"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              className={cn(inputClassName, 'min-h-24 resize-y')}
              required
            />
          </Field>
          <Field
            label="Accent color"
            htmlFor="plan-accent"
            helpKey="accentColor"
            onHelp={setHelpKey}
          >
            <div className="flex gap-2">
              <input
                id="plan-accent"
                type="color"
                value={form.accentColor}
                onChange={(e) => updateField('accentColor', e.target.value)}
                className="size-11 shrink-0 cursor-pointer border border-[var(--line)] bg-white p-1"
              />
              <input
                type="text"
                value={form.accentColor}
                onChange={(e) => updateField('accentColor', e.target.value)}
                className={inputClassName}
                pattern="^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$"
                required
              />
            </div>
          </Field>
          <Field
            label="Display order"
            htmlFor="plan-order"
            helpKey="order"
            onHelp={setHelpKey}
          >
            <input
              id="plan-order"
              type="number"
              min={0}
              value={form.order}
              onChange={(e) => updateField('order', e.target.value)}
              className={inputClassName}
              required
            />
          </Field>
        </FormSection>

        <FormSection
          title="Pricing"
          description="What users see and what gets billed."
        >
          <Field
            label="Price label ($)"
            htmlFor="plan-price-label"
            helpKey="priceLabel"
            onHelp={setHelpKey}
          >
            <input
              id="plan-price-label"
              type="number"
              min={0}
              step="0.01"
              value={form.priceLabel}
              onChange={(e) => updateField('priceLabel', e.target.value)}
              className={inputClassName}
              required
            />
          </Field>
          <Field
            label="Price per month ($)"
            htmlFor="plan-price-month"
            helpKey="pricePerMonth"
            onHelp={setHelpKey}
          >
            <input
              id="plan-price-month"
              type="number"
              min={0}
              step="0.01"
              value={form.pricePerMonth}
              onChange={(e) => updateField('pricePerMonth', e.target.value)}
              className={inputClassName}
              required
            />
          </Field>
          <Field
            label="Price note"
            htmlFor="plan-price-note"
            className="sm:col-span-2"
            helpKey="priceNote"
            onHelp={setHelpKey}
          >
            <input
              id="plan-price-note"
              type="text"
              value={form.priceNote}
              onChange={(e) => updateField('priceNote', e.target.value)}
              className={inputClassName}
              placeholder="Billed monthly"
              required
            />
          </Field>
        </FormSection>

        <FormSection
          title="API & rate limits"
          description="How much public API usage this plan allows."
        >
          <Field
            label="Max API keys"
            htmlFor="plan-max-keys"
            helpKey="maxApiKeys"
            onHelp={setHelpKey}
          >
            <input
              id="plan-max-keys"
              type="number"
              min={0}
              value={form.maxApiKeys}
              onChange={(e) => updateField('maxApiKeys', e.target.value)}
              className={inputClassName}
              required
            />
          </Field>
          <Field
            label="Max requests / minute"
            htmlFor="plan-max-rpm"
            helpKey="maxRequestsPerMinute"
            onHelp={setHelpKey}
          >
            <input
              id="plan-max-rpm"
              type="number"
              min={0}
              value={form.maxRequestsPerMinute}
              onChange={(e) => updateField('maxRequestsPerMinute', e.target.value)}
              className={inputClassName}
              required
            />
          </Field>
        </FormSection>

        <FormSection
          title="Articles & topics"
          description="Training article and topic caps for this plan."
        >
          <Field
            label="Max articles"
            htmlFor="plan-max-articles"
            helpKey="maxArticles"
            onHelp={setHelpKey}
          >
            <input
              id="plan-max-articles"
              type="number"
              min={0}
              value={form.maxArticles}
              onChange={(e) => updateField('maxArticles', e.target.value)}
              className={inputClassName}
              required
            />
          </Field>
          <Field
            label="Max topics / article"
            htmlFor="plan-max-topics"
            helpKey="maxTopicsPerArticle"
            onHelp={setHelpKey}
          >
            <input
              id="plan-max-topics"
              type="number"
              min={0}
              value={form.maxTopicsPerArticle}
              onChange={(e) =>
                updateField('maxTopicsPerArticle', e.target.value)
              }
              className={inputClassName}
              required
            />
          </Field>
          <Field
            label="Max images / topic"
            htmlFor="plan-max-images"
            helpKey="maxImagesPerTopic"
            onHelp={setHelpKey}
          >
            <input
              id="plan-max-images"
              type="number"
              min={0}
              value={form.maxImagesPerTopic}
              onChange={(e) =>
                updateField('maxImagesPerTopic', e.target.value)
              }
              className={inputClassName}
              required
            />
          </Field>
          <Field
            label="Max characters / topic"
            htmlFor="plan-max-chars-topic"
            helpKey="maxCharactersPerTopic"
            onHelp={setHelpKey}
          >
            <input
              id="plan-max-chars-topic"
              type="number"
              min={0}
              value={form.maxCharactersPerTopic}
              onChange={(e) =>
                updateField('maxCharactersPerTopic', e.target.value)
              }
              className={inputClassName}
              required
            />
          </Field>
        </FormSection>

        <FormSection
          title="Snippets"
          description="Standalone knowledge snippet caps for this plan."
        >
          <Field
            label="Max snippets"
            htmlFor="plan-max-snippets"
            helpKey="maxSnippets"
            onHelp={setHelpKey}
          >
            <input
              id="plan-max-snippets"
              type="number"
              min={0}
              value={form.maxSnippets}
              onChange={(e) => updateField('maxSnippets', e.target.value)}
              className={inputClassName}
              required
            />
          </Field>
          <Field
            label="Max images / snippet"
            htmlFor="plan-max-images-snippet"
            helpKey="maxImagesPerSnippet"
            onHelp={setHelpKey}
          >
            <input
              id="plan-max-images-snippet"
              type="number"
              min={0}
              value={form.maxImagesPerSnippet}
              onChange={(e) =>
                updateField('maxImagesPerSnippet', e.target.value)
              }
              className={inputClassName}
              required
            />
          </Field>
          <Field
            label="Max characters / snippet"
            htmlFor="plan-max-chars-snippet"
            helpKey="maxCharactersPerSnippet"
            onHelp={setHelpKey}
          >
            <input
              id="plan-max-chars-snippet"
              type="number"
              min={0}
              value={form.maxCharactersPerSnippet}
              onChange={(e) =>
                updateField('maxCharactersPerSnippet', e.target.value)
              }
              className={inputClassName}
              required
            />
          </Field>
        </FormSection>

        <FormSection
          title="Guidances"
          description="Agent guidance document caps for this plan."
        >
          <Field
            label="Max guidances"
            htmlFor="plan-max-guidances"
            helpKey="maxGuidances"
            onHelp={setHelpKey}
          >
            <input
              id="plan-max-guidances"
              type="number"
              min={0}
              value={form.maxGuidances}
              onChange={(e) => updateField('maxGuidances', e.target.value)}
              className={inputClassName}
              required
            />
          </Field>
          <Field
            label="Max characters / guidance"
            htmlFor="plan-max-chars-guidance"
            helpKey="maxCharactersPerGuidance"
            onHelp={setHelpKey}
          >
            <input
              id="plan-max-chars-guidance"
              type="number"
              min={0}
              value={form.maxCharactersPerGuidance}
              onChange={(e) =>
                updateField('maxCharactersPerGuidance', e.target.value)
              }
              className={inputClassName}
              required
            />
          </Field>
        </FormSection>

        <FormSection
          title="Live agents"
          description="Live-agent handoff access and seat caps for this plan."
        >
          <div className="sm:col-span-2">
            <ToggleRow
              id="plan-live-agent"
              label="Live Agent"
              description="Allow projects on this plan to enable live-agent handoff."
              checked={form.liveAgent}
              onChange={(value) => updateField('liveAgent', value)}
              helpKey="liveAgent"
              onHelp={setHelpKey}
            />
          </div>
          <Field
            label="Max live agents"
            htmlFor="plan-max-live-agents"
            helpKey="maxLiveAgents"
            onHelp={setHelpKey}
          >
            <input
              id="plan-max-live-agents"
              type="number"
              min={0}
              value={form.maxLiveAgents}
              onChange={(e) => updateField('maxLiveAgents', e.target.value)}
              className={inputClassName}
              required
            />
          </Field>
        </FormSection>

        <FormSection
          title="Meeting tool"
          description="Meeting booking access and topic caps for this plan."
        >
          <div className="sm:col-span-2">
            <ToggleRow
              id="plan-meeting-tool"
              label="Meeting Tool"
              description="Allow projects on this plan to enable the Meeting Tool."
              checked={form.meetingTool}
              onChange={(value) => updateField('meetingTool', value)}
              helpKey="meetingTool"
              onHelp={setHelpKey}
            />
          </div>
          <Field
            label="Max meeting topics"
            htmlFor="plan-max-meeting-topics"
            helpKey="maxMeetingTopics"
            onHelp={setHelpKey}
          >
            <input
              id="plan-max-meeting-topics"
              type="number"
              min={0}
              value={form.maxMeetingTopics}
              onChange={(e) => updateField('maxMeetingTopics', e.target.value)}
              className={inputClassName}
              required
            />
          </Field>
        </FormSection>

        <FormSection
          title="Lead capture"
          description="Conversation lead capture for projects on this plan."
        >
          <div className="sm:col-span-2">
            <ToggleRow
              id="plan-lead-capture"
              label="Customer Data & Lead Capture"
              description="Allow projects on this plan to capture leads from conversations."
              checked={form.leadCapture}
              onChange={(value) => updateField('leadCapture', value)}
              helpKey="leadCapture"
              onHelp={setHelpKey}
            />
          </div>
        </FormSection>

        <FormSection
          title="WhatsApp"
          description="WhatsApp channel access for projects on this plan."
        >
          <div className="sm:col-span-2">
            <ToggleRow
              id="plan-whatsapp"
              label="WhatsApp"
              description="Allow projects on this plan to enable the WhatsApp channel."
              checked={form.whatsApp}
              onChange={(value) => updateField('whatsApp', value)}
              helpKey="whatsApp"
              onHelp={setHelpKey}
            />
          </div>
        </FormSection>

        <FormSection
          title="Batch testing"
          description="Batch test group and question caps for this plan."
        >
          <Field
            label="Max batch test groups"
            htmlFor="plan-batch-test-group-amount"
            helpKey="batchTestGroupAmount"
            onHelp={setHelpKey}
          >
            <input
              id="plan-batch-test-group-amount"
              type="number"
              min={0}
              value={form.batchTestGroupAmount}
              onChange={(e) =>
                updateField('batchTestGroupAmount', e.target.value)
              }
              className={inputClassName}
              required
            />
          </Field>
          <Field
            label="Max questions / batch test group"
            htmlFor="plan-questions-per-batch-test-group"
            helpKey="questionsPerBatchTestGroup"
            onHelp={setHelpKey}
          >
            <input
              id="plan-questions-per-batch-test-group"
              type="number"
              min={0}
              value={form.questionsPerBatchTestGroup}
              onChange={(e) =>
                updateField('questionsPerBatchTestGroup', e.target.value)
              }
              className={inputClassName}
              required
            />
          </Field>
        </FormSection>

        <section className="space-y-4 border-t border-[var(--line)] pt-8">
          <div>
            <h3 className="text-sm font-medium text-[var(--ink)]">
              Visibility & status
            </h3>
            <p className={`mt-1 ${hintClassName}`}>
              Where this plan appears and whether it can be assigned.
            </p>
          </div>
          <ToggleRow
            id="plan-active"
            label="Active"
            description="Inactive plans are hidden from the public pricing page."
            checked={form.isActive}
            onChange={(value) => updateField('isActive', value)}
            helpKey="isActive"
            onHelp={setHelpKey}
          />
          <ToggleRow
            id="plan-pricing"
            label="Show on pricing page"
            description="Display this plan on the public /pricing page."
            checked={form.showOnPricingPage}
            onChange={(value) => updateField('showOnPricingPage', value)}
            helpKey="showOnPricingPage"
            onHelp={setHelpKey}
          />
        </section>

        <section className="space-y-4 border-t border-[var(--line)] pt-8">
          <div>
            <h3 className="text-sm font-medium text-[var(--ink)]">
              Analytics & default
            </h3>
            <p className={`mt-1 ${hintClassName}`}>
              Reporting window and which plan new users receive.
            </p>
          </div>
          <div
            className={cn(
              cardClassName,
              'grid gap-4 p-4 sm:grid-cols-2 sm:items-end',
            )}
          >
            <Field
              label="Analytics lookback days"
              htmlFor="plan-analytics-lookback-days"
              helpKey="analyticsLookbackDays"
              onHelp={setHelpKey}
            >
              <input
                id="plan-analytics-lookback-days"
                type="number"
                min={0}
                value={form.analyticsLookbackDays}
                onChange={(e) =>
                  updateField('analyticsLookbackDays', e.target.value)
                }
                className={inputClassName}
                required
              />
            </Field>
            <Field
              label="DeepSeek tokens / period window"
              htmlFor="plan-deepseek-tokens"
              helpKey="deepseekQuotaPerPeriod"
              onHelp={setHelpKey}
            >
              <input
                id="plan-deepseek-tokens"
                type="number"
                min={0}
                value={form.deepseekQuotaPerPeriod}
                onChange={(e) =>
                  updateField('deepseekQuotaPerPeriod', e.target.value)
                }
                className={inputClassName}
                required
              />
            </Field>
            <Field
              label="Quota window days"
              htmlFor="plan-quota-window-days"
              helpKey="quotaWindowDays"
              onHelp={setHelpKey}
            >
              <input
                id="plan-quota-window-days"
                type="number"
                min={1}
                placeholder="Whole period"
                value={form.quotaWindowDays}
                onChange={(e) =>
                  updateField('quotaWindowDays', e.target.value)
                }
                className={inputClassName}
              />
            </Field>
            <div className="flex items-center justify-between gap-4 sm:min-h-11">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <label
                    htmlFor="plan-default"
                    className="cursor-pointer text-sm font-medium text-[var(--ink)]"
                  >
                    Default plan
                  </label>
                  <InfoButton
                    label="Default plan"
                    onClick={() => setHelpKey('isDefaultPlan')}
                  />
                </div>
                <p className={`mt-0.5 ${hintClassName}`}>
                  New users are assigned this plan.
                </p>
              </div>
              <label
                htmlFor="plan-default"
                className="relative inline-flex shrink-0 cursor-pointer"
              >
                <input
                  id="plan-default"
                  type="checkbox"
                  className="peer sr-only"
                  checked={form.isDefaultPlan}
                  onChange={(event) =>
                    updateField('isDefaultPlan', event.target.checked)
                  }
                />
                <span
                  className={cn(
                    'block h-6 w-11 rounded-full border border-[var(--line)] bg-[var(--surface)] transition',
                    'peer-checked:border-[var(--ink)] peer-checked:bg-[var(--ink)]',
                    'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--ink)]',
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
              </label>
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-3 border-t border-[var(--line)] pt-8">
          {editingId ? (
            <button
              type="button"
              onClick={startCreate}
              className={buttonOutlineClassName}
            >
              Cancel edit
            </button>
          ) : null}
          <button type="submit" disabled={saving} className={buttonClassName}>
            {saving ? (
              <>
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
                Saving…
              </>
            ) : editingId ? (
              'Save plan'
            ) : (
              'Create plan'
            )}
          </button>
        </div>
      </form>

      <Modal
        open={help !== null}
        onClose={() => setHelpKey(null)}
        title={help?.title ?? ''}
      >
        <p className="text-sm leading-relaxed text-[var(--muted)]">
          {help?.body}
        </p>
      </Modal>
    </div>
  )
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="space-y-4 border-t border-[var(--line)] pt-8">
      <div>
        <h3 className="text-sm font-medium text-[var(--ink)]">{title}</h3>
        <p className={`mt-1 ${hintClassName}`}>{description}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  )
}

function InfoButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-[var(--line)] text-[var(--muted)] transition hover:border-[var(--ink)] hover:text-[var(--ink)]"
      aria-label={`About ${label}`}
    >
      <Info className="size-3" aria-hidden />
    </button>
  )
}

function Field({
  label,
  htmlFor,
  children,
  className,
  helpKey,
  onHelp,
}: {
  label: string
  htmlFor: string
  children: ReactNode
  className?: string
  helpKey: HelpKey
  onHelp: (key: HelpKey) => void
}) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center gap-1.5">
        <label htmlFor={htmlFor} className="text-sm text-[var(--ink)]">
          {label}
        </label>
        <InfoButton label={label} onClick={() => onHelp(helpKey)} />
      </div>
      {children}
    </div>
  )
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
  helpKey,
  onHelp,
}: {
  id: string
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
  helpKey: HelpKey
  onHelp: (key: HelpKey) => void
}) {
  return (
    <div
      className={cn(
        cardClassName,
        'flex items-start justify-between gap-4 px-4 py-3 transition hover:border-[var(--ink)]',
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <label
            htmlFor={id}
            className="cursor-pointer text-sm font-medium text-[var(--ink)]"
          >
            {label}
          </label>
          <InfoButton label={label} onClick={() => onHelp(helpKey)} />
        </div>
        <p className={`mt-0.5 ${hintClassName}`}>{description}</p>
      </div>
      <label htmlFor={id} className="relative mt-0.5 inline-flex shrink-0 cursor-pointer">
        <input
          id={id}
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span
          className={cn(
            'block h-6 w-11 rounded-full border border-[var(--line)] bg-[var(--surface)] transition',
            'peer-checked:border-[var(--ink)] peer-checked:bg-[var(--ink)]',
            'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--ink)]',
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
      </label>
    </div>
  )
}
