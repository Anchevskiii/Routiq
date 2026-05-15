import React from 'react'
import { User, Lock, Bell, Shield, LogOut } from 'lucide-react'

export type Section = 'general' | 'security' | 'notifications' | 'privacy'

interface Props {
  active: Section
  onSelect: (s: Section) => void
  onLogout: () => void
}

const NAV_ITEMS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'general', label: 'General', icon: <User className="w-5 h-5" /> },
  { id: 'security', label: 'Security', icon: <Lock className="w-5 h-5" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
  { id: 'privacy', label: 'Privacy', icon: <Shield className="w-5 h-5" /> },
]

export const ProfileNav: React.FC<Props> = ({ active, onSelect, onLogout }) => (
  <div className="space-y-2">
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          className={`flex items-center px-4 py-3 rounded-xl font-bold transition-all ${
            active === item.id ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <span className="mr-3">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
    <div className="pt-8">
      <button
        onClick={onLogout}
        className="flex items-center w-full px-4 py-3 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors"
      >
        <LogOut className="w-5 h-5 mr-3" />
        Sign Out
      </button>
    </div>
  </div>
)
