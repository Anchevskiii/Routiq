import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { getTravelTypeByValue } from '@/constants/travelTypes'
import { format } from 'date-fns'
import { Calendar, MapPin, Users, Share2, Plus, ArrowRight } from 'lucide-react'
import { itineraryApi } from '@/api/itinerary.api'
import type { Itinerary } from '@/types/itinerary.types'

export const DashboardPage: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['itineraries', { limit: 5 }],
    queryFn: () => itineraryApi.listItineraries({ limit: 5 }),
  })

  const itineraries = data?.data || []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back!</h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your travel plans.
          </p>
        </div>
        <Link
          to={ROUTES.PLANNER}
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="w-5 h-5 mr-2" />
          Plan New Trip
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatsCard 
          icon={<Calendar className="w-6 h-6 text-primary" />} 
          label="Total Itineraries" 
          value={data?.meta?.total || 0} 
          color="bg-primary/10"
        />
        <StatsCard 
          icon={<MapPin className="w-6 h-6 text-green-600" />} 
          label="Places Explored" 
          value={itineraries.length} 
          color="bg-green-50"
        />
        <StatsCard 
          icon={<Users className="w-6 h-6 text-blue-600" />} 
          label="Travel Groups" 
          value={0} 
          color="bg-blue-50"
        />
        <StatsCard 
          icon={<Share2 className="w-6 h-6 text-purple-600" />} 
          label="Shared Plans" 
          value={0} 
          color="bg-purple-50"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Recent Itineraries</h2>
          <Link to={ROUTES.DASHBOARD} className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center">
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        
        <div className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-50 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 bg-red-50 rounded-xl">
              <p className="text-red-600 font-medium">Failed to load itineraries. Please try again later.</p>
            </div>
          ) : itineraries.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No itineraries yet</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                You haven't created any travel plans yet. Start your first adventure with our AI planner!
              </p>
              <Link
                to={ROUTES.PLANNER}
                className="inline-flex items-center text-primary font-bold hover:underline"
              >
                Plan your first trip <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {itineraries.map((itinerary) => (
                <ItineraryListItem key={itinerary.id} itinerary={itinerary} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface StatsCardProps {
  icon: React.ReactNode
  label: string
  value: number | string
  color: string
}

const StatsCard: React.FC<StatsCardProps> = ({ icon, label, value, color }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-all hover:shadow-md">
    <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
      {icon}
    </div>
    <div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500 font-medium">{label}</div>
    </div>
  </div>
)

const ItineraryListItem: React.FC<{ itinerary: Itinerary }> = ({ itinerary }) => {
  const travelType = getTravelTypeByValue(itinerary.travelType)
  
  return (
    <Link 
      to={ROUTES.ITINERARY(itinerary.id)}
      className="group flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-all"
    >
      <div className="flex items-center gap-4 mb-4 md:mb-0">
        <div className="text-3xl bg-white w-14 h-14 rounded-lg shadow-sm flex items-center justify-center border border-gray-50 group-hover:scale-110 transition-transform">
          {travelType?.icon || '📍'}
        </div>
        <div>
          <h4 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">
            {itinerary.destination}
          </h4>
          <div className="flex items-center text-sm text-gray-500 mt-1 gap-3">
            <span className="flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1" />
              {format(new Date(itinerary.startDate), 'MMM d')} - {format(new Date(itinerary.endDate), 'MMM d, yyyy')}
            </span>
            <span className="flex items-center capitalize">
              <div className={`w-2 h-2 rounded-full mr-1.5 bg-${travelType?.color || 'gray'}-500`} />
              {travelType?.label || itinerary.travelType}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center text-primary font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
        View Details <ArrowRight className="w-4 h-4 ml-1" />
      </div>
    </Link>
  )
}

