import React, { useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { groupsApi } from '@/api/groups.api'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { ROUTES } from '@/constants/routes'
import toast from 'react-hot-toast'
import { useAuth } from '@/app/Providers'
import { GroupDetailSidebar } from '@/features/groups/components/GroupDetailSidebar'
import { GroupHeader } from '@/features/groups/components/GroupHeader'
import { GroupItinerariesTab } from '@/features/groups/components/GroupItinerariesTab'
import { AddItineraryModal } from '@/features/groups/components/AddItineraryModal'
import type { GroupRole } from '@/types/group.types'

export const GroupDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [inviteEmail, setInviteEmail]           = useState('')
  const [isAddItineraryOpen, setAddItinerary]   = useState(false)
  const [toastDismissed, setToastDismissed]     = useState(false)

  const { data: group, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.group(id!),
    queryFn: () => groupsApi.getGroup(id!),
    enabled: !!id,
  })

  const inviteMutation = useMutation({
    mutationFn: (email: string) => groupsApi.inviteMember(id!, email),
    onSuccess: () => {
      toast.success('Invitation sent')
      setInviteEmail('')
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.group(id!) })
    },
    onError: () => toast.error('Failed to send invitation'),
  })

  const addItineraryMutation = useMutation({
    mutationFn: (itineraryId: string) => groupsApi.addItineraryToGroup(id!, itineraryId),
    onSuccess: () => {
      toast.success('Itinerary added')
      setAddItinerary(false)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.group(id!) })
    },
    onError: () => toast.error('Failed to add itinerary'),
  })

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => groupsApi.removeMember(id!, userId),
    onSuccess: () => {
      toast.success('Member removed')
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.group(id!) })
    },
    onError: () => toast.error('Failed to remove member'),
  })

  const currentMember    = group?.members.find(m => m.userId === user?.id)
  const currentUserRole: GroupRole = currentMember?.role ?? 'MEMBER'
  const sortedItineraries = useMemo(
    () => [...(group?.itineraries ?? [])].sort((a, b) => b.score - a.score),
    [group?.itineraries],
  )

  if (isLoading) return <GroupDetailSkeleton />

  if (error || !group) return (
    <div className="min-h-full bg-gray-50 dark:bg-[#0a0c1e] flex flex-col items-center justify-center gap-4 py-20">
      <span className="text-lg font-semibold text-gray-900 dark:text-[#f0eeff]">Group not found</span>
      <Link to={ROUTES.GROUPS} className="text-[#3b82f6] text-sm no-underline">← Back to Groups</Link>
    </div>
  )

  return (
    <div className="min-h-full bg-gray-50 dark:bg-[#0a0c1e] text-gray-900 dark:text-[#f0eeff] px-8 py-6 pb-16">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 mb-[18px] text-[13px] text-gray-400 dark:text-[#6e6c93] font-medium">
        <Link to={ROUTES.GROUPS} className="text-gray-400 dark:text-[#6e6c93] no-underline hover:text-gray-500 dark:text-[#a3a1c8] transition-colors">Groups</Link>
        <span className="opacity-40">/</span>
        <span className="text-gray-900 dark:text-[#f0eeff]">{group.name}</span>
      </nav>

      <GroupHeader
        group={group}
        onImport={() => setAddItinerary(true)}
        onGenerate={() => navigate(`${ROUTES.PLANNER}?groupId=${id}`)}
      />

      {/* Main layout */}
      <div className="flex gap-6 items-start">

        {/* Left — content */}
        <div className="flex-1 min-w-0">
          <GroupItinerariesTab
            itineraries={sortedItineraries}
            currentUserRole={currentUserRole}
            currentUserId={user?.id}
            toastDismissed={toastDismissed}
            onDismissToast={() => setToastDismissed(true)}
            onAddItinerary={() => setAddItinerary(true)}
          />
        </div>

        {/* Right rail */}
        <div className="w-80 shrink-0 sticky top-6 self-start">
          <GroupDetailSidebar
            groupId={group.id}
            members={group.members}
            currentUserRole={currentUserRole}
            inviteEmail={inviteEmail}
            isInviting={inviteMutation.isPending}
            isRemoving={removeMemberMutation.isPending}
            onEmailChange={setInviteEmail}
            onInvite={() => inviteMutation.mutate(inviteEmail)}
            onRemoveMember={userId => removeMemberMutation.mutate(userId)}
          />
        </div>
      </div>

      {isAddItineraryOpen && (
        <AddItineraryModal
          onClose={() => setAddItinerary(false)}
          onAdd={itineraryId => addItineraryMutation.mutate(itineraryId)}
          isSubmitting={addItineraryMutation.isPending}
        />
      )}
    </div>
  )
}

function GroupDetailSkeleton() {
  return (
    <div className="min-h-full bg-gray-50 dark:bg-[#0a0c1e] px-8 py-6 pb-16">
      <div className="h-[220px] rounded-[22px] bg-[rgba(22,24,48,0.4)] mb-[22px] animate-pulse" />
      <div className="flex gap-6">
        <div className="flex-1 h-96 rounded-[18px] bg-[rgba(22,24,48,0.4)] animate-pulse" />
        <div className="w-80 h-96 rounded-[18px] bg-[rgba(22,24,48,0.4)] animate-pulse" />
      </div>
    </div>
  )
}

