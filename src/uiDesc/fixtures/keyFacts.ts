/** Sample: status + label/value facts with bind slots. */
export const keyFactsTemplateDefinition = {
  version: 1 as const,
  root: {
    type: 'card' as const,
    title: 'Summary',
    children: [
      {
        type: 'status' as const,
        value: 'pending' as const,
        label: 'In progress',
        bind: 'status',
      },
      {
        type: 'keyValue' as const,
        rows: [
          { label: 'Reference', value: '', bind: 'reference' },
          { label: 'Customer', value: '', bind: 'customer' },
          { label: 'Total', value: '', bind: 'total' },
        ],
      },
    ],
  },
}
