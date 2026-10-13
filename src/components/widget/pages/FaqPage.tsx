import WidgetFaqList from '#/components/widget/WidgetFaqList'
import { useWidgetRuntime } from '#/components/widget/context/WidgetRuntimeContext'
import { normalizeFaqSettings } from '#/lib/widget'
import { cn } from '#/lib/utils'

export default function FaqPage() {
  const { publicKey, settings, darkMode, openArticle } = useWidgetRuntime()
  const faqSettings = normalizeFaqSettings(settings.faqSettings)

  if (!faqSettings.enabled) return null

  return (
    <div className={cn('flex w-full flex-col px-6 pt-2 pb-6')}>
      <WidgetFaqList
        title={faqSettings.title}
        enableSearch={faqSettings.enableSearch !== false}
        searchPlaceholder={faqSettings.searchPlaceholder}
        entries={faqSettings.entries}
        darkMode={darkMode}
        publicKey={publicKey}
        onOpenArticle={openArticle}
      />
    </div>
  )
}
