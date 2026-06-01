import React, { useState, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import { Calendar, Clock, Share2, Printer, Wallet, Pencil, Check, X, Compass } from 'lucide-react'
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
  itinerary, showActions = true, compact = false, itineraryId, onNameChange,
}) => {
  const travelType = getTravelTypeByValue(itinerary.travelType)
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const city = itinerary.destination.split(',')[0].trim()
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(city)}`)
      .then(r => r.json())
      .then(data => {
        const url = data.originalimage?.source || data.thumbnail?.source
        if (url) setPhotoUrl(url)
      })
      .catch(() => {})
  }, [itinerary.destination])

  const updateMutation = useMutation({
    mutationFn: (name: string) => itineraryApi.updateItinerary(itineraryId ?? itinerary.id, { name }),
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
    if (trimmed && trimmed !== displayTitle) updateMutation.mutate(trimmed)
    setIsEditing(false)
  }
  const cancelEdit = () => setIsEditing(false)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commitEdit()
    if (e.key === 'Escape') cancelEdit()
  }

  const minH = compact ? 200 : 320

  return (
    <div
      className="relative rounded-[22px] overflow-hidden border border-white/[0.07] shadow-[0_1px_2px_rgba(0,0,0,0.4),0_10px_32px_-12px_rgba(0,0,0,0.6)] mb-6"
      style={{ minHeight: minH, background: '#0a1226' }}
    >
      {/* cover photo from Wikipedia */}
      {photoUrl && (
        <img
          src={photoUrl}
          alt={itinerary.destination}
          className="absolute inset-0 w-full h-full object-cover object-[center_40%]"
          style={{ filter: 'saturate(0.85) brightness(0.70)' }}
        />
      )}

      {/* gradient fallback */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#0d1428] via-[#0a1020] to-[#06090f]"
        style={{ opacity: photoUrl ? 0 : 1, transition: 'opacity 0.4s' }}
      />

      {/* overlays always on top of photo */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 800px 500px at 75% -10%, rgba(14,165,233,0.18), transparent 60%), radial-gradient(ellipse 700px 500px at 10% 110%, rgba(59,130,246,0.16), transparent 65%)' }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 80% at 0% 100%, rgba(37,99,235,0.30), transparent 60%), radial-gradient(ellipse 50% 60% at 100% 0%, rgba(34,211,238,0.14), transparent 60%)', mixBlendMode: 'screen' }} />

      <div className={`relative flex flex-col justify-between gap-5 ${compact ? 'p-6' : 'p-7 sm:p-8'}`} style={{ minHeight: minH }}>
        {/* top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-2 flex-wrap">
            {travelType && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono font-semibold uppercase tracking-[0.1em] text-[#d8d4ff] bg-[rgba(8,9,26,0.55)] border border-white/[0.12] backdrop-blur-sm">
                <Compass className="w-3 h-3" /> {travelType.label} Adventure
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono font-semibold uppercase tracking-[0.1em] text-[#22d3ee] bg-[rgba(8,9,26,0.55)] border border-white/[0.12] backdrop-blur-sm">
              {itinerary.destination}
            </span>
          </div>

          {showActions && (
            <div className="flex gap-2 flex-shrink-0">
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-[11px] text-[13px] font-medium text-[#f0eeff] bg-[rgba(8,9,26,0.55)] border border-white/[0.12] backdrop-blur-sm hover:bg-[rgba(25,30,55,0.75)] transition-colors">
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-[11px] text-[13px] font-medium text-[#f0eeff] bg-[rgba(8,9,26,0.55)] border border-white/[0.12] backdrop-blur-sm hover:bg-[rgba(25,30,55,0.75)] transition-colors">
                <Printer className="w-3.5 h-3.5" /> PDF
              </button>
            </div>
          )}
        </div>

        {/* body */}
        <div className="max-w-3xl">
          {isEditing ? (
            <div className="flex items-center gap-2 mb-3">
              <input
                ref={inputRef}
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={handleKeyDown}
                className={`font-semibold text-white bg-white/10 border border-white/30 rounded-xl px-4 py-2 focus:outline-none focus:border-blue-400 ${compact ? 'text-3xl' : 'text-5xl'}`}
                style={{ letterSpacing: '-0.035em', lineHeight: '0.96' }}
                autoFocus
              />
              <button onMouseDown={e => { e.preventDefault(); commitEdit() }} className="p-2 rounded-lg bg-white/10 hover:bg-blue-500/30 text-white transition-colors">
                <Check className="w-4 h-4" />
              </button>
              <button onMouseDown={e => { e.preventDefault(); cancelEdit() }} className="p-2 rounded-lg bg-white/10 hover:bg-red-500/30 text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 mb-3 group/title">
              <h1
                className={`font-semibold text-white ${compact ? 'text-3xl' : 'text-5xl sm:text-6xl'}`}
                style={{ letterSpacing: '-0.035em', lineHeight: '0.96', textShadow: '0 4px 30px rgba(0,0,0,0.5)' }}
              >
                {displayTitle}
              </h1>
              <button
                onClick={startEditing}
                className="opacity-0 group-hover/title:opacity-100 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-[11px] text-[13px] font-medium text-[#f0eeff] bg-[rgba(8,9,26,0.55)] border border-white/[0.12] backdrop-blur-sm">
              <Calendar className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span className="text-[#6e6c93] text-[11px] font-mono uppercase tracking-wide">When</span>
              {format(new Date(itinerary.startDate), 'MMM d')} – {format(new Date(itinerary.endDate), 'MMM d, yyyy')}
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-[11px] text-[13px] font-medium text-[#f0eeff] bg-[rgba(8,9,26,0.55)] border border-white/[0.12] backdrop-blur-sm">
              <Clock className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span className="text-[#6e6c93] text-[11px] font-mono uppercase tracking-wide">Length</span>
              {itinerary.totalDays} days
            </span>
            {itinerary.estimatedBudget && (
              <span className="inline-flex items-center gap-2 px-3 py-2 rounded-[11px] text-[13px] font-medium text-[#f0eeff] bg-[rgba(8,9,26,0.55)] border border-white/[0.12] backdrop-blur-sm">
                <Wallet className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span className="text-[#6e6c93] text-[11px] font-mono uppercase tracking-wide">Est.</span>
                {itinerary.estimatedBudget}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
