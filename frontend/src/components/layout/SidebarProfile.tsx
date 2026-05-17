import React from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { ROUTES } from '@/constants/routes'

interface Props {
  collapsed: boolean
  name?: string
  avatarUrl?: string
}

export const SidebarProfile: React.FC<Props> = ({ collapsed, name, avatarUrl }) => (
  <Link to={ROUTES.PROFILE}>
    <div className="flex items-center gap-2.5 mx-2.5 mb-4 p-2.5 rounded-xl bg-indigo-500/[0.05] dark:bg-indigo-900/20 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition-colors cursor-pointer">
      <div className="shrink-0">
        <Avatar src={avatarUrl} alt={name} size="sm" />
      </div>
      {!collapsed && (
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold truncate text-indigo-950 dark:text-indigo-100">{name ?? 'Traveler'}</div>
          <div className="text-xs truncate text-indigo-300 dark:text-indigo-600">Pro · 5 members</div>
        </div>
      )}
    </div>
  </Link>
)
