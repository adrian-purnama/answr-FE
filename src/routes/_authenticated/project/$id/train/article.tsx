import {
  createFileRoute,
  useLoaderData,
  useNavigate,
} from '@tanstack/react-router'
import ArticlesSection from '#/components/articles/ArticlesSection'
import SnippetsSection from '#/components/articles/SnippetsSection'
import { hintClassName, projectSectionClassName } from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

type ArticleSearch = {
  view?: 'articles' | 'snippets'
  articleId?: string
  topicId?: string
  snippetId?: string
  batchQuestionId?: string
  batchPrompt?: string
}

export const Route = createFileRoute(
  '/_authenticated/project/$id/train/article',
)({
  validateSearch: (search: Record<string, unknown>): ArticleSearch => ({
    view:
      search.view === 'snippets'
        ? 'snippets'
        : search.view === 'articles'
          ? 'articles'
          : undefined,
    articleId:
      typeof search.articleId === 'string' && search.articleId
        ? search.articleId
        : undefined,
    topicId:
      typeof search.topicId === 'string' && search.topicId
        ? search.topicId
        : undefined,
    snippetId:
      typeof search.snippetId === 'string' && search.snippetId
        ? search.snippetId
        : undefined,
    batchQuestionId:
      typeof search.batchQuestionId === 'string' && search.batchQuestionId
        ? search.batchQuestionId
        : undefined,
    batchPrompt:
      typeof search.batchPrompt === 'string' && search.batchPrompt
        ? search.batchPrompt
        : undefined,
  }),
  component: TrainArticlesPage,
})

function TrainArticlesPage() {
  const { apiKey } = useLoaderData({ from: '/_authenticated/project/$id' })
  const { id: projectId } = Route.useParams()
  const { view, articleId, topicId, snippetId, batchQuestionId, batchPrompt } =
    Route.useSearch()
  const navigate = useNavigate()

  const activeView: 'articles' | 'snippets' =
    view === 'snippets' || Boolean(snippetId) ? 'snippets' : 'articles'

  function setView(next: 'articles' | 'snippets') {
    void navigate({
      to: '/project/$id/train/article',
      params: { id: projectId },
      search: {
        ...(next === 'snippets' ? { view: 'snippets' as const } : {}),
        ...(batchQuestionId ? { batchQuestionId } : {}),
        ...(batchPrompt ? { batchPrompt } : {}),
      },
      replace: true,
    })
  }

  function dismissBatchBanner() {
    void navigate({
      to: '/project/$id/train/article',
      params: { id: projectId },
      search: {
        ...(activeView === 'snippets' ? { view: 'snippets' as const } : {}),
        ...(articleId ? { articleId } : {}),
        ...(topicId ? { topicId } : {}),
        ...(snippetId ? { snippetId } : {}),
      },
      replace: true,
    })
  }

  return (
    <div className={cn(projectSectionClassName, 'min-w-0 max-w-full')}>
      <div className="min-w-0">
        <h1 className="text-2xl font-medium text-[var(--ink)]">
          {activeView === 'snippets' ? 'Snippets' : 'Articles'}
        </h1>
        <p className={cn(hintClassName, 'mt-1')}>
          {activeView === 'snippets'
            ? 'Standalone knowledge units synced to the vector store for retrieval.'
            : 'Training documents made of ordered topics    open one to edit like a page.'}
        </p>
      </div>

      {batchQuestionId || batchPrompt ? (
        <div className="mt-4 flex items-start justify-between gap-3 rounded border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--ink)]">
              From batch test remediation
            </p>
            {batchPrompt ? (
              <p className={cn(hintClassName, 'mt-1 line-clamp-3')}>
                Question: {batchPrompt}
              </p>
            ) : null}
            <p className={cn(hintClassName, 'mt-1')}>
              Add or update knowledge manually. Nothing is changed until you
              save.
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 text-sm text-[var(--muted)] hover:text-[var(--ink)]"
            onClick={dismissBatchBanner}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <div
        className="mt-5 flex gap-5 border-b border-[var(--line)]"
        role="tablist"
        aria-label="Knowledge type"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'articles'}
          className={cn(
            '-mb-px border-b-2 pb-2.5 text-sm font-medium transition',
            activeView === 'articles'
              ? 'border-[var(--ink)] text-[var(--ink)]'
              : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]',
          )}
          onClick={() => setView('articles')}
        >
          Articles
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'snippets'}
          className={cn(
            '-mb-px border-b-2 pb-2.5 text-sm font-medium transition',
            activeView === 'snippets'
              ? 'border-[var(--ink)] text-[var(--ink)]'
              : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]',
          )}
          onClick={() => setView('snippets')}
        >
          Snippets
        </button>
      </div>

      <div className="mt-6 min-w-0">
        {activeView === 'snippets' ? (
          <SnippetsSection
            apiKeyId={apiKey.id}
            embedded
            openSnippetId={snippetId}
            onOpenRequestConsumed={() => {
              void navigate({
                to: '/project/$id/train/article',
                params: { id: projectId },
                search: { view: 'snippets' },
                replace: true,
              })
            }}
          />
        ) : (
          <ArticlesSection
            apiKeyId={apiKey.id}
            embedded
            openArticleId={articleId}
            openTopicId={topicId}
            onOpenRequestConsumed={() => {
              void navigate({
                to: '/project/$id/train/article',
                params: { id: projectId },
                search: {},
                replace: true,
              })
            }}
          />
        )}
      </div>
    </div>
  )
}
