import React, { useState } from 'react'
import { MapPin, Clock, ExternalLink, Utensils, Camera, GripVertical } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import type { DraggableSyntheticListeners, DraggableAttributes } from '@dnd-kit/core'

import { itineraryApi } from '@/api/itinerary.api'
import { Activity, ActivityType } from '@/types/itinerary.types'
import { ActivityEditForm } from './ActivityEditForm'
import { ActivityDeleteConfirm } from './ActivityDeleteConfirm'

interface AttractionCardProps {
  activity: Activity
  isFirst?: boolean
  itineraryId?: string
  dragHandleProps?: DraggableSyntheticListeners
  dragHandleAttributes?: DraggableAttributes
  onUpdated?: () => void
  onDeleted?: () => void
}

type ConfirmState = 'idle' | 'confirming'
type EditState = 'idle' | 'editing'

export const AttractionCard: React.FC<AttractionCardProps> = ({
  activity,
  itineraryId,
  dragHandleProps,
  dragHandleAttributes,
  onUpdated,
  onDeleted,
}) => {
  const isMeal = activity.activityType === ActivityType.MEAL
  const [confirmState, setConfirmState] = useState<ConfirmState>('idle')
  const [editState, setEditState]       = useState<EditState>('idle')
  const [editTime, setEditTime]         = useState(activity.startTime ?? '')
  const [editDuration, setEditDuration] = useState(String(activity.durationMinutes ?? 60))

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!itineraryId) return Promise.resolve()
      return itineraryApi.deleteActivity(itineraryId, activity.id)
    },
    onSuccess: () => onDeleted?.(),
  })

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!itineraryId) return Promise.resolve(activity)
      return itineraryApi.updateActivity(itineraryId, activity.id, {
        startTime: editTime || undefined,
        durationMinutes: editDuration ? Number(editDuration) : undefined,
      })
    },
    onSuccess: () => { setEditState('idle'); onUpdated?.() },
  })

  const openEditForm = () => {
    setEditTime(activity.startTime ?? '')
    setEditDuration(String(activity.durationMinutes ?? 60))
    setEditState('editing')
  }

<<<<<<< HEAD
  const dotBorder  = isMeal ? 'border-orange-400' : 'border-sky-400'
  const dotShadow  = 'shadow-[0_0_0_3px_white] dark:shadow-[0_0_0_3px_rgba(8,9,26,1)]'
  const iconEl     = isMeal ? <Utensils className="w-4 h-4 text-orange-500 dark:text-orange-400" /> : <Camera className="w-4 h-4 text-sky-500 dark:text-sky-400" />
  const iconBg     = isMeal ? 'bg-orange-50 dark:bg-gradient-to-br dark:from-orange-500/20 dark:to-rose-500/15' : 'bg-sky-50 dark:bg-gradient-to-br dark:from-sky-500/20 dark:to-blue-500/15'
  const catBadge   = isMeal
    ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-400/10 border border-orange-200 dark:border-orange-400/25'
    : 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-400/10 border border-sky-200 dark:border-sky-400/25'
=======
  const dotColor = isMeal
    ? 'border-orange-400 shadow-[0_0_0_3px_rgba(8,9,26,1)]'
    : 'border-sky-400 shadow-[0_0_0_3px_rgba(8,9,26,1)]'

  const iconEl = isMeal
    ? <Utensils className="w-4 h-4 text-orange-400" />
    : <Camera className="w-4 h-4 text-sky-400" />

  const iconBg = isMeal
    ? 'bg-gradient-to-br from-orange-500/20 to-rose-500/15'
    : 'bg-gradient-to-br from-sky-500/20 to-blue-500/15'

  const catBadge = isMeal
    ? 'text-orange-400 bg-orange-400/10 border border-orange-400/25'
    : 'text-sky-400 bg-sky-400/10 border border-sky-400/25'
>>>>>>> fix/group-itinerary-access

  return (
    <div className="relative grid gap-3.5 py-2.5 group/act" style={{ gridTemplateColumns: '28px 72px 1fr auto' }}>
      {/* dot */}
      <div className="flex justify-center pt-1.5">
<<<<<<< HEAD
        <div className={`w-3.5 h-3.5 rounded-full bg-white dark:bg-[#08091a] border-[3px] z-10 ${dotBorder} ${dotShadow}`} />
=======
        <div className={`w-3.5 h-3.5 rounded-full bg-[#08091a] border-[3px] z-10 ${dotColor}`} />
>>>>>>> fix/group-itinerary-access
      </div>

      {/* time */}
      <div className="pt-1 text-right">
        <button
          onClick={openEditForm}
          title="Edit time & duration"
<<<<<<< HEAD
          className="font-mono text-[13px] font-semibold text-gray-800 dark:text-[#f0eeff] hover:text-sky-600 dark:hover:text-sky-400 transition-colors leading-none"
        >
          {activity.startTime || '--:--'}
        </button>
        <span className="block font-mono text-[11px] font-medium text-gray-400 dark:text-[#6e6c93] mt-1">
=======
          className="font-mono text-[13px] font-semibold text-[#f0eeff] hover:text-sky-400 transition-colors leading-none"
        >
          {activity.startTime || '--:--'}
        </button>
        <span className="block font-mono text-[11px] font-medium text-[#6e6c93] mt-1">
>>>>>>> fix/group-itinerary-access
          {activity.durationMinutes} min
        </span>
      </div>

      {/* card */}
      <div className="flex flex-col gap-2">
<<<<<<< HEAD
        <div className="bg-gray-50 dark:bg-white/[0.025] border border-gray-200 dark:border-white/[0.07] rounded-[12px] p-3 flex items-center gap-3 hover:bg-white dark:hover:bg-white/[0.04] hover:border-gray-300 dark:hover:border-white/[0.14] hover:translate-x-0.5 cursor-pointer transition-all shadow-xs">
=======
        <div className="bg-white/[0.025] border border-white/[0.07] rounded-[12px] p-3 flex items-center gap-3 hover:bg-white/[0.04] hover:border-white/[0.14] hover:translate-x-0.5 cursor-pointer transition-all">
>>>>>>> fix/group-itinerary-access
          <div className={`w-10 h-10 rounded-[10px] flex-shrink-0 grid place-items-center ${iconBg}`}>
            {iconEl}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
<<<<<<< HEAD
              <span className="text-[14px] font-semibold text-gray-900 dark:text-[#f0eeff] leading-snug tracking-[-0.005em]">
=======
              <span className="text-[14px] font-semibold text-[#f0eeff] leading-snug tracking-[-0.005em]">
>>>>>>> fix/group-itinerary-access
                {activity.title}
              </span>
              <span className={`text-[9px] font-mono font-semibold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded-[5px] ${catBadge}`}>
                {isMeal ? 'food' : 'sight'}
              </span>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              {activity.location && (
<<<<<<< HEAD
                <span className="flex items-center gap-1 text-[12px] text-gray-400 dark:text-[#6e6c93]">
=======
                <span className="flex items-center gap-1 text-[12px] text-[#6e6c93]">
>>>>>>> fix/group-itinerary-access
                  <MapPin className="w-2.5 h-2.5" /> {activity.location}
                </span>
              )}
              {activity.durationMinutes && (
<<<<<<< HEAD
                <span className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-[#6e6c93]">
=======
                <span className="flex items-center gap-1 text-[11px] text-[#6e6c93]">
>>>>>>> fix/group-itinerary-access
                  <Clock className="w-2.5 h-2.5" /> {activity.durationMinutes} min
                </span>
              )}
            </div>
          </div>
        </div>

        {editState === 'editing' && itineraryId && (
          <ActivityEditForm
            editTime={editTime}
            editDuration={editDuration}
            isPending={updateMutation.isPending}
            onTimeChange={setEditTime}
            onDurationChange={setEditDuration}
            onSave={() => updateMutation.mutate()}
            onCancel={() => setEditState('idle')}
          />
        )}
      </div>

      {/* tools */}
      <div className="flex flex-col gap-1 opacity-0 group-hover/act:opacity-100 transition-opacity pt-1">
        {dragHandleProps && (
          <button
            {...dragHandleProps}
            {...dragHandleAttributes}
<<<<<<< HEAD
            className="w-7 h-7 rounded-[8px] bg-transparent border border-gray-200 dark:border-white/[0.07] grid place-items-center text-gray-400 dark:text-[#a3a1c8] cursor-grab active:cursor-grabbing hover:text-gray-700 dark:hover:text-[#f0eeff] hover:border-gray-400 dark:hover:border-white/[0.14] transition-all"
=======
            className="w-7 h-7 rounded-[8px] bg-transparent border border-white/[0.07] grid place-items-center text-[#a3a1c8] cursor-grab active:cursor-grabbing hover:text-[#f0eeff] hover:border-white/[0.14] transition-all"
>>>>>>> fix/group-itinerary-access
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>
        )}
        {activity.placeId && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.title)}${activity.location ? encodeURIComponent(' ' + activity.location) : ''}&query_place_id=${activity.placeId}`}
            target="_blank"
            rel="noopener noreferrer"
<<<<<<< HEAD
            className="w-7 h-7 rounded-[8px] bg-transparent border border-gray-200 dark:border-white/[0.07] grid place-items-center text-gray-400 dark:text-[#a3a1c8] hover:text-gray-700 dark:hover:text-[#f0eeff] hover:border-gray-400 dark:hover:border-white/[0.14] transition-all"
=======
            className="w-7 h-7 rounded-[8px] bg-transparent border border-white/[0.07] grid place-items-center text-[#a3a1c8] hover:text-[#f0eeff] hover:border-white/[0.14] transition-all"
>>>>>>> fix/group-itinerary-access
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
        {itineraryId && (
          <ActivityDeleteConfirm
            confirmState={confirmState}
            isPending={deleteMutation.isPending}
            onRequestConfirm={() => setConfirmState('confirming')}
            onConfirm={() => deleteMutation.mutate()}
            onCancel={() => setConfirmState('idle')}
          />
        )}
      </div>
    </div>
  )
}
