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
  isFirst,
  itineraryId,
  dragHandleProps,
  dragHandleAttributes,
  onUpdated,
  onDeleted,
}) => {
  const isMeal = activity.activityType === ActivityType.MEAL

  const [confirmState, setConfirmState] = useState<ConfirmState>('idle')
  const [editState, setEditState] = useState<EditState>('idle')
  const [editTime, setEditTime] = useState(activity.startTime ?? '')
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
    onSuccess: () => {
      setEditState('idle')
      onUpdated?.()
    },
  })

  const handleDeleteConfirm = () => deleteMutation.mutate()

  const handleEditSave = () => updateMutation.mutate()

  const openEditForm = () => {
    setEditTime(activity.startTime ?? '')
    setEditDuration(String(activity.durationMinutes ?? 60))
    setEditState('editing')
  }

  return (
    <div className={`relative pl-8 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-0.5 before:bg-gray-100 last:before:hidden ${isFirst ? 'mt-0' : 'mt-8'}`}>
      <div className={`absolute left-[-4px] top-2 w-2.5 h-2.5 rounded-full ring-4 ${
        isMeal ? 'bg-orange-500 ring-orange-500/10' : 'bg-primary ring-primary/10'
      }`} />

      <div className="bg-white dark:bg-[#1e1b38] rounded-2xl border border-gray-100 dark:border-blue-600/10 p-4 hover:shadow-md transition-shadow group">
        <div className="flex gap-2 items-start">
          {dragHandleProps && (
            <div
              {...dragHandleProps}
              {...dragHandleAttributes}
              className="mt-1 p-1 rounded cursor-grab active:cursor-grabbing text-gray-200 dark:text-slate-700 opacity-0 group-hover:opacity-100 hover:text-gray-400 dark:hover:text-slate-500 transition-opacity flex-shrink-0"
            >
              <GripVertical className="w-4 h-4" />
            </div>
          )}
        <div className="flex flex-col md:flex-row gap-6 flex-1">
          {/* Time column — clickable to edit */}
          <div className="w-20 flex-shrink-0">
            <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Time</span>
            <button
              onClick={openEditForm}
              title="Edit time & duration"
              className="text-sm font-bold text-gray-900 dark:text-blue-300 bg-gray-50 dark:bg-slate-800/50 px-2 py-1 rounded-lg border border-gray-100 dark:border-slate-700 hover:border-primary/40 transition-colors cursor-pointer"
            >
              {activity.startTime || '--:--'}
            </button>
          </div>

          <div className="flex-grow">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {isMeal ? (
                    <Utensils className="w-4 h-4 text-orange-500" />
                  ) : (
                    <Camera className="w-4 h-4 text-primary" />
                  )}
                  <h4 className="text-lg font-bold text-gray-900 dark:text-blue-300 group-hover:text-primary transition-colors">
                    {activity.title}
                  </h4>
                </div>
                <p className="text-gray-500 dark:text-slate-500 text-sm flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1" />
                  {activity.location}
                </p>
              </div>

              <div className="flex items-center gap-1">
                {activity.placeId && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.title)}${activity.location ? encodeURIComponent(' ' + activity.location) : ''}&query_place_id=${activity.placeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 text-gray-400 dark:text-slate-500 hover:text-primary transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}

                {itineraryId && (
                  <ActivityDeleteConfirm
                    confirmState={confirmState}
                    isPending={deleteMutation.isPending}
                    onRequestConfirm={() => setConfirmState('confirming')}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setConfirmState('idle')}
                  />
                )}
              </div>
            </div>

            {activity.description && (
              <p className="text-gray-600 dark:text-slate-400 text-sm leading-relaxed mb-4 line-clamp-2">
                {activity.description}
              </p>
            )}

            {editState === 'editing' && itineraryId && (
              <ActivityEditForm
                editTime={editTime}
                editDuration={editDuration}
                isPending={updateMutation.isPending}
                onTimeChange={setEditTime}
                onDurationChange={setEditDuration}
                onSave={handleEditSave}
                onCancel={() => setEditState('idle')}
              />
            )}

            <div className="flex flex-wrap gap-3">
              <button
                onClick={openEditForm}
                title="Edit duration"
                className="flex items-center px-2.5 py-1 rounded-full bg-gray-50 dark:bg-slate-800/50 text-[10px] font-bold text-gray-500 dark:text-slate-500 border border-gray-100 dark:border-slate-700 hover:border-primary/40 transition-colors cursor-pointer"
              >
                <Clock className="w-3 h-3 mr-1" />
                {activity.durationMinutes} MINS
              </button>

              {activity.tips && (
                <div className="flex items-center px-2.5 py-1 rounded-full bg-primary/5 text-[10px] font-bold text-primary border border-primary/10">
                  TIP: {activity.tips}
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
