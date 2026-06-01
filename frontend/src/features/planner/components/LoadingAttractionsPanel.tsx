import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin } from 'lucide-react'
import type { FormattedPlace } from '@/types/attractions.types'

interface Props {
  attractions: FormattedPlace[]
}

export const LoadingAttractionsPanel: React.FC<Props> = ({ attractions }) => (
  <div className="bg-white dark:bg-[#1e1b38] rounded-2xl border border-line shadow-sm overflow-hidden flex flex-col">
    <div className="p-4 border-b border-line flex items-center justify-between">
      <div className="flex items-center gap-2 font-semibold text-ink">
        <MapPin className="w-5 h-5 text-red-500" />
        <span>Spots Discovered</span>
      </div>
      <span className="bg-blue-50 dark:bg-blue-900/30 text-ink-dim text-xs px-2 py-1 rounded-full">
        {attractions.length} found
      </span>
    </div>

    <div className="flex-1 overflow-y-auto max-h-[420px] p-4 space-y-3">
      <AnimatePresence initial={false}>
        {attractions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-ink-faint space-y-2 opacity-50">
            <MapPin className="w-12 h-12" />
            <p className="text-sm italic">Scanning local highlights...</p>
          </div>
        ) : (
          attractions.map((place, idx) => (
            <motion.div
              key={place.id || idx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-3 p-3 bg-gray-50 dark:bg-[#16142e] rounded-xl border border-line hover:border-primary/20 transition-colors"
            >
              {place.photos?.[0] ? (
                <img src={place.photos[0]} alt={place.name} className="w-16 h-16 rounded-lg object-cover bg-gray-200 dark:bg-[#2a2650]" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-[#2a2650] flex items-center justify-center text-ink-faint">
                  <MapPin className="w-6 h-6" />
                </div>
              )}
              <div className="min-w-0">
                <h4 className="font-semibold text-ink text-sm truncate">{place.name}</h4>
                <p className="text-xs text-ink-dim line-clamp-2">{place.description || place.address}</p>
              </div>
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </div>
  </div>
)
