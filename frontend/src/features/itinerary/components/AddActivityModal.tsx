import React, { useState } from 'react'
import { X } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'

import { itineraryApi } from '@/api/itinerary.api'
import type { AddActivityDto } from '@/types/itinerary.types'
import { usePlaceAutocomplete } from '../hooks/usePlaceAutocomplete'

interface AddActivityModalProps {
  itineraryId: string
  dayId: string
  onAdded: () => void
  onClose: () => void
}

export const AddActivityModal: React.FC<AddActivityModalProps> = ({
  itineraryId,
  dayId,
  onAdded,
  onClose,
}) => {
  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState('60')
  const [startTime, setStartTime] = useState('')
  const { location, placeData, inputRef: locationInputRef, handleLocationChange } = usePlaceAutocomplete()

  const addMutation = useMutation({
    mutationFn: (payload: AddActivityDto) =>
      itineraryApi.addActivity(itineraryId, dayId, payload),
    onSuccess: () => {
      onAdded()
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    addMutation.mutate({
      title: title.trim(),
      location: location.trim() || undefined,
      durationMinutes: duration ? Number(duration) : undefined,
      startTime: startTime || undefined,
      address: placeData.address,
      placeId: placeData.placeId,
      latitude: placeData.latitude,
      longitude: placeData.longitude,
    })
  }

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-[#16142e] rounded-3xl shadow-2xl border border-gray-100 dark:border-blue-600/10 w-full max-w-md">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-blue-600/10">
          <h2 className="text-lg font-black text-gray-900 dark:text-blue-300">Add Activity</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700/50 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Visit the Eiffel Tower"
              required
              className="text-sm font-medium text-gray-900 dark:text-blue-300 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary placeholder:text-gray-300 dark:placeholder:text-slate-600"
            />
          </div>

          {/* Location */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Location
            </label>
            <input
              ref={locationInputRef}
              type="text"
              value={location}
              onChange={e => handleLocationChange(e.target.value)}
              placeholder="Search for a place…"
              className="text-sm font-medium text-gray-900 dark:text-blue-300 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary placeholder:text-gray-300 dark:placeholder:text-slate-600"
            />
          </div>

          {/* Duration + Start Time */}
          <div className="flex gap-4">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                Duration (min)
              </label>
              <input
                type="number"
                min={5}
                step={5}
                value={duration}
                onChange={e => setDuration(e.target.value)}
                className="text-sm font-medium text-gray-900 dark:text-blue-300 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="text-sm font-medium text-gray-900 dark:text-blue-300 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {addMutation.isError && (
            <p className="text-xs text-red-500 font-medium">
              Something went wrong. Please try again.
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || addMutation.isPending}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-black hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {addMutation.isPending ? 'Adding…' : 'Add Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
