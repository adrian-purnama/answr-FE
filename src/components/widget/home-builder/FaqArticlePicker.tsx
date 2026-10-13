import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Search } from 'lucide-react'
import { getArticle, listArticles, type Article, type Topic } from '#/lib/article'
import { buttonOutlineClassName, hintClassName } from '#/lib/ui-classes'
import { cn } from '#/lib/utils'
import type { HomeFaqEntry } from '#/lib/widget'

const fieldClassName =
  'w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--ink)]'

type FaqArticlePickerProps = {
  apiKeyId: string
  entries: HomeFaqEntry[]
  onChange: (entries: HomeFaqEntry[]) => void
}

function StatusChip({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase',
        enabled
          ? 'bg-emerald-500/15 text-emerald-700'
          : 'bg-amber-500/15 text-amber-800',
      )}
    >
      {enabled ? 'Active' : 'Disabled'}
    </span>
  )
}

export default function FaqArticlePicker({
  apiKeyId,
  entries,
  onChange,
}: FaqArticlePickerProps) {
  const [articles, setArticles] = useState<Article[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [topicsByArticle, setTopicsByArticle] = useState<
    Record<string, Topic[]>
  >({})
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const entryIdsKey = entries.map((e) => e.articleId).join(',')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const response = await listArticles(apiKeyId)
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to load articles')
        }
        if (!cancelled) setArticles(response.data)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load articles')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [apiKeyId])

  useEffect(() => {
    let cancelled = false
    async function loadTopics() {
      const ids = entryIdsKey ? entryIdsKey.split(',') : []
      const missing = ids.filter((id) => id && !(id in topicsByArticle))
      if (missing.length === 0) return

      const next: Record<string, Topic[]> = {}
      await Promise.all(
        missing.map(async (articleId) => {
          try {
            const response = await getArticle(apiKeyId, articleId)
            next[articleId] =
              response.success && response.data ? response.data.topics : []
          } catch {
            next[articleId] = []
          }
        }),
      )
      if (!cancelled) {
        setTopicsByArticle((prev) => {
          const merged = { ...prev }
          for (const [id, topics] of Object.entries(next)) {
            if (!(id in merged)) merged[id] = topics
          }
          return merged
        })
      }
    }
    void loadTopics()
    return () => {
      cancelled = true
    }
  }, [apiKeyId, entryIdsKey, topicsByArticle])

  const selectedIds = useMemo(
    () => new Set(entries.map((e) => e.articleId)),
    [entries],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const available = articles.filter((a) => !selectedIds.has(a.id))
    if (!q) return available
    return available.filter((a) => a.title.toLowerCase().includes(q))
  }, [articles, search, selectedIds])

  function addArticle(article: Article) {
    if (selectedIds.has(article.id)) return
    onChange([...entries, { articleId: article.id, topicIds: [] }])
    setExpandedId(article.id)
    setSearch('')
  }

  function removeArticle(articleId: string) {
    onChange(entries.filter((e) => e.articleId !== articleId))
    if (expandedId === articleId) setExpandedId(null)
  }

  function selectAllTopics(articleId: string) {
    onChange(
      entries.map((entry) =>
        entry.articleId === articleId ? { ...entry, topicIds: [] } : entry,
      ),
    )
  }

  function toggleTopic(articleId: string, topicId: string) {
    onChange(
      entries.map((entry) => {
        if (entry.articleId !== articleId) return entry
        const topics = topicsByArticle[articleId] ?? []
        const allTopics = entry.topicIds.length === 0
        if (allTopics) {
          return {
            ...entry,
            topicIds: topics.map((t) => t.id).filter((id) => id !== topicId),
          }
        }
        const has = entry.topicIds.includes(topicId)
        if (has) {
          return {
            ...entry,
            topicIds: entry.topicIds.filter((id) => id !== topicId),
          }
        }
        const next = [...entry.topicIds, topicId]
        if (topics.length > 0 && topics.every((t) => next.includes(t.id))) {
          return { ...entry, topicIds: [] }
        }
        return { ...entry, topicIds: next }
      }),
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-[var(--muted)]" />
        <input
          className={cn(fieldClassName, 'pl-9')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search articles…"
        />
      </div>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      {loading ? <p className={hintClassName}>Loading…</p> : null}

      <div className="max-h-36 overflow-y-auto rounded-xl border border-[var(--line)]">
        {filtered.length === 0 ? (
          <p className={cn(hintClassName, 'px-3 py-4')}>
            {search.trim() ? 'No matches.' : 'All articles selected or none yet.'}
          </p>
        ) : (
          filtered.map((article) => (
            <button
              key={article.id}
              type="button"
              className="flex w-full items-center justify-between gap-2 border-b border-[var(--line)] px-3 py-2 text-left text-sm last:border-b-0 hover:bg-[var(--surface)]"
              onClick={() => addArticle(article)}
            >
              <span className="truncate text-[var(--ink)]">{article.title}</span>
              <StatusChip enabled={article.enabled} />
            </button>
          ))
        )}
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-semibold tracking-wide text-[var(--muted)] uppercase">
          Included ({entries.length})
        </p>
        {entries.length === 0 ? (
          <p className={hintClassName}>Select articles above.</p>
        ) : (
          entries.map((entry) => {
            const article = articles.find((a) => a.id === entry.articleId)
            const topics = topicsByArticle[entry.articleId] ?? []
            const open = expandedId === entry.articleId
            const allTopics = entry.topicIds.length === 0
            return (
              <div
                key={entry.articleId}
                className="overflow-hidden rounded-xl border border-[var(--line)]"
              >
                <div className="flex items-center gap-1 px-2 py-1.5">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                    onClick={() =>
                      setExpandedId(open ? null : entry.articleId)
                    }
                  >
                    {open ? (
                      <ChevronDown className="size-3.5 shrink-0 text-[var(--muted)]" />
                    ) : (
                      <ChevronRight className="size-3.5 shrink-0 text-[var(--muted)]" />
                    )}
                    <span className="truncate text-sm font-medium text-[var(--ink)]">
                      {article?.title ?? entry.articleId}
                    </span>
                    {article ? <StatusChip enabled={article.enabled} /> : null}
                  </button>
                  <button
                    type="button"
                    className={cn(buttonOutlineClassName, 'px-2 py-0.5 text-[11px]')}
                    onClick={() => removeArticle(entry.articleId)}
                  >
                    Remove
                  </button>
                </div>
                {open ? (
                  <div className="space-y-2 border-t border-[var(--line)] bg-[var(--surface)]/50 px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className={cn(
                          buttonOutlineClassName,
                          'px-2 py-0.5 text-[11px]',
                          allTopics && 'border-[var(--ink)]',
                        )}
                        onClick={() => selectAllTopics(entry.articleId)}
                      >
                        All topics
                      </button>
                      <span className="text-[10px] text-[var(--muted)]">
                        {allTopics
                          ? 'All topics included'
                          : `${entry.topicIds.length} selected`}
                      </span>
                    </div>
                    {topics.length === 0 ? (
                      <p className={hintClassName}>No topics yet.</p>
                    ) : (
                      <div className="max-h-32 space-y-1 overflow-y-auto">
                        {topics.map((topic) => {
                          const checked =
                            allTopics || entry.topicIds.includes(topic.id)
                          return (
                            <label
                              key={topic.id}
                              className="flex items-center gap-2 text-sm text-[var(--ink)]"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  toggleTopic(entry.articleId, topic.id)
                                }
                              />
                              <span className="truncate">{topic.topicName}</span>
                              {!topic.enabled ? (
                                <span className="text-[10px] text-amber-700">
                                  off
                                </span>
                              ) : null}
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
