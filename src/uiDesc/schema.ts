import { z } from 'zod'

const statusValues = ['pending', 'paid', 'failed', 'expired'] as const
const chartVariants = ['bar', 'line', 'pie', 'donut'] as const

const bindStr = z.string().min(1).optional()

const mediaSchema = z.discriminatedUnion('kind', [
  z.object({
    type: z.literal('media'),
    kind: z.literal('url'),
    src: z.string().optional().default(''),
    alt: z.string().optional(),
    bindSrc: bindStr,
  }),
  z.object({
    type: z.literal('media'),
    kind: z.literal('dataUrl'),
    src: z.string().optional().default(''),
    alt: z.string().optional(),
    bindSrc: bindStr,
  }),
  z.object({
    type: z.literal('media'),
    kind: z.literal('payload'),
    payload: z.string().optional().default(''),
    encoding: z.enum(['raw', 'base64']).optional().default('raw'),
    mimeType: z.string().optional(),
    alt: z.string().optional(),
    bindPayload: bindStr,
    bindEncoding: bindStr,
  }),
])

const textSchema = z.object({
  type: z.literal('text'),
  content: z.string().optional().default(''),
  tone: z.enum(['default', 'muted', 'emphasis']).optional(),
  bind: bindStr,
})

const keyValueSchema = z.object({
  type: z.literal('keyValue'),
  rows: z.array(
    z.object({
      label: z.string(),
      value: z.string().optional().default(''),
      bind: bindStr,
    }),
  ),
})

const statusSchema = z.object({
  type: z.literal('status'),
  value: z.enum(statusValues).optional().default('pending'),
  label: z.string().optional(),
  bind: bindStr,
})

const tableSchema = z.object({
  type: z.literal('table'),
  headers: z.array(z.string()),
  rows: z.array(z.array(z.string())),
  bindRows: bindStr,
})

const buttonGroupSchema = z.object({
  type: z.literal('buttonGroup'),
  buttons: z.array(
    z.object({
      actionId: z.string().min(1),
      label: z.string().min(1),
    }),
  ),
})

const metricSchema = z.object({
  type: z.literal('metric'),
  label: z.string().optional().default(''),
  value: z.string().optional().default(''),
  unit: z.string().optional(),
  bind: bindStr,
  bindLabel: bindStr,
})

const metricGridSchema = z.object({
  type: z.literal('metricGrid'),
  columns: z.union([z.literal(2), z.literal(3)]).optional().default(2),
  items: z.array(
    z.object({
      label: z.string().optional().default(''),
      value: z.string().optional().default(''),
      unit: z.string().optional(),
      bind: bindStr,
    }),
  ),
})

const progressSchema = z.object({
  type: z.literal('progress'),
  label: z.string().optional(),
  value: z.number().optional().default(0),
  max: z.number().optional().default(100),
  bind: bindStr,
  bindMax: bindStr,
})

const dividerSchema = z.object({
  type: z.literal('divider'),
})

const chartSeriesItemSchema = z.object({
  label: z.string(),
  value: z.number(),
})

const chartSchema = z.object({
  type: z.literal('chart'),
  variant: z.enum(chartVariants).optional().default('bar'),
  title: z.string().optional(),
  series: z.array(chartSeriesItemSchema).optional().default([]),
  bindSeries: bindStr,
})

type UiNode =
  | z.infer<typeof textSchema>
  | z.infer<typeof keyValueSchema>
  | z.infer<typeof statusSchema>
  | z.infer<typeof mediaSchema>
  | z.infer<typeof tableSchema>
  | z.infer<typeof buttonGroupSchema>
  | z.infer<typeof metricSchema>
  | z.infer<typeof metricGridSchema>
  | z.infer<typeof progressSchema>
  | z.infer<typeof dividerSchema>
  | z.infer<typeof chartSchema>
  | { type: 'stack'; children: UiNode[] }
  | { type: 'card'; children: UiNode[]; title?: string }

export const uiNodeSchema: z.ZodType<UiNode> = z.lazy(() =>
  z.discriminatedUnion('type', [
    textSchema,
    keyValueSchema,
    statusSchema,
    mediaSchema,
    tableSchema,
    buttonGroupSchema,
    metricSchema,
    metricGridSchema,
    progressSchema,
    dividerSchema,
    chartSchema,
    z.object({
      type: z.literal('stack'),
      children: z.array(uiNodeSchema),
    }),
    z.object({
      type: z.literal('card'),
      title: z.string().optional(),
      children: z.array(uiNodeSchema),
    }),
  ]),
)

export const uiDescSchema = z.object({
  version: z.literal(1),
  root: uiNodeSchema,
})

/** Runtime chat payloads: require filled media/src; binds optional (ignored). */
export function parseUiDesc(input: unknown) {
  return uiDescSchema.safeParse(input)
}

export function collectBindNames(
  node: unknown,
  out = new Set<string>(),
): Set<string> {
  if (!node || typeof node !== 'object') return out
  const record = node as Record<string, unknown>
  for (const key of [
    'bind',
    'bindSrc',
    'bindPayload',
    'bindEncoding',
    'bindLabel',
    'bindMax',
    'bindSeries',
    'bindRows',
  ] as const) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) out.add(value.trim())
  }
  if (Array.isArray(record.rows)) {
    for (const row of record.rows) {
      if (row && typeof row === 'object' && !Array.isArray(row)) {
        const bind = (row as Record<string, unknown>).bind
        if (typeof bind === 'string' && bind.trim()) out.add(bind.trim())
      }
    }
  }
  if (Array.isArray(record.items)) {
    for (const item of record.items) {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        const bind = (item as Record<string, unknown>).bind
        if (typeof bind === 'string' && bind.trim()) out.add(bind.trim())
      }
    }
  }
  if (Array.isArray(record.children)) {
    for (const child of record.children) collectBindNames(child, out)
  }
  return out
}
