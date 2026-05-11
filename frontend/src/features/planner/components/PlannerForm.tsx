import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { plannerSchema, type PlannerFormValues } from '../schemas/plannerSchema'
import { getTravelTypeOptions } from '@/constants/travelTypes'

interface PlannerFormProps {
  onSubmit: (values: PlannerFormValues) => void
  isLoading: boolean
}

export const PlannerForm: React.FC<PlannerFormProps> = ({ onSubmit, isLoading }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PlannerFormValues>({
    resolver: zodResolver(plannerSchema),
  })

  const travelOptions = getTravelTypeOptions()

  return (
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
            <p className="mt-1 text-sm text-red-600 font-medium">
              {errors.destination.message}
            </p>
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
              <p className="mt-1 text-sm text-red-600 font-medium">
                {errors.startDate.message}
              </p>
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
              <p className="mt-1 text-sm text-red-600 font-medium">
                {errors.endDate.message}
              </p>
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
                <span className="text-sm font-medium text-gray-900">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
          {errors.travelType && (
            <p className="mt-2 text-sm text-red-600 font-medium">
              {errors.travelType.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:bg-primary/90 transform hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
        >
          {isLoading ? 'Preparing Your Trip...' : 'Create My Itinerary'}
        </button>
      </form>
    </div>
  )
}
