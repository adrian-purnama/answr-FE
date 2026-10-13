import { useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, Plus } from 'lucide-react'
import Modal from '#/components/ui/Modal'
import {
  getArticle,
  listArticles,
  type Article,
  type Topic,
} from '#/lib/article'
import { buttonOutlineClassName, hintClassName } from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

type TopicReferencePickerProps = {
  open: boolean
  onClose: () => void
  apiKeyId: string
  /** Hide this topic from the list (e.g. the topic currently being edited). */
  excludeTopicId?: string
  onInsertTopic: (topicId: string, topicName: string) => void
}

export default function TopicReferencePicker({
  open,
  onClose,
  apiKeyId,
  excludeTopicId,
  onInsertTopic,
}: TopicReferencePickerProps) {
  const [articles, setArticles] = useState<Article[]>([])
  const [topicsByArticle, setTopicsByArticle] = useState<
    Record<string, Topic[]>
  >({})
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await listArticles(apiKeyId)
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to load articles')
        }
        if (!cancelled) {
          setArticles(response.data.filter((a) => a.enabled))
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load articles')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, apiKeyId])

  async function expandArticle(articleId: string) {
    if (expandedId === articleId) {
      setExpandedId(null)
      return
    }
    setExpandedId(articleId)
    if (articleId in topicsByArticle) return

    const response = await getArticle(apiKeyId, articleId)
    if (!response.success || !response.data) {
      setError(response.message || 'Failed to load topics')
      return
    }
    setTopicsByArticle((prev) => ({
      ...prev,
      [articleId]: response.data!.topics.filter(
        (t) =>
          t.enabled &&
          (!excludeTopicId ||
            t.id.toLowerCase() !== excludeTopicId.toLowerCase()),
      ),
    }))
  }

  return (
    <Modal open={open} onClose={onClose} title="Insert topic reference" maxWidth="max-w-lg">
      <p className={cn(hintClassName, 'mb-3')}>
        Click a topic to insert it at the cursor. You can insert the same topic
        more than once.
      </p>

      {error ? <p className="mb-2 text-xs text-red-600">{error}</p> : null}
      {loading ? <p className={hintClassName}>Loading articles…</p> : null}

      {!loading && articles.length === 0 ? (
        <p className={hintClassName}>No enabled articles yet.</p>
      ) : (
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {articles.map((article) => {
            const openRow = expandedId === article.id
            const topics = topicsByArticle[article.id] ?? []
            return (
              <div
                key={article.id}
                className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--line)]"
              >
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-[var(--surface)]"
                  onClick={() => void expandArticle(article.id)}
                >
                  {openRow ? (
                    <ChevronDown className="size-4 shrink-0 text-[var(--muted)]" />
                  ) : (
                    <ChevronRight className="size-4 shrink-0 text-[var(--muted)]" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--ink)]">
                    {article.title}
                  </span>
                  <span className={hintClassName}>Article</span>
                </button>
                {openRow ? (
                  <div className="space-y-1 border-t border-[var(--line)] bg-[var(--surface)]/50 px-3 py-2">
                    {!(article.id in topicsByArticle) ? (
                      <p className={hintClassName}>Loading topics…</p>
                    ) : topics.length === 0 ? (
                      <p className={hintClassName}>No enabled topics.</p>
                    ) : (
                      topics
                        .filter(
                          (topic) =>
                            !excludeTopicId ||
                            topic.id.toLowerCase() !==
                              excludeTopicId.toLowerCase(),
                        )
                        .map((topic) => (
                        <button
                          key={topic.id}
                          type="button"
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition hover:bg-white/80"
                          onClick={() =>
                            onInsertTopic(topic.id, topic.topicName)
                          }
                        >
                          <Plus
                            className="size-3.5 shrink-0 text-[var(--muted)]"
                            aria-hidden
                          />
                          <span className="min-w-0 flex-1 truncate text-[var(--ink)]">
                            {topic.topicName}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          className={buttonOutlineClassName}
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </Modal>
  )
}
