import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Info, MessageCircle } from 'lucide-react'
import type { FormattedPlace } from '@/types/attractions.types'
import type { StreamingDay } from '@/types/itinerary.types'
import { LoadingAttractionsPanel } from './LoadingAttractionsPanel'

interface Props {
  progress: string
  attractions: FormattedPlace[]
  generatedDays: StreamingDay[]
  elapsedTime: number
}

const FUN_FACTS = [
  "France is the most visited country in the world, with over 89 million visitors annually.",
  "Japan has more than 6,800 islands, though only about 430 are inhabited.",
  "The world's longest commercial flight from New York to Singapore takes over 18 hours.",
  "Australia has more than 10,000 beaches — a new one every day for 27 years!",
  "The Great Wall of China is over 13,000 miles long — half the Earth's circumference.",
  "Iceland is the only country in the world without mosquitoes.",
]

const QUESTIONS = [
  "What's your dream destination if money was no object?",
  "Are you a 'pack everything' or 'essentials only' traveler?",
  "Hidden gems or world-famous landmarks?",
  "Most exotic food you've tried while traveling?",
  "Luxury hotel or authentic local experience?",
  "One thing you never travel without (besides your phone)?",
]

export const GenerationLoading: React.FC<Props> = ({ progress, attractions, generatedDays: _generatedDays, elapsedTime }) => {
  const [factIndex, setFactIndex] = useState(0)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [showFact, setShowFact] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setShowFact(false)
      setTimeout(() => {
        setFactIndex(p => (p + 1) % FUN_FACTS.length)
        setQuestionIndex(p => (p + 1) % QUESTIONS.length)
        setShowFact(true)
      }, 500)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full font-mono text-lg border border-primary/20">
          <Clock className="w-5 h-5 animate-pulse" />
          <span>{elapsedTime}s</span>
        </div>
        <h3 className="text-2xl font-bold text-ink">Crafting Your Adventure</h3>
        <p className="text-ink-dim animate-pulse">{progress || 'Preparing your itinerary...'}</p>
      </div>

      {/* Fun fact / question card */}
      <div className="bg-gradient-to-br from-primary/5 to-secondary/5 dark:from-blue-900/20 dark:to-blue-50/20 rounded-2xl p-6 border border-line h-48 flex flex-col justify-center relative overflow-hidden">
        <div className="absolute top-4 left-4 text-primary/20">
          {factIndex % 2 === 0 ? <Info className="w-8 h-8" /> : <MessageCircle className="w-8 h-8" />}
        </div>
        <AnimatePresence mode="wait">
          {showFact && (
            <motion.div key={factIndex} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center px-4">
              <span className="text-xs font-bold uppercase tracking-wider text-primary mb-2 block">
                {factIndex % 2 === 0 ? 'Travel Fun Fact' : 'A Question For You'}
              </span>
              <p className="text-ink text-lg font-medium leading-relaxed">
                {factIndex % 2 === 0 ? FUN_FACTS[factIndex] : QUESTIONS[questionIndex]}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Attractions panel only */}
      <LoadingAttractionsPanel attractions={attractions} />
    </div>
  )
}
