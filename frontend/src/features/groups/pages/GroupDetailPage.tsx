import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { groupsApi } from '@/api/groups.api'
import { ROUTES } from '@/constants/routes'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { Users, Plus, Shield, User, MapPin, Calendar, MessageSquare, ThumbsUp, Trash2, Mail, ExternalLink } from 'lucide-react'
import type { GroupItinerary } from '@/types/group.types'

export const GroupDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [inviteEmail, setInviteEmail] = useState('')

  const { data: group, isLoading, error } = useQuery({
    queryKey: ['group', id],
    queryFn: () => groupsApi.getGroup(id!),
    enabled: !!id,
  })

  const inviteMutation = useMutation({
    mutationFn: (email: string) => groupsApi.inviteMember(id!, email),
    onSuccess: () => {
      toast.success('Invitation sent successfully')
      setInviteEmail('')
      queryClient.invalidateQueries({ queryKey: ['group', id] })
    },
    onError: () => toast.error('Failed to send invitation'),
  })

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => groupsApi.removeMember(id!, userId),
    onSuccess: () => {
      toast.success('Member removed')
      queryClient.invalidateQueries({ queryKey: ['group', id] })
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
                <ItineraryCard key={groupItinerary.id} groupItinerary={groupItinerary} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: Members & Invite */}
        <div className="space-y-8">
          {/* Invite Section */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Invite Members</h3>
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                />
              </div>
              <button
                onClick={() => inviteMutation.mutate(inviteEmail)}
                disabled={!inviteEmail || inviteMutation.isPending}
                className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md"
              >
                {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </div>

          {/* Members List */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-50">
              <h3 className="text-xl font-bold text-gray-900">Members</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {group.members.map((member) => (
                <div key={member.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                      {member.user.avatarUrl ? (
                        <img src={member.user.avatarUrl} alt={member.user.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400 uppercase">
                          {member.user.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        {member.user.name}
                        {member.role === 'ADMIN' && <Shield className="w-3.5 h-3.5 text-primary" />}
                      </div>
                      <div className="text-xs text-gray-400 font-medium">{member.user.email}</div>
                    </div>
                  </div>
                  {member.role !== 'ADMIN' && (
                    <button
                      onClick={() => removeMemberMutation.mutate(member.userId)}
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const ItineraryCard: React.FC<{ groupItinerary: GroupItinerary }> = ({ groupItinerary }) => {
  const { itinerary } = groupItinerary
  
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
      <div className="p-8">
        <div className="flex justify-between items-start mb-6">
          <div className="flex gap-4">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-gray-100">
              📍
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{itinerary.destination}</h3>
              <div className="flex items-center text-sm text-gray-500 mt-1 gap-4">
                <span className="flex items-center"><Calendar className="w-4 h-4 mr-1 text-primary" /> {format(new Date(itinerary.startDate), 'MMM d')} - {format(new Date(itinerary.endDate), 'MMM d')}</span>
                <span className="flex items-center"><User className="w-4 h-4 mr-1 text-primary" /> Added by {itinerary.user.name}</span>
              </div>
            </div>
          </div>
          <Link
            to={ROUTES.ITINERARY(itinerary.id)}
            className="p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-primary hover:bg-primary/10 transition-all"
          >
            <ExternalLink className="w-5 h-5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button className="flex items-center justify-center gap-2 py-3 bg-gray-50 rounded-2xl font-bold text-gray-600 hover:bg-primary/5 hover:text-primary transition-all">
            <ThumbsUp className="w-5 h-5" />
            <span>{groupItinerary._count?.votes || 0} Votes</span>
          </button>
          <button className="flex items-center justify-center gap-2 py-3 bg-gray-50 rounded-2xl font-bold text-gray-600 hover:bg-primary/5 hover:text-primary transition-all">
            <MessageSquare className="w-5 h-5" />
            <span>{groupItinerary._count?.comments || 0} Comments</span>
          </button>
        </div>
      </div>
    </div>
  )
}

