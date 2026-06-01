import React from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { ROUTES } from '@/constants/routes'

interface Props {
  collapsed: boolean
  name?: string
  avatarUrl?: string
  email?: string
}

export const SidebarProfile: React.FC<Props> = ({ collapsed, name, avatarUrl, email }) => (
  <Link to={ROUTES.PROFILE}>
    <div className="flex items-center gap-2.5 mx-2.5 mb-4 p-2.5 rounded-xl bg-blue-600/[0.05] dark:bg-blue-900/20 hover:bg-blue-600 dark:hover:bg-blue-900/40 transition-colors cursor-pointer">
      <div className="shrink-0">
        <Avatar src={avatarUrl} alt={name} size="sm" />
      </div>
      {!collapsed && (
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold truncate text-blue-600 dark:text-blue-300">{name ?? 'Traveler'}</div>
          <div className="text-xs truncate text-blue-600/70 dark:text-blue-300/70">{email ?? ''}</div>
        </div>
      )}
    </div>
  </Link>
)
