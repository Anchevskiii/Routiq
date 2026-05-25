import React from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import type { Group } from '@/types/group.types'

const COLORS = ['#2563eb', '#3b82f6', '#10b981', '#f59e0b', '#ec4899']

interface Props {
  group: Group
  index: number
}

export const GroupCard: React.FC<Props> = ({ group, index }) => {
  const color = COLORS[index % COLORS.length]

  return (
    <Link to={ROUTES.GROUP_DETAIL(group.id)}>
      <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-blue-50/60 dark:hover:bg-blue-900/20 transition-colors cursor-pointer">
        <div
          className="w-9 h-9 flex items-center justify-center rounded-xl text-white font-bold text-sm shrink-0"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}
        >
          {group.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate text-blue-600 dark:text-blue-300">{group.name}</div>
          <div className="text-xs truncate text-slate-400 dark:text-slate-500">{group.description ?? 'Group trip'}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs font-semibold text-blue-600 dark:text-blue-300">{group.memberCount}</div>
          <div className="text-xs text-slate-400 dark:text-slate-500">members</div>
        </div>
      </div>
    </Link>
  )
}
