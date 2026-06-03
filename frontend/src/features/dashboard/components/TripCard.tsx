import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
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

  // Wikipedia cover photo (same as ItineraryHeader)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  useEffect(() => {
    const city = trip.destination.split(',')[0].trim()
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(city)}`)
      .then(r => r.json())
      .then(data => {
        const url = data.originalimage?.source || data.thumbnail?.source
        if (url) setPhotoUrl(url)
      })
      .catch(() => {})
  }, [trip.destination])

  const { mutate, isPending } = useMutation({
    mutationFn: () => itineraryApi.deleteItinerary(trip.id),
    onMutate: async () => {
      // Optimistically remove from cache — no "deleted strip" flash
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.itineraries })
      const prev = queryClient.getQueryData(QUERY_KEYS.itineraries)
      queryClient.setQueryData(QUERY_KEYS.itineraries, (old: { data: Itinerary[] } | undefined) => {
        if (!old?.data) return old
        return { ...old, data: old.data.filter(it => it.id !== trip.id) }
      })
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(QUERY_KEYS.itineraries, ctx.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.itineraries })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groups })
    },
  })

  return (
    <motion.div variants={fadeUp}>
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
                {/* Cover photo (Wikipedia) or gradient fallback */}
                <div className="relative h-28 overflow-hidden" style={{ background: grad }}>
                  {photoUrl && (
                    <img
                      src={photoUrl}
                      alt={trip.destination}
                      className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500"
                      style={{ opacity: 0.85 }}
                    />
                  )}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.45) 100%)' }} />
                  <span className="absolute top-2.5 left-2.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-sm text-white">
                    {status}
                  </span>
                  <button
                    className="absolute top-2 right-2 w-[26px] h-[26px] flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-red-500/80 transition-colors"
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
                    {/* color circles removed */}
                  </div>

                  <div className="flex items-center justify-between text-xs text-secondary-400 dark:text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-[11px] h-[11px]" />
                      {format(start, 'dd.MM')}–{format(end, 'dd.MM.yy')}
                    </span>
                    <span className="font-semibold" style={{ color: c1 }}>
                      {trip.totalDays} days
                    </span>
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
