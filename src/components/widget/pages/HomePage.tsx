import HomeSections from '#/components/widget/HomeSections'
import { useWidgetRuntime } from '#/components/widget/context/WidgetRuntimeContext'
import { resolveVisitorTemplate } from '#/lib/widget'
import { useMemo } from 'react'

export default function HomePage() {
  const {
    publicKey,
    homeSettings,
    chatSettings,
    darkMode,
    logoUrl,
    openAgentChat,
    openArticle,
    openNews,
    visitor,
  } = useWidgetRuntime()

  const personalizedHome = useMemo(
    () => ({
      ...homeSettings,
      greeting: resolveVisitorTemplate(homeSettings.greeting, visitor),
    }),
    [homeSettings, visitor],
  )

  if (!homeSettings.enabled) return null

  return (
    <HomeSections
      homeSettings={personalizedHome}
      darkMode={darkMode}
      logoUrl={logoUrl}
      publicKey={publicKey}
      onGoToChat={chatSettings.enabled ? openAgentChat : undefined}
      onOpenArticle={openArticle}
      onOpenNews={openNews}
      chromeOffset
    />
  )
}
