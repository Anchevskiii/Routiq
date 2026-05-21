import React from 'react'
import { ExternalLink } from 'lucide-react'
import { buildDirectionsUrl } from '@/utils/map.utils'
import type { Activity } from '@/types/itinerary.types'

interface PlacedActivity extends Activity {
  dayNumber: number
  color: string
  lat: number
  lng: number
}

interface Props {
  activity: PlacedActivity
  destination: string
}

export const MapActivityBar: React.FC<Props> = ({ activity, destination }) => (
  <div className="bg-white dark:bg-[#16142e] px-4 py-3 border-t border-slate-100 dark:border-blue-600/10 flex items-center justify-between gap-3">
    <div className="min-w-0">
      <div className="text-xs font-bold" style={{ color: activity.color }}>Day {activity.dayNumber}</div>
      <div className="text-sm font-semibold text-blue-600 dark:text-blue-300 truncate">{activity.title}</div>
    </div>
    <a
      href={buildDirectionsUrl(destination, activity.address ?? activity.title ?? destination)}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-600 shrink-0"
    >
      Directions <ExternalLink className="w-3 h-3" />
    </a>
  </div>
)
