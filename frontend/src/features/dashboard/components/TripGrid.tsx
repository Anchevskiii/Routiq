import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { stagger } from '../animations'
import { TripCard } from './TripCard'
import type { Itinerary } from '@/types/itinerary.types'

/* Filters (All, Planning, Confirmed, Past) — commented out
type Tab = 'all' | 'planning' | 'confirmed' | 'past'
const TABS = [...]
*/

interface Props {
  itineraries: Itinerary[]
  isLoading: boolean
}

export const TripGrid: React.FC<Props> = ({ itineraries, isLoading }) => {
  return (
    <motion.section>
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="text-base font-bold text-blue-950 dark:text-blue-100">Your trips</h2>
        {/* Filters commented out */}
        <Link to={ROUTES.TRIPS} className="flex items-center gap-1 text-xs font-semibold text-blue-600">
          All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-44 rounded-2xl animate-pulse bg-blue-500/[0.07]" />
          ))}
        </div>
      ) : itineraries.length === 0 ? (
        <EmptyTrips />
      ) : (
        <motion.div
          variants={stagger}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3 gap-3"
        >
          {itineraries.slice(0, 6).map((trip, i) => (
            <TripCard key={trip.id} trip={trip} index={i} />
          ))}
        </motion.div>
      )}
    </motion.section>
  )
}

const EmptyTrips: React.FC = () => (
  <Link to={ROUTES.PLANNER}>
    <motion.div
      className="flex flex-col items-center rounded-2xl p-8 text-center border-2 border-dashed border-blue-500/20"
      whileHover={{ scale: 1.01 }}
    >
      <motion.div
        className="text-4xl mb-2"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        ✈️
      </motion.div>
      <p className="font-bold text-sm mb-1 text-blue-950 dark:text-blue-100">No trips yet</p>
      <p className="text-xs text-slate-400 dark:text-slate-500">Click to plan your first trip</p>
    </motion.div>
  </Link>
)
