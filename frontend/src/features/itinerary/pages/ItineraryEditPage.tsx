import React, { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { itineraryApi } from '@/api/itinerary.api'
import { ROUTES } from '@/constants/routes'
import { MapPin, Calendar, Save, ArrowLeft, Loader2 } from 'lucide-react'

const editSchema = z.object({
  destination: z.string().min(2, 'Destination must be at least 2 characters'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
})

type EditFormValues = z.infer<typeof editSchema>

export const ItineraryEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: itinerary, isLoading } = useQuery({
    queryKey: ['itinerary', id],
    queryFn: () => itineraryApi.getItinerary(id!),
    enabled: !!id,
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
  })

  useEffect(() => {
    if (itinerary) {
      reset({
        destination: itinerary.destination,
        startDate: formatToDateInput(itinerary.startDate),
        endDate: formatToDateInput(itinerary.endDate),
      })
    }
  }, [itinerary, reset])

  const updateMutation = useMutation({
    mutationFn: (values: EditFormValues) => itineraryApi.updateItinerary(id!, values),
    onSuccess: () => {
      toast.success('Itinerary updated successfully')
      queryClient.invalidateQueries({ queryKey: ['itinerary', id] })
      navigate(ROUTES.ITINERARY(id!))
    },
    onError: () => toast.error('Failed to update itinerary'),
  })

  const onSubmit = (values: EditFormValues) => {
    updateMutation.mutate(values)
  }

  if (isLoading) return <div className="max-w-3xl mx-auto px-4 py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-sm font-bold text-gray-500 hover:text-primary mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back
      </button>

      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900">Edit Itinerary</h1>
        <p className="text-gray-500 mt-2">Update the basic details of your trip.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Destination</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                {...register('destination')}
                className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all ${
                  errors.destination ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-gray-50/50'
                }`}
              />
            </div>
            {errors.destination && <p className="mt-1 text-xs text-red-600 font-bold">{errors.destination.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  {...register('startDate')}
                  className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all ${
                    errors.startDate ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-gray-50/50'
                  }`}
                />
              </div>
              {errors.startDate && <p className="mt-1 text-xs text-red-600 font-bold">{errors.startDate.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">End Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  {...register('endDate')}
                  className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all ${
                    errors.endDate ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-gray-50/50'
                  }`}
                />
              </div>
              {errors.endDate && <p className="mt-1 text-xs text-red-600 font-bold">{errors.endDate.message}</p>}
            </div>
          </div>

          <div className="pt-6 border-t border-gray-50 flex justify-end">
            <button
              type="submit"
              disabled={!isDirty || updateMutation.isPending}
              className="flex items-center px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg"
            >
              <Save className="w-5 h-5 mr-2" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const formatToDateInput = (dateString: string) => {
  if (!dateString) return ''
  return new Date(dateString).toISOString().split('T')[0]
}

