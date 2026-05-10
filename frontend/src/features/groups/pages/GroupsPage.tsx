import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { groupsApi } from '@/api/groups.api'
import { ROUTES } from '@/constants/routes'
import { Group, GroupMember } from '@/types/group.types'
import { Users, Plus, ArrowRight, Shield } from 'lucide-react'

export const GroupsPage: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['groups'],
    queryFn: () => groupsApi.getGroups(),
  })

  const groups = data?.data || []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Travel Groups</h1>
          <p className="text-gray-600 mt-1">
            Collaborate with friends and family on travel plans.
          </p>
        </div>
        <button className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all">
          <Plus className="w-5 h-5 mr-2" />
          Create New Group
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-red-50 rounded-2xl">
          <p className="text-red-600 font-medium">Failed to load groups. Please try again later.</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No groups yet</h3>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto">
            Travel is better with friends. Create a group to start planning your next collective adventure!
          </p>
          <button className="bg-primary text-white py-3 px-8 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-md">
            Create My First Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </div>
  )
}

const GroupCard: React.FC<{ group: Group }> = ({ group }) => {
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

