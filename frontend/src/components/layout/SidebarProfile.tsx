import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Settings, LogOut, HelpCircle } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/app/Providers'

interface Props {
  collapsed: boolean
  name?: string
  avatarUrl?: string
  email?: string
}

export const SidebarProfile: React.FC<Props> = ({ collapsed, name, avatarUrl, email }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    setOpen(false)
    logout()
    navigate(ROUTES.LOGIN)
  }

  return (
    <div ref={ref} className="relative mx-2.5 mb-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-blue-600/[0.05] dark:bg-blue-900/20 hover:bg-blue-600/10 dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
      >
        <div className="shrink-0">
          <Avatar src={avatarUrl} alt={name} size="sm" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1 text-left">
            <div className="text-sm font-semibold truncate text-blue-600 dark:text-blue-300">{name ?? 'Traveler'}</div>
            <div className="text-xs truncate text-blue-600/70 dark:text-blue-300/70">{email ?? ''}</div>
          </div>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-[#1a1830] border border-gray-100 dark:border-white/[0.08] rounded-xl shadow-lg dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden z-50">
          <Link to={ROUTES.PROFILE} onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 dark:text-[#c8c6e8] hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors">
            <Settings className="w-4 h-4 text-gray-400 dark:text-[#6e6c93]" /> Settings
          </Link>
          <Link to="/help" onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 dark:text-[#c8c6e8] hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors">
            <HelpCircle className="w-4 h-4 text-gray-400 dark:text-[#6e6c93]" /> Help
          </Link>
          <div className="border-t border-gray-100 dark:border-white/[0.06]" />
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      )}
    </div>
  )
}
