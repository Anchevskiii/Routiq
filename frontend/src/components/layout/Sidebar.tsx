import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/utils/cn'
import { ROUTES } from '@/constants/routes'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { useAuth } from '@/app/Providers'
import { Avatar } from '@/components/ui/Avatar'
import { itineraryApi } from '@/api/itinerary.api'
import { groupsApi } from '@/api/groups.api'
import {
  Home, Map, Users, Sparkles, Globe, Bookmark,
  Settings, HelpCircle, Plus, ChevronLeft, ChevronRight,
} from 'lucide-react'

const NAV_BOTTOM = [
  { id: 'settings', label: 'Nastavitve', icon: Settings,   href: ROUTES.PROFILE   },
  { id: 'help',     label: 'Pomoč',      icon: HelpCircle, href: ROUTES.DASHBOARD },
]

export interface SidebarProps {
  collapsed: boolean
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const location = useLocation()
  const { user } = useAuth()

  const { data: itinData } = useQuery({
    queryKey: QUERY_KEYS.itineraries,
    queryFn: () => itineraryApi.listItineraries({ limit: 100 }),
  })
  const { data: groupData } = useQuery({
    queryKey: QUERY_KEYS.groups,
    queryFn: () => groupsApi.getGroups(),
  })

  const NAV_MAIN = [
    { id: 'home',   label: 'Domov',       icon: Home,     href: ROUTES.DASHBOARD, badge: 0                            },
    { id: 'trips',  label: 'Potovanja',   icon: Map,      href: ROUTES.DASHBOARD, badge: itinData?.meta?.total ?? 0   },
    { id: 'groups', label: 'Skupini',     icon: Users,    href: ROUTES.GROUPS,    badge: groupData?.data?.length ?? 0 },
    { id: 'ai',     label: 'AI Planer',   icon: Sparkles, href: ROUTES.PLANNER,   badge: 0                            },
    { id: 'places', label: 'Destinacije', icon: Globe,    href: ROUTES.DASHBOARD, badge: 0                            },
    { id: 'saved',  label: 'Shranjeno',   icon: Bookmark, href: ROUTES.DASHBOARD, badge: 0                            },
  ]

  const isActive = (id: string) => {
    if (id === 'home')     return location.pathname === ROUTES.DASHBOARD
    if (id === 'groups')   return location.pathname.startsWith(ROUTES.GROUPS)
    if (id === 'ai')       return location.pathname === ROUTES.PLANNER
    if (id === 'settings') return location.pathname === ROUTES.PROFILE
    return false
  }

  const navPad = collapsed ? 'py-[9px] px-0 justify-center' : 'py-2 px-[10px]'

  return (
    <aside
      className={cn(
        'flex flex-col h-screen sticky top-0 overflow-hidden',
        'bg-white dark:bg-[#16142e] border-r border-indigo-500/10 dark:border-indigo-500/20',
        'transition-[width,min-width] duration-[250ms] ease-in-out will-change-[width] transform-gpu',
        collapsed ? 'w-[68px] min-w-[68px]' : 'w-[220px] min-w-[220px]',
      )}
    >
      {/* Logo row */}
      <div className="flex items-center gap-2.5 px-3.5 py-4 mb-1 min-h-[60px]">
        <div className="w-[34px] h-[34px] flex items-center justify-center rounded-xl shrink-0 shadow-[0_4px_14px_rgba(99,102,241,0.35)] gradient-aurora">
          <svg viewBox="0 0 28 28" width="20" height="20" fill="none">
            <defs>
              <linearGradient id="aurora-logo" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stopColor="#ffffff" />
                <stop offset="1" stopColor="#e0e7ff" />
              </linearGradient>
            </defs>
            <circle cx="14" cy="14" r="13" fill="url(#aurora-logo)" />
            <path d="M8 18 L14 6 L20 18 L14 14 Z" fill="#6366f1" />
          </svg>
        </div>

        {!collapsed && (
          <span className="font-bold text-[15px] tracking-tight text-indigo-950 dark:text-indigo-100 whitespace-nowrap">
            Routiq
          </span>
        )}

        <button
          className="ml-auto w-[26px] h-[26px] flex items-center justify-center rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors text-indigo-300 dark:text-indigo-500 shrink-0"
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Razširi' : 'Skrij'}
        >
          {collapsed
            ? <ChevronRight strokeWidth={2} className="w-3.5 h-3.5" />
            : <ChevronLeft  strokeWidth={2} className="w-3.5 h-3.5" />
          }
        </button>
      </div>

      {/* New trip button */}
      <div className="px-3 mb-5">
        <Link to={ROUTES.PLANNER}>
          <button className="flex items-center justify-center gap-2 w-full h-[38px] rounded-xl font-semibold text-sm text-white hover:opacity-90 active:scale-95 transition-opacity shadow-[0_4px_14px_rgba(99,102,241,0.28)] gradient-aurora">
            <Plus strokeWidth={2.5} className="w-[15px] h-[15px] shrink-0" />
            {!collapsed && <span>Nova pot</span>}
          </button>
        </Link>
      </div>

      {!collapsed && (
        <div className="px-4 mb-1">
          <span className="text-[10px] font-bold tracking-widest text-indigo-200 dark:text-indigo-700">MENI</span>
        </div>
      )}

      <nav className="flex flex-col gap-px px-2">
        {NAV_MAIN.map(item => {
          const active = isActive(item.id)
          const ItemIcon = item.icon
          return (
            <Link
              key={item.id}
              to={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'relative flex items-center rounded-xl select-none transition-colors',
                collapsed ? 'gap-0' : 'gap-2.5',
                navPad,
                active
                  ? 'bg-indigo-50/80 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400'
                  : 'text-secondary-500 dark:text-slate-400 hover:bg-secondary-50 dark:hover:bg-slate-800/50',
              )}
            >
              {active && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full gradient-aurora-v" />
              )}
              <ItemIcon strokeWidth={active ? 2.2 : 1.75} className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-sm font-medium">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="text-[11px] font-bold rounded-full px-[7px] py-[2px] bg-indigo-500/10 text-indigo-500 leading-none">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="mt-5">
        {!collapsed && (
          <div className="px-4 mb-1">
            <span className="text-[10px] font-bold tracking-widest text-indigo-200 dark:text-indigo-700">DRUGO</span>
          </div>
        )}
        <nav className="flex flex-col gap-px px-2">
          {NAV_BOTTOM.map(item => {
            const active = isActive(item.id)
            const ItemIcon = item.icon
            return (
              <Link
                key={item.id}
                to={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl hover:bg-secondary-50 dark:hover:bg-slate-800/50 transition-colors',
                  navPad,
                  active ? 'text-indigo-500 dark:text-indigo-400' : 'text-secondary-400 dark:text-slate-500',
                )}
              >
                <ItemIcon strokeWidth={1.75} className="w-[18px] h-[18px] shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="flex-1" />

      <Link to={ROUTES.PROFILE}>
        <div className="flex items-center gap-2.5 mx-2.5 mb-4 p-2.5 rounded-xl bg-indigo-500/[0.05] dark:bg-indigo-900/20 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition-colors cursor-pointer">
          <div className="shrink-0">
            <Avatar src={user?.avatarUrl} alt={user?.name} size="sm" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate text-indigo-950 dark:text-indigo-100">{user?.name ?? 'Traveler'}</div>
              <div className="text-xs truncate text-indigo-300 dark:text-indigo-600">Pro · 5 članov</div>
            </div>
          )}
        </div>
      </Link>
    </aside>
  )
}
