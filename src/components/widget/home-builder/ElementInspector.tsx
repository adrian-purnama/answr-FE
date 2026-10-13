import FaqArticlePicker from '#/components/widget/home-builder/FaqArticlePicker'
import {
  hintClassName,
  inputClassName,
  widgetFieldLabelClassName,
} from '#/components/widget/forms/widgetFormUi'
import { buttonOutlineClassName } from '#/lib/ui-classes'
import { cn } from '#/lib/utils'
import type { HomeSectionElement } from '#/lib/widget'

type ElementInspectorProps = {
  element: HomeSectionElement | null
  onChange: (element: HomeSectionElement) => void
  onDelete: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  apiKeyId: string
}

export default function ElementInspector({
  element,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  apiKeyId,
}: ElementInspectorProps) {
  if (!element) {
    return (
      <div className="rounded-lg border border-[var(--line)] px-4 py-6">
        <p className={hintClassName}>Select a section to edit.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-lg border border-[var(--line)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium tracking-wide text-[var(--muted)] uppercase">
          {element.type}
        </span>
        <div className="flex flex-wrap gap-1">
          {onMoveUp ? (
            <button
              type="button"
              className={cn(buttonOutlineClassName, 'px-2 py-1 text-xs')}
              onClick={onMoveUp}
            >
              Up
            </button>
          ) : null}
          {onMoveDown ? (
            <button
              type="button"
              className={cn(buttonOutlineClassName, 'px-2 py-1 text-xs')}
              onClick={onMoveDown}
            >
              Down
            </button>
          ) : null}
          <button
            type="button"
            className={cn(
              buttonOutlineClassName,
              'px-2 py-1 text-xs text-red-600 hover:border-red-300',
            )}
            onClick={onDelete}
          >
            Delete
          </button>
        </div>
      </div>

      <p className={hintClassName}>
        Section colors follow the widget light/dark theme.
      </p>

      {element.type === 'goToChat' ? (
        <div className="space-y-4">
          <p className={hintClassName}>
            Opens the chat tab in the live widget (chat section must be
            enabled).
          </p>
          <div>
            <label className={widgetFieldLabelClassName}>Label</label>
            <input
              className={inputClassName}
              value={element.label}
              onChange={(e) => onChange({ ...element, label: e.target.value })}
            />
          </div>
          <div>
            <label className={widgetFieldLabelClassName}>Subtitle</label>
            <input
              className={inputClassName}
              value={element.subtitle ?? ''}
              onChange={(e) =>
                onChange({
                  ...element,
                  subtitle: e.target.value || undefined,
                })
              }
              placeholder="Optional supporting line"
            />
          </div>
        </div>
      ) : null}

      {element.type === 'latestNews' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={widgetFieldLabelClassName}>Title</label>
            <input
              className={inputClassName}
              value={element.title ?? ''}
              onChange={(e) => onChange({ ...element, title: e.target.value })}
            />
          </div>
          <div>
            <label className={widgetFieldLabelClassName}>Limit</label>
            <input
              type="number"
              min={1}
              max={20}
              className={inputClassName}
              value={element.limit}
              onChange={(e) =>
                onChange({
                  ...element,
                  limit: Math.max(1, Math.min(20, Number(e.target.value) || 1)),
                })
              }
            />
          </div>
        </div>
      ) : null}

      {element.type === 'faq' ? (
        <div className="space-y-4">
          <div>
            <label className={widgetFieldLabelClassName}>Title</label>
            <input
              className={inputClassName}
              value={element.title ?? ''}
              onChange={(e) => onChange({ ...element, title: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--ink)]">
            <input
              type="checkbox"
              checked={element.enableSearch !== false}
              onChange={(e) =>
                onChange({ ...element, enableSearch: e.target.checked })
              }
            />
            Show search
          </label>
          {element.enableSearch !== false ? (
            <div>
              <label className={widgetFieldLabelClassName}>
                Search placeholder
              </label>
              <input
                className={inputClassName}
                value={element.searchPlaceholder ?? ''}
                placeholder="Search for help"
                onChange={(e) =>
                  onChange({
                    ...element,
                    searchPlaceholder: e.target.value || undefined,
                  })
                }
              />
            </div>
          ) : null}
          <FaqArticlePicker
            apiKeyId={apiKeyId}
            entries={element.entries}
            onChange={(entries) => onChange({ ...element, entries })}
          />
        </div>
      ) : null}

      {element.type === 'linkCard' ? (
        <div className="space-y-4">
          <div>
            <label className={widgetFieldLabelClassName}>Title</label>
            <input
              className={inputClassName}
              value={element.title ?? ''}
              onChange={(e) => onChange({ ...element, title: e.target.value })}
            />
          </div>
          <div>
            <label className={widgetFieldLabelClassName}>Label</label>
            <input
              className={inputClassName}
              value={element.label}
              onChange={(e) => onChange({ ...element, label: e.target.value })}
            />
          </div>
          <div>
            <label className={widgetFieldLabelClassName}>URL</label>
            <input
              className={inputClassName}
              value={element.url}
              onChange={(e) => onChange({ ...element, url: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--ink)]">
            <input
              type="checkbox"
              checked={element.openInNewTab ?? false}
              onChange={(e) =>
                onChange({ ...element, openInNewTab: e.target.checked })
              }
            />
            Open in new tab
          </label>
        </div>
      ) : null}
    </div>
  )
}
