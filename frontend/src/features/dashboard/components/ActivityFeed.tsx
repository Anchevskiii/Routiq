import React from 'react'
import { format } from 'date-fns'
import type { Itinerary } from '@/types/itinerary.types'

interface Props {
  itineraries: Itinerary[]
}

export const ActivityFeed: React.FC<Props> = ({ itineraries }) => {
  if (itineraries.length === 0) {
    return <p className="text-xs text-slate-400 text-center py-3">Ni aktivnosti.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {itineraries.map(it => (
        <div key={it.id} className="flex items-start gap-2.5">
          <span
            className="mt-1 w-2 h-2 rounded-full shrink-0 gradient-aurora"
          />
          <div className="min-w-0">
            <p className="text-xs leading-snug text-slate-700 dark:text-slate-300">
              <strong className="text-indigo-950 dark:text-indigo-100">{it.user?.name ?? 'Ti'}</strong> si dodal/a{' '}
              <span className="text-indigo-500 dark:text-indigo-400">{it.destination}</span>
            </p>
            <p className="text-xs mt-0.5 text-slate-400 dark:text-slate-600">
              {format(new Date(it.createdAt), 'd. MMM yyyy')}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
