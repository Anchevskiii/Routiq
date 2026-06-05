import { Home, Map, Users, Sparkles, HelpCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ROUTES } from '@/constants/routes'

export interface NavItem {
  id: string
  label: string
  icon: LucideIcon
  href: string
}

// Settings and Help moved to profile popup
export const NAV_BOTTOM: NavItem[] = []

export const NAV_MAIN_STATIC = [
  { id: 'home',   label: 'Home',        icon: Home,     href: ROUTES.DASHBOARD },
  { id: 'trips',  label: 'Trips',       icon: Map,      href: ROUTES.TRIPS     },
  { id: 'groups', label: 'Groups',      icon: Users,    href: ROUTES.GROUPS    },
  { id: 'ai',     label: 'AI Planner',  icon: Sparkles,    href: ROUTES.PLANNER },
  { id: 'help',   label: 'Help',        icon: HelpCircle,  href: ROUTES.HELP    },
] as const
