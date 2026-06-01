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

async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    new google.maps.Geocoder().geocode({ address: query }, (results, status) => {
      resolve(status === 'OK' && results?.[0]
        ? { lat: results[0].geometry.location.lat(), lng: results[0].geometry.location.lng() }
        : null)
    })
  })
}

export function usePlacedActivities(days: Day[], destination: string, isLoaded: boolean) {
  const [placed, setPlaced] = useState<PlacedActivity[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isLoaded) return
    const resolve = async () => {
      setLoading(true)
      const result: PlacedActivity[] = []
      for (const day of days) {
        const color = COLORS[(day.dayNumber - 1) % COLORS.length]
        for (const activity of day.activities) {
          if (activity.latitude != null && activity.longitude != null) {
            result.push({ ...activity, dayNumber: day.dayNumber, color, lat: activity.latitude, lng: activity.longitude })
          } else {
            const query = activity.address ? `${activity.address}, ${destination}` : `${activity.title}, ${destination}`
            const coords = await geocode(query)
            if (coords) result.push({ ...activity, dayNumber: day.dayNumber, color, ...coords })
          }
        }
      }
      setPlaced(result)
      setLoading(false)
    }
    resolve()
  }, [isLoaded, days, destination])

  return { placed, loading }
}
