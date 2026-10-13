import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  agentMarkdownToHtml,
  agentProseClassName,
} from '#/components/agentChat/agentChatMarkdown'
import { parseContentToBlocks } from '#/lib/contentReferences'
import { cn } from '#/lib/utils'
import { widgetPublicArticleMediaPath } from '#/lib/widget'
import { fetchArticleMediaObjectUrl } from '#/lib/article'
import { parseUiDesc, UiDescRenderer } from '#/uiDesc'

export type AgentChatImageRenderer = (props: {
  mediaId: string
  alt?: string
  darkMode: boolean
}) => ReactNode

function PublicAgentChatImage({
  publicKey,
  mediaId,
  alt,
  darkMode,
}: {
  publicKey: string
  mediaId: string
  alt?: string
  darkMode: boolean
}) {
  const [failed, setFailed] = useState(false)
  const src = widgetPublicArticleMediaPath(publicKey, mediaId)

  if (failed) {
    return (
      <p
        className={cn(
          'my-2 text-[11px]',
          darkMode ? 'text-neutral-500' : 'text-neutral-400',
        )}
      >
        Image unavailable
      </p>
    )
  }

  return (
    <img
      src={src}
      alt={alt ?? ''}
      className="my-2 h-auto max-h-56 w-full max-w-full rounded-lg object-contain"
      onError={() => setFailed(true)}
    />
  )
}

function AuthAgentChatImage({
  apiKeyId,
  mediaId,
  alt,
  darkMode,
}: {
  apiKeyId: string
  mediaId: string
  alt?: string
  darkMode: boolean
}) {
  const [src, setSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null

    void fetchArticleMediaObjectUrl(mediaId, apiKeyId)
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url)
          return
        }
        objectUrl = url
        setSrc(url)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [apiKeyId, mediaId])

  if (failed) {
    return (
      <p
        className={cn(
          'my-2 text-[11px]',
          darkMode ? 'text-neutral-500' : 'text-neutral-400',
        )}
      >
        Image unavailable
      </p>
    )
  }

  if (!src) {
    return (
      <p
        className={cn(
          'my-2 text-[11px]',
          darkMode ? 'text-neutral-500' : 'text-neutral-400',
        )}
      >
        Loading image…
      </p>
    )
  }

  return (
    <img
      src={src}
      alt={alt ?? ''}
      className="my-2 h-auto max-h-56 w-full max-w-full rounded-lg object-contain"
    />
  )
}

export function createPublicImageRenderer(
  publicKey: string,
): AgentChatImageRenderer {
  return function PublicImage({ mediaId, alt, darkMode }) {
    return (
      <PublicAgentChatImage
        publicKey={publicKey}
        mediaId={mediaId}
        alt={alt}
        darkMode={darkMode}
      />
    )
  }
}

export function createAuthImageRenderer(
  apiKeyId: string,
): AgentChatImageRenderer {
  return function AuthImage({ mediaId, alt, darkMode }) {
    return (
      <AuthAgentChatImage
        apiKeyId={apiKeyId}
        mediaId={mediaId}
        alt={alt}
        darkMode={darkMode}
      />
    )
  }
}

export default function AgentMessageBody({
  text,
  streaming,
  darkMode,
  renderImage,
  ui,
  onUiAction,
}: {
  text: string
  streaming: boolean
  darkMode: boolean
  renderImage: AgentChatImageRenderer
  ui?: unknown
  onUiAction?: (actionId: string) => void
}) {
  const blocks = useMemo(() => parseContentToBlocks(text), [text])
  const parsedUi = useMemo(() => {
    if (ui == null) return null
    const result = parseUiDesc(ui)
    return result.success ? result.data : null
  }, [ui])

  if (!text && !parsedUi) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1',
          darkMode ? 'text-neutral-400' : 'text-neutral-500',
        )}
      >
        {streaming ? (
          <>
            <span className="size-1.5 animate-pulse rounded-full bg-current" />
            <span className="size-1.5 animate-pulse rounded-full bg-current [animation-delay:120ms]" />
            <span className="size-1.5 animate-pulse rounded-full bg-current [animation-delay:240ms]" />
          </>
        ) : null}
      </span>
    )
  }

  return (
    <div className="min-w-0 max-w-full space-y-1">
      {text
        ? blocks.map((block, index) => {
            if (block.type === 'image') {
              return (
                <div key={`img-${block.id}-${index}`}>
                  {renderImage({
                    mediaId: block.id,
                    alt: block.alt,
                    darkMode,
                  })}
                </div>
              )
            }

            if (
              block.type === 'topic' ||
              block.type === 'tool' ||
              block.type === 'tool_variable'
            ) {
              // Hide unresolved reference tokens (customer + test parity).
              return null
            }

            if (block.type !== 'text') {
              return null
            }

            const html = agentMarkdownToHtml(block.content)
            if (!html) return null
            return (
              <div
                key={`text-${index}`}
                className={agentProseClassName(darkMode)}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            )
          })
        : null}
      {parsedUi ? (
        <UiDescRenderer
          root={parsedUi.root}
          darkMode={darkMode}
          onAction={(actionId) => onUiAction?.(actionId)}
        />
      ) : null}
    </div>
  )
}
