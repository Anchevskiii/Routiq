import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { itineraryApi } from '@/api/itinerary.api'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { format, differenceInDays } from 'date-fns'
import { Calendar, MapPin } from 'lucide-react'
import type { Itinerary } from '@/types/itinerary.types'

interface Props {
  selectedIds: Set<string>
  onToggle: (id: string) => void
}

export const CreateGroupItinerariesStep: React.FC<Props> = ({ selectedIds, onToggle }) => {
  const { data: itinData, isLoading } = useQuery({
    queryKey: QUERY_KEYS.itineraries,
    queryFn: () => itineraryApi.listItineraries({ limit: 100 }),
  })
  const itineraries: Itinerary[] = itinData?.data ?? []

  if (isLoading) return (
    <div className="flex flex-col gap-3">
      {[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-white/[0.04] animate-pulse" />)}
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      <p className="m-0 text-[13px] text-gray-500 dark:text-[#a3a1c8]">Select itineraries to share. You can add more later.</p>
      {itineraries.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-gray-400 dark:text-[#6e6c93]">No itineraries found. You can skip this step.</p>
      ) : (
        itineraries.map(it => {
          const selected = selectedIds.has(it.id)
          const days = differenceInDays(new Date(it.endDate), new Date(it.startDate)) + 1
          return (
            <button
              key={it.id}
              onClick={() => onToggle(it.id)}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-left cursor-pointer transition-all border ${selected ? 'border-blue-500/50 bg-blue-500/[0.06]' : 'border-gray-200 dark:border-white/[0.07] bg-white/50 dark:bg-white/[0.02] hover:bg-gray-100/60 dark:hover:bg-white/[0.04]'}`}
            >
              <div className={`w-9 h-9 rounded-[10px] grid place-items-center shrink-0 border border-gray-200 dark:border-white/[0.07] ${selected ? 'grp-aurora' : 'bg-gray-200/50 dark:bg-white/[0.06]'}`}>
                <MapPin size={14} className={selected ? 'text-white' : 'text-gray-400 dark:text-[#6e6c93]'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`m-0 text-[13px] font-semibold truncate ${selected ? 'text-gray-900 dark:text-[#f0eeff]' : 'text-gray-700 dark:text-[#d8d4ff]'}`}>{it.destination}</p>
                <div className="flex gap-2 mt-0.5">
                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 dark:text-[#6e6c93]">
                    <Calendar size={10} /> {format(new Date(it.startDate), 'MMM d')}
                  </span>
                  <span className="text-[11px] text-gray-400 dark:text-[#6e6c93]">{days} days</span>
                </div>
              </div>
              {selected && (
                <div className="w-5 h-5 rounded-full bg-blue-500 grid place-items-center shrink-0">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </button>
          )
        })
      )}
    </div>
  )
}
