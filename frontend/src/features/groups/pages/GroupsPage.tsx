import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { groupsApi } from '@/api/groups.api'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { Users, Plus } from 'lucide-react'
import { GroupCard } from '../components/GroupCard'
import { CreateGroupModal } from '../components/CreateGroupModal'
import toast from 'react-hot-toast'
import type { Invitation } from '@/types/group.types'
import { useAuth } from '@/app/Providers'

export const GroupsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.groups,
    queryFn: () => groupsApi.getGroups(),
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
    onSuccess: () => { toast.success('Invitation declined'); refetchInvitations() },
  })

  const groups = data?.data ?? []

  return (
    <div className="min-h-full bg-gray-50 dark:bg-[#0a0c1e] text-gray-900 dark:text-[#f0eeff] px-8 py-6 pb-16">

      {/* Pending invitations */}
      {invitations && invitations.length > 0 && (
        <section className="mb-8">
          <h2 className="m-0 mb-3.5 text-[15px] font-semibold text-gray-500 dark:text-[#a3a1c8] tracking-tight">
            Pending Invitations ({invitations.length})
          </h2>
          <div className="flex flex-col gap-2.5">
            {invitations.map(inv => (
              <div key={inv.id} className="grp-panel rounded-2xl px-[18px] py-3.5 flex items-center gap-3.5 border border-gray-200 dark:border-white/[0.07]">
                <div className="grp-aurora w-[38px] h-[38px] rounded-xl grid place-items-center shrink-0">
                  <Users size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="m-0 text-sm font-semibold text-gray-900 dark:text-[#f0eeff]">{inv.group.name}</p>
                  <p className="m-0 text-xs text-gray-400 dark:text-[#6e6c93] mt-0.5">Invited by {inv.group.createdBy.name}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => acceptMutation.mutate(inv.groupId)} className="grp-aurora px-3.5 py-2 rounded-[9px] border-none text-white text-xs font-semibold cursor-pointer">
                    Accept
                  </button>
                  <button onClick={() => declineMutation.mutate(inv.groupId)} className="px-3.5 py-2 rounded-[9px] border border-white/[0.1] bg-gray-100/50 dark:bg-white/[0.03] text-gray-500 dark:text-[#a3a1c8] text-xs font-medium cursor-pointer hover:bg-gray-200/50 dark:bg-white/[0.06] transition-colors">
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between mb-[22px]">
        <div>
          <h1 className="m-0 text-[28px] font-semibold text-gray-900 dark:text-[#f0eeff] tracking-[-0.025em]">Travel Groups</h1>
          <p className="m-0 mt-1 text-sm text-gray-400 dark:text-[#6e6c93]">Collaborate with friends on shared adventures.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="grp-aurora inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-none text-white text-[13px] font-semibold cursor-pointer shadow-[0_8px_22px_-8px_rgba(37,99,235,0.6)]"
        >
          <Plus size={15} /> Create Group
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-[18px]">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 rounded-[20px] bg-[rgba(22,24,48,0.4)] animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="grp-panel rounded-[18px] border border-gray-200 dark:border-white/[0.07] px-6 py-8 text-center">
          <p className="m-0 text-sm text-red-400">Failed to load groups. Please try again.</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="grp-panel rounded-[20px] border border-gray-200 dark:border-white/[0.07] py-16 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100/60 dark:bg-white/[0.04] grid place-items-center mx-auto mb-4">
            <Users size={28} className="text-gray-400 dark:text-[#6e6c93]" />
          </div>
          <h3 className="m-0 mb-2 text-[18px] font-semibold text-gray-900 dark:text-[#f0eeff]">No groups yet</h3>
          <p className="m-0 mb-6 text-sm text-gray-400 dark:text-[#6e6c93] max-w-xs mx-auto">
            Travel is better with friends. Create a group to start planning together.
          </p>
          <button onClick={() => setShowCreateModal(true)} className="grp-aurora px-6 py-2.5 rounded-[11px] border-none text-white text-[13px] font-semibold cursor-pointer">
            Create My First Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-[18px]">
          {groups.map(group => <GroupCard key={group.id} group={group} currentUserId={user?.id} />)}
        </div>
      )}

      {showCreateModal && <CreateGroupModal onClose={() => setShowCreateModal(false)} />}
    </div>
  )
}
