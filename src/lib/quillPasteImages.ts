/** Quill-like editor surface used for paste image ingest. */
export type PasteImageEditor = {
  root: HTMLElement
  on: (event: 'text-change', handler: (...args: unknown[]) => void) => void
  off: (event: 'text-change', handler: (...args: unknown[]) => void) => void
}

export function isExternalOrClipboardImageSrc(src: string): boolean {
  const value = src.trim()
  if (!value) return false
  if (value.startsWith('http://') || value.startsWith('https://')) return true
  if (value.startsWith('data:image/')) return true
  if (value.startsWith('blob:')) return true
  return false
}

export function needsPastedImageIngest(img: HTMLImageElement): boolean {
  if (img.getAttribute('data-media-id')?.trim()) return false
  if (img.getAttribute('data-file-key')?.trim()) return false
  if (img.dataset.ingestPending === 'true') return false
  if (img.dataset.ingestDone === 'true') return false
  const src = img.getAttribute('src') ?? ''
  return isExternalOrClipboardImageSrc(src)
}

/**
 * After user paste/edit, find external/clipboard images and run async ingest.
 * Returns a disposer.
 */
export function attachPastedImageIngest(
  editor: PasteImageEditor,
  ingest: (img: HTMLImageElement) => Promise<void>,
): () => void {
  let scheduled = false

  function scan() {
    scheduled = false
    const images = Array.from(editor.root.querySelectorAll('img'))
    for (const img of images) {
      if (!needsPastedImageIngest(img)) continue
      img.dataset.ingestPending = 'true'
      void ingest(img)
        .catch(() => {
          // Caller handles removal/toasts
        })
        .finally(() => {
          delete img.dataset.ingestPending
        })
    }
  }

  function onTextChange(...args: unknown[]) {
    const source = typeof args[2] === 'string' ? args[2] : ''
    if (source !== 'user') return
    if (scheduled) return
    scheduled = true
    queueMicrotask(scan)
  }

  editor.on('text-change', onTextChange)
  return () => {
    editor.off('text-change', onTextChange)
  }
}
