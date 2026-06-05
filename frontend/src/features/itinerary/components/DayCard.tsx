import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ChevronDown, Cloud, Sun, CloudRain, Wind, GripVertical, Plus, MapPin, Clock } from 'lucide-react'
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
  destination?: string
  onAddActivity?: (dayId: string) => void
  onReorderActivities?: (dayId: string, activityIds: string[]) => void
  onActivityUpdated?: () => void
  onActivityDeleted?: () => void
}

function WeatherChip({ condition, tempMax }: { condition: string; tempMax?: number | null }) {
  const lc = condition.toLowerCase()
  const isRain  = lc === 'rain' || lc === 'showers'
  const isSun   = lc === 'clear' || lc === 'sunny'
  const isWindy = lc === 'windy'
  const Icon = isRain ? CloudRain : isSun ? Sun : isWindy ? Wind : Cloud
  const colorClass = isRain ? 'text-sky-500 dark:text-sky-400' : isSun ? 'text-amber-500 dark:text-amber-400' : 'text-gray-400 dark:text-[#a3a1c8]'

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] bg-gray-100 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.07] text-[13px] font-medium text-gray-700 dark:text-[#f0eeff]">
      <Icon className={`w-3.5 h-3.5 ${colorClass}`} />
      {tempMax != null ? `${tempMax}°C` : '--°C'}
    </span>
  )
}

export const DayCard: React.FC<DayCardProps> = ({
  day,
  isInitiallyExpanded = false,
  dragHandleProps,
  dragHandleAttributes,
  itineraryId,
  destination,
  onAddActivity,
  onReorderActivities,
  onActivityUpdated,
  onActivityDeleted,
}) => {
  const [isExpanded, setIsExpanded] = useState(isInitiallyExpanded)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  // Local activities order for instant visual feedback
  const [localActivities, setLocalActivities] = useState(day.activities ?? [])
  useEffect(() => { setLocalActivities(day.activities ?? []) }, [day.activities])

  const handleActivityDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = localActivities.findIndex(a => a.id === active.id)
    const newIdx = localActivities.findIndex(a => a.id === over.id)
    if (oldIdx === -1 || newIdx === -1) return

    const reordered = arrayMove(localActivities, oldIdx, newIdx)
    setLocalActivities(reordered)  // instant visual update
    onReorderActivities?.(day.id, reordered.map(a => a.id))
  }

  const totalMinutes = localActivities.reduce((s, a) => s + (a.durationMinutes ?? 0), 0)
  const activeHours = totalMinutes > 0 ? `~${Math.round(totalMinutes / 60)}h` : null

  return (
    <div className="relative bg-white dark:bg-[rgba(22,24,48,0.6)] dark:backdrop-blur-xl border border-gray-200/80 dark:border-white/[0.07] rounded-[18px] overflow-hidden shadow-[0_2px_12px_-4px_rgba(0,0,0,0.10),0_0_0_1px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_10px_32px_-12px_rgba(0,0,0,0.6)] hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.05)] dark:hover:border-white/[0.14] dark:hover:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_10px_32px_-12px_rgba(0,0,0,0.6)] transition-all">

      {/* header */}
      <div className="flex items-center gap-4 px-5 py-4 cursor-pointer select-none" onClick={() => setIsExpanded(v => !v)}>
        {dragHandleProps && (
          <div
            {...dragHandleProps}
            {...dragHandleAttributes}
            onClick={e => e.stopPropagation()}
            data-testid="day-drag-handle"
            className="p-1.5 rounded-[8px] text-gray-400 dark:text-[#6e6c93] cursor-grab active:cursor-grabbing hover:text-gray-600 dark:hover:text-[#a3a1c8] transition-colors flex-shrink-0"
          >
            <GripVertical className="w-4 h-4" />
          </div>
        )}

        <div className="w-14 flex-shrink-0 h-16 rounded-[12px] bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 flex flex-col items-center justify-center">
          <span className="text-[9px] font-mono font-semibold uppercase tracking-[0.12em] text-sky-600 dark:text-sky-400 mb-1">Day</span>
          <span className="text-2xl font-semibold text-sky-600 dark:text-sky-400 leading-none" style={{ letterSpacing: '-0.02em' }}>
            {day.dayNumber}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-[18px] font-semibold text-gray-900 dark:text-[#f0eeff] leading-snug mb-1" style={{ letterSpacing: '-0.015em' }}>
            {day.theme || `Day ${day.dayNumber}`}
          </h3>
          <div className="flex items-center gap-1.5 text-[13px] text-gray-400 dark:text-[#6e6c93]">
            <span>{format(new Date(day.date), 'EEEE, MMMM d')}</span>
            {localActivities.length > 0 && (
              <>
                <span className="w-[3px] h-[3px] rounded-full bg-gray-300 dark:bg-[#6e6c93]" />
                <span className="inline-flex items-center gap-1 text-gray-500 dark:text-[#a3a1c8]">
                  <MapPin className="w-2.5 h-2.5" /> {localActivities.length} stops
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          {day.weather && (
            <WeatherChip condition={day.weather.condition} tempMax={day.weather.tempMax} />
          )}
          <div className={`w-8 h-8 rounded-[10px] bg-gray-100 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.07] grid place-items-center text-gray-400 dark:text-[#a3a1c8] transition-transform duration-200 ${!isExpanded ? '-rotate-90' : ''}`}>
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* body */}
      <div
        className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
        style={{
          maxHeight: isExpanded ? '4000px' : 0,
          borderTop: isExpanded ? '1px solid' : 'none',
          borderTopColor: isExpanded ? 'var(--day-border, rgba(0,0,0,0.08))' : 'transparent',
        }}
      >
        <div className="flex gap-4 px-5 py-3 border-b border-blue-100/80 dark:border-white/[0.07] bg-blue-50/50 dark:bg-black/10">
          <span className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 dark:text-[#a3a1c8]">
            <MapPin className="w-3 h-3 text-gray-400 dark:text-[#6e6c93]" />
            <strong className="text-gray-800 dark:text-[#f0eeff] font-semibold">{localActivities.length}</strong> stops
          </span>
          {activeHours && (
            <span className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 dark:text-[#a3a1c8]">
              <Clock className="w-3 h-3 text-gray-400 dark:text-[#6e6c93]" />
              <strong className="text-gray-800 dark:text-[#f0eeff] font-semibold">{activeHours}</strong> active
            </span>
          )}
        </div>

        <div className="px-5 py-4 relative bg-slate-50/60 dark:bg-transparent">
          {localActivities.length > 1 && (
            <div
              className="absolute w-0.5 pointer-events-none"
              style={{
                left: '39px',
                top: '36px',
                bottom: '80px',
                background: 'linear-gradient(180deg, rgba(56,189,248,0.4) 0%, rgba(56,189,248,0.1) 100%)',
              }}
            />
          )}

          {localActivities.length > 0 ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleActivityDragEnd}>
              <SortableContext items={localActivities.map(a => a.id)} strategy={verticalListSortingStrategy}>
                {localActivities.map((activity, index) => (
                  <SortableAttractionCard
                    key={activity.id}
                    activity={activity}
                    index={index}
                    itineraryId={itineraryId}
                    destination={destination}
                    onUpdated={onActivityUpdated}
                    onDeleted={onActivityDeleted}
                  />
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            <p className="text-center text-[13px] text-gray-400 dark:text-[#6e6c93] py-6">No activities planned for this day.</p>
          )}
        </div>

        {onAddActivity && (
          <button
            onClick={() => onAddActivity(day.id)}
            className="mx-5 mb-4 w-[calc(100%-40px)] flex items-center justify-center gap-2 py-3.5 rounded-[12px] border border-dashed border-sky-200 dark:border-white/[0.20] bg-white dark:bg-sky-400/[0.03] text-[13px] font-medium text-sky-500/70 dark:text-[#a3a1c8] hover:bg-sky-50 dark:hover:bg-sky-400/[0.07] hover:border-sky-400 dark:hover:border-sky-400/50 hover:text-sky-600 dark:hover:text-sky-400 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add activity to day {day.dayNumber}
          </button>
        )}
      </div>
    </div>
  )
}
