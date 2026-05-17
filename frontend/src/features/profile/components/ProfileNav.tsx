import React from 'react'
import { User, Lock, Bell, Shield, LogOut } from 'lucide-react'

export type Section = 'general' | 'security' | 'notifications' | 'privacy'

interface Props {
  active: Section
  onSelect: (s: Section) => void
  onLogout: () => void
}

const NAV_ITEMS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'general',       label: 'General',       icon: <User className="w-4 h-4" /> },
  { id: 'security',      label: 'Security',      icon: <Lock className="w-4 h-4" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
  { id: 'privacy',       label: 'Privacy',       icon: <Shield className="w-4 h-4" /> },
]

export const ProfileNav: React.FC<Props> = ({ active, onSelect, onLogout }) => (
  <div className="flex flex-col gap-1">
    {NAV_ITEMS.map(item => (
      <button
        key={item.id}
        onClick={() => onSelect(item.id)}
        className={[
          'flex items-center gap-2.5 px-3.5 py-2.5 rounded-[12px] text-sm font-semibold transition-all text-left',
          active === item.id
            ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-[0_4px_14px_rgba(99,102,241,0.35)]'
            : 'text-ink-dim hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-ink',
        ].join(' ')}
      >
        {item.icon}
        {item.label}
      </button>
    ))}

    <div className="mt-4 pt-4 border-t border-line">
      <button
        onClick={onLogout}
        className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm font-semibold text-red-500 rounded-[12px] hover:bg-red-50 dark:hover:bg-red-900/15 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>
    </div>
  </div>
)
