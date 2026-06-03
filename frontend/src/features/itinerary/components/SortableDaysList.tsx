import React, { useState, useEffect } from 'react'
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import type { SensorDescriptor, SensorOptions } from '@dnd-kit/core'

import { Day } from '@/types/itinerary.types'
import { SortableDayCard } from './SortableDayCard'
import { AddActivityModal } from './AddActivityModal'

interface Props {
  days: Day[]
  itineraryId: string
  sensors: SensorDescriptor<SensorOptions>[]
  addActivityDayId: string | null
  onDragEnd: (e: DragEndEvent) => void
  onAddActivity: (dayId: string) => void
  onReorderActivities: (dayId: string, activityIds: string[]) => void
  onActivityUpdated: () => void
  onActivityDeleted: () => void
  onCloseAddActivity: () => void
}

export const SortableDaysList: React.FC<Props> = ({
  days: serverDays,
  itineraryId,
  sensors,
  addActivityDayId,
  onDragEnd: onDragEndExternal,
  onAddActivity,
  onReorderActivities,
  onActivityUpdated,
  onActivityDeleted,
  onCloseAddActivity,
}) => {
  // Local state for instant visual reorder — syncs from server when not dragging
  const [localDays, setLocalDays] = useState(serverDays)

  // Keep in sync with server (after refetch)
  useEffect(() => {
    setLocalDays(serverDays)
  }, [serverDays])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIdx = localDays.findIndex(d => d.id === active.id)
    const newIdx = localDays.findIndex(d => d.id === over.id)
    if (oldIdx === -1 || newIdx === -1) return

    // Instantly update local order — no waiting for backend
    setLocalDays(prev => arrayMove(prev, oldIdx, newIdx))

    // Fire backend mutation via parent
    onDragEndExternal(event)
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={localDays.map(d => d.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {localDays.map((day, i) => (
              <SortableDayCard
                key={day.id}
                day={day}
                isFirst={i === 0}
                itineraryId={itineraryId}
                onAddActivity={onAddActivity}
                onReorderActivities={onReorderActivities}
                onActivityUpdated={onActivityUpdated}
                onActivityDeleted={onActivityDeleted}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {addActivityDayId && (
        <AddActivityModal
          itineraryId={itineraryId}
          dayId={addActivityDayId}
          onAdded={onActivityUpdated}
          onClose={onCloseAddActivity}
        />
      )}
    </>
  )
}
