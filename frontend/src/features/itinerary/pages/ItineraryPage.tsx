import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { itineraryApi } from '@/api/itinerary.api'
import { getTravelTypeByValue } from '@/constants/travelTypes'
import { format } from 'date-fns'
import { Calendar, MapPin, Clock, Info, ChevronRight, Share2, Printer, Edit3 } from 'lucide-react'

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
          <div className="h-32 bg-gray-100 rounded-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-50 rounded-2xl" />
              ))}
            </div>
            <div className="space-y-4">
              <div className="h-96 bg-gray-50 rounded-2xl" />
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

  const travelType = getTravelTypeByValue(itinerary.travelType)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold mb-4">
              {travelType?.icon} {travelType?.label} Adventure
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{itinerary.destination}</h1>
            <div className="flex flex-wrap items-center text-gray-500 gap-6">
              <span className="flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-primary" />
                {format(new Date(itinerary.startDate), 'MMMM d')} - {format(new Date(itinerary.endDate), 'MMMM d, yyyy')}
              </span>
              <span className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-primary" />
                {itinerary.days?.length || 0} Days
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600">
              <Printer className="w-5 h-5" />
            </button>
            <button className="flex items-center px-6 py-3 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors">
              <Edit3 className="w-5 h-5 mr-2" />
              Edit Trip
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Days */}
        <div className="lg:col-span-2 space-y-8">
          {itinerary.days?.map((day: any) => (
            <div key={day.day} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Day {day.day}</h3>
                  <p className="text-sm text-gray-500 font-medium">
                    {format(new Date(day.date), 'EEEE, MMMM do')}
                  </p>
                </div>
                <div className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-bold text-primary shadow-sm">
                  {day.theme}
                </div>
              </div>
              <div className="p-8 space-y-8">
                {day.activities?.map((activity: any, idx: number) => (
                  <div key={idx} className="relative pl-8 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-0.5 before:bg-gray-100 last:before:hidden">
                    <div className="absolute left-[-4px] top-2 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary/10" />
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="w-24 flex-shrink-0 pt-1">
                        <span className="text-sm font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-md">{activity.time}</span>
                      </div>
                      <div className="flex-grow">
                        <h4 className="text-lg font-bold text-gray-900 mb-1">{activity.title}</h4>
                        <p className="text-gray-600 text-sm leading-relaxed mb-3">{activity.description}</p>
                        <div className="flex flex-wrap gap-4 text-xs font-semibold">
                          <span className="flex items-center text-gray-500">
                            <MapPin className="w-3.5 h-3.5 mr-1 text-primary" />
                            {activity.location}
                          </span>
                          <span className="flex items-center text-gray-500">
                            <Clock className="w-3.5 h-3.5 mr-1 text-primary" />
                            {activity.duration}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar: Summary & Info */}
        <div className="space-y-8">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sticky top-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Trip Overview</h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">Destination</div>
                  <div className="text-sm text-gray-500">{itinerary.destination}</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">Duration</div>
                  <div className="text-sm text-gray-500">{itinerary.days?.length} days of exploration</div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-100">
              <h4 className="text-sm font-bold text-gray-900 mb-4">Quick Links</h4>
              <div className="space-y-2">
                <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-600 flex items-center justify-between group">
                  Weather Forecast <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary" />
                </button>
                <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-600 flex items-center justify-between group">
                  Nearby Attractions <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary" />
                </button>
                <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-600 flex items-center justify-between group">
                  Local Food Guide <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

