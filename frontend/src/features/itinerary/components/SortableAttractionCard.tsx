import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { Activity } from '@/types/itinerary.types'
import { AttractionCard } from './AttractionCard'

interface Props {
  activity: Activity
  index: number
  itineraryId?: string
  destination?: string
  onUpdated?: () => void
  onDeleted?: () => void
}

export const SortableAttractionCard: React.FC<Props> = ({
  activity,
  index,
  itineraryId,
  destination,
  onUpdated,
  onDeleted,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: activity.id,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <AttractionCard
        activity={activity}
        isFirst={index === 0}
        itineraryId={itineraryId}
        dragHandleProps={listeners}
        dragHandleAttributes={attributes}
        destination={destination}
        onUpdated={onUpdated}
        onDeleted={onDeleted}
      />
    </div>
  )
}
