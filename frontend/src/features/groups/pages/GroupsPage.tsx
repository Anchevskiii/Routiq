import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { groupsApi } from '@/api/groups.api'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { Users, Plus } from 'lucide-react'
import { GroupCard } from '../components/GroupCard'

export const GroupsPage: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.groups,
    queryFn: () => groupsApi.getGroups(),
  })

  const groups = data?.data || []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Travel Groups</h1>
          <p className="text-gray-600 mt-1">Collaborate with friends and family on travel plans.</p>
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
          {groups.map(group => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </div>
  )
}
