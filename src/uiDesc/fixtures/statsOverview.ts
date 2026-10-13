/** Sample: metrics grid, progress, pie + bar charts. */
export const statsOverviewTemplateDefinition = {
  version: 1 as const,
  root: {
    type: 'card' as const,
    title: 'Usage overview',
    children: [
      {
        type: 'metricGrid' as const,
        columns: 2 as const,
        items: [
          { label: 'Requests', value: '12.4k', bind: 'requests' },
          { label: 'Active users', value: '860', bind: 'users' },
          { label: 'Error rate', value: '0.4', unit: '%', bind: 'errorRate' },
          { label: 'Latency p95', value: '180', unit: 'ms', bind: 'latency' },
        ],
      },
      { type: 'divider' as const },
      {
        type: 'progress' as const,
        label: 'Plan quota',
        value: 72,
        max: 100,
        bind: 'quotaUsed',
        bindMax: 'quotaMax',
      },
      { type: 'divider' as const },
      {
        type: 'chart' as const,
        variant: 'pie' as const,
        title: 'Traffic by channel',
        series: [
          { label: 'Widget', value: 48 },
          { label: 'API', value: 32 },
          { label: 'Email', value: 20 },
        ],
        bindSeries: 'channels',
      },
      {
        type: 'chart' as const,
        variant: 'bar' as const,
        title: 'Last 7 days',
        series: [
          { label: 'Mon', value: 40 },
          { label: 'Tue', value: 55 },
          { label: 'Wed', value: 48 },
          { label: 'Thu', value: 70 },
          { label: 'Fri', value: 62 },
          { label: 'Sat', value: 35 },
          { label: 'Sun', value: 28 },
        ],
        bindSeries: 'daily',
      },
    ],
  },
}
