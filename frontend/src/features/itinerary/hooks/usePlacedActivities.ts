import { useState, useEffect } from 'react'
import type { Day, Activity } from '@/types/itinerary.types'

export interface PlacedActivity extends Activity {
  dayNumber: number
  color: string
  lat: number
  lng: number
}

const COLORS = [
  '#2563eb', '#0ea5e9', '#10b981', '#f59e0b',
  '#ef4444', '#3b82f6', '#06b6d4', '#84cc16',
]

export function usePlacedActivities(days: Day[], isLoaded: boolean) {
  const [placed, setPlaced] = useState<PlacedActivity[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isLoaded) return
    setLoading(true)
    const result: PlacedActivity[] = []
    for (const day of days) {
      const color = COLORS[(day.dayNumber - 1) % COLORS.length]
      for (const activity of day.activities) {
        if (activity.latitude != null && activity.longitude != null) {
          result.push({
            ...activity,
            dayNumber: day.dayNumber,
            color,
            lat: activity.latitude,
            lng: activity.longitude,
          })
        }
      }
    }
    setPlaced(result)
    setLoading(false)
  }, [isLoaded, days])

  return { placed, loading }
}
