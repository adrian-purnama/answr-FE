/** Sample: rows of data with optional actions. */
export const dataTableTemplateDefinition = {
  version: 1 as const,
  root: {
    type: 'card' as const,
    title: 'Results',
    children: [
      {
        type: 'text' as const,
        content: 'Matching records',
        tone: 'muted' as const,
      },
      {
        type: 'table' as const,
        headers: ['Name', 'Status', 'Updated'],
        rows: [
          ['Acme Corp', 'Active', '2026-03-01'],
          ['Beta LLC', 'Pending', '2026-03-10'],
        ],
      },
      {
        type: 'buttonGroup' as const,
        buttons: [
          { actionId: 'Refresh', label: 'Refresh' },
          { actionId: 'Export', label: 'Export' },
        ],
      },
    ],
  },
}
