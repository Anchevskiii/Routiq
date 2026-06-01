import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { stagger } from '../animations'
import { TripCard } from './TripCard'
import type { Itinerary } from '@/types/itinerary.types'

type Tab = 'all' | 'planning' | 'confirmed' | 'past'

const TABS: { value: Tab; label: string }[] = [
  { value: 'all',       label: 'All'         },
  { value: 'planning',  label: 'Planning' },
  { value: 'confirmed', label: 'Confirmed'    },
  { value: 'past',      label: 'Past'    },
]

interface Props {
  itineraries: Itinerary[]
  isLoading: boolean
}

export const TripGrid: React.FC<Props> = ({ itineraries, isLoading }) => {
  const [tab, setTab] = useState<Tab>('all')
  const today = new Date()

  const filtered = itineraries.filter(it => {
    const start = new Date(it.startDate)
    const end = new Date(it.endDate)
    if (tab === 'planning')  return start > today
    if (tab === 'confirmed') return start <= today && end >= today
    if (tab === 'past')      return end < today
    return true
  })

  return (
    <motion.section>
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="text-base font-bold text-blue-950 dark:text-blue-100">Your trips</h2>
        <div className="flex items-center gap-1">
          {TABS.map(t => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${tab === t.value ? 'gradient-aurora text-white' : 'bg-blue-600/[0.07] text-blue-600'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Link to={ROUTES.DASHBOARD} className="flex items-center gap-1 text-xs font-semibold text-blue-600">
          All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-44 rounded-2xl animate-pulse bg-blue-500/[0.07]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyTrips />
      ) : (
        <motion.div
          variants={stagger}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3 gap-3"
        >
          {filtered.slice(0, 6).map((trip, i) => (
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
