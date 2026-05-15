import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { Zap, Calendar, MapPin, ArrowRight, Plus } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { getTravelTypeByValue } from '@/constants/travelTypes'
import type { Itinerary } from '@/types/itinerary.types'

const HERO_BG = 'linear-gradient(135deg, #3730a3 0%, #6366f1 45%, #8b5cf6 100%)'
const BAR_BG  = 'linear-gradient(90deg, #a5b4fc, #e879f9)'

interface HeroCardProps {
  trip: Itinerary
  daysUntil: number
}

export const HeroCard: React.FC<HeroCardProps> = ({ trip, daysUntil }) => {
  const progress = Math.max(10, Math.min(90, Math.round((1 - daysUntil / 180) * 100)))

  return (
    <Link to={ROUTES.ITINERARY(trip.id)}>
      <motion.div
        className="relative rounded-2xl overflow-hidden cursor-pointer min-h-[190px]"
        style={{ background: HERO_BG }}
        whileHover={{ scale: 1.008, y: -2 }}
        whileTap={{ scale: 0.995 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      >
        <motion.div
          className="absolute w-[280px] h-[280px] rounded-full bg-white/[0.07] -top-20 -right-20"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-40 h-40 rounded-full bg-white/[0.05] -bottom-12 -left-12"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />

        <div className="relative z-10 p-5 flex flex-col h-full">
          <div className="flex items-center gap-1.5 mb-3">
            <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.6, repeat: Infinity }}>
              <Zap className="w-3 h-3 text-yellow-200" />
            </motion.div>
            <span className="text-xs font-bold tracking-widest uppercase text-indigo-200">
              AI Planer · Prihajajoče potovanje
            </span>
          </div>

          <div className="flex items-end gap-4 mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white leading-tight mb-1">{trip.destination} te čaka</h2>
              <div className="flex items-center gap-3 text-xs text-indigo-200">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(trip.startDate), 'd. MMM')} – {format(new Date(trip.endDate), 'd. MMM yyyy')}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {getTravelTypeByValue(trip.travelType)?.label ?? trip.travelType}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-5xl font-black text-white leading-none">{daysUntil}</div>
              <div className="text-xs font-medium text-indigo-200">dni do odhoda</div>
            </div>
          </div>

          <div className="mb-3.5">
            <div className="h-1.5 rounded-full overflow-hidden bg-white/15">
              <motion.div
                className="h-full rounded-full"
                style={{ background: BAR_BG }}
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-xs text-indigo-200">
              <span>Načrt {progress}% pripravljen</span>
              <span>3 odprta opravila</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-auto">
            <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-white/[0.18] hover:bg-white/25 transition-colors">
              Odpri potovanje <ArrowRight className="w-3 h-3" />
            </button>
            <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold text-indigo-100 border border-white/20 hover:bg-white/10 transition-colors">
              <Plus className="w-3 h-3" /> Dodaj korak
            </button>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

export const HeroCta: React.FC = () => (
  <Link to={ROUTES.PLANNER}>
    <motion.div
      className="relative rounded-2xl overflow-hidden cursor-pointer p-5 min-h-[160px]"
      style={{ background: HERO_BG }}
      whileHover={{ scale: 1.008, y: -2 }}
    >
      <motion.div
        className="absolute w-[220px] h-[220px] rounded-full bg-white/[0.06] -top-16 -right-16"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 5, repeat: Infinity }}
      />
      <div className="relative z-10">
        <p className="text-xs font-bold tracking-widest uppercase mb-2 text-indigo-200">AI Planer</p>
        <h2 className="text-xl font-bold text-white mb-4">Planiraj novo potovanje</h2>
        <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold text-white bg-white/[0.18]">
          <Plus className="w-3.5 h-3.5" /> Začni zdaj
        </span>
      </div>
    </motion.div>
  </Link>
)
