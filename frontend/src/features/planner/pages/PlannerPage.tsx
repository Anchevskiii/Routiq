import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { differenceInDays, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import { useStream } from '@/hooks/useStream'
import { getTravelTypeOptions } from '@/constants/travelTypes'
import { ROUTES } from '@/constants/routes'
import { plannerSchema, type PlannerFormValues } from '@/features/planner/schemas/plannerSchema'

export const PlannerPage: React.FC = () => {
  const navigate = useNavigate()
  const { stream, isLoading } = useStream<{ itineraryId: string }, { message: string }>()
  const [progress, setProgress] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PlannerFormValues>({
    resolver: zodResolver(plannerSchema),
  })

  const onSubmit = async (values: PlannerFormValues) => {
    const days = differenceInDays(parseISO(values.endDate), parseISO(values.startDate)) + 1

    if (days <= 0) {
      toast.error('End date must be after start date')
      return
    }

    if (days > 14) {
      toast.error('Trip duration cannot exceed 14 days')
      return
    }

    const payload = {
      ...values,
      days,
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
    
    stream(`${apiUrl}/itinerary/generate`, payload, {
      onProgress: (data: { message: string }) => {
        if (data.message) setProgress(data.message)
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

  const travelOptions = getTravelTypeOptions()

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
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Generating your adventure...</h3>
              <p className="text-gray-500 text-center max-w-sm">
                {progress || 'Our AI is crafting the perfect plan for you. This might take a few seconds.'}
              </p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Where are you heading?
              </h3>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destination
                  </label>
                  <input
                    type="text"
                    {...register('destination')}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none ${
                      errors.destination ? 'border-red-500 bg-red-50' : 'border-gray-200'
                    }`}
                    placeholder="e.g., Paris, Tokyo, New York"
                  />
                  {errors.destination && (
                    <p className="mt-1 text-sm text-red-600 font-medium">{errors.destination.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      {...register('startDate')}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none ${
                        errors.startDate ? 'border-red-500 bg-red-50' : 'border-gray-200'
                      }`}
                    />
                    {errors.startDate && (
                      <p className="mt-1 text-sm text-red-600 font-medium">{errors.startDate.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      {...register('endDate')}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none ${
                        errors.endDate ? 'border-red-500 bg-red-50' : 'border-gray-200'
                      }`}
                    />
                    {errors.endDate && (
                      <p className="mt-1 text-sm text-red-600 font-medium">{errors.endDate.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    What kind of experience are you looking for?
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {travelOptions.map((option) => (
                      <label
                        key={option.value}
                        className="relative flex flex-col items-center p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition-all peer-checked:border-primary peer-checked:bg-primary/5 group"
                      >
                        <input
                          type="radio"
                          value={option.value}
                          {...register('travelType')}
                          className="absolute opacity-0"
                        />
                        <span className="text-2xl mb-2">{option.icon}</span>
                        <span className="text-sm font-medium text-gray-900">{option.label}</span>
                      </label>
                    ))}
                  </div>
                  {errors.travelType && (
                    <p className="mt-2 text-sm text-red-600 font-medium">{errors.travelType.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:bg-primary/90 transform hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                >
                  Create My Itinerary
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

