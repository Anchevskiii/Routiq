import React from 'react'
import { Link } from 'react-router-dom'
import { Sun, Moon, Settings } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/app/Providers'
import { useTheme } from '@/hooks/useTheme'
import { NotificationsDropdown } from '@/components/layout/NotificationsDropdown'

export const DashboardTopbar: React.FC = () => {
  const { user: _user } = useAuth()
  const { isDark, toggle } = useTheme()

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 px-6 py-3 bg-slate-50 dark:bg-[#0c0b1a] border-b border-blue-500/[0.08] dark:border-blue-500/10">
      <div className="flex-1" />

      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={toggle}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-blue-900/30 transition-colors"
        >
          {isDark ? <Sun className="w-[17px] h-[17px]" /> : <Moon className="w-[17px] h-[17px]" />}
        </button>

        <NotificationsDropdown />

        <Link to={ROUTES.PROFILE} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-blue-900/30 transition-colors">
          <Settings className="w-[17px] h-[17px]" />
        </Link>
      </div>
    </header>
  )
}
