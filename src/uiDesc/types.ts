import type { z } from 'zod'
import type { uiDescSchema, uiNodeSchema } from '#/uiDesc/schema'

export type ContentFormat = 'markdown' | 'ui' | 'openui'

export type UiDesc = z.infer<typeof uiDescSchema>
export type UiNode = z.infer<typeof uiNodeSchema>

export type UiActionHandler = (actionId: string, label: string) => void
