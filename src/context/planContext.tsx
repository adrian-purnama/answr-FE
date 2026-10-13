import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from '#/context/authContext'
import { apiFetch } from '#/lib/api'

export type UserPlan = {
  id: string
  name: string
  slug: string
  accentColor: string
  maxApiKeys: number
  maxRequestsPerMinute: number
  maxArticles: number
  maxTopicsPerArticle: number
  maxImagesPerTopic: number
  maxCharactersPerTopic: number
  maxSnippets: number
  maxImagesPerSnippet: number
  maxCharactersPerSnippet: number
  maxGuidances: number
  maxCharactersPerGuidance: number
  maxLiveAgents: number
  liveAgent: boolean
  meetingTool: boolean
  leadCapture: boolean
  whatsApp: boolean
  maxMeetingTopics: number
  batchTestGroupAmount: number
  questionsPerBatchTestGroup: number
  analyticsLookbackDays: number
  isDefaultPlan: boolean
}

export type UserPlanPeriod = {
  id: string
  userId: string
  planId: string
  planName: string | null
  effectiveDate: string
  untilDate: string
  neverExpires: boolean
  source: 'manual' | 'default_sync'
  createdAt: string | null
  createdBy: string | null
  deepseekQuotaPerPeriod?: number
  quotaWindowDays?: number | null
  windowCount?: number | null
}

export type UserPlanTimeline = {
  periods: UserPlanPeriod[]
  gaps: Array<{ effectiveDate: string; untilDate: string }>
  currentPeriodId: string | null
  page?: number
  pageSize?: number
  total?: number
  previousCount?: number
  upcomingCount?: number
  currentPeriodPage?: number | null
  latestPeriod?: {
    id: string
    planName: string | null
    untilDate: string
    neverExpires: boolean
  } | null
}

export type UserPlanNextPeriod = {
  planId: string
  planName: string | null
  effectiveDate: string
  untilDate: string
  neverExpires: boolean
}

export type UserPlanStatus = {
  plan: UserPlan
  planExpiresAt: string | null
  neverExpires: boolean
  timeline: UserPlanTimeline
  nextPeriod: UserPlanNextPeriod | null
}

interface PlanContextValue {
  plan: UserPlan | null
  planExpiresAt: string | null
  neverExpires: boolean
  timeline: UserPlanTimeline | null
  nextPeriod: UserPlanNextPeriod | null
  headingToExpiry: boolean
  isLoading: boolean
  refreshPlan: () => Promise<void>
}

const emptyTimeline: UserPlanTimeline = {
  periods: [],
  gaps: [],
  currentPeriodId: null,
}

/** Only surface the expiry banner this close to (or past) plan end. */
const WARN_WITHIN_MS = 3 * 24 * 60 * 60 * 1000

const PlanContext = createContext<PlanContextValue | null>(null)

async function fetchUserPlanStatus(): Promise<UserPlanStatus | null> {
  try {
    const response = await apiFetch<UserPlanStatus>('/user/plan-status')
    if (response.success && response.data) {
      return response.data
    }
  } catch {
    // fall through
  }

  // Admins / plan-less users: entitlements-only fallback
  try {
    const response = await apiFetch<UserPlan>('/user/plan')
    if (!response.success || !response.data) return null
    return {
      plan: {
        ...response.data,
        isDefaultPlan: response.data.isDefaultPlan ?? false,
      },
      planExpiresAt: null,
      neverExpires: true,
      timeline: emptyTimeline,
      nextPeriod: null,
    }
  } catch {
    return null
  }
}

export function PlanProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [status, setStatus] = useState<UserPlanStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const applyStatus = useCallback((result: UserPlanStatus | null) => {
    setStatus(result)
  }, [])

  const refreshPlan = useCallback(async () => {
    if (!isAuthenticated) {
      applyStatus(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const result = await fetchUserPlanStatus()
    applyStatus(result)
    setIsLoading(false)
  }, [applyStatus, isAuthenticated])

  useEffect(() => {
    if (authLoading) {
      return
    }

    let cancelled = false

    void (async () => {
      if (!isAuthenticated) {
        if (!cancelled) {
          applyStatus(null)
          setIsLoading(false)
        }
        return
      }

      if (!cancelled) {
        setIsLoading(true)
      }

      const result = await fetchUserPlanStatus()
      if (!cancelled) {
        applyStatus(result)
        setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [applyStatus, authLoading, isAuthenticated])

  const headingToExpiry = useMemo(() => {
    if (!status?.plan) return false
    if (status.neverExpires || !status.planExpiresAt) return false
    if (status.nextPeriod) return false
    if (status.plan.isDefaultPlan) return false
    const remaining =
      new Date(status.planExpiresAt).getTime() - Date.now()
    // Warn only when expiry is close (or already past), not the whole period.
    if (remaining > WARN_WITHIN_MS) return false
    return true
  }, [status])

  return createElement(
    PlanContext.Provider,
    {
      value: {
        plan: status?.plan ?? null,
        planExpiresAt: status?.planExpiresAt ?? null,
        neverExpires: status?.neverExpires ?? false,
        timeline: status?.timeline ?? null,
        nextPeriod: status?.nextPeriod ?? null,
        headingToExpiry,
        isLoading: authLoading || isLoading,
        refreshPlan,
      },
    },
    children,
  )
}

export function usePlan(): PlanContextValue {
  const context = useContext(PlanContext)
  if (!context) {
    throw new Error('usePlan must be used within PlanProvider')
  }
  return context
}
