import React, { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Info, Compass, MapPin } from 'lucide-react'
import { PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'

import { itineraryApi } from '@/api/itinerary.api'
import { groupsApi } from '@/api/groups.api'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/app/Providers'

import { ItineraryHeader } from '../components/ItineraryHeader'
// import { TripIntelligenceSidebar } from '../components/TripIntelligenceSidebar'
import { ItineraryMap } from '../components/ItineraryMap'
import { SortableDaysList } from '../components/SortableDaysList'
import { GroupDetailSidebar } from '@/features/groups/components/GroupDetailSidebar'

type Tab = 'it' | 'mp'

const TABS: { id: Tab; label: string }[] = [
  { id: 'it', label: 'Itinerary' },
  { id: 'mp', label: 'Map' },
]

export const ItineraryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const groupId = searchParams.get('groupId')
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [tab, setTab] = useState<Tab>('it')
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

    onMutate: async ({ dayId, activityIds }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.itinerary(id!) })
      const previous = queryClient.getQueryData(QUERY_KEYS.itinerary(id!))

      queryClient.setQueryData(QUERY_KEYS.itinerary(id!), (old: typeof itinerary) => {
        if (!old?.days) return old
        return {
          ...old,
          days: old.days.map(day => {
            if (day.id !== dayId || !day.activities) return day
            const reordered = activityIds
              .map((actId, i) => {
                const act = day.activities!.find(a => a.id === actId)
                return act ? { ...act, sortOrder: i } : null
              })
              .filter(Boolean) as typeof day.activities
            return { ...day, activities: reordered }
          }),
        }
      })
      return { previous }
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(QUERY_KEYS.itinerary(id!), context.previous)
    },

    onSettled: invalidate,
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
    <div className="px-6 py-10 max-w-7xl mx-auto">
      <div className="animate-pulse space-y-6">
        <div className="h-[320px] bg-[rgba(22,24,48,0.6)] rounded-[22px]" />
        <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 340px' }}>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-[rgba(22,24,48,0.4)] rounded-[18px]" />)}
          </div>
          <div className="h-96 bg-[rgba(22,24,48,0.4)] rounded-[18px]" />
        </div>
      </div>
    </div>
  )

  if (error || !itinerary) return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <div className="bg-red-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
        <Info className="w-10 h-10 text-red-400" />
      </div>
      <h2 className="text-2xl font-bold text-[#f0eeff] mb-2">Itinerary not found</h2>
      <p className="text-[#6e6c93] mb-8">We couldn't find the itinerary you're looking for.</p>
      <Link to="/dashboard" className="text-blue-400 font-semibold hover:underline">Go back to Dashboard</Link>
    </div>
  )

  const days = itinerary.days ?? []

  const sharedListProps = {
    days,
    itineraryId: id!,
    sensors,
    addActivityDayId,
    onDragEnd: handleDragEnd,
    onAddActivity: setAddActivityDayId,
    onReorderActivities: (dayId: string, activityIds: string[]) => reorderActivitiesMutation.mutate({ dayId, activityIds }),
    onActivityUpdated: invalidate,
    onActivityDeleted: invalidate,
    onCloseAddActivity: () => setAddActivityDayId(null),
  }

  /* ── group view ── */
  if (groupId && group) return (
    <div className="px-8 py-6 pb-16">
      <nav className="flex items-center gap-2 mb-5 text-[13px] text-[#6e6c93] font-medium">
        <Link to={ROUTES.GROUPS} className="hover:text-[#a3a1c8] transition-colors">Groups</Link>
        <span className="opacity-40">/</span>
        <Link to={ROUTES.GROUP_DETAIL(group.id)} className="hover:text-[#a3a1c8] transition-colors">{group.name}</Link>
        <span className="opacity-40">/</span>
        <span className="text-[#f0eeff]">{itinerary.destination}</span>
      </nav>
      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0">
          <ItineraryHeader itinerary={itinerary} showActions={false} compact itineraryId={id} />
          <h2 className="text-xl font-semibold text-[#f0eeff] flex items-center gap-2.5 mt-6 mb-4">
            <Compass className="w-5 h-5 text-sky-400" /> Daily Route
          </h2>
          <SortableDaysList {...sharedListProps} />
        </div>
        <div className="w-80 shrink-0 sticky top-6 self-start">
          <GroupDetailSidebar
            groupId={group.id}
            members={group.members}
            currentUserRole={currentUserRole}
            inviteEmail="" isInviting={false} isRemoving={false}
            onEmailChange={() => {}} onInvite={() => {}} onRemoveMember={() => {}}
          />
        </div>
      </div>
    </div>
  )

  /* ── standard view ── */
  return (
    <div className="px-6 py-6 pb-16 max-w-[1400px] mx-auto">
      <nav className="flex items-center gap-2 mb-5 text-[13px] text-[#6e6c93] font-medium">
        <Link to="/dashboard" className="hover:text-[#a3a1c8] transition-colors">Routiq</Link>
        <span className="opacity-40">/</span>
        <Link to="/dashboard" className="hover:text-[#a3a1c8] transition-colors">Trips</Link>
        <span className="opacity-40">/</span>
        <span className="text-[#f0eeff]">{itinerary.destination}</span>
      </nav>

      <ItineraryHeader itinerary={itinerary} itineraryId={id} />

      {/* tabs */}
      <div className="flex gap-1 bg-white dark:bg-[rgba(22,24,48,0.6)] dark:backdrop-blur-xl border border-gray-200 dark:border-white/[0.07] rounded-[14px] p-1 w-fit mb-6 shadow-sm dark:shadow-none">
        {TABS.map(t => {
          const count = t.id === 'it' ? days.length : undefined
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-medium transition-all ${
                tab === t.id
                  ? 'text-white bg-gradient-to-b from-blue-500 to-blue-600 shadow-[0_4px_12px_-6px_rgba(37,99,235,0.6)]'
                  : 'text-gray-500 dark:text-[#a3a1c8] hover:text-gray-900 dark:hover:text-[#f0eeff]'
              }`}
            >
              {t.label}
              {count != null && (
                <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-white/25' : 'bg-gray-100 dark:bg-white/[0.08] text-gray-500 dark:text-inherit'}`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {tab === 'it' && (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div>
            <h2 className="flex items-center gap-2.5 text-[16px] font-semibold text-gray-900 dark:text-[#f0eeff] mb-4" style={{ letterSpacing: '-0.01em' }}>
              <span className="w-7 h-7 rounded-[9px] bg-sky-50 dark:bg-sky-400/10 text-sky-500 dark:text-sky-400 grid place-items-center flex-shrink-0">
                <Compass className="w-3.5 h-3.5" />
              </span>
              Daily Route
            </h2>
            <SortableDaysList {...sharedListProps} />
          </div>

          <aside className="hidden lg:flex flex-col gap-3.5 sticky top-5 self-start">
            <div className="bg-white dark:bg-[rgba(22,24,48,0.6)] dark:backdrop-blur-xl border border-gray-200 dark:border-white/[0.07] rounded-[18px] overflow-hidden shadow-[0_2px_12px_-4px_rgba(0,0,0,0.10),0_0_0_1px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_10px_32px_-12px_rgba(0,0,0,0.6)]">
              <div className="flex items-center gap-2.5 px-4 py-3.5">
                <div className="w-7 h-7 rounded-[9px] bg-sky-50 dark:bg-sky-400/10 grid place-items-center text-sky-500 dark:text-[#22d3ee] flex-shrink-0">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <span className="text-[14px] font-semibold text-gray-900 dark:text-[#f0eeff]">Map</span>
              </div>
              <div className="border-t border-gray-100 dark:border-white/[0.07]">
                <ItineraryMap days={days} destination={itinerary.destination} />
              </div>
            </div>
          </aside>
        </div>
      )}

      {tab === 'mp' && (
        <div
          className="bg-white dark:bg-[rgba(22,24,48,0.6)] dark:backdrop-blur-xl border border-gray-200 dark:border-white/[0.07] rounded-[18px] overflow-hidden shadow-sm dark:shadow-none flex flex-col"
          style={{ height: 'calc(100vh - 220px)', minHeight: 500 }}
        >
          <ItineraryMap days={days} destination={itinerary.destination} fullscreen />
        </div>
      )}
    </div>
  )
}
