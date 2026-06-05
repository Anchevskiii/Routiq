import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { groupsApi } from '@/api/groups.api'
import { Bell, Users, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Invitation } from '@/types/group.types'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { initials, avatarGrad } from '@/utils/avatar.utils'

export const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient()

  const { data: invitations, isLoading, refetch } = useQuery({
    queryKey: ['pending-invitations'],
    queryFn: () => groupsApi.getPendingInvitations() as Promise<Invitation[]>,
  })

  const acceptMutation = useMutation({
    mutationFn: (groupId: string) => groupsApi.acceptInvitation(groupId),
    onSuccess: () => {
      toast.success('Invitation accepted!')
      refetch()
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groups })
    },
    onError: () => toast.error('Failed to accept invitation'),
  })

  const declineMutation = useMutation({
    mutationFn: (groupId: string) => groupsApi.declineInvitation(groupId),
    onSuccess: () => { toast.success('Invitation declined'); refetch() },
    onError: () => toast.error('Failed to decline invitation'),
  })

  const busy = acceptMutation.isPending || declineMutation.isPending

  return (
    <div className="min-h-full bg-gray-50 dark:bg-[#0a0c1e] text-gray-900 dark:text-[#f0eeff] px-4 py-6 pb-16 sm:px-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="grp-aurora w-10 h-10 rounded-xl grid place-items-center shadow-[0_8px_20px_-6px_rgba(37,99,235,0.6)]">
          <Bell size={18} className="text-white" />
        </div>
        <div>
          <h1 className="m-0 text-2xl font-semibold text-gray-900 dark:text-[#f0eeff] tracking-tight">Notifications</h1>
          <p className="m-0 text-[13px] text-gray-400 dark:text-[#6e6c93]">Group invitations and activity</p>
        </div>
      </div>

      {(() => {
        if (isLoading) {
          return (
            <div className="flex flex-col gap-2.5">
              {[1, 2, 3].map(num => (
                <div key={`notif-skeleton-${num}`} className="h-20 rounded-2xl bg-[rgba(22,24,48,0.4)] animate-pulse" />
              ))}
            </div>
          )
        }
        if (!invitations || invitations.length === 0) {
          return (
            <div className="grp-panel rounded-[20px] border border-gray-200 dark:border-white/[0.07] py-16 px-6 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100/60 dark:bg-white/[0.04] grid place-items-center mx-auto mb-3.5">
                <Bell size={24} className="text-gray-400 dark:text-[#6e6c93]" />
              </div>
              <h3 className="m-0 mb-1.5 text-base font-semibold text-gray-900 dark:text-[#f0eeff]">No notifications</h3>
              <p className="m-0 text-[13px] text-gray-400 dark:text-[#6e6c93]">You're all caught up! No pending group invitations.</p>
            </div>
          )
        }
        return (
          <>
            <p className="m-0 mb-3.5 text-[13px] text-gray-400 dark:text-[#6e6c93]">
              {invitations.length} pending invitation{invitations.length === 1 ? '' : 's'}
            </p>
            <div className="flex flex-col gap-2.5">
              {invitations.map(inv => (
                <div key={inv.id} className="grp-panel rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 border border-gray-200 dark:border-white/[0.07]">
                  <div className={`w-11 h-11 rounded-[14px] bg-gradient-to-br ${avatarGrad(inv.group.createdBy.name)} grid place-items-center text-sm font-bold text-white shrink-0`}>
                    {initials(inv.group.createdBy.name)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="m-0 text-sm text-gray-900 dark:text-[#f0eeff] leading-snug">
                      <strong className="font-semibold">{inv.group.createdBy.name}</strong>
                      {' '}invited you to join{' '}
                      <strong className="font-semibold">{inv.group.name}</strong>
                    </p>
                    <p className="m-0 mt-1 flex items-center gap-1.5 text-xs text-gray-400 dark:text-[#6e6c93]">
                      <Users size={11} strokeWidth={1.8} /> Group invitation
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => acceptMutation.mutate(inv.groupId)}
                      disabled={busy}
                      className="grp-aurora inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-4 py-[9px] rounded-[10px] border-none text-white text-[13px] font-semibold cursor-pointer disabled:opacity-60 shadow-[0_6px_16px_-6px_rgba(37,99,235,0.6)]"
                    >
                      <Check size={13} strokeWidth={2.5} /> Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => declineMutation.mutate(inv.groupId)}
                      disabled={busy}
                      className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto px-4 py-[9px] rounded-[10px] border border-white/[0.1] bg-gray-100/50 dark:bg-white/[0.03] text-gray-500 dark:text-[#a3a1c8] text-[13px] font-medium cursor-pointer disabled:opacity-60 hover:bg-gray-200/50 dark:bg-white/[0.06] transition-colors"
                    >
                      <X size={13} /> Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )
      })()}
    </div>
  )
}
