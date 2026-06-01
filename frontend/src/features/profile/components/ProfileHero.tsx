import React from 'react'
import { MapPin, Users } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import type { User } from '@/types/auth.types'

interface Props {
  user: User
  itineraryCount: number
  groupCount: number
}

export const ProfileHero: React.FC<Props> = ({ user, itineraryCount, groupCount }) => (
  <div className="relative rounded-[22px] overflow-hidden mb-8 border border-line shadow-card">
    <div className="h-24 gradient-aurora" />
    <div className="bg-white dark:bg-[#1e1b38] px-6 pb-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-10">
        <div className="flex items-end gap-4">
          <div className="w-20 h-20 rounded-[18px] overflow-hidden border-4 border-white dark:border-[#1e1b38] shadow-lg shrink-0">
            <Avatar src={user.avatarUrl} alt={user.name} size="xl" className="w-full h-full" />
          </div>
          <div className="pb-1">
            <h1 className="text-xl font-semibold tracking-tight text-ink leading-tight">{user.name}</h1>
            <p className="text-sm text-ink-faint font-mono">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-4 pb-1">
          <div className="flex items-center gap-2 text-sm">
            <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
              <MapPin className="w-3.5 h-3.5" />
            </span>
            <span className="font-semibold text-ink">{itineraryCount}</span>
            <span className="text-ink-faint text-xs">trips</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">
              <Users className="w-3.5 h-3.5" />
            </span>
            <span className="font-semibold text-ink">{groupCount}</span>
            <span className="text-ink-faint text-xs">groups</span>
          </div>
        </div>
      </div>
    </div>
  </div>
)
