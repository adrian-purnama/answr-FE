import { useMemo, useState } from 'react'
import ElementInspector from '#/components/widget/home-builder/ElementInspector'
import ElementPalette from '#/components/widget/home-builder/ElementPalette'
import HomeChromeUploads from '#/components/widget/home-builder/HomeChromeUploads'
import {
  WidgetFormSection,
  hintClassName,
  inputClassName,
  widgetFieldLabelClassName,
} from '#/components/widget/forms/widgetFormUi'
import { buttonOutlineClassName } from '#/lib/ui-classes'
import { cn } from '#/lib/utils'
import {
  newHomeId,
  type HomeSectionElement,
  type HomeSectionType,
  type WidgetHomeSettings,
} from '#/lib/widget'

function createSection(type: HomeSectionType): HomeSectionElement {
  const id = newHomeId()
  switch (type) {
    case 'goToChat':
      return {
        id,
        type,
        label: 'Ask a question',
        subtitle: 'AI Agent and team can help',
      }
    case 'latestNews':
      return {
        id,
        type,
        title: 'Latest news',
        limit: 3,
      }
    case 'faq':
      return {
        id,
        type,
        title: 'FAQ',
        enableSearch: true,
        searchPlaceholder: 'Search for help',
        entries: [],
      }
    case 'linkCard':
      return {
        id,
        type,
        title: '',
        label: 'Learn more',
        url: 'https://',
        openInNewTab: true,
      }
  }
}

function sectionLabel(element: HomeSectionElement): string {
  switch (element.type) {
    case 'goToChat':
      return element.label || 'Go to chat'
    case 'faq':
      return element.title || 'FAQ'
    case 'latestNews':
      return element.title || 'Latest news'
    case 'linkCard':
      return element.label || element.title || 'Link card'
  }
}

type HomeCanvasBuilderProps = {
  value: WidgetHomeSettings
  onChange: (value: WidgetHomeSettings) => void
  apiKeyId: string
  publicKey: string
  darkMode?: boolean
}

export default function HomeCanvasBuilder({
  value,
  onChange,
  apiKeyId,
  publicKey,
  darkMode = false,
}: HomeCanvasBuilderProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedIndex = useMemo(
    () => value.elements.findIndex((el) => el.id === selectedId),
    [selectedId, value.elements],
  )
  const selected =
    selectedIndex >= 0 ? (value.elements[selectedIndex] ?? null) : null

  function updateElements(elements: HomeSectionElement[]) {
    onChange({ ...value, elements })
  }

  function upsertElement(next: HomeSectionElement) {
    updateElements(
      value.elements.map((el) => (el.id === next.id ? next : el)),
    )
  }

  function addSection(type: HomeSectionType) {
    const element = createSection(type)
    updateElements([...value.elements, element])
    setSelectedId(element.id)
  }

  function moveSelected(delta: -1 | 1) {
    if (selectedIndex < 0) return
    const nextIndex = selectedIndex + delta
    if (nextIndex < 0 || nextIndex >= value.elements.length) return
    const next = [...value.elements]
    const [row] = next.splice(selectedIndex, 1)
    if (!row) return
    next.splice(nextIndex, 0, row)
    updateElements(next)
  }

  return (
    <div className="space-y-6">
      <WidgetFormSection
        title="Home chrome"
        description="Logo, banner, and greeting shown at the top of Home."
      >
        <HomeChromeUploads
          value={value}
          onChange={onChange}
          apiKeyId={apiKeyId}
          publicKey={publicKey}
        />
        <div>
          <label className={widgetFieldLabelClassName} htmlFor="widget-home-greeting">
            Greeting
          </label>
          <textarea
            id="widget-home-greeting"
            rows={3}
            className={cn(inputClassName, 'resize-y')}
            value={value.greeting}
            onChange={(e) => onChange({ ...value, greeting: e.target.value })}
            placeholder={
              'Hello {{claims.name || "there"}}!\nHow can we help?'
            }
          />
          <p className={`mt-1.5 ${hintClassName}`}>
            Optional personalization:{' '}
            <code className="text-xs">{'{{claims.field || "fallback"}}'}</code>{' '}
            uses visitor JWT claims (falls back when missing).
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div>
              <label className={widgetFieldLabelClassName} htmlFor="widget-greeting-color">
                Greeting color
              </label>
              <input
                id="widget-greeting-color"
                type="color"
                className="h-9 w-14 cursor-pointer rounded border border-[var(--line)] bg-[var(--surface)] p-1"
                value={value.greetingColor ?? (darkMode ? '#ffffff' : '#171717')}
                onChange={(e) =>
                  onChange({ ...value, greetingColor: e.target.value })
                }
              />
            </div>
            {value.greetingColor ? (
              <button
                type="button"
                className={cn(buttonOutlineClassName, 'px-3 py-1.5 text-xs')}
                onClick={() =>
                  onChange({ ...value, greetingColor: undefined })
                }
              >
                Use theme default
              </button>
            ) : null}
          </div>
          <p className={cn(hintClassName, 'mt-1.5')}>
            Preview changes in the draft widget panel on the right.
          </p>
        </div>
      </WidgetFormSection>

      <WidgetFormSection
        title="Sections"
        description="Add predefined sections in order. Select a row to edit; use Up/Down to reorder."
      >
        <ElementPalette onAdd={addSection} />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
          <div className="space-y-1.5">
            {value.elements.length === 0 ? (
              <p className={hintClassName}>No sections yet.</p>
            ) : (
              value.elements.map((element) => (
                <button
                  key={element.id}
                  type="button"
                  onClick={() => setSelectedId(element.id)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition',
                    selectedId === element.id
                      ? 'border-[var(--ink)] bg-[var(--surface)]'
                      : 'border-[var(--line)] hover:border-[var(--ink)]/40',
                  )}
                >
                  <span className="truncate font-medium text-[var(--ink)]">
                    {sectionLabel(element)}
                  </span>
                  <span className="ml-2 shrink-0 text-[10px] tracking-wide text-[var(--muted)] uppercase">
                    {element.type}
                  </span>
                </button>
              ))
            )}
          </div>

          <div className="lg:sticky lg:top-6 lg:self-start">
            <ElementInspector
              element={selected}
              onChange={upsertElement}
              apiKeyId={apiKeyId}
              onDelete={() => {
                if (!selected) return
                updateElements(
                  value.elements.filter((el) => el.id !== selected.id),
                )
                setSelectedId(null)
              }}
              onMoveUp={
                selectedIndex > 0 ? () => moveSelected(-1) : undefined
              }
              onMoveDown={
                selectedIndex >= 0 && selectedIndex < value.elements.length - 1
                  ? () => moveSelected(1)
                  : undefined
              }
            />
          </div>
        </div>
      </WidgetFormSection>
    </div>
  )
}
