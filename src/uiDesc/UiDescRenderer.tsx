import type { UiActionHandler, UiNode } from '#/uiDesc/types'
import {
  UiButtonGroup,
  UiCard,
  UiChart,
  UiDivider,
  UiKeyValue,
  UiMedia,
  UiMetric,
  UiMetricGrid,
  UiProgress,
  UiStack,
  UiStatusBadge,
  UiTable,
  UiText,
} from '#/uiDesc/primitives'

function renderNode(
  node: UiNode,
  darkMode: boolean,
  onAction: UiActionHandler | undefined,
  key: string,
): React.ReactNode {
  switch (node.type) {
    case 'stack':
      return (
        <UiStack key={key} darkMode={darkMode}>
          {node.children.map((child, index) =>
            renderNode(child, darkMode, onAction, `${key}.${index}`),
          )}
        </UiStack>
      )
    case 'card':
      return (
        <UiCard key={key} title={node.title} darkMode={darkMode}>
          {node.children.map((child, index) =>
            renderNode(child, darkMode, onAction, `${key}.${index}`),
          )}
        </UiCard>
      )
    case 'text':
      return (
        <UiText
          key={key}
          content={node.content}
          tone={node.tone}
          darkMode={darkMode}
        />
      )
    case 'keyValue':
      return <UiKeyValue key={key} rows={node.rows} darkMode={darkMode} />
    case 'status':
      return (
        <UiStatusBadge
          key={key}
          value={node.value}
          label={node.label}
          darkMode={darkMode}
        />
      )
    case 'media':
      if (node.kind === 'payload') {
        return (
          <UiMedia
            key={key}
            kind="payload"
            payload={node.payload}
            encoding={node.encoding}
            mimeType={node.mimeType}
            alt={node.alt}
            darkMode={darkMode}
          />
        )
      }
      return (
        <UiMedia
          key={key}
          kind={node.kind}
          src={node.src}
          alt={node.alt}
          darkMode={darkMode}
        />
      )
    case 'table':
      return (
        <UiTable
          key={key}
          headers={node.headers}
          rows={node.rows}
          darkMode={darkMode}
        />
      )
    case 'buttonGroup':
      return (
        <UiButtonGroup
          key={key}
          buttons={node.buttons}
          darkMode={darkMode}
          onAction={onAction}
        />
      )
    case 'metric':
      return (
        <UiMetric
          key={key}
          label={node.label ?? ''}
          value={node.value ?? ''}
          unit={node.unit}
          darkMode={darkMode}
        />
      )
    case 'metricGrid':
      return (
        <UiMetricGrid
          key={key}
          items={node.items ?? []}
          columns={node.columns}
          darkMode={darkMode}
        />
      )
    case 'progress':
      return (
        <UiProgress
          key={key}
          label={node.label}
          value={node.value ?? 0}
          max={node.max ?? 100}
          darkMode={darkMode}
        />
      )
    case 'divider':
      return <UiDivider key={key} darkMode={darkMode} />
    case 'chart':
      return (
        <UiChart
          key={key}
          variant={node.variant ?? 'bar'}
          title={node.title}
          series={node.series ?? []}
          darkMode={darkMode}
        />
      )
    default:
      return null
  }
}

export default function UiDescRenderer({
  root,
  darkMode,
  onAction,
}: {
  root: UiNode
  darkMode: boolean
  onAction?: UiActionHandler
}) {
  return (
    <div className="mt-2 min-w-0 max-w-full">
      {renderNode(root, darkMode, onAction, 'root')}
    </div>
  )
}
