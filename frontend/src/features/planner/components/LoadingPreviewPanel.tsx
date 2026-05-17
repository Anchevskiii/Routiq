import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import type { StreamingDay, StreamingActivity } from '@/types/itinerary.types'

interface Props {
  generatedDays: StreamingDay[]
}

export const LoadingPreviewPanel: React.FC<Props> = ({ generatedDays }) => (
  <div className="bg-gray-900 rounded-2xl p-6 shadow-inner h-64 overflow-hidden relative flex flex-col">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2 text-primary">
        <Sparkles className="w-4 h-4" />
        <span className="text-xs font-mono uppercase tracking-widest">Itinerary Preview</span>
      </div>
      <span className="text-[10px] font-mono text-primary/50">{generatedDays.length} days generated</span>
    </div>

    <div className="flex-1 overflow-y-auto pr-2 space-y-4">
      <AnimatePresence initial={false}>
        {generatedDays.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-primary/30 space-y-3">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-xs font-mono animate-pulse">Waiting for AI to structure the route...</p>
          </div>
        ) : (
          generatedDays.map((day, idx) => (
            <motion.div
              key={day.dayNumber || idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="border-l-2 border-primary/20 pl-4 py-1"
            >
              <h4 className="text-primary font-mono text-sm mb-2">Day {day.dayNumber}: {day.theme}</h4>
              <div className="space-y-1.5">
                {day.activities?.create?.map((activity: StreamingActivity, aIdx: number) => (
                  <div key={aIdx} className="flex items-center gap-2 text-[10px] text-primary/70 font-mono">
                    <span className="text-primary/40">{activity.startTime || '--:--'}</span>
                    <span className="truncate">{activity.title}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </div>
  </div>
)
