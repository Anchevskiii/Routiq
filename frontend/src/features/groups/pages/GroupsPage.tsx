import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { groupsApi } from '@/api/groups.api'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { Users, Plus, X, Image as ImageIcon, Mail } from 'lucide-react'
import { GroupCard } from '../components/GroupCard'
import { uploadGroupImage } from '@/utils/upload'
import toast from 'react-hot-toast'
import type { Invitation } from '@/types/group.types'

export const GroupsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [isCreating, setIsCreating] = useState(false)
  const [newGroup, setNewGroup] = useState({ name: '', description: '', themeColor: '#10b981' })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.groups,
    queryFn: () => groupsApi.getGroups(),
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      let imageUrl = undefined
      if (selectedFile) {
        imageUrl = await uploadGroupImage(selectedFile)
      }
      return groupsApi.createGroup({ ...newGroup, imageUrl })
    },
    onSuccess: () => {
      toast.success('Group created successfully!')
      setIsCreating(false)
      setNewGroup({ name: '', description: '', themeColor: '#10b981' })
      setSelectedFile(null)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groups })
    },
    onError: () => toast.error('Failed to create group'),
  })

  const { data: invitations, refetch: refetchInvitations } = useQuery({
    queryKey: ['pending-invitations'],
    queryFn: () => groupsApi.getPendingInvitations() as Promise<Invitation[]>,
  })

  const acceptMutation = useMutation({
    mutationFn: (groupId: string) => groupsApi.acceptInvitation(groupId),
    onSuccess: () => {
      toast.success('Invitation accepted!')
      refetchInvitations()
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groups })
    },
  })

  const declineMutation = useMutation({
    mutationFn: (groupId: string) => groupsApi.declineInvitation(groupId),
    onSuccess: () => {
      toast.success('Invitation declined')
      refetchInvitations()
    },
  })

  const groups = data?.data || []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Invitations Section */}
      {invitations && invitations.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Pending Invitations ({invitations.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {invitations.map((inv) => (
              <div key={inv.id} className="bg-white p-6 rounded-2xl shadow-sm border border-primary/20 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900">{inv.group.name}</h4>
                  <p className="text-xs text-gray-400">Invited by {inv.group.createdBy.name}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => acceptMutation.mutate(inv.groupId)}
                    className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all"
                  >
                    Accept
                  </button>
                  <button 
                    onClick={() => declineMutation.mutate(inv.groupId)}
                    className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Travel Groups</h1>
          <p className="text-gray-600 mt-1">Collaborate with friends and family on travel plans.</p>
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
        >
          {isCreating ? <X className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
          {isCreating ? 'Cancel' : 'Create New Group'}
        </button>
      </div>

      {isCreating && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-12 animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-xl font-bold mb-6">Create New Group</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Group Name</label>
                <input 
                  type="text" 
                  value={newGroup.name}
                  onChange={e => setNewGroup({...newGroup, name: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-primary/20 focus:bg-white outline-none transition-all"
                  placeholder="e.g. Summer Adventure 2024"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Description</label>
                <textarea 
                  value={newGroup.description}
                  onChange={e => setNewGroup({...newGroup, description: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:border-primary/20 focus:bg-white outline-none transition-all h-24"
                  placeholder="Where are we going? What's the plan?"
                />
              </div>
            </div>
            <div className="space-y-4">
               <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Theme Color</label>
                <div className="flex gap-3">
                  {['#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#06b6d4'].map(color => (
                    <button 
                      key={color}
                      onClick={() => setNewGroup({...newGroup, themeColor: color})}
                      className={`w-8 h-8 rounded-full border-4 ${newGroup.themeColor === color ? 'border-gray-200' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Group Image (Optional)</label>
                <label className="w-full h-32 flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-100 transition-all">
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                    accept="image/*"
                  />
                  {selectedFile ? (
                    <span className="text-sm font-bold text-primary truncate px-4">{selectedFile.name}</span>
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-gray-300 mb-2" />
                      <span className="text-xs text-gray-400">Click to upload image</span>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>
          <div className="mt-8 flex justify-end">
            <button 
              onClick={() => createMutation.mutate()}
              disabled={!newGroup.name || createMutation.isPending}
              className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 shadow-lg shadow-primary/20 transition-all"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </div>
      )}

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
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-primary text-white py-3 px-8 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-md"
          >
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
