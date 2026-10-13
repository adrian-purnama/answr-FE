import { Link, useParams } from '@tanstack/react-router'
import ToggleRow from '#/components/widget/forms/ToggleRow'
import {
  WidgetFormSection,
  hintClassName,
  inputClassName,
  widgetFieldLabelClassName,
} from '#/components/widget/forms/widgetFormUi'
import FaqArticlePicker from '#/components/widget/home-builder/FaqArticlePicker'
import type { WidgetFaqSettings } from '#/lib/widget'

type WidgetFaqFormProps = {
  value: WidgetFaqSettings
  onChange: (value: WidgetFaqSettings) => void
  apiKeyId: string
}

export default function WidgetFaqForm({
  value,
  onChange,
  apiKeyId,
}: WidgetFaqFormProps) {
  const { id: projectId } = useParams({
    from: '/_authenticated/project/$id',
  })

  return (
    <div className="space-y-6">
      <WidgetFormSection title="Availability">
        <ToggleRow
          id="widget-section-faq"
          label="Enable Help"
          description="Help tab for FAQs and self-serve articles."
          checked={value.enabled}
          onChange={(enabled) => onChange({ ...value, enabled })}
        />
      </WidgetFormSection>

      <WidgetFormSection
        title="Help content"
        description="Choose which articles and topics appear in the Help tab. Clicking an article opens the reader."
      >
        <div>
          <label className={widgetFieldLabelClassName} htmlFor="widget-help-title">
            Title
          </label>
          <input
            id="widget-help-title"
            className={inputClassName}
            value={value.title ?? ''}
            onChange={(e) => onChange({ ...value, title: e.target.value })}
            placeholder="Help"
          />
        </div>

        <ToggleRow
          id="widget-help-search"
          label="Show search"
          description="Let visitors filter the article list in Help."
          checked={value.enableSearch !== false}
          onChange={(enableSearch) => onChange({ ...value, enableSearch })}
        />

        {value.enableSearch !== false ? (
          <div>
            <label
              className={widgetFieldLabelClassName}
              htmlFor="widget-help-search-placeholder"
            >
              Search placeholder
            </label>
            <input
              id="widget-help-search-placeholder"
              className={inputClassName}
              value={value.searchPlaceholder ?? ''}
              onChange={(e) =>
                onChange({ ...value, searchPlaceholder: e.target.value })
              }
              placeholder="Search for help"
            />
          </div>
        ) : null}

        <div className="space-y-2 border-t border-[var(--line)] pt-4">
          <p className="text-sm font-medium text-[var(--ink)]">Articles</p>
          <p className={hintClassName}>
            Select articles, then expand to choose topics (empty selection means
            all topics). Manage source content in{' '}
            <Link
              to="/project/$id/train/article"
              params={{ id: projectId }}
              className="text-[var(--ink)] underline underline-offset-2 hover:opacity-80"
            >
              Train → Articles
            </Link>
            .
          </p>
          <FaqArticlePicker
            apiKeyId={apiKeyId}
            entries={value.entries}
            onChange={(entries) => onChange({ ...value, entries })}
          />
        </div>
      </WidgetFormSection>
    </div>
  )
}
