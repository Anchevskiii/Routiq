import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Info, Compass } from 'lucide-react'

import { itineraryApi } from '@/api/itinerary.api'
import { Day } from '@/types/itinerary.types'

import { DayCard } from '../components/DayCard'
import { ItineraryHeader } from '../components/ItineraryHeader'
import { TripIntelligenceSidebar } from '../components/TripIntelligenceSidebar'
import { ItineraryMap } from '../components/ItineraryMap'

export const ItineraryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  const { data: itinerary, isLoading, error } = useQuery({
    queryKey: ['itinerary', id],
    queryFn: () => itineraryApi.getItinerary(id!),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-48 bg-gray-100 dark:bg-slate-800 rounded-[2rem]" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-40 bg-gray-50 dark:bg-slate-800/50 rounded-3xl" />
              ))}
            </div>
            <div className="space-y-6">
              <div className="h-96 bg-gray-50 dark:bg-slate-800/50 rounded-3xl" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !itinerary) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Info className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Itinerary not found</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          We couldn't find the itinerary you're looking for. It might have been deleted or the link is incorrect.
        </p>
        <Link to="/dashboard" className="text-primary font-bold hover:underline">
          Go back to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ItineraryHeader itinerary={itinerary} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content: Days */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-gray-900 dark:text-indigo-100 tracking-tight flex items-center gap-3">
              <Compass className="w-7 h-7 text-primary" />
              Daily Route
            </h2>
            <button className="text-sm font-bold text-primary hover:underline">
              Expand All
            </button>
          </div>
          
          <div className="space-y-2">
            {itinerary.days?.map((day: Day, index: number) => (
              <DayCard 
                key={day.id} 
                day={day} 
                isInitiallyExpanded={index === 0} 
              />
            ))}
          </div>
        </div>

        {/* Sidebar: Map + Summary */}
        <div className="flex flex-col gap-6">
          <ItineraryMap days={itinerary.days ?? []} destination={itinerary.destination} />
          <TripIntelligenceSidebar itinerary={itinerary} />
        </div>
      </div>
    </div>
  )
}
