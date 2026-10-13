import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import WidgetChatForm from '#/components/widget/forms/WidgetChatForm'
import WidgetConfigurationForm from '#/components/widget/forms/WidgetConfigurationForm'
import WidgetFaqForm from '#/components/widget/forms/WidgetFaqForm'
import WidgetHomeForm from '#/components/widget/forms/WidgetHomeForm'
import WidgetNewsForm from '#/components/widget/forms/WidgetNewsForm'
import {
  WidgetRuntimeProvider,
  type WidgetTab,
} from '#/components/widget/context/WidgetRuntimeContext'
import {
  BUILDER_TABS,
  type BuilderTab,
} from '#/components/widget/constants/widgetTabs'
import WidgetPanel from '#/components/widget/WidgetPanel'
import {
  defaultLoginPrompt,
  embedWidgetPath,
  getWidget,
  normalizeChatSettings,
  normalizeFaqSettings,
  normalizeHomeSettings,
  normalizeLoginPrompt,
  updateWidget,
  type UpdateWidgetInput,
  type VisitorJwtAlgorithm,
  type Widget,
  type WidgetAccessMode,
  type WidgetChatSettings,
  type WidgetFaqSettings,
  type WidgetHomeSettings,
  type WidgetLoginPrompt,
  type WidgetSectionSettings,
} from '#/lib/widget'
import {
  buttonClassName,
  hintClassName,
} from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

type SectionTab = 'home' | 'chat' | 'faq' | 'news'

type DraftSettings = {
  enabled: boolean
  darkMode: boolean
  badgeImage: string
  accessMode: WidgetAccessMode
  loginPrompt: WidgetLoginPrompt
  visitorJwtPublicKeyPem: string
  visitorJwtAlgorithm: VisitorJwtAlgorithm
  visitorJwtIssuer: string
  allowedDomains: string[]
  homeSettings: WidgetHomeSettings
  chatSettings: WidgetChatSettings
  faqSettings: WidgetFaqSettings
  newsSettings: WidgetSectionSettings
}

function draftFromWidget(widget: Widget): DraftSettings {
  return {
    enabled: widget.enabled,
    darkMode: widget.darkMode ?? false,
    badgeImage: widget.badgeImage ?? '',
    accessMode: widget.accessMode ?? 'both',
    loginPrompt: normalizeLoginPrompt(widget.loginPrompt),
    visitorJwtPublicKeyPem: widget.visitorJwtPublicKeyPem ?? '',
    visitorJwtAlgorithm: widget.visitorJwtAlgorithm ?? 'RS256',
    visitorJwtIssuer: widget.visitorJwtIssuer ?? '',
    allowedDomains: widget.allowedDomains,
    homeSettings: normalizeHomeSettings(widget.homeSettings),
    chatSettings: normalizeChatSettings(widget.chatSettings),
    faqSettings: normalizeFaqSettings(widget.faqSettings),
    newsSettings: widget.newsSettings,
  }
}

function previewForceTab(tab: BuilderTab): WidgetTab {
  return tab === 'configuration' ? 'home' : tab
}

function sameDomainList(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  return a.every((value, index) => value === b[index])
}

const SETTINGS_KEY_BY_TAB: Record<
  SectionTab,
  'homeSettings' | 'chatSettings' | 'faqSettings' | 'newsSettings'
> = {
  home: 'homeSettings',
  chat: 'chatSettings',
  faq: 'faqSettings',
  news: 'newsSettings',
}

function isSectionTab(tab: BuilderTab): tab is SectionTab {
  return tab !== 'configuration'
}

type WidgetBuilderProps = {
  apiKeyId: string
}

export default function WidgetBuilder({ apiKeyId }: WidgetBuilderProps) {
  const [widget, setWidget] = useState<Widget | null>(null)
  const [draft, setDraft] = useState<DraftSettings | null>(null)
  const [builderTab, setBuilderTab] = useState<BuilderTab>('home')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewExpanded, setPreviewExpanded] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await getWidget(apiKeyId)
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to load widget')
      }
      setWidget(response.data)
      setDraft(draftFromWidget(response.data))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load widget')
    } finally {
      setLoading(false)
    }
  }, [apiKeyId])

  useEffect(() => {
    void load()
  }, [load])

  const dirty = useMemo(() => {
    if (!widget || !draft) return false
    return (
      draft.enabled !== widget.enabled ||
      draft.darkMode !== (widget.darkMode ?? false) ||
      draft.badgeImage !== (widget.badgeImage ?? '') ||
      draft.accessMode !== (widget.accessMode ?? 'both') ||
      JSON.stringify(draft.loginPrompt) !==
        JSON.stringify(normalizeLoginPrompt(widget.loginPrompt)) ||
      draft.visitorJwtPublicKeyPem !== (widget.visitorJwtPublicKeyPem ?? '') ||
      draft.visitorJwtAlgorithm !== (widget.visitorJwtAlgorithm ?? 'RS256') ||
      draft.visitorJwtIssuer !== (widget.visitorJwtIssuer ?? '') ||
      !sameDomainList(draft.allowedDomains, widget.allowedDomains) ||
      JSON.stringify(draft.homeSettings) !==
        JSON.stringify(normalizeHomeSettings(widget.homeSettings)) ||
      JSON.stringify(normalizeChatSettings(draft.chatSettings)) !==
        JSON.stringify(normalizeChatSettings(widget.chatSettings)) ||
      JSON.stringify(normalizeFaqSettings(draft.faqSettings)) !==
        JSON.stringify(normalizeFaqSettings(widget.faqSettings)) ||
      draft.newsSettings.enabled !== widget.newsSettings.enabled
    )
  }, [draft, widget])

  async function handleSave() {
    if (!draft || !dirty) return
    setSaving(true)
    try {
      const body: UpdateWidgetInput = {
        enabled: draft.enabled,
        darkMode: draft.darkMode,
        badgeImage: draft.badgeImage,
        accessMode: draft.accessMode,
        loginPrompt: draft.loginPrompt,
        visitorJwtPublicKeyPem: draft.visitorJwtPublicKeyPem,
        visitorJwtAlgorithm: draft.visitorJwtAlgorithm,
        visitorJwtIssuer: draft.visitorJwtIssuer,
        allowedDomains: draft.allowedDomains,
        homeSettings: normalizeHomeSettings(draft.homeSettings),
        chatSettings: draft.chatSettings,
        faqSettings: draft.faqSettings,
        newsSettings: draft.newsSettings,
      }
      const response = await updateWidget(apiKeyId, body)
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update widget')
      }
      setWidget(response.data)
      setDraft(draftFromWidget(response.data))
      toast.success('Widget saved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save widget')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !draft || !widget) {
    return (
      <div className="text-sm text-[var(--muted)]">Loading widget builder…</div>
    )
  }

  const embedPath = embedWidgetPath(widget.publicKey)

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-medium text-[var(--ink)]">Widget</h1>
            <p className={`mt-1 max-w-xl ${hintClassName}`}>
              Configure the embeddable messenger. Save to update the live embed
              preview.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {dirty ? (
              <span className={`text-sm ${hintClassName}`}>Unsaved changes</span>
            ) : null}
            <button
              type="button"
              className={buttonClassName}
              disabled={!dirty || saving}
              onClick={() => void handleSave()}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        <div
          className="flex flex-wrap gap-1 border-b border-[var(--line)] sm:gap-2"
          role="tablist"
          aria-label="Widget sections"
        >
          {BUILDER_TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = builderTab === tab.id
            const sectionOff =
              isSectionTab(tab.id) &&
              !draft[SETTINGS_KEY_BY_TAB[tab.id]].enabled
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setBuilderTab(tab.id)}
                className={cn(
                  '-mb-px inline-flex items-center gap-1.5 border-b-2 px-2 pb-3 text-sm font-medium transition sm:px-3',
                  isActive
                    ? 'border-[var(--ink)] text-[var(--ink)]'
                    : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]',
                  sectionOff && !isActive && 'opacity-50',
                )}
              >
                <Icon className="size-3.5 shrink-0" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="min-w-0 space-y-6">
          {builderTab === 'home' ? (
            <WidgetHomeForm
              value={draft.homeSettings}
              apiKeyId={apiKeyId}
              publicKey={widget.publicKey}
              darkMode={draft.darkMode}
              onChange={(homeSettings) =>
                setDraft((prev) => (prev ? { ...prev, homeSettings } : prev))
              }
            />
          ) : null}
          {builderTab === 'chat' ? (
            <WidgetChatForm
              value={draft.chatSettings}
              onChange={(chatSettings) =>
                setDraft((prev) => (prev ? { ...prev, chatSettings } : prev))
              }
              apiKeyId={widget.apiKeyId}
              publicKey={widget.publicKey}
            />
          ) : null}
          {builderTab === 'faq' ? (
            <WidgetFaqForm
              value={draft.faqSettings}
              apiKeyId={apiKeyId}
              onChange={(faqSettings) =>
                setDraft((prev) => (prev ? { ...prev, faqSettings } : prev))
              }
            />
          ) : null}
          {builderTab === 'news' ? (
            <WidgetNewsForm
              value={draft.newsSettings}
              onChange={(newsSettings) =>
                setDraft((prev) => (prev ? { ...prev, newsSettings } : prev))
              }
              apiKeyId={apiKeyId}
              publicKey={widget.publicKey}
            />
          ) : null}
          {builderTab === 'configuration' ? (
            <WidgetConfigurationForm
              enabled={draft.enabled}
              onEnabledChange={(enabled) =>
                setDraft((prev) => (prev ? { ...prev, enabled } : prev))
              }
              darkMode={draft.darkMode}
              onDarkModeChange={(darkMode) =>
                setDraft((prev) => (prev ? { ...prev, darkMode } : prev))
              }
              badgeImage={draft.badgeImage}
              onBadgeImageChange={(badgeImage) =>
                setDraft((prev) => (prev ? { ...prev, badgeImage } : prev))
              }
              apiKeyId={apiKeyId}
              accessMode={draft.accessMode}
              onAccessModeChange={(accessMode) =>
                setDraft((prev) =>
                  prev
                    ? {
                        ...prev,
                        accessMode,
                        loginPrompt:
                          accessMode === 'both'
                            ? prev.loginPrompt
                            : defaultLoginPrompt(),
                      }
                    : prev,
                )
              }
              loginPrompt={draft.loginPrompt}
              onLoginPromptChange={(loginPrompt) =>
                setDraft((prev) => (prev ? { ...prev, loginPrompt } : prev))
              }
              visitorJwtPublicKeyPem={draft.visitorJwtPublicKeyPem}
              onVisitorJwtPublicKeyPemChange={(visitorJwtPublicKeyPem) =>
                setDraft((prev) =>
                  prev ? { ...prev, visitorJwtPublicKeyPem } : prev,
                )
              }
              visitorJwtAlgorithm={draft.visitorJwtAlgorithm}
              onVisitorJwtAlgorithmChange={(visitorJwtAlgorithm) =>
                setDraft((prev) =>
                  prev ? { ...prev, visitorJwtAlgorithm } : prev,
                )
              }
              visitorJwtIssuer={draft.visitorJwtIssuer}
              onVisitorJwtIssuerChange={(visitorJwtIssuer) =>
                setDraft((prev) =>
                  prev ? { ...prev, visitorJwtIssuer } : prev,
                )
              }
              publicKey={widget.publicKey}
              embedPath={embedPath}
              allowedDomains={draft.allowedDomains}
              onAllowedDomainsChange={(allowedDomains) =>
                setDraft((prev) =>
                  prev ? { ...prev, allowedDomains } : prev,
                )
              }
            />
          ) : null}
        </section>

        <aside
          className={cn(
            'mx-auto w-full max-w-[380px] lg:sticky lg:top-6 lg:self-start lg:mx-0',
            previewExpanded && 'lg:max-w-[420px]',
          )}
        >
          <div className="mb-3 text-xs font-medium tracking-wide text-[var(--muted)] uppercase">
            Preview
          </div>
          <div className="h-[640px] overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-1.5 transition-all">
            <WidgetRuntimeProvider
              publicKey={widget.publicKey}
              forceTab={previewForceTab(builderTab)}
              darkMode={draft.darkMode}
              expanded={previewExpanded}
              onExpandedChange={setPreviewExpanded}
              settings={{
                homeSettings: draft.homeSettings,
                chatSettings: draft.chatSettings,
                faqSettings: draft.faqSettings,
                newsSettings: draft.newsSettings,
              }}
            >
              <WidgetPanel className="h-full" />
            </WidgetRuntimeProvider>
          </div>
        </aside>
      </div>
    </div>
  )
}
