import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Map } from 'lucide-react'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { itineraryApi } from '@/api/itinerary.api'
import { TripCard } from '@/features/dashboard/components/TripCard'
import { ROUTES } from '@/constants/routes'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
}

export const TripsPage: React.FC = () => {
  const { data: itinData, isLoading } = useQuery({
    queryKey: QUERY_KEYS.itineraries,
    queryFn: () => itineraryApi.listItineraries({ limit: 100 }),
  })

  const itineraries = itinData?.data ?? []

  return (
    <div className="flex flex-col min-h-screen px-6 py-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">My Trips</h1>
          <p className="mt-1 text-sm text-ink-dim">
            Manage your personal travel itineraries and adventures.
          </p>
        </div>

        <Link to={ROUTES.PLANNER}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-95 transition-opacity gradient-aurora"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Create new trip</span>
          </motion.button>
        </Link>
      </header>

      {isLoading ? (
        <div className="flex-1 grid place-items-center min-h-[300px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : itineraries.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col items-center justify-center text-center py-16 px-4 bg-white dark:bg-[#16142e] rounded-[2rem] border border-gray-100 dark:border-transparent shadow-sm"
        >
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 dark:text-indigo-400 grid place-items-center mb-4">
            <Map size={28} />
          </div>
          <h2 className="text-xl font-bold text-ink">No itineraries found</h2>
          <p className="mt-2 text-sm text-ink-dim max-w-sm">
            You haven't planned any trips yet. Generate your first personalized itinerary with our AI planner!
          </p>
          <Link to={ROUTES.PLANNER} className="mt-6">
            <button className="h-10 px-5 rounded-xl text-sm font-semibold text-white gradient-aurora shadow-sm hover:opacity-90 active:scale-95 transition-all">
              Start planning
            </button>
          </Link>
        </motion.div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
        >
          {itineraries.map((trip, idx) => (
            <TripCard key={trip.id} trip={trip} index={idx} />
          ))}
        </motion.div>
      )}
    </div>
  )
}
