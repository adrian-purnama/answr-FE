import type { LucideIcon } from 'lucide-react'
import {
  CircleHelp,
  Home,
  Megaphone,
  MessageSquare,
  Settings,
} from 'lucide-react'
import type { WidgetTab } from '#/components/widget/context/WidgetRuntimeContext'

export type WidgetTabMeta = {
  id: WidgetTab
  label: string
  Icon: LucideIcon
}

/** Runtime panel nav (Home / Messages / Help / News). */
export const WIDGET_TAB_META: WidgetTabMeta[] = [
  { id: 'home', label: 'Home', Icon: Home },
  { id: 'chat', label: 'Messages', Icon: MessageSquare },
  { id: 'faq', label: 'Help', Icon: CircleHelp },
  { id: 'news', label: 'News', Icon: Megaphone },
]

export type BuilderTab = WidgetTab | 'configuration'

export type BuilderTabMeta = {
  id: BuilderTab
  label: string
  icon: LucideIcon
}

/** Builder editor tabs (includes Configuration). */
export const BUILDER_TABS: BuilderTabMeta[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'faq', label: 'Help', icon: CircleHelp },
  { id: 'news', label: 'News', icon: Megaphone },
  { id: 'configuration', label: 'Configuration', icon: Settings },
]
