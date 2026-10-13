import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type Ref,
} from 'react'
import 'react-quill-new/dist/quill.snow.css'
import { cn } from '#/lib/utils'
import { stampNewsImageMediaIds } from '#/lib/news'

const TOOLBAR = [
  [{ header: [2, 3, false] }],
  ['bold', 'italic'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['link', 'image'],
  ['clean'],
]

type QuillEditorApi = {
  getSelection: (focus?: boolean) => { index: number; length: number } | null
  getLength: () => number
  insertEmbed: (index: number, type: string, value: unknown, source?: string) => void
  setSelection: (index: number, length?: number, source?: string) => void
  focus: () => void
  root: HTMLElement
}

type ReactQuillHandle = {
  getEditor: () => QuillEditorApi
}

type QuillProps = {
  theme?: string
  value?: string
  defaultValue?: string
  onChange?: (html: string) => void
  modules?: Record<string, unknown>
  formats?: string[]
  placeholder?: string
  className?: string
}

function allowBlobImageSrc(QuillStatic: {
  import: (name: string) => { sanitize: (url: string) => string }
}) {
  const Image = QuillStatic.import('formats/image')
  Image.sanitize = (url: string) => url
}

type NewsRichEditorProps = {
  defaultValue: string
  onChange: (html: string) => void
  onUploadImage: (file: File) => Promise<{ mediaId: string; previewUrl: string }>
  placeholder?: string
  className?: string
}

export default function NewsRichEditor({
  defaultValue,
  onChange,
  onUploadImage,
  placeholder = 'Write the article…',
  className,
}: NewsRichEditorProps) {
  const quillRef = useRef<ReactQuillHandle | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaIdBySrcRef = useRef(new Map<string, string>())
  const uploadingRef = useRef(false)
  const [Quill, setQuill] = useState<
    ComponentType<QuillProps & { ref?: Ref<ReactQuillHandle> }> | null
  >(null)

  useEffect(() => {
    let cancelled = false
    void import('react-quill-new').then((mod) => {
      if (cancelled) return
      const QuillStatic = mod as unknown as {
        Quill: Parameters<typeof allowBlobImageSrc>[0]
        default: ComponentType<QuillProps & { ref?: Ref<ReactQuillHandle> }>
      }
      if (QuillStatic.Quill) allowBlobImageSrc(QuillStatic.Quill)
      setQuill(() => QuillStatic.default)
    })
    return () => {
      cancelled = true
    }
  }, [])

  function stampAndEmit(html: string) {
    const editor = quillRef.current?.getEditor()
    if (editor) {
      for (const img of editor.root.querySelectorAll('img')) {
        const src = img.getAttribute('src') ?? ''
        const existing = img.getAttribute('data-media-id')
        if (existing) {
          if (src) mediaIdBySrcRef.current.set(src, existing)
          continue
        }
        const known = src ? mediaIdBySrcRef.current.get(src) : undefined
        if (known) img.setAttribute('data-media-id', known)
      }
    }
    onChange(stampNewsImageMediaIds(editor?.root.innerHTML ?? html))
  }

  const modules = useMemo(
    () => ({
      toolbar: {
        container: TOOLBAR,
        handlers: {
          image: () => fileInputRef.current?.click(),
        },
      },
    }),
    [],
  )

  async function onFileChange(file: File | undefined) {
    if (!file || uploadingRef.current) return
    const editor = quillRef.current?.getEditor()
    if (!editor) return
    uploadingRef.current = true
    try {
      const { mediaId, previewUrl } = await onUploadImage(file)
      mediaIdBySrcRef.current.set(previewUrl, mediaId)
      const range = editor.getSelection(true)
      const index = range?.index ?? Math.max(0, editor.getLength() - 1)
      editor.insertEmbed(index, 'image', previewUrl, 'user')
      const img = editor.root.querySelector(
        `img[src="${CSS.escape(previewUrl)}"]`,
      )
      img?.setAttribute('data-media-id', mediaId)
      editor.setSelection(index + 1, 0, 'silent')
      editor.focus()
      stampAndEmit(editor.root.innerHTML)
    } finally {
      uploadingRef.current = false
    }
  }

  if (!Quill) {
    return (
      <div
        className={cn(
          'min-h-64 animate-pulse rounded-md bg-[var(--surface)]',
          className,
        )}
      />
    )
  }

  return (
    <div className={cn('article-quill news-quill min-w-0', className)}>
      <Quill
        ref={(instance: ReactQuillHandle | null) => {
          quillRef.current = instance
        }}
        theme="snow"
        defaultValue={defaultValue}
        onChange={(html) => stampAndEmit(html)}
        modules={modules}
        formats={['header', 'bold', 'italic', 'list', 'link', 'image']}
        placeholder={placeholder}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          void onFileChange(event.target.files?.[0])
          event.target.value = ''
        }}
      />
    </div>
  )
}
