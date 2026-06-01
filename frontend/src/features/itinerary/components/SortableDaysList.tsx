import React from 'react'
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
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
  days,
  itineraryId,
  sensors,
  addActivityDayId,
  onDragEnd,
  onAddActivity,
  onReorderActivities,
  onActivityUpdated,
  onActivityDeleted,
  onCloseAddActivity,
}) => (
  <>
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={days.map(d => d.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {days.map((day, i) => (
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
