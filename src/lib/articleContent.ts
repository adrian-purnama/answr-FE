import { marked } from 'marked'
import TurndownService from 'turndown'
import type {
  TopicContentSavePayload,
  TopicEditorBlock,
  TopicImageBlock,
  TopicTextBlock,
} from '#/lib/article'
import {
  formatImageRef,
  formatToolRef,
  formatToolVariableRef,
  formatTopicRef,
  defaultToolAlias,
  listToolDeclarations,
  parseContentToBlocks,
  serializeContentBlocks,
} from '#/lib/contentReferences'

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
})

// Keep empty Quill paragraphs (`<p><br></p>`) as visible blank lines in markdown.
turndown.addRule('preserveBlankParagraph', {
  filter(node) {
    if (node.nodeName !== 'P') return false
    const text = (node.textContent ?? '').replace(/\u00a0/g, '').trim()
    const onlyBreak =
      node.childNodes.length === 0 ||
      (node.childNodes.length === 1 &&
        (node.firstChild as HTMLElement | null)?.nodeName === 'BR')
    return text === '' || onlyBreak
  },
  replacement() {
    return '\n\n\u00a0\n\n'
  },
})

// Quill Shift+Enter / soft breaks must not collapse on round-trip.
turndown.addRule('preserveLineBreak', {
  filter: 'br',
  replacement() {
    return '  \n'
  },
})

marked.setOptions({
  gfm: true,
  breaks: true,
})

function looksLikeHtml(value: string): boolean {
  return /^\s*</.test(value)
}

function isEditorEmptyHtml(html: string): boolean {
  if (!html) return true
  if (html === '<p><br></p>' || html === '<p></p>') return true
  const text = html
    .replace(/<[^>]+>/g, '')
    .replace(/\u00a0/g, '')
    .replace(/\s+/g, '')
  return text === ''
}

/** Convert stored topic content (Markdown or legacy HTML) to Quill HTML. */
export function topicContentToHtml(content: string): string {
  // Do not trim    blank lines / leading-trailing Enter spacing must survive reload.
  if (!content) return ''
  if (looksLikeHtml(content)) return content

  // Keep {{…}} tokens intact through marked (quotes / emphasis).
  const placeholders: string[] = []
  const protectedContent = content.replace(/\{\{[^}]+\}\}/g, (token) => {
    const index = placeholders.length
    placeholders.push(token)
    return `%%SAPREF${index}%%`
  })

  const html = marked.parse(protectedContent, { async: false })
  if (typeof html !== 'string') return ''
  const restored = html.replace(/%%SAPREF(\d+)%%/g, (_, index: string) => {
    return placeholders[Number(index)] ?? ''
  })
  // marked turns nbsp-only paragraphs into <p>&nbsp;</p>; Quill prefers <p><br></p>
  return restored.replace(/<p>(?:\s|&nbsp;|\u00a0)*<\/p>/gi, '<p><br></p>')
}

/**
 * Quill v2 list markers need `data-list` + `.ql-ui` on each `<li>`.
 * Marked/Turndown round-trips produce plain `<ol>/<ul>` without those.
 */
export function quillifyListHtml(html: string): string {
  if (!html || typeof document === 'undefined') return html
  const host = document.createElement('div')
  host.innerHTML = html

  function ensureListItem(li: Element, listKind: 'ordered' | 'bullet') {
    if (!li.hasAttribute('data-list')) {
      li.setAttribute('data-list', listKind)
    }
    if (!li.querySelector(':scope > .ql-ui')) {
      const ui = document.createElement('span')
      ui.className = 'ql-ui'
      ui.setAttribute('contenteditable', 'false')
      li.insertBefore(ui, li.firstChild)
    }
  }

  // Quill uses <ol> for both ordered and bullet lists.
  for (const ul of Array.from(host.querySelectorAll('ul'))) {
    for (const li of ul.querySelectorAll(':scope > li')) {
      ensureListItem(li, 'bullet')
    }
    const ol = document.createElement('ol')
    ol.innerHTML = ul.innerHTML
    for (const attr of Array.from(ul.attributes)) {
      ol.setAttribute(attr.name, attr.value)
    }
    ul.replaceWith(ol)
  }

  for (const ol of host.querySelectorAll('ol')) {
    for (const li of ol.querySelectorAll(':scope > li')) {
      const kind =
        li.getAttribute('data-list') === 'bullet' ? 'bullet' : 'ordered'
      ensureListItem(li, kind)
    }
  }

  return host.innerHTML
}

/** Convert Quill HTML back to Markdown for storage / export. */
export function htmlToTopicContent(html: string): string {
  // Headings are reserved for article title (H1) / topic names (H3) in import-export.
  const withoutHeadings = html
    .replace(/<h[1-6][^>]*>/gi, '<p>')
    .replace(/<\/h[1-6]>/gi, '</p>')

  if (isEditorEmptyHtml(withoutHeadings)) return ''

  // Turndown escapes underscores (`get_plan` → `get\_plan`); keep {{…}} tokens raw.
  const placeholders: string[] = []
  const protectedHtml = withoutHeadings.replace(/\{\{[^}]+\}\}/g, (token) => {
    const index = placeholders.length
    placeholders.push(token)
    return `%%SAPREF${index}%%`
  })

  const markdown = turndown.turndown(protectedHtml)
  // Do not trim    preserves Enter-created blank lines at the edges.
  return markdown.replace(/%%SAPREF(\d+)%%/g, (_, index: string) => {
    return placeholders[Number(index)] ?? ''
  })
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
}

/**
 * Build one Quill HTML document from alternating text/image editor blocks.
 * Persisted images need a real src (blob:/http:)    Quill rewrites empty src to //:0.
 */
export function editorBlocksToHtml(
  blocks: TopicEditorBlock[],
  srcByMediaId: Map<string, string> = new Map(),
): string {
  const parts: string[] = []
  for (const block of blocks) {
    if (block.type === 'text') {
      const html = quillifyListHtml(topicContentToHtml(block.content))
      if (html) parts.push(html)
      continue
    }
    if ('previewUrl' in block && block.previewUrl) {
      parts.push(
        `<p><img src="${escapeAttr(block.previewUrl)}" alt="${escapeAttr(block.alt ?? '')}" data-file-key="${escapeAttr(block.fileKey)}"></p>`,
      )
    } else if ('mediaId' in block && block.mediaId) {
      const src = srcByMediaId.get(block.mediaId)
      if (!src) continue
      parts.push(
        `<p><img src="${escapeAttr(src)}" alt="${escapeAttr(block.alt ?? '')}" data-media-id="${escapeAttr(block.mediaId)}"></p>`,
      )
    }
  }
  return parts.join('') || '<p><br></p>'
}

export type ImageSrcMeta = { mediaId?: string; fileKey?: string }

function replaceNodeWithText(node: Node, text: string): void {
  const parent = node.parentNode
  if (!parent) return
  parent.replaceChild(document.createTextNode(text), node)
}

/**
 * Replace tool/variable/image embeds in place with wire tokens, then turndown
 * the whole document once so paragraph / blank-line structure is preserved.
 */
export function editorHtmlToSavePayload(
  html: string,
  draftFiles: Map<string, File>,
  imageMetaBySrc: Map<string, ImageSrcMeta> = new Map(),
): TopicContentSavePayload {
  const host = document.createElement('div')
  host.innerHTML = html

  const files: TopicContentSavePayload['files'] = []
  const seenFileKeys = new Set<string>()

  for (const el of Array.from(
    host.querySelectorAll<HTMLElement>('.ql-topic-ref[data-topic-id]'),
  )) {
    if (el.parentElement?.closest('.ql-topic-ref')) continue
    const id = el.getAttribute('data-topic-id')?.trim() ?? ''
    if (!id) {
      el.remove()
      continue
    }
    replaceNodeWithText(el, formatTopicRef(id))
  }

  for (const el of Array.from(
    host.querySelectorAll<HTMLElement>(
      '.ql-tool-ref, [data-tool-name]:not(img)',
    ),
  )) {
    if (
      !el.classList.contains('ql-tool-ref') &&
      !el.hasAttribute('data-tool-name')
    ) {
      continue
    }
    // Prefer the outer chip host when nested.
    if (el.parentElement?.closest('.ql-tool-ref')) continue
    const name = el.getAttribute('data-tool-name')?.trim() ?? ''
    if (!name) {
      el.remove()
      continue
    }
    const as = el.getAttribute('data-tool-as')?.trim() || undefined
    replaceNodeWithText(el, formatToolRef(name, as))
  }

  for (const el of Array.from(
    host.querySelectorAll<HTMLElement>(
      '.ql-tool-var-ref, [data-tool-var-ref]',
    ),
  )) {
    if (el.parentElement?.closest('.ql-tool-var-ref')) continue
    const ref = el.getAttribute('data-tool-var-ref')?.trim() ?? ''
    const variable = el.getAttribute('data-tool-var-name')?.trim() ?? ''
    if (!ref || !variable) {
      el.remove()
      continue
    }
    replaceNodeWithText(el, formatToolVariableRef(ref, variable))
  }

  // Strip leftover {{…}} from attributes (e.g. old chip title= wire tokens)
  // so turndown cannot resurrect deleted tool/topic references.
  for (const el of Array.from(host.querySelectorAll<HTMLElement>('*'))) {
    for (const attr of Array.from(el.attributes)) {
      if (attr.value.includes('{{')) {
        el.removeAttribute(attr.name)
      }
    }
  }

  for (const img of Array.from(host.querySelectorAll('img'))) {
    const src = img.getAttribute('src') ?? ''
    const fromSrc = imageMetaBySrc.get(src)
    const mediaId =
      img.getAttribute('data-media-id') ?? fromSrc?.mediaId ?? undefined
    const fileKey =
      img.getAttribute('data-file-key') ?? fromSrc?.fileKey ?? undefined
    const altRaw = img.getAttribute('alt') ?? ''
    const alt = altRaw.trim() ? altRaw.trim().slice(0, 200) : undefined

    if (fileKey && draftFiles.has(fileKey)) {
      if (!seenFileKeys.has(fileKey)) {
        files.push({ fileKey, file: draftFiles.get(fileKey)! })
        seenFileKeys.add(fileKey)
      }
      replaceNodeWithText(img, formatImageRef(fileKey, alt))
    } else if (mediaId) {
      replaceNodeWithText(img, formatImageRef(mediaId, alt))
    } else {
      img.remove()
    }
  }

  const markdown = htmlToTopicContent(host.innerHTML)
  if (!markdown) {
    return { blocks: [], files }
  }

  const blocks: TopicContentSavePayload['blocks'] = []

  function pushText(content: string): void {
    const last = blocks[blocks.length - 1]
    if (last?.type === 'text') {
      last.content += content
      return
    }
    blocks.push({ type: 'text', content } satisfies TopicTextBlock)
  }

  for (const block of parseContentToBlocks(markdown)) {
    if (block.type === 'text') {
      if (block.content) pushText(block.content)
      continue
    }
    if (block.type === 'image') {
      if (draftFiles.has(block.id)) {
        blocks.push({
          type: 'image',
          fileKey: block.id,
          ...(block.alt ? { alt: block.alt } : {}),
        })
      } else {
        blocks.push({
          type: 'image',
          mediaId: block.id,
          ...(block.alt ? { alt: block.alt } : {}),
        } satisfies TopicImageBlock)
      }
      continue
    }
    // Keep tool / topic / tool_variable tokens inside text so paragraph
    // spacing around them survives serializeContentBlocks joins.
    pushText(serializeContentBlocks([block]))
  }

  const cleaned = blocks.filter((b, _i, arr) => {
    if (b.type !== 'text') return true
    if (b.content !== '') return true
    return arr.length === 1
  })

  return { blocks: cleaned.length ? cleaned : [], files }
}

/**
 * Quill delta is source of truth for which tool/topic/variable embeds exist.
 * HTML round-trips can resurrect deleted tool chips (e.g. via title attributes);
 * drop any tool tokens that are not still in the live delta.
 */
export function reconcileSavePayloadWithEditorDelta(
  payload: TopicContentSavePayload,
  deltaPlain: string,
): TopicContentSavePayload {
  const allowed = new Set(
    listToolDeclarations(deltaPlain).map(
      (decl) => `${decl.name.toLowerCase()}::${decl.as.toLowerCase()}`,
    ),
  )

  const blocks = payload.blocks.map((block) => {
    if (block.type !== 'text') return block
    const kept = parseContentToBlocks(block.content).filter((part) => {
      if (part.type !== 'tool') return true
      const alias = part.as?.trim()
        ? part.as.trim()
        : defaultToolAlias(part.name)
      const key = `${part.name.toLowerCase()}::${alias.toLowerCase()}`
      return allowed.has(key)
    })
    return { type: 'text' as const, content: serializeContentBlocks(kept) }
  })

  return { ...payload, blocks }
}

/** Count image embeds in Quill HTML (for plan limits while editing). */
export function countImagesInEditorHtml(html: string): number {
  const matches = html.match(/<img\b/gi)
  return matches?.length ?? 0
}
