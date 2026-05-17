import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/utils/cn'
import { ROUTES } from '@/constants/routes'
import { Home, Calendar, Users, User } from 'lucide-react'

const navigation = [
  { name: 'Home', href: ROUTES.DASHBOARD, icon: Home },
  { name: 'Planner', href: ROUTES.PLANNER, icon: Calendar },
  { name: 'Groups', href: ROUTES.GROUPS, icon: Users },
  { name: 'Profile', href: ROUTES.PROFILE, icon: User },
]

export const FloatingNav: React.FC = () => {
  const location = useLocation()

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#16142e] border-t border-slate-100 dark:border-indigo-500/20 shadow-[0_-4px_24px_rgba(15,23,42,0.06)]"
    >
      <nav className="flex items-stretch justify-around max-w-screen-xl mx-auto h-16">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 flex-1 transition-colors',
                isActive ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-10 rounded-full bg-indigo-500 dark:bg-indigo-400" />
              )}
              <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.75} />
              <span className={cn('text-xs font-medium', isActive ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-600')}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
