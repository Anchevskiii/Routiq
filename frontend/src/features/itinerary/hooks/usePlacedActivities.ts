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

function geocodeQuery(query: string): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    const geocoder = new google.maps.Geocoder()
    geocoder.geocode({ address: query }, (results, status) => {
      if (status === 'OK' && results?.[0]?.geometry?.location) {
        const loc = results[0].geometry.location
        resolve({ lat: loc.lat(), lng: loc.lng() })
      } else {
        resolve(null)
      }
    })
  })
}

export function usePlacedActivities(days: Day[], isLoaded: boolean, destination?: string) {
  const [placed, setPlaced] = useState<PlacedActivity[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isLoaded) return

    let cancelled = false
    setLoading(true)

    async function process() {
      const result: PlacedActivity[] = []

      for (const day of days) {
        const color = COLORS[(day.dayNumber - 1) % COLORS.length]

        const resolved = await Promise.all(
          day.activities.map(async (activity) => {
            let lat = activity.latitude
            let lng = activity.longitude

            if (lat == null || lng == null) {
              const query = activity.location || activity.title
              if (query) {
                const fullQuery = destination ? `${query}, ${destination}` : query
                const coords = await geocodeQuery(fullQuery)
                if (coords) {
                  lat = coords.lat
                  lng = coords.lng
                }
              }
            }

            if (lat != null && lng != null) {
              return { ...activity, dayNumber: day.dayNumber, color, lat, lng } as PlacedActivity
            }
            return null
          })
        )

        resolved.forEach(a => a && result.push(a))
      }

      if (!cancelled) {
        setPlaced(result)
        setLoading(false)
      }
    }

    process()
    return () => { cancelled = true }
  }, [isLoaded, days, destination])

  return { placed, loading }
}
