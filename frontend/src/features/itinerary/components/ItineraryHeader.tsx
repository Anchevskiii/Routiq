import React, { useState, useRef } from 'react'
import { format } from 'date-fns'
import { Calendar, Clock, Share2, Pencil, Check, X } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { itineraryApi } from '@/api/itinerary.api'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { Itinerary } from '@/types/itinerary.types'
import { getTravelTypeByValue } from '@/constants/travelTypes'

interface ItineraryHeaderProps {
  itinerary: Itinerary
  showActions?: boolean
  compact?: boolean
  itineraryId?: string
  onNameChange?: (name: string) => void
}

export const ItineraryHeader: React.FC<ItineraryHeaderProps> = ({
  itinerary,
  showActions = true,
  compact = false,
  itineraryId,
  onNameChange,
}) => {
  const travelType = getTravelTypeByValue(itinerary.travelType)
  const queryClient = useQueryClient()

  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const updateMutation = useMutation({
    mutationFn: (name: string) =>
      itineraryApi.updateItinerary(itineraryId ?? itinerary.id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.itinerary(itineraryId ?? itinerary.id) })
      onNameChange?.(editValue)
    },
  })

  const displayTitle = itinerary.name || itinerary.destination

  const startEditing = () => {
    setEditValue(displayTitle)
    setIsEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const commitEdit = () => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== displayTitle) {
      updateMutation.mutate(trimmed)
    }
    setIsEditing(false)
  }

  const cancelEdit = () => {
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commitEdit()
    if (e.key === 'Escape') cancelEdit()
  }

  return (
    <div className={`relative bg-gray-900 rounded-[2rem] overflow-hidden shadow-2xl shadow-primary/10 ${compact ? 'p-6 mb-5' : 'p-8 md:p-12 mb-12'}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent pointer-events-none" />
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-bold mb-6 border border-white/10 uppercase tracking-widest">
            {travelType?.icon} {travelType?.label} Adventure
          </div>

          {isEditing ? (
            <div className="flex items-center gap-2 mb-4">
              <input
                ref={inputRef}
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={handleKeyDown}
                className={`font-black text-white bg-white/10 border border-white/30 rounded-xl px-4 py-2 tracking-tight leading-[1.1] focus:outline-none focus:border-primary ${compact ? 'text-3xl' : 'text-4xl md:text-5xl'}`}
                style={{ width: 'min(100%, 520px)' }}
                autoFocus
              />
              <button
                onMouseDown={e => { e.preventDefault(); commitEdit() }}
                className="p-2 rounded-lg bg-white/10 hover:bg-primary/30 text-white transition-colors"
              >
                <Check className="w-5 h-5" />
              </button>
              <button
                onMouseDown={e => { e.preventDefault(); cancelEdit() }}
                className="p-2 rounded-lg bg-white/10 hover:bg-red-500/30 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 mb-4 group/title">
              <h1 className={`font-black text-white tracking-tight leading-[1.1] ${compact ? 'text-3xl' : 'text-5xl md:text-6xl'}`}>
                {displayTitle}
              </h1>
              <button
                onClick={startEditing}
                className="opacity-0 group-hover/title:opacity-100 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
                title="Edit title"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center text-white/70 gap-8">
            <span className="flex items-center bg-white/5 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/5">
              <Calendar className="w-5 h-5 mr-3 text-primary" />
              {format(new Date(itinerary.startDate), 'MMM d')} - {format(new Date(itinerary.endDate), 'MMM d, yyyy')}
            </span>
            <span className="flex items-center bg-white/5 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/5">
              <Clock className="w-5 h-5 mr-3 text-primary" />
              {itinerary.totalDays} Days of Discovery
            </span>
          </div>
        </div>

        {showActions && (
          <div className="flex gap-4">
            <button className="p-4 rounded-2xl bg-white/5 text-white hover:bg-white/10 transition-all border border-white/10">
              <Share2 className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
