import { marked } from 'marked'
import { cn } from '#/lib/utils'

const LIVE_AGENT_OFFER_MARKER = '[[LIVE_AGENT_OFFER]]'

marked.setOptions({
  gfm: true,
  breaks: true,
})

export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '')
}

export function agentMarkdownToHtml(text: string): string {
  if (!text.trim()) return ''
  const html = marked.parse(text, { async: false })
  if (typeof html !== 'string') return ''
  return sanitizeHtml(html)
}

export function stripUiMarkers(text: string): string {
  return text
    .split(LIVE_AGENT_OFFER_MARKER)
    .join('')
    .replace(/\[\[LIVE_AGENT\]\]/gi, '')
    .split('[[CONVERSATION_RESOLVED]]')
    .join('')
    .replace(/\[\[MEETING_BOOKING:[a-z0-9_-]+\]\]/gi, '')
    .trimEnd()
}

export function newAgentChatMessageId(): string {
  return `msg_${Math.random().toString(36).slice(2, 10)}`
}

export function agentProseClassName(darkMode: boolean): string {
  return cn(
    'prose prose-sm max-w-none text-xs leading-relaxed',
    'prose-headings:my-2 prose-headings:font-semibold',
    'prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5',
    'prose-pre:my-2 prose-pre:overflow-x-auto prose-pre:rounded-lg prose-pre:p-2',
    'prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-code:before:content-none prose-code:after:content-none',
    'prose-a:underline prose-a:underline-offset-2',
    'prose-strong:font-semibold',
    darkMode
      ? 'prose-invert prose-pre:bg-neutral-800 prose-code:bg-neutral-800 prose-a:text-sky-300'
      : 'prose-pre:bg-neutral-100 prose-code:bg-neutral-100 prose-a:text-blue-700',
  )
}
