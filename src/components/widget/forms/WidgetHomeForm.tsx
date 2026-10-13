import ToggleRow from '#/components/widget/forms/ToggleRow'
import { WidgetFormSection } from '#/components/widget/forms/widgetFormUi'
import HomeCanvasBuilder from '#/components/widget/home-builder/HomeCanvasBuilder'
import type { WidgetHomeSettings } from '#/lib/widget'

type WidgetHomeFormProps = {
  value: WidgetHomeSettings
  onChange: (value: WidgetHomeSettings) => void
  apiKeyId: string
  publicKey: string
  darkMode?: boolean
}

export default function WidgetHomeForm({
  value,
  onChange,
  apiKeyId,
  publicKey,
  darkMode = false,
}: WidgetHomeFormProps) {
  return (
    <div className="space-y-6">
      <WidgetFormSection title="Availability">
        <ToggleRow
          id="widget-section-home"
          label="Enable Home"
          description="Logo, greeting, and stacked sections (FAQ, chat, news, links)."
          checked={value.enabled}
          onChange={(enabled) => onChange({ ...value, enabled })}
        />
      </WidgetFormSection>
      <HomeCanvasBuilder
        value={value}
        onChange={onChange}
        apiKeyId={apiKeyId}
        publicKey={publicKey}
        darkMode={darkMode}
      />
    </div>
  )
}
