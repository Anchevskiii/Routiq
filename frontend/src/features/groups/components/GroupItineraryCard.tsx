import React from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { Calendar, User, ExternalLink, ThumbsUp, MessageSquare } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import type { GroupItinerary } from '@/types/group.types'

interface Props {
  groupItinerary: GroupItinerary
}

export const GroupItineraryCard: React.FC<Props> = ({ groupItinerary }) => {
  const { itinerary } = groupItinerary

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
      <div className="p-8">
        <div className="flex justify-between items-start mb-6">
          <div className="flex gap-4">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-gray-100">
              📍
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{itinerary.destination}</h3>
              <div className="flex items-center text-sm text-gray-500 mt-1 gap-4">
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1 text-primary" />
                  {format(new Date(itinerary.startDate), 'MMM d')} – {format(new Date(itinerary.endDate), 'MMM d')}
                </span>
                <span className="flex items-center">
                  <User className="w-4 h-4 mr-1 text-primary" />
                  Added by {itinerary.user.name}
                </span>
              </div>
            </div>
          </div>
          <Link
            to={ROUTES.ITINERARY(itinerary.id)}
            className="p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-primary hover:bg-primary/10 transition-all"
          >
            <ExternalLink className="w-5 h-5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button className="flex items-center justify-center gap-2 py-3 bg-gray-50 rounded-2xl font-bold text-gray-600 hover:bg-primary/5 hover:text-primary transition-all">
            <ThumbsUp className="w-5 h-5" />
            <span>{groupItinerary._count?.votes || 0} Votes</span>
          </button>
          <button className="flex items-center justify-center gap-2 py-3 bg-gray-50 rounded-2xl font-bold text-gray-600 hover:bg-primary/5 hover:text-primary transition-all">
            <MessageSquare className="w-5 h-5" />
            <span>{groupItinerary._count?.comments || 0} Comments</span>
          </button>
        </div>
      </div>
    </div>
  )
}
