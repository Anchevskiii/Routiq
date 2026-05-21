import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format, differenceInDays } from 'date-fns'
import { Calendar, Trash2 } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { itineraryApi } from '@/api/itinerary.api'
import { getTravelTypeByValue } from '@/constants/travelTypes'
import { fadeUp } from '../animations'
import type { Itinerary } from '@/types/itinerary.types'

const PALETTES = [
  ['#2563eb', '#3b82f6'],
  ['#0ea5e9', '#38bdf8'],
  ['#10b981', '#34d399'],
  ['#f59e0b', '#fbbf24'],
  ['#ef4444', '#f87171'],
]

interface Props {
  trip: Itinerary
  index: number
}

export const TripCard: React.FC<Props> = ({ trip, index }) => {
  const [confirm, setConfirm] = useState(false)
  const queryClient = useQueryClient()
  const [c1, c2] = PALETTES[index % PALETTES.length]
  const grad = `linear-gradient(135deg, ${c1}, ${c2})`
  const travelType = getTravelTypeByValue(trip.travelType)
  const today = new Date()
  const end = new Date(trip.endDate)
  const start = new Date(trip.startDate)
  const status = end < today ? 'Past' : start <= today ? 'Active' : 'Planning'

  const [deleted, setDeleted] = useState(false)

  const { mutate, isPending } = useMutation({
    mutationFn: () => itineraryApi.deleteItinerary(trip.id),
    onSuccess: () => {
      setDeleted(true)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.itineraries })
    },
  })

  if (deleted) return null

  return (
    <motion.div variants={fadeUp} layout exit={{ opacity: 0, scale: 0.9 }}>
      <AnimatePresence mode="wait">
        {confirm ? (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="rounded-2xl bg-white dark:bg-[#16142e] shadow-sm border border-red-100 dark:border-red-900/30 p-4 flex flex-col items-center gap-3"
          >
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-300 text-center">
              Delete <span className="text-blue-600">{trip.destination}</span>?
            </p>
            <div className="flex gap-2 w-full">
              <button
                onClick={() => setConfirm(false)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => mutate()}
                disabled={isPending}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isPending ? '…' : 'Delete'}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="card"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15 }}
          >
            <Link to={ROUTES.ITINERARY(trip.id)}>
              <motion.div
                className="rounded-2xl overflow-hidden cursor-pointer bg-white dark:bg-[#16142e] shadow-sm"
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              >
                <div className="relative h-24" style={{ background: grad }}>
                  <span className="absolute top-2.5 left-2.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white">
                    {status}
                  </span>
                  <button
                    className="absolute top-2 right-2 w-[26px] h-[26px] flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-red-500/80 transition-colors"
                    onClick={e => { e.preventDefault(); setConfirm(true) }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                <div className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="font-bold text-sm truncate text-blue-600 dark:text-blue-300">{trip.destination}</div>
                      <div className="text-xs truncate text-secondary-400 dark:text-slate-500">
                        {travelType?.icon} {travelType?.label ?? trip.travelType}
                      </div>
                    </div>
                    <div className="flex -space-x-1 shrink-0">
                      {[c1, c2, '#e0e7ff'].map((col, k) => (
                        <span key={k} className="inline-block w-[18px] h-[18px] rounded-full border-2 border-white dark:border-[#16142e]" style={{ background: col }} />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs mb-1.5 text-secondary-400 dark:text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-[11px] h-[11px]" />
                      {format(start, 'dd.MM')}–{format(end, 'dd.MM.yy')}
                    </span>
                    <span className="font-semibold" style={{ color: c1 }}>
                      {Math.max(0, differenceInDays(end, start))}d
                    </span>
                  </div>

                  <div className="h-1 rounded-full overflow-hidden bg-blue-600/[0.09]">
                    <div className="h-full rounded-full w-[55%]" style={{ background: grad }} />
                  </div>
                </div>
              </motion.div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
