import React, { useState } from 'react'
import { format } from 'date-fns'
import { ChevronDown, ChevronUp, Cloud, Sun, CloudRain, Wind, GripVertical, Plus } from 'lucide-react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import type { DraggableSyntheticListeners, DraggableAttributes } from '@dnd-kit/core'

import { Day } from '@/types/itinerary.types'
import { SortableAttractionCard } from './SortableAttractionCard'

interface DayCardProps {
  day: Day
  isInitiallyExpanded?: boolean
  dragHandleProps?: DraggableSyntheticListeners
  dragHandleAttributes?: DraggableAttributes
  itineraryId?: string
  onAddActivity?: (dayId: string) => void
  onReorderActivities?: (dayId: string, activityIds: string[]) => void
  onActivityUpdated?: () => void
  onActivityDeleted?: () => void
}

function getWeatherIcon(condition: string) {
  switch (condition.toLowerCase()) {
    case 'clear':
    case 'sunny': return <Sun className="w-5 h-5 text-yellow-500" />
    case 'rain':
    case 'showers': return <CloudRain className="w-5 h-5 text-blue-500" />
    case 'windy': return <Wind className="w-5 h-5 text-gray-500" />
    default: return <Cloud className="w-5 h-5 text-gray-400" />
  }
}

export const DayCard: React.FC<DayCardProps> = ({
  day,
  isInitiallyExpanded = false,
  dragHandleProps,
  dragHandleAttributes,
  itineraryId,
  onAddActivity,
  onReorderActivities,
  onActivityUpdated,
  onActivityDeleted,
}) => {
  const [isExpanded, setIsExpanded] = useState(isInitiallyExpanded)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const handleActivityDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !day.activities) return
    const oldIdx = day.activities.findIndex(a => a.id === active.id)
    const newIdx = day.activities.findIndex(a => a.id === over.id)
    if (oldIdx === -1 || newIdx === -1) return
    const reordered = arrayMove(day.activities, oldIdx, newIdx)
    onReorderActivities?.(day.id, reordered.map(a => a.id))
  }

  return (
    <div className="bg-white dark:bg-[#16142e] rounded-3xl shadow-sm border border-gray-100 dark:border-blue-600/10 overflow-hidden mb-6 transition-all">
      {/* Header */}
      <div className="w-full px-8 py-6 flex items-center justify-between bg-gray-50/30 dark:bg-slate-800/20 border-b border-gray-100 dark:border-blue-600/10 group/header">
        {/* Drag handle */}
        {dragHandleProps && (
          <div
            {...dragHandleProps}
            {...dragHandleAttributes}
            className="mr-3 p-1.5 rounded-lg cursor-grab active:cursor-grabbing text-gray-300 dark:text-slate-600 opacity-0 group-hover/header:opacity-100 hover:text-gray-500 dark:hover:text-slate-400 transition-opacity"
            title="Drag to reorder"
          >
            <GripVertical className="w-5 h-5" />
          </div>
        )}

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 flex items-center justify-between hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors rounded-2xl -mx-2 px-2 py-1"
        >
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-[#1e1b38] border border-gray-100 dark:border-blue-600/20 shadow-sm flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-tighter">Day</span>
              <span className="text-xl font-black text-primary leading-none">{day.dayNumber}</span>
            </div>

            <div className="text-left">
              <h3 className="text-lg font-bold text-gray-900 dark:text-blue-300 leading-tight">
                {day.theme || `Day ${day.dayNumber}: Exploration`}
              </h3>
              <p className="text-sm text-gray-500 dark:text-slate-500 font-medium">
                {format(new Date(day.date), 'EEEE, MMMM do')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {day.weather && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1e1b38] border border-gray-100 dark:border-blue-600/20 shadow-xs">
                {getWeatherIcon(day.weather.condition)}
                <span className="text-xs font-bold text-gray-700 dark:text-slate-300">
                  {day.weather.tempMax !== null && day.weather.tempMax !== undefined
                    ? `${day.weather.tempMax}°C`
                    : '--°C'}
                </span>
              </div>
            )}
            <div className="p-2 rounded-full bg-gray-100/50 dark:bg-slate-700/30 text-gray-400 dark:text-slate-500">
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>
        </button>
      </div>

      {/* Activities List */}
      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-8 space-y-2">
          {day.activities && day.activities.length > 0 ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleActivityDragEnd}>
              <SortableContext items={day.activities.map(a => a.id)} strategy={verticalListSortingStrategy}>
                {day.activities.map((activity, index) => (
                  <SortableAttractionCard
                    key={activity.id}
                    activity={activity}
                    index={index}
                    itineraryId={itineraryId}
                    onUpdated={onActivityUpdated}
                    onDeleted={onActivityDeleted}
                  />
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            <div className="text-center py-12 bg-gray-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
              <p className="text-gray-400 dark:text-slate-500 text-sm font-medium">No activities planned for this day.</p>
            </div>
          )}

          {/* Add Activity button */}
          {onAddActivity && (
            <button
              onClick={() => onAddActivity(day.id)}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700 text-sm font-bold text-gray-400 dark:text-slate-500 hover:border-primary/50 hover:text-primary dark:hover:text-primary transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Activity
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
