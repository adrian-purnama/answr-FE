export type Plan = {
  id: string
  slug: string
  name: string
  description: string
  pricePerMonth: number
  priceLabel: number
  priceNote: string
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
  deepseekQuotaPerPeriod: number
  /** null = whole plan period is one quota window. */
  quotaWindowDays: number | null
  accentColor: string
  order: number
  showOnPricingPage: boolean
  isDefaultPlan: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type PlanFormValues = {
  slug: string
  name: string
  description: string
  pricePerMonth: string
  priceLabel: string
  priceNote: string
  maxApiKeys: string
  maxRequestsPerMinute: string
  maxArticles: string
  maxTopicsPerArticle: string
  maxImagesPerTopic: string
  maxCharactersPerTopic: string
  maxSnippets: string
  maxImagesPerSnippet: string
  maxCharactersPerSnippet: string
  maxGuidances: string
  maxCharactersPerGuidance: string
  maxLiveAgents: string
  liveAgent: boolean
  meetingTool: boolean
  leadCapture: boolean
  whatsApp: boolean
  maxMeetingTopics: string
  batchTestGroupAmount: string
  questionsPerBatchTestGroup: string
  analyticsLookbackDays: string
  deepseekQuotaPerPeriod: string
  /** Empty string means null (whole period). */
  quotaWindowDays: string
  accentColor: string
  order: string
  showOnPricingPage: boolean
  isDefaultPlan: boolean
  isActive: boolean
}

export const emptyPlanForm = (): PlanFormValues => ({
  slug: '',
  name: '',
  description: '',
  pricePerMonth: '0',
  priceLabel: '0',
  priceNote: '',
  maxApiKeys: '1',
  maxRequestsPerMinute: '60',
  maxArticles: '10',
  maxTopicsPerArticle: '50',
  maxImagesPerTopic: '10',
  maxCharactersPerTopic: '10000',
  maxSnippets: '50',
  maxImagesPerSnippet: '10',
  maxCharactersPerSnippet: '5000',
  maxGuidances: '10',
  maxCharactersPerGuidance: '2000',
  maxLiveAgents: '0',
  liveAgent: false,
  meetingTool: false,
  leadCapture: false,
  whatsApp: false,
  maxMeetingTopics: '0',
  batchTestGroupAmount: '5',
  questionsPerBatchTestGroup: '50',
  analyticsLookbackDays: '30',
  deepseekQuotaPerPeriod: '0',
  quotaWindowDays: '',
  accentColor: '#1B2B4D',
  order: '0',
  showOnPricingPage: false,
  isDefaultPlan: false,
  isActive: true,
})

export function planToFormValues(plan: Plan): PlanFormValues {
  return {
    slug: plan.slug,
    name: plan.name,
    description: plan.description,
    pricePerMonth: String(plan.pricePerMonth),
    priceLabel: String(plan.priceLabel),
    priceNote: plan.priceNote,
    maxApiKeys: String(plan.maxApiKeys),
    maxRequestsPerMinute: String(plan.maxRequestsPerMinute),
    maxArticles: String(plan.maxArticles ?? 10),
    maxTopicsPerArticle: String(plan.maxTopicsPerArticle ?? 50),
    maxImagesPerTopic: String(plan.maxImagesPerTopic ?? 10),
    maxCharactersPerTopic: String(plan.maxCharactersPerTopic ?? 10000),
    maxSnippets: String(plan.maxSnippets ?? 50),
    maxImagesPerSnippet: String(plan.maxImagesPerSnippet ?? 10),
    maxCharactersPerSnippet: String(plan.maxCharactersPerSnippet ?? 5000),
    maxGuidances: String(plan.maxGuidances ?? 10),
    maxCharactersPerGuidance: String(plan.maxCharactersPerGuidance ?? 2000),
    maxLiveAgents: String(plan.maxLiveAgents ?? 0),
    liveAgent: plan.liveAgent ?? false,
    meetingTool: plan.meetingTool ?? false,
    leadCapture: plan.leadCapture ?? false,
    whatsApp: plan.whatsApp ?? false,
    maxMeetingTopics: String(plan.maxMeetingTopics ?? 0),
    batchTestGroupAmount: String(plan.batchTestGroupAmount ?? 5),
    questionsPerBatchTestGroup: String(plan.questionsPerBatchTestGroup ?? 50),
    analyticsLookbackDays: String(plan.analyticsLookbackDays ?? 30),
    deepseekQuotaPerPeriod: String(plan.deepseekQuotaPerPeriod ?? 0),
    quotaWindowDays:
      plan.quotaWindowDays == null ? '' : String(plan.quotaWindowDays),
    accentColor: plan.accentColor,
    order: String(plan.order),
    showOnPricingPage: plan.showOnPricingPage,
    isDefaultPlan: plan.isDefaultPlan,
    isActive: plan.isActive,
  }
}

export function formValuesToPayload(values: PlanFormValues) {
  const windowRaw = values.quotaWindowDays.trim()
  return {
    slug: values.slug.trim().toLowerCase(),
    name: values.name.trim(),
    description: values.description.trim(),
    pricePerMonth: Number(values.pricePerMonth),
    priceLabel: Number(values.priceLabel),
    priceNote: values.priceNote.trim(),
    maxApiKeys: Number(values.maxApiKeys),
    maxRequestsPerMinute: Number(values.maxRequestsPerMinute),
    maxArticles: Number(values.maxArticles),
    maxTopicsPerArticle: Number(values.maxTopicsPerArticle),
    maxImagesPerTopic: Number(values.maxImagesPerTopic),
    maxCharactersPerTopic: Number(values.maxCharactersPerTopic),
    maxSnippets: Number(values.maxSnippets),
    maxImagesPerSnippet: Number(values.maxImagesPerSnippet),
    maxCharactersPerSnippet: Number(values.maxCharactersPerSnippet),
    maxGuidances: Number(values.maxGuidances),
    maxCharactersPerGuidance: Number(values.maxCharactersPerGuidance),
    maxLiveAgents: Number(values.maxLiveAgents),
    liveAgent: values.liveAgent,
    meetingTool: values.meetingTool,
    leadCapture: values.leadCapture,
    whatsApp: values.whatsApp,
    maxMeetingTopics: Number(values.maxMeetingTopics),
    batchTestGroupAmount: Number(values.batchTestGroupAmount),
    questionsPerBatchTestGroup: Number(values.questionsPerBatchTestGroup),
    analyticsLookbackDays: Number(values.analyticsLookbackDays),
    deepseekQuotaPerPeriod: Number(values.deepseekQuotaPerPeriod),
    quotaWindowDays: windowRaw === '' ? null : Number(windowRaw),
    accentColor: values.accentColor,
    order: Number(values.order),
    showOnPricingPage: values.showOnPricingPage,
    isDefaultPlan: values.isDefaultPlan,
    isActive: values.isActive,
  }
}
