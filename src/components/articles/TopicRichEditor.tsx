import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type FocusEvent as ReactFocusEvent,
  type MouseEvent as ReactMouseEvent,
  type Ref,
} from 'react'
import 'react-quill-new/dist/quill.snow.css'
import toast from 'react-hot-toast'
import {
  CaseUpper,
  Braces,
  FunctionSquare,
  Image as ImageIcon,
  TextCursorInput,
  Trash2,
  Waypoints,
} from 'lucide-react'
import {
  fetchArticleMediaObjectUrl,
  ingestArticleMedia,
  loadTopicRefLookup,
  MAX_TOPIC_IMAGE_BYTES,
  topicContentToEditorBlocks,
  type TopicContentBlock,
  type TopicContentSavePayload,
} from '#/lib/article'
import {
  countImagesInEditorHtml,
  editorBlocksToHtml,
  editorHtmlToSavePayload,
  reconcileSavePayloadWithEditorDelta,
  topicContentToHtml,
  type ImageSrcMeta,
} from '#/lib/articleContent'
import TopicReferencePicker from '#/components/guidance/TopicReferencePicker'
import ToolReferencePicker, {
  type ToolInsertPayload,
} from '#/components/guidance/ToolReferencePicker'
import VariableReferencePicker, {
  type VariableInsertPayload,
} from '#/components/guidance/VariableReferencePicker'
import {
  formatToolRef,
  formatTopicRef,
  parseContentToBlocks,
  serializeContentBlocks,
} from '#/lib/contentReferences'
import { loadReferenceToolTitles } from '#/lib/liveAgent'
import {
  registerTopicRefBlot,
  shortTopicLabel,
  TOPIC_CHIP_CSS,
  TOPIC_REF_BLOT,
  type TopicRefValue,
} from '#/lib/quillTopicRef'
import {
  aliasToToolNameFromContent,
  applyRefChipStatus,
  attachRefChipSelection,
  attachToolRefClipboardMatchers,
  hydrateContentRefsInEditor,
  registerToolRefBlot,
  registerToolVariableRefBlot,
  serializeRefsDeltaToPlainText,
  shortToolLabel,
  shortVariableLabel,
  REF_CHIP_STATUS_CSS,
  TOOL_CHIP_CSS,
  TOOL_REF_BLOT,
  TOOL_VARIABLE_CHIP_CSS,
  TOOL_VARIABLE_REF_BLOT,
  type ToolRefValue,
  type ToolVariableRefValue,
} from '#/lib/quillToolRef'
import { attachPastedImageIngest } from '#/lib/quillPasteImages'
import Modal from '#/components/ui/Modal'
import {
  buttonClassName,
  buttonOutlineClassName,
} from '#/lib/ui-classes'
import { cn } from '#/lib/utils'

const TOOLBAR = [
  ['bold', 'italic'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['link', 'image'],
  ['clean'],
]

type QuillEditorApi = {
  getSelection: (focus?: boolean) => { index: number; length: number } | null
  getLength: () => number
  getText: (index?: number, length?: number) => string
  getContents: () => { ops?: Array<{ insert?: string | Record<string, unknown> }> }
  getIndex: (blot: unknown) => number
  deleteText: (index: number, length: number, source?: string) => void
  insertEmbed: (index: number, type: string, value: unknown, source?: string) => void
  insertText: (index: number, text: string, source?: string) => void
  setContents: (
    delta: { ops?: Array<{ insert?: string | Record<string, unknown> }> },
    source?: string,
  ) => void
  setSelection: (index: number, length?: number, source?: string) => void
  focus: () => void
  root: HTMLElement
  on: (event: 'text-change', handler: (...args: unknown[]) => void) => void
  off: (event: 'text-change', handler: (...args: unknown[]) => void) => void
  clipboard: {
    addMatcher: (
      selector: string | number,
      matcher: (node: Node, delta: unknown) => unknown,
    ) => void
  }
}

type ReactQuillHandle = {
  getEditor: () => QuillEditorApi
}

type QuillProps = {
  theme?: string
  defaultValue?: string
  modules?: Record<string, unknown>
  formats?: string[]
  placeholder?: string
  onChange?: (value: string) => void
}

type TopicRichEditorProps = {
  content: TopicContentBlock[]
  contentKey: string
  apiKeyId: string
  /** Optional article ownership context for ingested media metadata. */
  articleId?: string
  maxImages: number
  maxCharacters: number
  canEdit?: boolean
  placeholder?: string
  /** Hide this topic from the insert-topic picker (current article topic). */
  excludeTopicId?: string
  onSave: (payload: TopicContentSavePayload) => void
  onImageLimit?: () => void
  onImageTooLarge?: () => void
  onCharacterLimit?: () => void
  className?: string
}

type SelectedImage = {
  img: HTMLImageElement
  top: number
  right: number
}

const TOPIC_BODY_HTML_CLASS = cn(
  'max-w-none text-sm leading-relaxed text-[var(--ink)]',
  '[&_a]:break-all [&_a]:underline [&_a]:underline-offset-2',
  '[&_strong]:font-semibold [&_em]:italic',
  '[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5',
  '[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5',
  '[&_li]:my-1 [&_p]:mb-3 last:[&_p]:mb-0',
)

function escapeHtmlText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function chipIconHtml(iconClass: string, paths: string): string {
  return `<span class="${iconClass}" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg></span>`
}

const WAYPOINTS_PATHS =
  '<circle cx="12" cy="4.5" r="2.5"/><path d="m10.2 6.3-3.9 3.9"/><circle cx="4.5" cy="12" r="2.5"/><path d="M7 12h10"/><circle cx="19.5" cy="12" r="2.5"/><path d="m13.8 17.7 3.9-3.9"/><circle cx="12" cy="19.5" r="2.5"/>'
const FUNCTION_PATHS =
  '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 17c2 0 2.5-1 2.5-2.5V9.5C11.5 8 12 7 14 7"/><path d="M9 11h4"/>'
const BRACES_PATHS =
  '<path d="M8 3H7a2 2 0 0 0-2 2v3a2 2 0 0 1-2 2 2 2 0 0 1 2 2v3c0 1.1.9 2 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-3a2 2 0 0 1 2-2 2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/>'

function topicContentToDisplayHtml(
  content: string,
  opts: {
    topicNames: Map<string, string>
    enabledTopicIds: Set<string>
    toolTitles: Map<string, string>
  },
): string {
  const html = topicContentToHtml(content)
  if (!html) return ''

  const aliasToFrom = new Map<string, string>()
  const aliasToToolName = aliasToToolNameFromContent(content)
  for (const part of parseContentToBlocks(content)) {
    if (part.type === 'tool' && part.as) {
      aliasToFrom.set(
        part.as.toLowerCase(),
        opts.toolTitles.get(part.name.toLowerCase()) ?? part.name,
      )
    }
  }

  return html.replace(/\{\{[^}]+\}\}/g, (token) => {
    const part = parseContentToBlocks(token)[0]
    if (!part || part.type === 'text' || part.type === 'image') {
      return escapeHtmlText(token)
    }
    if (part.type === 'topic') {
      const name = opts.topicNames.get(part.id.toLowerCase()) ?? part.id
      const enabled = opts.enabledTopicIds.has(part.id.toLowerCase())
      const status = enabled ? 'ql-ref-chip--enabled' : 'ql-ref-chip--disabled'
      const label = escapeHtmlText(shortTopicLabel(part.id, name))
      return `<span class="ql-topic-ref ${status}" title="${escapeHtmlText(formatTopicRef(part.id))}"><span class="ql-topic-ref-inner">${chipIconHtml('ql-topic-ref-icon', WAYPOINTS_PATHS)}<span class="ql-topic-ref-label">${label}</span></span></span>`
    }
    if (part.type === 'tool') {
      const title = opts.toolTitles.get(part.name.toLowerCase()) ?? part.name
      const enabled = opts.toolTitles.has(part.name.toLowerCase())
      const status = enabled ? 'ql-ref-chip--enabled' : 'ql-ref-chip--disabled'
      const label = escapeHtmlText(shortToolLabel(part.name, title))
      return `<span class="ql-tool-ref ${status}" title="${escapeHtmlText(formatToolRef(part.name, part.as))}"><span class="ql-tool-ref-inner">${chipIconHtml('ql-tool-ref-icon', FUNCTION_PATHS)}<span class="ql-tool-ref-label">${label}</span></span></span>`
    }
    if (part.type === 'tool_variable') {
      const from = aliasToFrom.get(part.ref.toLowerCase()) ?? part.ref
      const toolName =
        aliasToToolName.get(part.ref.toLowerCase())?.toLowerCase() ?? ''
      const enabled = Boolean(toolName && opts.toolTitles.has(toolName))
      const status = enabled ? 'ql-ref-chip--enabled' : 'ql-ref-chip--disabled'
      const label = escapeHtmlText(shortVariableLabel(part.variable))
      const title = escapeHtmlText(`${part.variable} · from ${from}`)
      return `<span class="ql-tool-var-ref ${status}" title="${title}"><span class="ql-tool-var-ref-inner">${chipIconHtml('ql-tool-var-ref-icon', BRACES_PATHS)}<span class="ql-tool-var-ref-label">${label}</span></span></span>`
    }
    return escapeHtmlText(serializeContentBlocks([part]))
  })
}

function AuthImage({
  mediaId,
  apiKeyId,
  alt = '',
  className,
}: {
  mediaId: string
  apiKeyId: string
  alt?: string
  className?: string
}) {
  const [src, setSrc] = useState<string | null>(null)

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
        if (!cancelled) setSrc(null)
      })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [mediaId, apiKeyId])

  if (!src) {
    return (
      <div
        className={cn(
          'flex h-40 items-center justify-center bg-[var(--surface)] text-xs text-[var(--muted)]',
          className,
        )}
      >
        Loading…
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      className={cn('max-h-80 w-full object-contain', className)}
    />
  )
}

function ReadOnlyBlocks({
  blocks,
  apiKeyId,
  emptyLabel,
  className,
}: {
  blocks: TopicContentBlock[]
  apiKeyId: string
  emptyLabel: string
  className?: string
}) {
  const [toolTitles, setToolTitles] = useState<Map<string, string>>(
    () => new Map(),
  )
  const [topicNames, setTopicNames] = useState<Map<string, string>>(
    () => new Map(),
  )
  const [enabledTopicIds, setEnabledTopicIds] = useState<Set<string>>(
    () => new Set(),
  )

  useEffect(() => {
    let cancelled = false
    void loadReferenceToolTitles(apiKeyId).then((next) => {
      if (!cancelled) setToolTitles(next)
    })
    return () => {
      cancelled = true
    }
  }, [apiKeyId])

  useEffect(() => {
    let cancelled = false
    void loadTopicRefLookup(apiKeyId).then(({ names, enabledIds }) => {
      if (cancelled) return
      setTopicNames(names)
      setEnabledTopicIds(enabledIds)
    })
    return () => {
      cancelled = true
    }
  }, [apiKeyId])

  if (blocks.length === 0) {
    return (
      <p className={cn('text-sm text-[var(--muted)]', className)}>{emptyLabel}</p>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      <style>{TOPIC_CHIP_CSS}</style>
      <style>{TOOL_CHIP_CSS}</style>
      <style>{TOOL_VARIABLE_CHIP_CSS}</style>
      <style>{REF_CHIP_STATUS_CSS}</style>
      {blocks.map((block, index) => {
        if (block.type === 'text') {
          const html = topicContentToDisplayHtml(block.content, {
            topicNames,
            enabledTopicIds,
            toolTitles,
          })
          if (!html) return null
          return (
            <div
              key={`t-${index}`}
              className={TOPIC_BODY_HTML_CLASS}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )
        }
        return (
          <div
            key={`i-${block.mediaId}-${index}`}
            className="overflow-hidden rounded-md border border-[var(--line)] bg-[var(--surface)]"
          >
            <AuthImage
              mediaId={block.mediaId}
              apiKeyId={apiKeyId}
              alt={block.alt ?? ''}
            />
          </div>
        )
      })}
    </div>
  )
}

function quillPlainTextLength(editor: QuillEditorApi): number {
  // Quill always appends a trailing newline in getText().
  const text = editor.getText()
  return text.endsWith('\n') ? text.length - 1 : text.length
}

function countCharactersFromBlocks(blocks: TopicContentBlock[]): number {
  let total = 0
  for (const block of blocks) {
    if (block.type === 'text') total += block.content.length
  }
  return total
}

function nextFileKey(draftFiles: Map<string, File>): string {
  let max = -1
  for (const key of draftFiles.keys()) {
    const match = /^img(\d+)$/.exec(key)
    if (match) max = Math.max(max, Number(match[1]))
  }
  return `img${max + 1}`
}

/** Quill only allows http/https/data by default    blob: becomes //:0 without this. */
let blobImagesAllowed = false
function allowBlobImageSrc(QuillStatic: {
  import: (path: string) => { sanitize?: (url: string) => string }
}) {
  if (blobImagesAllowed) return
  const Image = QuillStatic.import('formats/image')
  const previous = Image.sanitize?.bind(Image)
  Image.sanitize = (url: string) => {
    if (typeof url === 'string' && url.startsWith('blob:')) return url
    return previous ? previous(url) : url
  }
  blobImagesAllowed = true
}

function findQuillBlot(
  QuillStatic: { find: (node: Node, bubble?: boolean) => unknown } | null,
  node: Node,
): unknown {
  if (QuillStatic) {
    try {
      return QuillStatic.find(node, true)
    } catch {
      // fall through
    }
  }
  let current: (Node & { __blot?: { blot?: unknown } }) | null = node
  while (current) {
    if (current.__blot?.blot) return current.__blot.blot
    current = current.parentNode as typeof current
  }
  return null
}

export default function TopicRichEditor({
  content,
  contentKey,
  apiKeyId,
  articleId,
  maxImages,
  maxCharacters,
  canEdit = false,
  placeholder = 'Type something…',
  excludeTopicId,
  onSave,
  onImageLimit,
  onImageTooLarge,
  onCharacterLimit,
  className,
}: TopicRichEditorProps) {
  const fileInputId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editorShellRef = useRef<HTMLDivElement>(null)
  const quillRef = useRef<ReactQuillHandle | null>(null)
  const draftFilesRef = useRef<Map<string, File>>(new Map())
  const draftUrlsRef = useRef<string[]>([])
  const imageMetaBySrcRef = useRef<Map<string, ImageSrcMeta>>(new Map())
  const htmlRef = useRef('<p><br></p>')
  const requestImageRef = useRef<() => void>(() => {})
  const contentRef = useRef(content)
  contentRef.current = content
  const matchersSessionRef = useRef<number | null>(null)
  const detachChipSelectionRef = useRef<(() => void) | null>(null)
  const detachPasteIngestRef = useRef<(() => void) | null>(null)
  const maxImagesRef = useRef(maxImages)
  maxImagesRef.current = maxImages
  const articleIdRef = useRef(articleId)
  articleIdRef.current = articleId
  const onImageLimitRef = useRef(onImageLimit)
  onImageLimitRef.current = onImageLimit
  const onImageTooLargeRef = useRef(onImageTooLarge)
  onImageTooLargeRef.current = onImageTooLarge
  const dirtyRef = useRef(false)
  const autosaveTimerRef = useRef<number | null>(null)
  const blurExitTimerRef = useRef<number | null>(null)
  const suppressDirtyRef = useRef(false)
  const savingInFlightRef = useRef(false)
  const onSaveRef = useRef(onSave)
  onSaveRef.current = onSave
  const editingRootRef = useRef<HTMLDivElement>(null)
  const editingRef = useRef(false)

  /** Optimistic read-only view after Done   parent `content` lags until save returns. */
  const [displayContent, setDisplayContent] = useState(content)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'dirty' | 'saving' | 'saved'>(
    'idle',
  )

  // Only re-sync read-only view when not editing. Autosave updates contentKey
  // while Quill is live   never overwrite the session from the parent response.
  useEffect(() => {
    if (editingRef.current) return
    setDisplayContent(contentRef.current)
  }, [contentKey])

  const [editing, setEditing] = useState(false)
  editingRef.current = editing
  const [editSession, setEditSession] = useState(0)
  const [Quill, setQuill] = useState<
    ComponentType<QuillProps & { ref?: Ref<ReactQuillHandle> }> | null
  >(null)
  const quillStaticRef = useRef<{
    find: (node: Node, bubble?: boolean) => unknown
    import: (path: string) => unknown
    register: (blot: unknown, suppressWarning?: boolean) => void
  } | null>(null)
  const [seedHtml, setSeedHtml] = useState('<p><br></p>')
  const [htmlReady, setHtmlReady] = useState(false)
  const [imageCount, setImageCount] = useState(0)
  const [toolTitles, setToolTitles] = useState<Map<string, string>>(
    () => new Map(),
  )
  const [characterCount, setCharacterCount] = useState(0)
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null)
  const [selectedAlt, setSelectedAlt] = useState('')
  const [altModalOpen, setAltModalOpen] = useState(false)
  const [altDraft, setAltDraft] = useState('')
  const [altModalSkipLabel, setAltModalSkipLabel] = useState(true)
  const [toolPickerOpen, setToolPickerOpen] = useState(false)
  const [variablePickerOpen, setVariablePickerOpen] = useState(false)
  const [topicPickerOpen, setTopicPickerOpen] = useState(false)
  const [topicNames, setTopicNames] = useState<Map<string, string>>(
    () => new Map(),
  )
  const [enabledTopicIds, setEnabledTopicIds] = useState<Set<string>>(
    () => new Set(),
  )
  const selectedImgRef = useRef<HTMLImageElement | null>(null)
  const overlayOpenRef = useRef(false)
  overlayOpenRef.current =
    altModalOpen || toolPickerOpen || variablePickerOpen || topicPickerOpen

  function syncImageCount(nextHtml: string) {
    htmlRef.current = nextHtml
    const nextCount = countImagesInEditorHtml(nextHtml)
    setImageCount((prev) => (prev === nextCount ? prev : nextCount))
  }

  function syncCountsFromEditor(editor?: QuillEditorApi | null) {
    const live = editor ?? quillRef.current?.getEditor()
    if (!live) return
    const nextChars = quillPlainTextLength(live)
    setCharacterCount((prev) => (prev === nextChars ? prev : nextChars))
    syncImageCount(live.root.innerHTML)
    applyRefChipStatus(live.root, {
      enabledTopicIds,
      enabledToolNames: new Set(toolTitles.keys()),
      aliasToToolName: aliasToToolNameFromContent(
        serializeRefsDeltaToPlainText(live.getContents()),
      ),
    })
  }

  requestImageRef.current = () => {
    const remaining = maxImages - countImagesInEditorHtml(htmlRef.current)
    if (remaining <= 0) {
      onImageLimit?.()
      return
    }
    fileInputRef.current?.click()
  }

  const modules = useMemo(
    () => ({
      toolbar: {
        container: TOOLBAR,
        handlers: {
          image: () => {
            requestImageRef.current()
          },
        },
      },
      clipboard: { matchVisual: false },
    }),
    [],
  )

  useEffect(() => {
    if (!canEdit) setEditing(false)
  }, [canEdit])

  useEffect(() => {
    // contentKey changes from our own autosave must not destroy the session.
    if (editing) return
    for (const url of draftUrlsRef.current) URL.revokeObjectURL(url)
    draftUrlsRef.current = []
    draftFilesRef.current.clear()
    imageMetaBySrcRef.current.clear()
    htmlRef.current = '<p><br></p>'
    setSeedHtml('<p><br></p>')
    setHtmlReady(false)
    setImageCount(0)
    setCharacterCount(0)
    if (selectedImgRef.current) {
      selectedImgRef.current.removeAttribute('data-selected')
      selectedImgRef.current = null
    }
    setSelectedImage(null)
    setSelectedAlt('')
    setAltModalOpen(false)
    setAltDraft('')
    setToolPickerOpen(false)
    setVariablePickerOpen(false)
    setTopicPickerOpen(false)
    dirtyRef.current = false
    setSaveStatus('idle')
    if (autosaveTimerRef.current !== null) {
      window.clearTimeout(autosaveTimerRef.current)
      autosaveTimerRef.current = null
    }
    // contentKey changes when the saved topic updates    do not depend on
    // `content` identity (parent rebuilds that array every render).
  }, [contentKey, editing])

  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current !== null) {
        window.clearTimeout(autosaveTimerRef.current)
      }
      if (blurExitTimerRef.current !== null) {
        window.clearTimeout(blurExitTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void loadReferenceToolTitles(apiKeyId).then((next) => {
      if (!cancelled) setToolTitles(next)
    })
    return () => {
      cancelled = true
    }
  }, [apiKeyId])

  useEffect(() => {
    let cancelled = false
    void loadTopicRefLookup(apiKeyId).then(({ names, enabledIds }) => {
      if (cancelled) return
      setTopicNames(names)
      setEnabledTopicIds(enabledIds)
    })
    return () => {
      cancelled = true
    }
  }, [apiKeyId])

  useEffect(() => {
    if (!altModalOpen) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeAltModal()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [altModalOpen])

  useEffect(() => {
    if (!editing || Quill) return
    let cancelled = false
    void import('react-quill-new').then((mod) => {
      if (cancelled) return
      const QuillStatic = mod as {
        Quill: Parameters<typeof allowBlobImageSrc>[0] & {
          find: (node: Node, bubble?: boolean) => unknown
        }
      }
      if (QuillStatic.Quill) {
        allowBlobImageSrc(QuillStatic.Quill)
        registerTopicRefBlot(
          QuillStatic.Quill as unknown as Parameters<
            typeof registerTopicRefBlot
          >[0],
        )
        registerToolRefBlot(
          QuillStatic.Quill as unknown as Parameters<
            typeof registerToolRefBlot
          >[0],
        )
        registerToolVariableRefBlot(
          QuillStatic.Quill as unknown as Parameters<
            typeof registerToolVariableRefBlot
          >[0],
        )
        quillStaticRef.current = QuillStatic.Quill as typeof quillStaticRef.current
      }
      setQuill(
        () =>
          mod.default as ComponentType<
            QuillProps & { ref?: Ref<ReactQuillHandle> }
          >,
      )
    })
    return () => {
      cancelled = true
    }
  }, [editing, Quill])

  // Seed once per edit session; remount Quill via editSession key (uncontrolled).
  // Do not re-seed on contentKey while editing   autosave updates must not wipe drafts.
  useEffect(() => {
    if (!editing) return
    let cancelled = false
    const objectUrls: string[] = []

    async function seed() {
      setHtmlReady(false)
      setSelectedImage(null)
      setSelectedAlt('')
      setAltModalOpen(false)
      setAltDraft('')
      imageMetaBySrcRef.current.clear()
      draftFilesRef.current.clear()
      dirtyRef.current = false
      setSaveStatus('idle')

      const snapshot = contentRef.current
      const srcByMediaId = new Map<string, string>()
      const mediaIds = snapshot
        .filter(
          (b): b is Extract<TopicContentBlock, { type: 'image' }> =>
            b.type === 'image',
        )
        .map((b) => b.mediaId)

      await Promise.all(
        mediaIds.map(async (mediaId) => {
          try {
            const src = await fetchArticleMediaObjectUrl(mediaId, apiKeyId)
            objectUrls.push(src)
            srcByMediaId.set(mediaId, src)
            imageMetaBySrcRef.current.set(src, { mediaId })
          } catch {
            // skip unloadable images
          }
        }),
      )

      if (cancelled) {
        for (const url of objectUrls) URL.revokeObjectURL(url)
        return
      }

      draftUrlsRef.current.push(...objectUrls)
      const nextHtml = editorBlocksToHtml(snapshot, srcByMediaId)
      htmlRef.current = nextHtml
      setSeedHtml(nextHtml)
      setImageCount(countImagesInEditorHtml(nextHtml))
      setCharacterCount(countCharactersFromBlocks(snapshot))
      suppressDirtyRef.current = true
      setEditSession((n) => n + 1)
      setHtmlReady(true)
    }

    void seed()
    return () => {
      cancelled = true
    }
  }, [editing, apiKeyId])

  useEffect(() => {
    return () => {
      for (const url of draftUrlsRef.current) URL.revokeObjectURL(url)
    }
  }, [])

  // After uncontrolled mount, repair images and hydrate leftover {{tool}} text.
  // Matchers + chip click-to-select + paste image ingest attach once per edit session.
  useEffect(() => {
    if (!editing || !htmlReady || !Quill) return
    suppressDirtyRef.current = true
    const frame = requestAnimationFrame(() => {
      const editor = quillRef.current?.getEditor()
      if (!editor) return
      restoreBrokenImageSrcs(editor.root)
      if (
        quillStaticRef.current &&
        matchersSessionRef.current !== editSession
      ) {
        attachToolRefClipboardMatchers(
          editor as unknown as Parameters<
            typeof attachToolRefClipboardMatchers
          >[0],
          quillStaticRef.current,
        )
        detachChipSelectionRef.current?.()
        detachChipSelectionRef.current = attachRefChipSelection(
          editor as unknown as Parameters<typeof attachRefChipSelection>[0],
          quillStaticRef.current,
        )
        detachPasteIngestRef.current?.()
        detachPasteIngestRef.current = attachPastedImageIngest(
          editor,
          (img) => ingestPastedImage(img),
        )
        matchersSessionRef.current = editSession
      }
      // Early-returns when there is no leftover {{…}} text   safe on toolTitles updates.
      hydrateContentRefsInEditor(
        editor as unknown as Parameters<typeof hydrateContentRefsInEditor>[0],
        topicNames,
        toolTitles,
      )
      syncCountsFromEditor(editor)
      // Quill may emit onChange during mount/hydrate   don't treat as user edits.
      window.setTimeout(() => {
        suppressDirtyRef.current = false
      }, 50)
    })
    return () => cancelAnimationFrame(frame)
  }, [editing, htmlReady, Quill, editSession, toolTitles, topicNames, enabledTopicIds])

  async function ingestPastedImage(img: HTMLImageElement) {
    const editor = quillRef.current?.getEditor()
    if (!editor || !editor.root.contains(img)) return

    const ownedCount = countImagesInEditorHtml(editor.root.innerHTML)
    // Current img is already in the DOM; limit is max total images.
    if (ownedCount > maxImagesRef.current) {
      img.remove()
      onImageLimitRef.current?.()
      syncCountsFromEditor(editor)
      return
    }

    const src = img.getAttribute('src')?.trim() ?? ''
    if (!src) {
      img.remove()
      return
    }

    try {
      let response: Awaited<ReturnType<typeof ingestArticleMedia>>

      if (src.startsWith('http://') || src.startsWith('https://')) {
        response = await ingestArticleMedia(apiKeyId, {
          url: src,
          articleId: articleIdRef.current,
        })
      } else if (src.startsWith('data:') || src.startsWith('blob:')) {
        const blob = await fetch(src).then((r) => r.blob())
        if (!blob.type.startsWith('image/')) {
          img.remove()
          toast.error('Only image uploads are allowed')
          syncCountsFromEditor(editor)
          return
        }
        if (blob.size > MAX_TOPIC_IMAGE_BYTES) {
          img.remove()
          onImageTooLargeRef.current?.()
          syncCountsFromEditor(editor)
          return
        }
        const ext = blob.type.split('/')[1] || 'png'
        const file = new File([blob], `paste.${ext}`, {
          type: blob.type || 'image/png',
        })
        response = await ingestArticleMedia(apiKeyId, {
          file,
          articleId: articleIdRef.current,
        })
      } else {
        img.remove()
        syncCountsFromEditor(editor)
        return
      }

      if (!response.success || !response.data?.mediaId) {
        img.remove()
        const message = response.message || 'Failed to save pasted image'
        if (/5MB|smaller|too large/i.test(message)) {
          onImageTooLargeRef.current?.()
        } else if (/limit/i.test(message)) {
          onImageLimitRef.current?.()
        } else {
          toast.error(message)
        }
        syncCountsFromEditor(editor)
        return
      }

      if (!editor.root.contains(img)) return

      const mediaId = response.data.mediaId
      const objectUrl = await fetchArticleMediaObjectUrl(mediaId, apiKeyId)
      draftUrlsRef.current.push(objectUrl)
      imageMetaBySrcRef.current.set(objectUrl, { mediaId })
      img.setAttribute('src', objectUrl)
      img.setAttribute('data-media-id', mediaId)
      img.removeAttribute('data-file-key')
      img.dataset.ingestDone = 'true'
      markDirty()
      syncCountsFromEditor(editor)
    } catch (error) {
      if (editor.root.contains(img)) img.remove()
      const message =
        error instanceof Error ? error.message : 'Failed to save pasted image'
      if (/5MB|smaller|too large/i.test(message)) {
        onImageTooLargeRef.current?.()
      } else {
        toast.error(message)
      }
      syncCountsFromEditor(editor)
    }
  }

  function restoreBrokenImageSrcs(root: HTMLElement) {
    const broken = root.querySelectorAll(
      'img[src="//:0"], img[src=""], img:not([src])',
    )
    for (const img of broken) {
      const mediaId = img.getAttribute('data-media-id')
      const fileKey = img.getAttribute('data-file-key')
      let restored: string | null = null
      for (const [src, meta] of imageMetaBySrcRef.current) {
        if (mediaId && meta.mediaId === mediaId) {
          restored = src
          break
        }
        if (fileKey && meta.fileKey === fileKey) {
          restored = src
          break
        }
      }
      if (restored) img.setAttribute('src', restored)
    }
  }

  function clearSelectedImage() {
    if (selectedImgRef.current) {
      selectedImgRef.current.removeAttribute('data-selected')
      selectedImgRef.current = null
    }
    setSelectedImage(null)
    setSelectedAlt('')
    setAltModalOpen(false)
    setAltDraft('')
  }

  function selectImageElement(img: HTMLImageElement) {
    const shell = editorShellRef.current
    if (!shell || !shell.contains(img)) {
      clearSelectedImage()
      return
    }
    if (selectedImgRef.current && selectedImgRef.current !== img) {
      selectedImgRef.current.removeAttribute('data-selected')
    }
    img.setAttribute('data-selected', 'true')
    selectedImgRef.current = img
    const shellRect = shell.getBoundingClientRect()
    const imgRect = img.getBoundingClientRect()
    setSelectedImage({
      img,
      top: imgRect.top - shellRect.top + 8,
      right: shellRect.right - imgRect.right + 8,
    })
    setSelectedAlt(img.getAttribute('alt') ?? img.alt ?? '')
  }

  function selectImageFromEvent(event: ReactMouseEvent) {
    const target = event.target as HTMLElement | null
    if (!target?.closest) return
    const img = target.closest('img') as HTMLImageElement | null
    const shell = editorShellRef.current
    if (!img || !shell || !shell.contains(img)) {
      clearSelectedImage()
      return
    }
    event.preventDefault()
    event.stopPropagation()
    selectImageElement(img)
  }

  function openAltModal() {
    const current = selectedImgRef.current?.getAttribute('alt') ?? selectedAlt
    setAltDraft(current)
    setAltModalSkipLabel(!current.trim())
    overlayOpenRef.current = true
    setAltModalOpen(true)
  }

  function saveAltFromModal() {
    const next = altDraft.trim().slice(0, 200)
    setSelectedAlt(next)
    const img = selectedImgRef.current
    if (img) {
      img.setAttribute('alt', next)
      img.alt = next
    }
    setAltModalOpen(false)
    markDirty()
  }

  function closeAltModal() {
    setAltModalOpen(false)
    setAltDraft('')
    overlayOpenRef.current =
      toolPickerOpen || variablePickerOpen || topicPickerOpen
  }

  function deleteSelectedImage() {
    const editor = quillRef.current?.getEditor()
    const img = selectedImage?.img
    if (!editor || !img || !editor.root.contains(img)) {
      clearSelectedImage()
      return
    }

    const blot = findQuillBlot(quillStaticRef.current, img)
    if (blot) {
      try {
        const index = editor.getIndex(blot)
        editor.deleteText(index, 1, 'user')
      } catch {
        img.remove()
      }
    } else {
      img.remove()
    }

    const src = img.getAttribute('src')
    if (src) {
      const meta = imageMetaBySrcRef.current.get(src)
      if (meta?.fileKey) {
        draftFilesRef.current.delete(meta.fileKey)
      }
      imageMetaBySrcRef.current.delete(src)
      if (src.startsWith('blob:')) {
        URL.revokeObjectURL(src)
        draftUrlsRef.current = draftUrlsRef.current.filter((u) => u !== src)
      }
    }

    clearSelectedImage()
    syncCountsFromEditor(editor)
    editor.focus()
    markDirty()
  }

  function insertImages(fileList: FileList | null) {
    if (!fileList?.length) return
    const editor = quillRef.current?.getEditor()
    if (!editor) return

    const remaining = maxImages - countImagesInEditorHtml(htmlRef.current)
    if (remaining <= 0) {
      onImageLimit?.()
      return
    }

    const range = editor.getSelection(true)
    let index = range?.index ?? Math.max(0, editor.getLength() - 1)
    let inserted = 0
    let lastImg: HTMLImageElement | null = null

    for (const file of Array.from(fileList)) {
      if (!file.type.startsWith('image/')) continue
      if (file.size > MAX_TOPIC_IMAGE_BYTES) {
        onImageTooLarge?.()
        continue
      }
      if (inserted >= remaining) {
        onImageLimit?.()
        break
      }

      const fileKey = nextFileKey(draftFilesRef.current)
      const previewUrl = URL.createObjectURL(file)
      draftUrlsRef.current.push(previewUrl)
      draftFilesRef.current.set(fileKey, file)
      imageMetaBySrcRef.current.set(previewUrl, { fileKey })

      editor.insertEmbed(index, 'image', previewUrl)
      const img = editor.root.querySelector(
        `img[src="${CSS.escape(previewUrl)}"]`,
      ) as HTMLImageElement | null
      img?.setAttribute('data-file-key', fileKey)
      img?.setAttribute('alt', '')
      if (img) lastImg = img

      index += 1
      inserted += 1
    }

    restoreBrokenImageSrcs(editor.root)
    editor.setSelection(index, 0)
    editor.focus()
    syncCountsFromEditor(editor)

    if (lastImg) {
      // Let layout settle so trash/alt positioning matches the image.
      requestAnimationFrame(() => {
        selectImageElement(lastImg)
        openAltModal()
      })
    } else {
      clearSelectedImage()
    }
    markDirty()
  }

  function buildSavePayload(): TopicContentSavePayload | null {
    const editor = quillRef.current?.getEditor()
    if (editor) {
      const chars = quillPlainTextLength(editor)
      if (chars > maxCharacters) {
        onCharacterLimit?.()
        return null
      }
    }
    const liveHtml = editor?.root.innerHTML ?? htmlRef.current
    const deltaPlain = editor
      ? serializeRefsDeltaToPlainText(editor.getContents())
      : ''
    const htmlPayload = editorHtmlToSavePayload(
      liveHtml,
      draftFilesRef.current,
      imageMetaBySrcRef.current,
    )
    return reconcileSavePayloadWithEditorDelta(htmlPayload, deltaPlain)
  }

  function payloadToOptimisticBlocks(
    payload: TopicContentSavePayload,
  ): TopicContentBlock[] {
    const optimistic: TopicContentBlock[] = []
    for (const block of payload.blocks) {
      if (block.type === 'text') {
        optimistic.push(...topicContentToEditorBlocks(block.content))
        continue
      }
      if ('mediaId' in block && block.mediaId) {
        optimistic.push({
          type: 'image',
          mediaId: block.mediaId,
          ...(block.alt ? { alt: block.alt } : {}),
        })
      }
    }
    return optimistic
  }

  function clearAutosaveTimer() {
    if (autosaveTimerRef.current !== null) {
      window.clearTimeout(autosaveTimerRef.current)
      autosaveTimerRef.current = null
    }
  }

  function clearBlurExitTimer() {
    if (blurExitTimerRef.current !== null) {
      window.clearTimeout(blurExitTimerRef.current)
      blurExitTimerRef.current = null
    }
  }

  function markDirty() {
    if (suppressDirtyRef.current || savingInFlightRef.current) return
    dirtyRef.current = true
    setSaveStatus('dirty')
    clearAutosaveTimer()
    autosaveTimerRef.current = window.setTimeout(() => {
      autosaveTimerRef.current = null
      void persistSave({ exit: false })
    }, 3000)
  }

  function exitEditingChrome() {
    setToolPickerOpen(false)
    setVariablePickerOpen(false)
    setTopicPickerOpen(false)
    detachChipSelectionRef.current?.()
    detachChipSelectionRef.current = null
    detachPasteIngestRef.current?.()
    detachPasteIngestRef.current = null
    matchersSessionRef.current = null
    clearAutosaveTimer()
    clearBlurExitTimer()
    setEditing(false)
  }

  function persistSave(options: { exit: boolean }): boolean {
    if (savingInFlightRef.current && !options.exit) return false
    if (!dirtyRef.current && !options.exit) return false
    // Exit without changes: just leave edit mode.
    if (!dirtyRef.current && options.exit) {
      exitEditingChrome()
      setSaveStatus('idle')
      return true
    }

    const payload = buildSavePayload()
    if (!payload) return false

    dirtyRef.current = false
    clearAutosaveTimer()
    savingInFlightRef.current = true
    setSaveStatus('saving')

    // Only flip read-only preview when leaving edit   mid-edit autosave must
    // not touch React state that can remount Quill or fight the live DOM.
    if (options.exit) {
      setDisplayContent(payloadToOptimisticBlocks(payload))
    }

    try {
      onSaveRef.current(payload)
    } finally {
      savingInFlightRef.current = false
      setSaveStatus('saved')
    }

    if (options.exit) {
      exitEditingChrome()
    }
    return true
  }

  function finishEditing() {
    clearBlurExitTimer()
    persistSave({ exit: true })
  }

  function handleEditorFocusOut(event: ReactFocusEvent<HTMLDivElement>) {
    const root = editingRootRef.current
    const next = event.relatedTarget as Node | null
    if (root && next && root.contains(next)) return
    if (overlayOpenRef.current) return
    if (next === fileInputRef.current) return

    // Defer exit so toolbar/picker focus moves and in-root refocus cancel it.
    clearBlurExitTimer()
    blurExitTimerRef.current = window.setTimeout(() => {
      blurExitTimerRef.current = null
      if (!editingRef.current) return
      if (overlayOpenRef.current) return
      const active = document.activeElement
      if (root && active && root.contains(active)) return
      persistSave({ exit: true })
    }, 200)
  }

  function handleEditorFocusIn() {
    clearBlurExitTimer()
  }

  function handleInsertTopic(topicId: string, topicName: string) {
    const editor = quillRef.current?.getEditor()
    if (!editor) return
    const range = editor.getSelection(true)
    const index = range?.index ?? Math.max(0, editor.getLength() - 1)
    editor.focus()
    editor.insertEmbed(
      index,
      TOPIC_REF_BLOT,
      {
        id: topicId,
        name: topicName,
      } satisfies TopicRefValue,
      'user',
    )
    editor.setSelection(index + 1, 0)
    setTopicNames((prev) => {
      const next = new Map(prev)
      next.set(topicId.toLowerCase(), topicName)
      return next
    })
    setEnabledTopicIds((prev) => {
      const next = new Set(prev)
      next.add(topicId.toLowerCase())
      return next
    })
    setTopicPickerOpen(false)
    syncCountsFromEditor(editor)
    markDirty()
  }

  function handleInsertTool(payload: ToolInsertPayload) {
    const editor = quillRef.current?.getEditor()
    if (!editor) return
    const range = editor.getSelection(true)
    const index = range?.index ?? Math.max(0, editor.getLength() - 1)
    editor.focus()
    editor.insertEmbed(
      index,
      TOOL_REF_BLOT,
      {
        name: payload.name,
        title: payload.title,
        as: payload.as,
      } satisfies ToolRefValue,
      'user',
    )
    editor.setSelection(index + 1, 0)
    setToolPickerOpen(false)
    syncCountsFromEditor(editor)
    markDirty()
  }

  function topicEditorPlainText(): string {
    const editor = quillRef.current?.getEditor()
    if (!editor) return ''
    // Reconstruct tokens from HTML so declared tools are visible to the variable picker.
    const payload = editorHtmlToSavePayload(
      editor.root.innerHTML,
      draftFilesRef.current,
      imageMetaBySrcRef.current,
    )
    return payload.blocks
      .map((block) => (block.type === 'text' ? block.content : ''))
      .join('')
  }

  function handleInsertVariable(payload: VariableInsertPayload) {
    const editor = quillRef.current?.getEditor()
    if (!editor) return
    const range = editor.getSelection(true)
    const index = range?.index ?? Math.max(0, editor.getLength() - 1)
    editor.focus()
    editor.insertEmbed(
      index,
      TOOL_VARIABLE_REF_BLOT,
      {
        alias: payload.ref,
        variable: payload.variable,
        from: payload.from,
      } satisfies ToolVariableRefValue,
      'user',
    )
    editor.setSelection(index + 1, 0)
    setVariablePickerOpen(false)
    syncCountsFromEditor(editor)
    markDirty()
  }

  function cancelEditing() {
    for (const url of draftUrlsRef.current) URL.revokeObjectURL(url)
    draftUrlsRef.current = []
    draftFilesRef.current.clear()
    imageMetaBySrcRef.current.clear()
    htmlRef.current = '<p><br></p>'
    setSeedHtml('<p><br></p>')
    setHtmlReady(false)
    setImageCount(0)
    setCharacterCount(0)
    setSelectedImage(null)
    setSelectedAlt('')
    setAltModalOpen(false)
    setAltDraft('')
    setToolPickerOpen(false)
    setVariablePickerOpen(false)
    setTopicPickerOpen(false)
    detachChipSelectionRef.current?.()
    detachChipSelectionRef.current = null
    detachPasteIngestRef.current?.()
    detachPasteIngestRef.current = null
    matchersSessionRef.current = null
    dirtyRef.current = false
    setSaveStatus('idle')
    clearAutosaveTimer()
    clearBlurExitTimer()
    setEditing(false)
  }

  if (!editing || !canEdit) {
    return (
      <div
        className={cn(className)}
        role={canEdit ? 'button' : undefined}
        tabIndex={canEdit ? 0 : undefined}
        onClick={
          canEdit
            ? (event) => {
                if ((event.target as HTMLElement).closest('a')) return
                setEditing(true)
              }
            : undefined
        }
        onKeyDown={
          canEdit
            ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  setEditing(true)
                }
              }
            : undefined
        }
      >
        <ReadOnlyBlocks
          blocks={displayContent}
          apiKeyId={apiKeyId}
          emptyLabel={canEdit ? 'Click to write…' : 'Empty'}
          className={
            canEdit
              ? 'cursor-text rounded-md transition hover:bg-[var(--surface)]/50'
              : undefined
          }
        />
      </div>
    )
  }

  if (!Quill || !htmlReady) {
    return (
      <div
        className={cn(
          'min-h-24 animate-pulse rounded-md bg-[var(--surface)]',
          className,
        )}
      />
    )
  }

  const imagesLeft = Math.max(0, maxImages - imageCount)
  const overCharacterLimit = characterCount > maxCharacters

  return (
    <div
      ref={editingRootRef}
      className={cn('article-quill min-w-0 space-y-3', className)}
      onFocusCapture={handleEditorFocusIn}
      onBlurCapture={handleEditorFocusOut}
    >
      <style>{TOPIC_CHIP_CSS}</style>
      <style>{TOOL_CHIP_CSS}</style>
      <style>{TOOL_VARIABLE_CHIP_CSS}</style>
      <style>{REF_CHIP_STATUS_CSS}</style>
      <div className="flex items-center gap-1">
        <button
          type="button"
          title="Insert topic reference"
          aria-label="Insert topic reference"
          className="inline-flex size-8 items-center justify-center rounded-md text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--ink)]"
          onMouseDown={(e) => {
            e.preventDefault()
          }}
          onClick={() => {
            overlayOpenRef.current = true
            setTopicPickerOpen(true)
          }}
        >
          <Waypoints className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          title="Insert tool"
          aria-label="Insert tool"
          className="inline-flex size-8 items-center justify-center rounded-md text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--ink)]"
          onMouseDown={(e) => {
            e.preventDefault()
          }}
          onClick={() => {
            overlayOpenRef.current = true
            setToolPickerOpen(true)
          }}
        >
          <FunctionSquare className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          title="Insert variable"
          aria-label="Insert variable"
          className="inline-flex size-8 items-center justify-center rounded-md text-[var(--muted)] transition hover:bg-[var(--surface)] hover:text-[var(--ink)]"
          onMouseDown={(e) => {
            e.preventDefault()
          }}
          onClick={() => {
            overlayOpenRef.current = true
            setVariablePickerOpen(true)
          }}
        >
          <Braces className="size-4" aria-hidden />
        </button>
      </div>
      <div
        ref={editorShellRef}
        className="relative z-20 min-w-0"
        onMouseDown={selectImageFromEvent}
      >
        <Quill
          key={editSession}
          ref={(instance: ReactQuillHandle | null) => {
            quillRef.current = instance
          }}
          theme="snow"
          defaultValue={seedHtml}
          modules={modules}
          formats={[
            'bold',
            'italic',
            'list',
            'link',
            'image',
            TOPIC_REF_BLOT,
            TOOL_REF_BLOT,
            TOOL_VARIABLE_REF_BLOT,
          ]}
          placeholder={placeholder}
          onChange={() => {
            // Uncontrolled: do not push value back into Quill   only track for save/counts.
            syncCountsFromEditor()
            markDirty()
            if (selectedImage && !selectedImage.img.isConnected) {
              clearSelectedImage()
            }
          }}
        />
        {selectedImage ? (
          <div
            className="absolute z-30 flex max-w-[min(100%,18rem)] items-center gap-1"
            style={{ top: selectedImage.top, right: selectedImage.right }}
          >
            <button
              type="button"
              title={
                selectedAlt.trim()
                  ? selectedAlt.trim()
                  : 'Alt not added    click to add'
              }
              aria-label={
                selectedAlt.trim()
                  ? `Alt text: ${selectedAlt.trim()}`
                  : 'Alt not added'
              }
              className={cn(
                'flex min-w-0 items-center gap-1.5 rounded-md px-2 py-1 text-left text-[11px] leading-tight shadow-sm',
                selectedAlt.trim()
                  ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80'
                  : 'bg-amber-50 text-amber-800 ring-1 ring-amber-200/80',
              )}
              onMouseDown={(event) => {
                event.preventDefault()
                event.stopPropagation()
              }}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                openAltModal()
              }}
            >
              <TextCursorInput className="size-3 shrink-0 opacity-80" />
              <span className="min-w-0 truncate font-medium">
                {selectedAlt.trim() ? selectedAlt.trim() : 'Alt not added'}
              </span>
            </button>
            <button
              type="button"
              aria-label="Remove image"
              title="Remove image"
              className="shrink-0 rounded-md bg-white/90 p-1.5 text-[var(--muted)] shadow-sm hover:text-red-600"
              onMouseDown={(event) => {
                event.preventDefault()
                event.stopPropagation()
              }}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                deleteSelectedImage()
              }}
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ) : null}
      </div>

      <Modal
        open={altModalOpen}
        onClose={closeAltModal}
        title="Describe this image"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          {selectedImage?.img.src ? (
            <div className="overflow-hidden rounded-md border border-[var(--line)] bg-[var(--surface)]">
              <img
                src={selectedImage.img.src}
                alt=""
                className="mx-auto max-h-40 w-full object-contain"
              />
            </div>
          ) : null}

          <div>
            <label
              htmlFor={`${fileInputId}-alt-modal`}
              className="mb-1.5 block text-sm font-medium text-[var(--ink)]"
            >
              Alt text
            </label>
            <p className={'text-xs mb-2'}>
              Explain what’s in the image so people and assistive tech can
              understand it. Optional.
            </p>
            <input
              id={`${fileInputId}-alt-modal`}
              maxLength={200}
              autoFocus
              placeholder="e.g. Diagram of monthly billing cycles and invoice adjustments"
              className={'w-full p-2 border border-[var(--line)] rounded-sm'}
              value={altDraft}
              onChange={(event) => setAltDraft(event.target.value.slice(0, 200))}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault()
                  saveAltFromModal()
                }
              }}
            />
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <p className={'text-xs'}>Ctrl + Enter to save</p>
              <p
                className={cn(
                  'text-xs tabular-nums',
                  altDraft.length >= 200
                    ? 'font-medium text-red-600'
                    : 'text-[var(--muted)]',
                )}
              >
                {altDraft.length}/200
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className={buttonOutlineClassName}
              onClick={closeAltModal}
            >
              {altModalSkipLabel ? 'Skip' : 'Cancel'}
            </button>
            <button
              type="button"
              className={`${buttonClassName} px-2.5 py-1 border border-[var(--line)] rounded-sm`}
              onClick={saveAltFromModal}
            >
              Save
            </button>
          </div>
        </div>
      </Modal>

      <input
        id={fileInputId}
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          insertImages(e.target.files)
          e.target.value = ''
        }}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <p
            className={cn(
              'inline-flex items-center gap-1.5 text-xs text-[var(--muted)]',
              imagesLeft === 0 && 'text-red-600',
            )}
            title={`${imagesLeft} of ${maxImages} images left`}
          >
            <ImageIcon className="size-3.5 shrink-0" aria-hidden />
            <span>
              {imagesLeft}/{maxImages}
            </span>
          </p>
          
          <div className="h-4 w-px bg-[var(--line)]" aria-hidden />

          <p
            className={cn(
              'inline-flex items-center gap-1.5 text-xs text-[var(--muted)]',
              overCharacterLimit && 'text-red-600',
            )}
            title={`${characterCount} of ${maxCharacters} characters used`}
          >
            <CaseUpper className="size-4.5 shrink-0" aria-hidden />
            {characterCount}/{maxCharacters}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saveStatus === 'saving' ? (
            <span className="text-xs text-[var(--muted)]">Saving…</span>
          ) : saveStatus === 'saved' ? (
            <span className="text-xs text-[var(--muted)]">Saved</span>
          ) : saveStatus === 'dirty' ? (
            <span className="text-xs text-[var(--muted)]">Unsaved</span>
          ) : null}
          <button
            type="button"
            className="rounded-md px-2.5 py-1 text-xs text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)]"
            onClick={cancelEditing}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-md bg-[var(--ink)] px-2.5 py-1 text-xs text-white hover:opacity-90 disabled:opacity-40"
            disabled={overCharacterLimit}
            onClick={finishEditing}
          >
            Done
          </button>
        </div>
      </div>

      <TopicReferencePicker
        open={topicPickerOpen}
        onClose={() => {
          setTopicPickerOpen(false)
          overlayOpenRef.current =
            altModalOpen || toolPickerOpen || variablePickerOpen
        }}
        apiKeyId={apiKeyId}
        excludeTopicId={excludeTopicId}
        onInsertTopic={handleInsertTopic}
      />
      <ToolReferencePicker
        open={toolPickerOpen}
        onClose={() => {
          setToolPickerOpen(false)
          overlayOpenRef.current =
            altModalOpen || topicPickerOpen || variablePickerOpen
        }}
        apiKeyId={apiKeyId}
        onInsertTool={handleInsertTool}
      />
      <VariableReferencePicker
        open={variablePickerOpen}
        onClose={() => {
          setVariablePickerOpen(false)
          overlayOpenRef.current =
            altModalOpen || topicPickerOpen || toolPickerOpen
        }}
        apiKeyId={apiKeyId}
        content={topicEditorPlainText()}
        onInsertVariable={handleInsertVariable}
      />
    </div>
  )
}
