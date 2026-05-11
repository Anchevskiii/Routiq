import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { differenceInDays, parseISO } from 'date-fns'

import { ITINERARY_ENDPOINTS } from '@/api/itinerary.api'
import { ROUTES } from '@/constants/routes'
import { useStream } from '@/hooks/useStream'
import type { FormattedPlace } from '@/types/attractions.types'
import type { PlannerFormValues } from '../schemas/plannerSchema'
import { GenerationLoading } from '../components/GenerationLoading'
import { PlannerForm } from '../components/PlannerForm'

type ItineraryStreamEvent =
  | { type: 'status'; message: string }
  | { type: 'attractions'; data: FormattedPlace[] }
  | { type: 'chunk'; content: string; message: string }
  | { type: 'complete'; itineraryId: string }
  | { type: 'error'; error: string }

export const PlannerPage: React.FC = () => {
  const navigate = useNavigate()
  const { stream, isLoading } = useStream<{ itineraryId: string }, ItineraryStreamEvent>()

  const [progress, setProgress] = useState<string>('')
  const [attractions, setAttractions] = useState<FormattedPlace[]>([])
  const [streamingText, setStreamingText] = useState<string>('')
  const [elapsedTime, setElapsedTime] = useState<number>(0)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isLoading) {
      setElapsedTime(0)
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isLoading])

  const handleGenerate = async (values: PlannerFormValues) => {
    const days =
      differenceInDays(parseISO(values.endDate), parseISO(values.startDate)) + 1

    if (days <= 0) {
      toast.error('End date must be after start date')
      return
    }

    if (days > 14) {
      toast.error('Trip duration cannot exceed 14 days')
      return
    }

    const payload = { ...values, days }

    // Reset states for new generation
    setProgress('')
    setAttractions([])
    setStreamingText('')

    stream(ITINERARY_ENDPOINTS.GENERATE, payload, {
      onProgress: (data) => {
        if (data.type === 'status' && data.message) {
          setProgress(data.message)
        } else if (data.type === 'attractions' && data.data) {
          setAttractions(data.data)
        } else if (data.type === 'chunk' && data.content) {
          setStreamingText((prev) => prev + data.content)
          if (data.message) setProgress(data.message)
        }
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Trip Planner</h1>
        <p className="text-gray-600 mt-2">
          Create your perfect itinerary with AI-powered recommendations.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8 md:p-12">
          {isLoading ? (
            <GenerationLoading
              progress={progress}
              attractions={attractions}
              streamingText={streamingText}
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
