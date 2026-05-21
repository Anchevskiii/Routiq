import React, { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Info, Compass } from 'lucide-react'
import { PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'

import { itineraryApi } from '@/api/itinerary.api'
import { groupsApi } from '@/api/groups.api'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/app/Providers'

import { ItineraryHeader } from '../components/ItineraryHeader'
import { TripIntelligenceSidebar } from '../components/TripIntelligenceSidebar'
import { ItineraryMap } from '../components/ItineraryMap'
import { SortableDaysList } from '../components/SortableDaysList'
import { GroupDetailSidebar } from '@/features/groups/components/GroupDetailSidebar'

export const ItineraryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const groupId = searchParams.get('groupId')
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [addActivityDayId, setAddActivityDayId] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const { data: itinerary, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.itinerary(id!),
    queryFn: () => itineraryApi.getItinerary(id!),
    enabled: !!id,
  })

  const { data: group } = useQuery({
    queryKey: QUERY_KEYS.group(groupId!),
    queryFn: () => groupsApi.getGroup(groupId!),
    enabled: !!groupId,
  })

  const currentMember = group?.members.find(m => m.userId === user?.id)
  const currentUserRole = currentMember?.role ?? 'MEMBER'
  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.itinerary(id!) })

  const reorderActivitiesMutation = useMutation({
    mutationFn: ({ dayId, activityIds }: { dayId: string; activityIds: string[] }) =>
      itineraryApi.reorderActivities(id!, dayId, activityIds),
    onSuccess: invalidate,
  })

  const reorderDaysMutation = useMutation({
    mutationFn: (dayIds: string[]) => itineraryApi.reorderDays(id!, dayIds),
    onMutate: async (dayIds) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.itinerary(id!) })
      const previous = queryClient.getQueryData(QUERY_KEYS.itinerary(id!))
      queryClient.setQueryData(QUERY_KEYS.itinerary(id!), (old: typeof itinerary) => {
        if (!old?.days) return old
        const reordered = dayIds
          .map((dayId, i) => { const day = old.days!.find(d => d.id === dayId); return day ? { ...day, dayNumber: i + 1 } : null })
          .filter(Boolean) as typeof old.days
        return { ...old, days: reordered }
      })
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(QUERY_KEYS.itinerary(id!), context.previous)
    },
    onSettled: invalidate,
  })

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !itinerary?.days) return
    const oldIdx = itinerary.days.findIndex(d => d.id === active.id)
    const newIdx = itinerary.days.findIndex(d => d.id === over.id)
    if (oldIdx === -1 || newIdx === -1) return
    reorderDaysMutation.mutate(arrayMove(itinerary.days, oldIdx, newIdx).map(d => d.id))
  }

  if (isLoading) return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="animate-pulse space-y-8">
        <div className="h-48 bg-gray-100 dark:bg-slate-800 rounded-[2rem]" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-gray-50 dark:bg-slate-800/50 rounded-3xl" />)}
          </div>
          <div><div className="h-96 bg-gray-50 dark:bg-slate-800/50 rounded-3xl" /></div>
        </div>
      </div>
    </div>
  )

  if (error || !itinerary) return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
        <Info className="w-10 h-10 text-red-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Itinerary not found</h2>
      <p className="text-gray-500 mb-8">We couldn't find the itinerary you're looking for.</p>
      <Link to="/dashboard" className="text-primary font-bold hover:underline">Go back to Dashboard</Link>
    </div>
  )

  const days = itinerary.days ?? []
  const sharedListProps = {
    days, itineraryId: id!, sensors, addActivityDayId,
    onDragEnd: handleDragEnd,
    onAddActivity: setAddActivityDayId,
    onReorderActivities: (dayId: string, activityIds: string[]) => reorderActivitiesMutation.mutate({ dayId, activityIds }),
    onActivityUpdated: invalidate,
    onActivityDeleted: invalidate,
    onCloseAddActivity: () => setAddActivityDayId(null),
  }

  if (groupId && group) return (
    <div className="min-h-full bg-gray-50 dark:bg-[#0a0c1e] text-gray-900 dark:text-[#f0eeff] px-8 py-6 pb-16">
      <nav className="flex items-center gap-2 mb-[22px] text-[13px] text-gray-400 dark:text-[#6e6c93] font-medium">
        <Link to={ROUTES.GROUPS} className="text-gray-400 dark:text-[#6e6c93] no-underline hover:text-[#a3a1c8] transition-colors">Groups</Link>
        <span className="opacity-40">/</span>
        <Link to={ROUTES.GROUP_DETAIL(group.id)} className="text-gray-400 dark:text-[#6e6c93] no-underline hover:text-[#a3a1c8] transition-colors">{group.name}</Link>
        <span className="opacity-40">/</span>
        <span className="text-gray-900 dark:text-[#f0eeff]">{itinerary.destination}</span>
      </nav>
      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0">
          <ItineraryHeader itinerary={itinerary} showActions={false} compact itineraryId={id} />
          <h2 className="text-2xl font-black dark:text-blue-300 tracking-tight flex items-center gap-3 mt-7 mb-4">
            <Compass className="w-7 h-7 text-primary" /> Daily Route
          </h2>
          <SortableDaysList {...sharedListProps} />
        </div>
        <div className="w-80 shrink-0 sticky top-6 self-start">
          <GroupDetailSidebar groupId={group.id} members={group.members} currentUserRole={currentUserRole}
            inviteEmail="" isInviting={false} isRemoving={false}
            onEmailChange={() => {}} onInvite={() => {}} onRemoveMember={() => {}} />
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ItineraryHeader itinerary={itinerary} itineraryId={id} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-gray-900 dark:text-blue-300 tracking-tight flex items-center gap-3">
              <Compass className="w-7 h-7 text-primary" /> Daily Route
            </h2>
          </div>
          <SortableDaysList {...sharedListProps} />
        </div>
        <div className="flex flex-col gap-6">
          <ItineraryMap days={days} destination={itinerary.destination} />
          <TripIntelligenceSidebar itinerary={itinerary} />
        </div>
      </div>
    </div>
  )
}
