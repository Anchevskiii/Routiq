import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { groupsApi } from '@/api/groups.api'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { ROUTES } from '@/constants/routes'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { Users, Plus, User, MapPin, Calendar, Trash2 } from 'lucide-react'
import { GroupItineraryCard }  from '@/features/groups/components/GroupItineraryCard'
import { GroupDetailSidebar }  from '@/features/groups/components/GroupDetailSidebar'

export const GroupDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [inviteEmail, setInviteEmail] = useState('')

  const { data: group, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.group(id!),
    queryFn: () => groupsApi.getGroup(id!),
    enabled: !!id,
  })

  const inviteMutation = useMutation({
    mutationFn: (email: string) => groupsApi.inviteMember(id!, email),
    onSuccess: () => {
      toast.success('Invitation sent successfully')
      setInviteEmail('')
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.group(id!) })
    },
    onError: () => toast.error('Failed to send invitation'),
  })

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => groupsApi.removeMember(id!, userId),
    onSuccess: () => {
      toast.success('Member removed')
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.group(id!) })
    },
    onError: () => toast.error('Failed to remove member'),
  })

  if (isLoading) return <div className="max-w-7xl mx-auto px-4 py-12 animate-pulse space-y-8">
    <div className="h-40 bg-gray-100 rounded-3xl" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 h-96 bg-gray-50 rounded-3xl" />
      <div className="h-96 bg-gray-50 rounded-3xl" />
    </div>
  </div>

  if (error || !group) return <div className="max-w-7xl mx-auto px-4 py-20 text-center">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Group not found</h2>
    <Link to={ROUTES.GROUPS} className="text-primary font-bold hover:underline">Back to Groups</Link>
  </div>

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Group Header */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <Users className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900">{group.name}</h1>
              <p className="text-gray-500 mt-1 max-w-xl">{group.description || 'No description provided.'}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-400 font-medium">
                <span className="flex items-center"><User className="w-4 h-4 mr-1" /> {group.members.length} members</span>
                <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" /> Created {format(new Date(group.createdAt), 'MMM yyyy')}</span>
              </div>
            </div>
          </div>
          <button className="flex items-center px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg">
            <Trash2 className="w-5 h-5 mr-2 text-red-400" />
            Delete Group
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Section: Shared Itineraries */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Shared Itineraries</h2>
            <button className="flex items-center text-sm font-bold text-primary hover:underline">
              <Plus className="w-4 h-4 mr-1" /> Add Itinerary
            </button>
          </div>

          {!group.itineraries || group.itineraries.length === 0 ? (
            <div className="bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900">No itineraries shared yet</h3>
              <p className="text-gray-500 mt-1">Start collaborating by adding your first itinerary to this group.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {group.itineraries.map((groupItinerary) => (
                <GroupItineraryCard key={groupItinerary.id} groupItinerary={groupItinerary} />
              ))}
            </div>
          )}
        </div>

        <GroupDetailSidebar
          members={group.members}
          inviteEmail={inviteEmail}
          isInviting={inviteMutation.isPending}
          isRemoving={removeMemberMutation.isPending}
          onEmailChange={setInviteEmail}
          onInvite={() => inviteMutation.mutate(inviteEmail)}
          onRemoveMember={(userId) => removeMemberMutation.mutate(userId)}
        />
      </div>
    </div>
  )
}


