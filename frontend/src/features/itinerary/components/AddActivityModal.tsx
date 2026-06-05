import React, { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { itineraryApi } from '@/api/itinerary.api'
import type { Activity, AddActivityDto } from '@/types/itinerary.types'
import { usePlaceAutocomplete } from '../hooks/usePlaceAutocomplete'
import { TimeSelect } from '@/components/ui/TimeSelect'
import { DurationSelect } from '@/components/ui/DurationSelect'

interface Conflict {
  type: 'new_pushed' | 'trim_preceding' | 'push_following'
  title?: string
  detail: string
}

function parseMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function fmtMin(min: number): string {
  return `${Math.floor(min / 60).toString().padStart(2, '0')}:${(min % 60).toString().padStart(2, '0')}`
}

function detectConflicts(
  startTime: string,
  durationMinutes: number,
  activities: Activity[],
): Conflict[] {
  const newStart = parseMinutes(startTime)
  const newDur = durationMinutes || 0
  const conflicts: Conflict[] = []

  const timed = [...activities]
    .filter(a => a.startTime)
    .sort((a, b) => parseMinutes(a.startTime!) - parseMinutes(b.startTime!))

  // Last activity that starts at or before newStart
  const preceding = [...timed].reverse().find(a => parseMinutes(a.startTime!) <= newStart)

  let effectiveStart = newStart

  if (preceding?.durationMinutes) {
    const precStart = parseMinutes(preceding.startTime!)
    const precEnd = precStart + preceding.durationMinutes
    if (precEnd > newStart) {
      const trimmedDur = newStart - precStart
      if (trimmedDur > 0) {
        // New activity starts inside preceding → trim preceding
        conflicts.push({
          type: 'trim_preceding',
          title: preceding.title,
          detail: `shortened from ${preceding.durationMinutes} to ${trimmedDur} min`,
        })
      } else {
        // Same start time → new activity gets pushed to where preceding ends
        effectiveStart = precEnd
        conflicts.push({
          type: 'new_pushed',
          detail: `Your activity will start at ${fmtMin(precEnd)} (after "${preceding.title}")`,
        })
      }
    }
  }

  // Activities that will be pushed by the new activity
  const effectiveEnd = effectiveStart + newDur
  const following = timed.filter(a => {
    const aStart = parseMinutes(a.startTime!)
    return aStart >= effectiveStart && aStart < effectiveEnd && a !== preceding
  })
  for (const a of following) {
    conflicts.push({
      type: 'push_following',
      title: a.title,
      detail: `moved to ${fmtMin(effectiveEnd)}`,
    })
  }

  return conflicts
}

interface AddActivityModalProps {
  itineraryId: string
  dayId: string
  existingActivities: Activity[]
  onAdded: () => void
  onClose: () => void
}

export const AddActivityModal: React.FC<AddActivityModalProps> = ({
  itineraryId,
  dayId,
  existingActivities,
  onAdded,
  onClose,
}) => {
  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState('60')
  const [startTime, setStartTime] = useState('')
  const [conflicts, setConflicts] = useState<Conflict[] | null>(null)
  const { location, placeData, inputRef: locationInputRef, handleLocationChange } = usePlaceAutocomplete()

  const addMutation = useMutation({
    mutationFn: (payload: AddActivityDto) =>
      itineraryApi.addActivity(itineraryId, dayId, payload),
    onSuccess: (data) => {
      if (data.trimmedActivity) {
        toast(`"${data.trimmedActivity.title}" shortened to ${data.trimmedActivity.newDurationMinutes} min`, {
          icon: '✂️',
          duration: 4000,
        })
      }
      if (data.pushedActivities && data.pushedActivities.length > 0) {
        if (data.pushedActivities.length === 1) {
          toast(`"${data.pushedActivities[0].title}" moved to ${data.pushedActivities[0].newStartTime}`, {
            icon: '⏩',
            duration: 4000,
          })
        } else {
          toast(`${data.pushedActivities.length} activities moved to avoid overlap`, {
            icon: '⏩',
            duration: 4000,
          })
        }
      }
      onAdded()
      onClose()
    },
  })

  const buildPayload = (): AddActivityDto => ({
    title: title.trim(),
    location: location.trim() || undefined,
    durationMinutes: duration ? Number(duration) : undefined,
    startTime: startTime || undefined,
    address: placeData.address,
    placeId: placeData.placeId,
    latitude: placeData.latitude,
    longitude: placeData.longitude,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    // If there's a startTime, check for conflicts first
    if (startTime && !conflicts) {
      const found = detectConflicts(startTime, Number(duration) || 0, existingActivities)
      if (found.length > 0) {
        setConflicts(found)
        return
      }
    }

    addMutation.mutate(buildPayload())
  }

  const handleConfirmAdd = () => {
    addMutation.mutate(buildPayload())
  }

  const handleBackToForm = () => {
    setConflicts(null)
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  const getIcon = (type: string) => {
    if (type === 'trim_preceding') return '✂️'
    if (type === 'new_pushed') return '➡️'
    return '⏩'
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
      onKeyDown={e => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onClose(); } }}
      role="button"
      tabIndex={0}
    >
      <div className="bg-white dark:bg-[#16142e] rounded-3xl shadow-2xl border border-gray-100 dark:border-blue-600/10 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-blue-600/10">
          <h2 className="text-lg font-black text-gray-900 dark:text-blue-300">
            {conflicts ? 'Time Conflict' : 'Add Activity'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700/50 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conflict confirmation step */}
        {conflicts ? (
          <div className="p-6 space-y-4">
            <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-2xl">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-2">
                  Adding "{title}" at {startTime} will change these activities:
                </p>
                <ul className="space-y-1.5">
                  {conflicts.map((c, i) => (
                    <li key={`conflict-${c.type}-${c.title || ''}-${i}`} className="text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
                      <span className="mt-0.5">
                        {getIcon(c.type)}
                      </span>
                      <span>
                        {c.title
                          ? <><span className="font-semibold">"{c.title}"</span> — {c.detail}</>
                          : c.detail
                        }
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-slate-400">
              Do you want to add the activity anyway?
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleBackToForm}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                Go back
              </button>
              <button
                type="button"
                onClick={handleConfirmAdd}
                disabled={addMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-black disabled:opacity-50 transition-colors"
              >
                {addMutation.isPending ? 'Adding…' : 'Add anyway'}
              </button>
            </div>
          </div>
        ) : (
          /* Normal form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="add-title" className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="add-title"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Visit the Eiffel Tower"
                required
                className="text-sm font-medium text-gray-900 dark:text-blue-300 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary placeholder:text-gray-300 dark:placeholder:text-slate-600"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="add-location" className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                Location
              </label>
              <input
                id="add-location"
                ref={locationInputRef}
                type="text"
                value={location}
                onChange={e => handleLocationChange(e.target.value)}
                placeholder="Search for a place…"
                className="text-sm font-medium text-gray-900 dark:text-blue-300 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary placeholder:text-gray-300 dark:placeholder:text-slate-600"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="add-starttime" className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                Start Time
              </label>
              <TimeSelect id="add-starttime" value={startTime} onChange={setStartTime} placeholder="Optional" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="add-duration" className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                Duration
              </label>
              <DurationSelect id="add-duration" value={duration} onChange={setDuration} />
            </div>

            {addMutation.isError && (
              <p className="text-xs text-red-500 font-medium">
                Something went wrong. Please try again.
              </p>
            )}

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
        )}
      </div>
    </div>
  )
}
