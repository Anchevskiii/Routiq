import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/utils/cn'
import { ROUTES } from '@/constants/routes'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { useAuth } from '@/app/Providers'
import { itineraryApi } from '@/api/itinerary.api'
import { groupsApi } from '@/api/groups.api'
import { Plus } from 'lucide-react'
import { SidebarHeader }  from './SidebarHeader'
import { SidebarProfile } from './SidebarProfile'
import { NAV_BOTTOM, NAV_MAIN_STATIC } from './sidebar.data'

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

  const badges: Record<string, number> = {
    trips:  itinData?.meta?.total   ?? 0,
    groups: groupData?.data?.length ?? 0,
  }
  const NAV_MAIN = NAV_MAIN_STATIC.map(item => ({ ...item, badge: badges[item.id] ?? 0 }))

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
      <SidebarHeader collapsed={collapsed} onExpand={() => setCollapsed(false)} onCollapse={() => setCollapsed(true)} />

      {/* New trip button */}
      <div className="px-3 mb-5">
        <Link to={ROUTES.PLANNER}>
          <button className="flex items-center justify-center gap-2 w-full h-[38px] rounded-xl font-semibold text-sm text-white hover:opacity-90 active:scale-95 transition-opacity shadow-[0_4px_14px_rgba(99,102,241,0.28)] gradient-aurora">
            <Plus strokeWidth={2.5} className="w-[15px] h-[15px] shrink-0" />
            {!collapsed && <span>New trip</span>}
          </button>
        </Link>
      </div>

      {!collapsed && (
        <div className="px-4 mb-1">
          <span className="text-[10px] font-bold tracking-widest text-indigo-200 dark:text-indigo-700">MENU</span>
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
            <span className="text-[10px] font-bold tracking-widest text-indigo-200 dark:text-indigo-700">OTHER</span>
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
      <SidebarProfile collapsed={collapsed} name={user?.name} avatarUrl={user?.avatarUrl} />
    </aside>
  )
}
