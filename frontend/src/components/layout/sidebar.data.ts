import { Home, Map, Users, Sparkles, Globe, Bookmark, Settings, HelpCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ROUTES } from '@/constants/routes'

export interface NavItem {
  id: string
  label: string
  icon: LucideIcon
  href: string
}

export const NAV_BOTTOM: NavItem[] = [
  { id: 'settings', label: 'Settings', icon: Settings,   href: ROUTES.PROFILE   },
  { id: 'help',     label: 'Help',     icon: HelpCircle, href: ROUTES.DASHBOARD },
]

export const NAV_MAIN_STATIC = [
  { id: 'home',   label: 'Home',        icon: Home,     href: ROUTES.DASHBOARD },
  { id: 'trips',  label: 'Trips',       icon: Map,      href: ROUTES.DASHBOARD },
  { id: 'groups', label: 'Groups',      icon: Users,    href: ROUTES.GROUPS    },
  { id: 'ai',     label: 'AI Planner',  icon: Sparkles, href: ROUTES.PLANNER   },
  { id: 'places', label: 'Destinations',icon: Globe,    href: ROUTES.DASHBOARD },
  { id: 'saved',  label: 'Saved',       icon: Bookmark, href: ROUTES.DASHBOARD },
] as const
