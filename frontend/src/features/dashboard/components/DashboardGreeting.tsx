import React from 'react'
import { motion } from 'framer-motion'
import { fadeUp } from '../animations'
import type { Itinerary } from '@/types/itinerary.types'

interface Props {
  firstName: string
  nextTrip: Itinerary | undefined
  daysUntil: number | null
}

export const DashboardGreeting: React.FC<Props> = ({ firstName, nextTrip, daysUntil }) => {
  const today = new Date()
  const hour = today.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const dateLabel = today.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <motion.div initial="hidden" animate="show" variants={fadeUp} className="flex items-start justify-between mb-7">
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase mb-1 text-blue-300 dark:text-blue-700">{dateLabel}</p>
        <h1 className="text-3xl font-bold tracking-tight leading-tight text-blue-950 dark:text-blue-100">
          {greeting},{' '}
          <span className="gradient-aurora-text">
            {firstName}
          </span>
        </h1>
        <p className="text-sm mt-1 text-slate-400 dark:text-slate-500">
          {nextTrip
            ? `Let's get ${nextTrip.destination} ready. You have 3 open tasks.`
            : 'Start planning your next adventure.'}
        </p>
      </div>

      {daysUntil !== null && (
        <div
          className="flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold text-blue-600 shrink-0 gradient-aurora-soft"
        >
          <motion.span
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-blue-600 shrink-0"
          />
          <strong>{daysUntil}</strong>&nbsp;days to go
        </div>
      )}
    </motion.div>
  )
}
