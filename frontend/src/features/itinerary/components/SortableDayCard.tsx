import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { Day } from '@/types/itinerary.types'
import { DayCard } from './DayCard'

export interface SortableDayCardProps {
  day: Day
  isFirst: boolean
  itineraryId: string
  onAddActivity: (dayId: string) => void
  onReorderActivities: (dayId: string, activityIds: string[]) => void
  onActivityUpdated: () => void
  onActivityDeleted: () => void
}

export const SortableDayCard: React.FC<SortableDayCardProps> = ({
  day,
  isFirst,
  itineraryId,
  onAddActivity,
  onReorderActivities,
  onActivityUpdated,
  onActivityDeleted,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: day.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <DayCard
        day={day}
        isInitiallyExpanded={isFirst}
        dragHandleProps={listeners}
        dragHandleAttributes={attributes}
        itineraryId={itineraryId}
        onAddActivity={onAddActivity}
        onReorderActivities={onReorderActivities}
        onActivityUpdated={onActivityUpdated}
        onActivityDeleted={onActivityDeleted}
      />
    </div>
  )
}
