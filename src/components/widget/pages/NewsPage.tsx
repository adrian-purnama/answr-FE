import { useEffect, useState } from 'react'
import WidgetNewsCard from '#/components/widget/WidgetNewsCard'
import { useWidgetRuntime } from '#/components/widget/context/WidgetRuntimeContext'
import { cn } from '#/lib/utils'
import {
  getPublicNewsList,
  type PublicNewsListItem,
} from '#/lib/news'

export default function NewsPage() {
  const { publicKey, settings, darkMode, openNews } =
    useWidgetRuntime()
  const [items, setItems] = useState<PublicNewsListItem[]>([])
  const [loading, setLoading] = useState(Boolean(publicKey))

  useEffect(() => {
    if (!publicKey || !settings.newsSettings.enabled) {
      setItems([])
      setLoading(false)
      return
    }
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const response = await getPublicNewsList(publicKey!)
        if (!cancelled && response.success && response.data) {
          setItems(response.data)
        }
      } catch {
        if (!cancelled) setItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [publicKey, settings.newsSettings.enabled])

  if (!settings.newsSettings.enabled) return null

  return (
    <div className="flex w-full flex-col px-5 pt-1 pb-6">
      {loading ? (
        <p
          className={cn(
            'py-10 text-center text-sm',
            darkMode ? 'text-neutral-500' : 'text-neutral-400',
          )}
        >
          Loading…
        </p>
      ) : items.length === 0 ? (
        <p
          className={cn(
            'py-10 text-center text-sm',
            darkMode ? 'text-neutral-500' : 'text-neutral-400',
          )}
        >
          No news yet
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {items.map((item) => (
            <li key={item.id}>
              <WidgetNewsCard
                item={item}
                publicKey={publicKey}
                darkMode={darkMode}
                onOpen={openNews}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
