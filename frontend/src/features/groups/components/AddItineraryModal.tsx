import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { itineraryApi } from '@/api/itinerary.api'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { X, MapPin, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import type { Itinerary } from '@/types/itinerary.types'

interface Props {
  onClose: () => void
  onAdd: (itineraryId: string) => void
  isSubmitting: boolean
}

export const AddItineraryModal: React.FC<Props> = ({ onClose, onAdd, isSubmitting }) => {
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.itineraries,
    queryFn: () => itineraryApi.listItineraries(),
  })

  const itineraries = data?.data || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[rgba(22,24,48,0.95)] dark:backdrop-blur-xl border border-gray-200 dark:border-white/[0.07] w-full max-w-lg rounded-[22px] shadow-2xl dark:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_24px_48px_-12px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-gray-100 dark:border-white/[0.07] flex items-center justify-between">
          <h2 className="text-[20px] font-semibold text-gray-900 dark:text-[#f0eeff]" style={{ letterSpacing: '-0.01em' }}>Add Itinerary</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/[0.06] rounded-full transition-all text-gray-500 dark:text-[#a3a1c8]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {isLoading ? (
            <div className="animate-pulse space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 dark:bg-white/[0.04] rounded-[14px]" />
              ))}
            </div>
          ) : itineraries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-[#6e6c93]">You don't have any itineraries yet.</p>
            </div>
          ) : (
            itineraries.map((itinerary: Itinerary) => (
              <button
                key={itinerary.id}
                onClick={() => onAdd(itinerary.id)}
                disabled={isSubmitting}
                className="w-full text-left px-4 py-3.5 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.07] rounded-[14px] hover:bg-sky-50/60 dark:hover:bg-sky-400/[0.06] hover:border-sky-200 dark:hover:border-sky-400/30 transition-all flex items-center justify-between group disabled:opacity-50"
              >
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-[#f0eeff] group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">{itinerary.destination}</h4>
                  <div className="flex items-center text-[12px] text-gray-400 dark:text-[#6e6c93] mt-1 gap-3 font-mono">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(itinerary.startDate), 'MMM d, yyyy')}</span>
                    <span>{itinerary.totalDays} days</span>
                  </div>
                </div>
                <MapPin className="w-4 h-4 text-gray-300 dark:text-[#6e6c93] group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors flex-shrink-0" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
