import type { UiDesc } from '#/uiDesc/types'
import { paymentQrTemplateDefinition } from '#/uiDesc/fixtures/paymentQr'
import { dataTableTemplateDefinition } from '#/uiDesc/fixtures/dataTable'
import { keyFactsTemplateDefinition } from '#/uiDesc/fixtures/keyFacts'
import { mediaCaptionTemplateDefinition } from '#/uiDesc/fixtures/mediaCaption'
import { statsOverviewTemplateDefinition } from '#/uiDesc/fixtures/statsOverview'

export type UiTemplateSample = {
  id: string
  label: string
  hint: string
  definition: UiDesc
}

export const uiTemplateSamples: UiTemplateSample[] = [
  {
    id: 'payment',
    label: 'Payment QR',
    hint: 'Status, QR, order details, actions',
    definition: paymentQrTemplateDefinition as UiDesc,
  },
  {
    id: 'table',
    label: 'Data table',
    hint: 'Title, table rows, refresh/export',
    definition: dataTableTemplateDefinition as UiDesc,
  },
  {
    id: 'summary',
    label: 'Key facts',
    hint: 'Status plus label/value binds',
    definition: keyFactsTemplateDefinition as UiDesc,
  },
  {
    id: 'media',
    label: 'Image + caption',
    hint: 'URL image with optional binds',
    definition: mediaCaptionTemplateDefinition as UiDesc,
  },
  {
    id: 'stats',
    label: 'Stats overview',
    hint: 'Metrics, progress, pie and bar charts',
    definition: statsOverviewTemplateDefinition as UiDesc,
  },
]
