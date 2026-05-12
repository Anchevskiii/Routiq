import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, MapPin, Sparkles, MessageCircle, Info } from 'lucide-react'
import type { FormattedPlace } from '@/types/attractions.types'

interface GenerationLoadingProps {
  progress: string
  attractions: FormattedPlace[]
  generatedDays: any[]
  elapsedTime: number
}

const FUN_FACTS = [
  "France is the most visited country in the world, with over 89 million visitors annually.",
  "Japan has more than 6,800 islands, though only about 430 are inhabited.",
  "The world's longest commercial flight from New York to Singapore takes over 18 hours.",
  "Australia has more than 10,000 beaches. You could visit a new one every day for 27 years!",
  "The Great Wall of China is over 13,000 miles long - that's half the Earth's circumference.",
  "Iceland is the only country in the world without mosquitoes.",
  "Bangkok's full ceremonial name is the longest city name in the world (168 letters).",
]

const QUESTIONS = [
  "What's your absolute dream travel destination if money was no object?",
  "Are you a 'pack everything' traveler or a 'essentials only' minimalist?",
  "Do you prefer exploring hidden gems or visiting world-famous landmarks?",
  "What's the most exotic or unusual food you've tried while traveling?",
  "Would you rather have a luxury hotel stay or an authentic local experience?",
  "What's the one thing you can never travel without (besides your phone)?",
]

export const GenerationLoading: React.FC<GenerationLoadingProps> = ({
  progress,
  attractions,
  generatedDays,
  elapsedTime,
}) => {
  const [factIndex, setFactIndex] = useState(0)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [showFact, setShowFact] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setShowFact(false)
      setTimeout(() => {
        setFactIndex((prev) => (prev + 1) % FUN_FACTS.length)
        setQuestionIndex((prev) => (prev + 1) % QUESTIONS.length)
        setShowFact(true)
      }, 500)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Header with Timer */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full font-mono text-lg border border-primary/20">
          <Clock className="w-5 h-5 animate-pulse" />
          <span>{elapsedTime}s</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-900">Crafting Your Adventure</h3>
        <p className="text-gray-600 animate-pulse">{progress || 'Preparing your itinerary...'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Distractions & Preview */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-6 border border-gray-100 h-48 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-4 left-4 text-primary/20">
              {factIndex % 2 === 0 ? <Info className="w-8 h-8" /> : <MessageCircle className="w-8 h-8" />}
            </div>
            
            <AnimatePresence mode="wait">
              {showFact && (
                <motion.div
                  key={factIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center px-4"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-primary mb-2 block">
                    {factIndex % 2 === 0 ? 'Travel Fun Fact' : 'A Question For You'}
                  </span>
                  <p className="text-gray-800 text-lg font-medium leading-relaxed">
                    {factIndex % 2 === 0 ? FUN_FACTS[factIndex] : QUESTIONS[questionIndex]}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Real-time Itinerary Preview */}
          <div className="bg-gray-900 rounded-2xl p-6 shadow-inner h-64 overflow-hidden relative flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-mono uppercase tracking-widest">Itinerary Preview</span>
              </div>
              <span className="text-[10px] font-mono text-primary/50">
                {generatedDays.length} days generated
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
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
                      <h4 className="text-primary font-mono text-sm mb-2">
                        Day {day.dayNumber}: {day.theme}
                      </h4>
                      <div className="space-y-1.5">
                        {day.activities?.create?.map((activity: any, aIdx: number) => (
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
        </div>

        {/* Right Column: Attractions Discovered */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-gray-900">
              <MapPin className="w-5 h-5 text-red-500" />
              <span>Spots Discovered</span>
            </div>
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
              {attractions.length} found
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto max-h-[420px] p-4 space-y-3 custom-scrollbar">
            <AnimatePresence initial={false}>
              {attractions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2 opacity-50">
                  <MapPin className="w-12 h-12" />
                  <p className="text-sm italic">Scanning local highlights...</p>
                </div>
              ) : (
                attractions.map((place, idx) => (
                  <motion.div
                    key={place.id || idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-primary/20 transition-colors"
                  >
                    {place.photos?.[0] ? (
                      <img
                        src={place.photos[0]}
                        alt={place.name}
                        className="w-16 h-16 rounded-lg object-cover bg-gray-200"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400">
                        <MapPin className="w-6 h-6" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm truncate">{place.name}</h4>
                      <p className="text-xs text-gray-500 line-clamp-2">{place.description || place.address}</p>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
