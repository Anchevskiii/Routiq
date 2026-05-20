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
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Add Itinerary</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-50 rounded-2xl" />
              ))}
            </div>
          ) : itineraries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">You don't have any itineraries yet.</p>
            </div>
          ) : (
            itineraries.map((itinerary: Itinerary) => (
              <button
                key={itinerary.id}
                onClick={() => onAdd(itinerary.id)}
                disabled={isSubmitting}
                className="w-full text-left p-6 bg-gray-50 rounded-2xl border-2 border-transparent hover:border-primary/30 hover:bg-white hover:shadow-md transition-all flex items-center justify-between group"
              >
                <div>
                  <h4 className="font-bold text-gray-900 group-hover:text-primary transition-colors">{itinerary.destination}</h4>
                  <div className="flex items-center text-xs text-gray-400 mt-1 gap-3">
                    <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {format(new Date(itinerary.startDate), 'MMM d')}</span>
                    <span>{itinerary.totalDays} days</span>
                  </div>
                </div>
                <MapPin className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
