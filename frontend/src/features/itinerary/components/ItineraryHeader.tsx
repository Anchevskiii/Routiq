import React from 'react'
import { format } from 'date-fns'
import { Calendar, Clock, Edit3, Share2 } from 'lucide-react'
import { Itinerary } from '@/types/itinerary.types'
import { getTravelTypeByValue } from '@/constants/travelTypes'

interface ItineraryHeaderProps {
  itinerary: Itinerary
}

export const ItineraryHeader: React.FC<ItineraryHeaderProps> = ({ itinerary }) => {
  const travelType = getTravelTypeByValue(itinerary.travelType)

  return (
    <div className="relative bg-gray-900 rounded-[2.5rem] overflow-hidden p-8 md:p-12 mb-12 shadow-2xl shadow-primary/10">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent pointer-events-none" />
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-bold mb-6 border border-white/10 uppercase tracking-widest">
            {travelType?.icon} {travelType?.label} Adventure
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight leading-[1.1]">
            {itinerary.destination}
          </h1>
          <div className="flex flex-wrap items-center text-white/70 gap-8">
            <span className="flex items-center bg-white/5 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/5">
              <Calendar className="w-5 h-5 mr-3 text-primary" />
              {format(new Date(itinerary.startDate), 'MMM d')} - {format(new Date(itinerary.endDate), 'MMM d, yyyy')}
            </span>
            <span className="flex items-center bg-white/5 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/5">
              <Clock className="w-5 h-5 mr-3 text-primary" />
              {itinerary.totalDays} Days of Discovery
            </span>
          </div>
        </div>
        <div className="flex gap-4">
          <button className="p-4 rounded-2xl bg-white/5 text-white hover:bg-white/10 transition-all border border-white/10">
            <Share2 className="w-6 h-6" />
          </button>
          <button className="flex items-center px-8 py-4 rounded-2xl bg-primary text-white font-black hover:scale-105 transition-transform shadow-lg shadow-primary/25">
            <Edit3 className="w-5 h-5 mr-3" />
            Edit Trip
          </button>
        </div>
      </div>
    </div>
  )
}
