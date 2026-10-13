import { apiFetch } from '#/lib/api'

export type BatchTestGroupRunStatus =
  | 'idle'
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'

export type BatchTestQuestionStatus =
  | 'idle'
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'

export type BatchTestAnswerability = 'answerable' | 'not_answerable'
export type BatchTestRating = 'good' | 'passable' | 'poor'

export type BatchTestQuestion = {
  id: string
  groupId: string
  apiKeyId: string
  questionText: string
  order: number
  status: BatchTestQuestionStatus
  answer: string | null
  answerability: BatchTestAnswerability | null
  error: string | null
  references: {
    topics: Array<{ id: string; name: string; articleId: string }>
    articles: Array<{ id: string; title: string }>
    chunks: Array<{
      id: string
      topicId: string
      articleId: string
      preview: string
    }>
  }
  toolsDeclared: Array<{ name: string; alias: string }>
  toolsCalled: Array<{
    name: string
    alias: string
    ok: boolean
    error?: string
  }>
  guidanceDeclared: Array<{ id: string; name: string }>
  guidanceUsed: Array<{ id: string; name: string }>
  execution: {
    runId: string | null
    startedAt: string | null
    finishedAt: string | null
  }
  rating: BatchTestRating | null
  createdAt: string
  updatedAt: string
}

export type BatchTestGroup = {
  id: string
  apiKeyId: string
  name: string
  runStatus: BatchTestGroupRunStatus
  progress: { total: number; completed: number; failed: number }
  lastRunAt: string | null
  latestRunId: string | null
  questionCount: number
  summary: {
    answerable: number
    notAnswerable: number
    good: number
    passable: number
    poor: number
  }
  createdAt: string
  updatedAt: string
}

export type BatchTestGroupDetail = BatchTestGroup & {
  questions: BatchTestQuestion[]
}

export type BatchTestGroupProgress = {
  id: string
  runStatus: BatchTestGroupRunStatus
  progress: { total: number; completed: number; failed: number }
  lastRunAt: string | null
  latestRunId: string | null
  questions: BatchTestQuestion[]
}

function withApiKey(path: string, apiKeyId: string): string {
  const sep = path.includes('?') ? '&' : '?'
  return `${path}${sep}apiKeyId=${encodeURIComponent(apiKeyId)}`
}

export async function listBatchTestGroups(apiKeyId: string) {
  return apiFetch<BatchTestGroup[]>(withApiKey('/batch-tests', apiKeyId))
}

export async function createBatchTestGroup(apiKeyId: string, name: string) {
  return apiFetch<BatchTestGroup>('/batch-tests', {
    method: 'POST',
    body: JSON.stringify({ apiKeyId, name }),
  })
}

export async function getBatchTestGroup(apiKeyId: string, groupId: string) {
  return apiFetch<BatchTestGroupDetail>(
    withApiKey(`/batch-tests/${groupId}`, apiKeyId),
  )
}

export async function updateBatchTestGroup(
  apiKeyId: string,
  groupId: string,
  name: string,
) {
  return apiFetch<BatchTestGroup>(
    withApiKey(`/batch-tests/${groupId}`, apiKeyId),
    {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    },
  )
}

export async function deleteBatchTestGroup(apiKeyId: string, groupId: string) {
  return apiFetch<null>(withApiKey(`/batch-tests/${groupId}`, apiKeyId), {
    method: 'DELETE',
  })
}

export async function addBatchTestQuestion(
  apiKeyId: string,
  groupId: string,
  questionText: string,
) {
  return apiFetch<BatchTestQuestion>(
    withApiKey(`/batch-tests/${groupId}/questions`, apiKeyId),
    {
      method: 'POST',
      body: JSON.stringify({ questionText }),
    },
  )
}

export async function updateBatchTestQuestion(
  apiKeyId: string,
  groupId: string,
  questionId: string,
  questionText: string,
) {
  return apiFetch<BatchTestQuestion>(
    withApiKey(`/batch-tests/${groupId}/questions/${questionId}`, apiKeyId),
    {
      method: 'PATCH',
      body: JSON.stringify({ questionText }),
    },
  )
}

export async function deleteBatchTestQuestions(
  apiKeyId: string,
  groupId: string,
  questionIds: string[],
) {
  return apiFetch<null>(
    withApiKey(`/batch-tests/${groupId}/questions/delete`, apiKeyId),
    {
      method: 'POST',
      body: JSON.stringify({ questionIds }),
    },
  )
}

export async function runBatchTestQuestions(
  apiKeyId: string,
  groupId: string,
  questionIds: string[],
) {
  return apiFetch<BatchTestGroupDetail>(
    withApiKey(`/batch-tests/${groupId}/run`, apiKeyId),
    {
      method: 'POST',
      body: JSON.stringify({ questionIds }),
    },
  )
}

export async function getBatchTestProgress(apiKeyId: string, groupId: string) {
  return apiFetch<BatchTestGroupProgress>(
    withApiKey(`/batch-tests/${groupId}/progress`, apiKeyId),
  )
}

export async function setBatchTestRating(
  apiKeyId: string,
  groupId: string,
  questionId: string,
  rating: BatchTestRating,
) {
  return apiFetch<BatchTestQuestion>(
    withApiKey(
      `/batch-tests/${groupId}/questions/${questionId}/rating`,
      apiKeyId,
    ),
    {
      method: 'POST',
      body: JSON.stringify({ rating }),
    },
  )
}
