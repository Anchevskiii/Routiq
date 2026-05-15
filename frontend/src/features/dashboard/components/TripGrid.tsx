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
  { value: 'all',       label: 'Vse'         },
  { value: 'planning',  label: 'Načrtovanje' },
  { value: 'confirmed', label: 'Potrjeno'    },
  { value: 'past',      label: 'Pretekla'    },
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
        <h2 className="text-base font-bold text-indigo-950 dark:text-indigo-100">Tvoja potovanja</h2>
        <div className="flex items-center gap-1">
          {TABS.map(t => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className="px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
              style={
                tab === t.value
                  ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }
                  : { background: 'rgba(99,102,241,0.07)', color: '#6366f1' }
              }
            >
              {t.label}
            </button>
          ))}
        </div>
        <Link to={ROUTES.DASHBOARD} className="flex items-center gap-1 text-xs font-semibold text-indigo-500">
          Vse <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-44 rounded-2xl animate-pulse bg-indigo-500/[0.07]" />
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
      className="flex flex-col items-center rounded-2xl p-8 text-center border-2 border-dashed border-indigo-500/20"
      whileHover={{ scale: 1.01 }}
    >
      <motion.div
        className="text-4xl mb-2"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        ✈️
      </motion.div>
      <p className="font-bold text-sm mb-1 text-indigo-950 dark:text-indigo-100">Ni potovanj</p>
      <p className="text-xs text-slate-400 dark:text-slate-500">Klikni za planiranje prve poti</p>
    </motion.div>
  </Link>
)
