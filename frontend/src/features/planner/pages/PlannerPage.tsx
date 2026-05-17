import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { differenceInDays, parseISO } from 'date-fns'
import { ITINERARY_ENDPOINTS } from '@/api/itinerary.api'
import { ROUTES } from '@/constants/routes'
import { useStream } from '@/hooks/useStream'
import type { FormattedPlace } from '@/types/attractions.types'
import type { StreamingDay } from '@/types/itinerary.types'
import type { PlannerFormValues } from '../schemas/plannerSchema'
import { GenerationLoading } from '../components/GenerationLoading'
import { PlannerForm } from '../components/PlannerForm'

type ItineraryStreamEvent =
  | { type: 'status'; message: string }
  | { type: 'attractions'; data: FormattedPlace[] }
  | { type: 'day'; data: StreamingDay }
  | { type: 'complete'; itineraryId: string }
  | { type: 'error'; error: string }

const ORB_STYLE: React.CSSProperties = {
  position: 'absolute',
  width: 480,
  height: 480,
  borderRadius: '50%',
  filter: 'blur(72px)',
  pointerEvents: 'none',
}

export const PlannerPage: React.FC = () => {
  const navigate = useNavigate()
  const { stream, isLoading } = useStream<{ itineraryId: string }, ItineraryStreamEvent>()

  const [progress, setProgress]             = useState('')
  const [attractions, setAttractions]       = useState<FormattedPlace[]>([])
  const [generatedDays, setGeneratedDays]   = useState<StreamingDay[]>([])
  const [elapsedTime, setElapsedTime]       = useState(0)

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (isLoading) {
      setElapsedTime(0)
      interval = setInterval(() => setElapsedTime(t => t + 1), 1000)
    }
    return () => clearInterval(interval)
  }, [isLoading])

  const handleGenerate = async (values: PlannerFormValues) => {
    const days = differenceInDays(parseISO(values.endDate), parseISO(values.startDate)) + 1
    if (days <= 0) { toast.error('End date must be after start date'); return }
    if (days > 14) { toast.error('Trip duration cannot exceed 14 days'); return }

    setProgress(''); setAttractions([]); setGeneratedDays([])

    stream(ITINERARY_ENDPOINTS.GENERATE, { ...values, days }, {
      onProgress: (data) => {
        if (data.type === 'status')      setProgress(data.message)
        if (data.type === 'attractions') setAttractions(data.data)
        if (data.type === 'day')         setGeneratedDays(prev => [...prev, data.data])
      },
      onSuccess: (data) => {
        toast.success('Itinerary generated successfully!')
        navigate(ROUTES.ITINERARY(data.itineraryId))
      },
      onError: (err) => {
        toast.error(`Generation failed: ${err}`)
        setProgress('')
      },
    })
  }

  return (
    <div className="relative h-full overflow-hidden bg-white dark:bg-[#0c0b1a]">

      {/* Orbs — pinned to container, do not scroll */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <motion.div
          style={{ ...ORB_STYLE, right: 60, top: -80,
            background: 'radial-gradient(circle, rgba(109,40,217,0.70) 0%, rgba(124,92,255,0.40) 50%, transparent 100%)' }}
          animate={{ x: [0, -80, 0], y: [0, 120, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          style={{ ...ORB_STYLE, left: -60, top: '30%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.65) 0%, rgba(167,139,250,0.35) 50%, transparent 100%)' }}
          animate={{ x: [0, 100, 0], y: [0, -80, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          style={{ ...ORB_STYLE, right: -40, top: '65%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.55) 0%, rgba(129,140,248,0.30) 50%, transparent 100%)' }}
          animate={{ x: [0, -60, 0], y: [0, -100, 0] }}
          transition={{ duration: 34, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        />
      </div>

      {/* Scrollable content */}
      <div className="relative z-10 h-full overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-6 py-10">
          <div className="mb-8">
            <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-ink-faint mb-3">
              AI · planner · v3.2
            </p>
            <h1 className="text-5xl font-semibold tracking-tight text-ink leading-[1.1] mb-4">
              Plan your next{' '}
              <em className="font-serif italic font-normal text-aurora">journey</em>
            </h1>
            <p className="text-base text-ink-dim max-w-md leading-relaxed">
              Tell Routiq where you're going. Watch your trip take shape on the right while you fill it in.
            </p>
          </div>

          {isLoading ? (
            <GenerationLoading
              progress={progress}
              attractions={attractions}
              generatedDays={generatedDays}
              elapsedTime={elapsedTime}
            />
          ) : (
            <PlannerForm onSubmit={handleGenerate} isLoading={isLoading} />
          )}
        </div>
      </div>
    </div>
  )
}
