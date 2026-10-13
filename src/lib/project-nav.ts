/**
 * Project sidebar navigation config.
 *
 * To add a section:
 * 1. Add an entry below
 * 2. Create a matching route file under routes/_authenticated/project/$id/
 * 3. Read apiKey via useLoaderData({ from: '/_authenticated/project/$id' })
 *
 * Examples:
 * { type: 'link', label: 'Statistics', to: 'statistics', icon: 'BarChart3' },
 * {
 *   type: 'group',
 *   label: 'Settings',
 *   icon: 'Settings',
 *   children: [
 *     { type: 'link', label: 'Agent settings', to: 'settings/agent', icon: 'Bot' },
 *   ],
 * },
 */

import type { LucideIcon } from 'lucide-react'
import {
  AppWindow,
  BarChart3,
  BookOpen,
  Cable,
  Calendar,
  FileText,
  Gauge,
  GraduationCap,
  Headset,
  LayoutGrid,
  LayoutTemplate,
  MessageCircle,
  UserRound,
  ScanSearch,
  Settings,
  TestTubeDiagonal,
  Wrench,
} from 'lucide-react'
import { COLLABORATOR_PERMISSION_FIELDS } from '#/lib/collaborator'
import type { CollaboratorPermissions } from '#/lib/collaborator'

export type ProjectNavPermission =
  | 'owner'
  | (typeof COLLABORATOR_PERMISSION_FIELDS)[number]['key']

export type ProjectNavLink = {
  type: 'link'
  label: string
  /** Path after /project/$id/    e.g. "statistics" or "settings/agent" */
  to: string
  /** Optional search params (e.g. `{ view: 'snippets' }`). */
  search?: Record<string, string>
  icon: LucideIcon
  permission?: ProjectNavPermission
}

export type ProjectNavGroup = {
  type: 'group'
  label: string
  icon: LucideIcon
  children: ProjectNavItem[]
}

export type ProjectNavItem = ProjectNavLink | ProjectNavGroup

export const PROJECT_NAV: ProjectNavItem[] = [
  {
    type: 'group',
    label: 'Analyze',
    icon: BarChart3,
    children: [
      { type: 'link', label: 'Overview', to: 'analyze/overview', icon: LayoutGrid, permission: 'overview' },
      { type: 'link', label: 'Performance', to: 'analyze/performance', icon: Gauge, permission: 'performance' },
      { type: 'link', label: 'Gaps', to: 'analyze/gaps', icon: ScanSearch, permission: 'gaps' },
    ],
  },
  {
    type: 'group',
    label: 'Train',
    icon: GraduationCap,
    children: [
      { type: 'link', label: 'Articles & Snippets', to: 'train/article', icon: FileText, permission: 'train.articleSnippet' },
      { type: 'link', label: 'Guidance', to: 'train/guidance', icon: BookOpen, permission: 'train.guidance' },
    ],
  },
  { type: 'link', label: 'Test', to: 'test', icon: TestTubeDiagonal, permission: 'test' },
  {
    type: 'group',
    label: 'Tools',
    icon: Wrench,
    children: [
      { type: 'link', label: 'Live Agent', to: 'tools/live-agent', icon: Headset, permission: 'tools.liveAgent' },
      { type: 'link', label: 'Meeting', to: 'tools/meeting', icon: Calendar, permission: 'tools.meeting' },
      { type: 'link', label: 'MCP', to: 'tools/mcp', icon: Cable, permission: 'tools.mcp' },
      { type: 'link', label: 'UI', to: 'tools/ui', icon: LayoutTemplate, permission: 'tools.mcp' },
      {
        type: 'link',
        label: 'Lead Capture',
        to: 'tools/lead-capture',
        icon: UserRound,
        permission: 'tools.leadCapture',
      },
      // {
      //   type: 'link',
      //   label: 'WhatsApp',
      //   to: 'tools/whatsapp',
      //   icon: MessageCircle,
      //   permission: 'tools.whatsApp',
      // },
    ],
  },
  { type: 'link', label: 'Widget', to: 'widget', icon: AppWindow, permission: 'widget' },
  { type: 'link', label: 'Settings', to: 'settings', icon: Settings, permission: 'owner' },
]

type ProjectAccess = {
  role?: 'owner' | 'collaborator'
  permissions?: CollaboratorPermissions
}

function hasNavPermission(
  permission: ProjectNavPermission,
  access: ProjectAccess,
): boolean {
  if (access.role !== 'collaborator') return true
  if (permission === 'owner') return false
  if (!access.permissions) return false
  const field = COLLABORATOR_PERMISSION_FIELDS.find((item) => item.key === permission)
  return field ? field.get(access.permissions) : false
}

export function filterProjectNav(
  items: ProjectNavItem[],
  access: ProjectAccess,
): ProjectNavItem[] {
  if (access.role !== 'collaborator') return items
  const next: ProjectNavItem[] = []
  for (const item of items) {
    if (item.type === 'link') {
      if (!item.permission || hasNavPermission(item.permission, access)) {
        next.push(item)
      }
      continue
    }
    const children = filterProjectNav(item.children, access)
    if (children.length > 0) next.push({ ...item, children })
  }
  return next
}

export function projectNavHref(
  projectId: string,
  to: string,
  search?: Record<string, string>,
): string {
  const path = `/project/${projectId}/${to}`
  if (!search || Object.keys(search).length === 0) return path
  const params = new URLSearchParams(search)
  return `${path}?${params.toString()}`
}
