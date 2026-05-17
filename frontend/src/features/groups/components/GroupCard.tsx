import React from 'react'
import { Link } from 'react-router-dom'
import { Users, ArrowRight, Shield } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import type { Group, GroupMember } from '@/types/group.types'

interface Props {
  group: Group
}

export const GroupCard: React.FC<Props> = ({ group }) => {
  const memberCount = group.members?.length || 0
  const owner = group.members?.find((m: GroupMember) => m.role === 'OWNER')?.user

  return (
    <Link
      to={ROUTES.GROUP_DETAIL(group.id)}
      className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:border-primary/30 transition-all transform hover:-translate-y-1"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
          <Users className="w-6 h-6" />
        </div>
        <div className="flex -space-x-2">
          {group.members?.slice(0, 3).map((member: GroupMember, i: number) => (
            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 overflow-hidden">
              {member.user.avatarUrl ? (
                <img src={member.user.avatarUrl} alt={member.user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-400">
                  {member.user.name.charAt(0)}
                </div>
              )}
            </div>
          ))}
          {memberCount > 3 && (
            <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400">
              +{memberCount - 3}
            </div>
          )}
        </div>
      </div>

      <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors mb-2">
        {group.name}
      </h3>
      <p className="text-gray-500 text-sm mb-6 line-clamp-2">
        {group.description || 'No description provided for this group.'}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
        <div className="flex items-center text-xs text-gray-400 font-medium">
          <Shield className="w-3.5 h-3.5 mr-1" />
          Admin: {owner?.name || 'Unknown'}
        </div>
        <div className="text-primary font-bold text-sm flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          Join <ArrowRight className="w-4 h-4 ml-1" />
        </div>
      </div>
    </Link>
  )
}
