import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Sun, Moon, Bell } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/app/Providers'
import { useTheme } from '@/hooks/useTheme'
import { Avatar } from '@/components/ui/Avatar'

export const DashboardTopbar: React.FC = () => {
  const { user } = useAuth()
  const { isDark, toggle } = useTheme()
  const [hasNotif] = useState(true)

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 px-6 py-3 bg-slate-50 dark:bg-[#0c0b1a] border-b border-indigo-500/[0.08] dark:border-indigo-500/10">
      <div className="flex items-center gap-2.5 flex-1 max-w-md rounded-xl bg-white dark:bg-[#16142e] border border-indigo-500/10 dark:border-indigo-500/20 shadow-sm px-3.5 py-2.5">
        <Search className="w-[15px] h-[15px] text-indigo-300 shrink-0" />
        <input
          className="flex-1 text-sm bg-transparent outline-none placeholder-slate-300 dark:placeholder-slate-600 text-slate-700 dark:text-slate-300"
          placeholder="Search destinations, trips, groups…"
        />
        <kbd className="text-xs rounded px-1.5 py-0.5 font-mono bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700">
          ⌘K
        </kbd>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={toggle}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 dark:text-slate-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
        >
          {isDark ? <Sun className="w-[17px] h-[17px]" /> : <Moon className="w-[17px] h-[17px]" />}
        </button>
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 dark:text-slate-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">
          <Bell className="w-[17px] h-[17px]" />
          {hasNotif && (
            <span className="absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full bg-indigo-500 border-2 border-white dark:border-[#0c0b1a]" />
          )}
        </button>
        <Link to={ROUTES.PROFILE}>
          <Avatar src={user?.avatarUrl} alt={user?.name} size="sm" />
        </Link>
      </div>
    </header>
  )
}
