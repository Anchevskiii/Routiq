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

const VENUE_WORDS = new Set([
  'workshop', 'restaurant', 'cafe', 'temple', 'shrine', 'museum', 'park',
  'garden', 'gallery', 'center', 'centre', 'hall', 'house', 'church',
  'cathedral', 'palace', 'castle', 'market', 'square', 'tower', 'walk',
  'trail', 'tour', 'site', 'nature', 'cutting'
])

const stripVenueType = (s: string): string => {
  const words = s.split(/\s+/)
  for (const word of words) {
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '')
    if (VENUE_WORDS.has(cleanWord)) {
      const idx = s.toLowerCase().indexOf(word.toLowerCase())
      if (idx !== -1) {
        return s.slice(0, idx).trim()
      }
    }
  }
  return s.trim()
}

const cleanWikipediaTitle = (title: string): string => {
  let s = title.trim();
  s = s.replace(/^(explore|visit|discover|see|walk\s+around|walk\s+through|sightseeing\s+at|tour\s+of|trip\s+to|journey\s+to|relax\s+at|enjoy)\s+/i, '');
  s = s.replace(/^the\s+/i, '');
  s = s.replace(/^(breakfast|lunch|dinner|brunch|coffee|drinks)\s+(at|in)\s+/i, '');
  s = s.replace(/^the\s+/i, '');
  return s.trim();
}

async function trySearchWikipedia(title: string, destination?: string): Promise<string | null> {
  if (title.length < 3) return null
  const cleanTitle = cleanWikipediaTitle(title)
  const queries = [
    destination ? `${cleanTitle} ${destination}` : cleanTitle,
    cleanTitle,
    destination ? `${stripVenueType(cleanTitle)} ${destination}` : stripVenueType(cleanTitle),
    stripVenueType(cleanTitle),
  ].filter((q, i, arr) => q && q.length > 2 && arr.indexOf(q) === i)

  for (const query of queries) {
    try {
      const res = await fetch(
        `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&namespace=0&format=json&origin=*`
      )
      const [, titles] = await res.json() as [string, string[]]
      const t = titles?.[0]
      if (t) {
        const summary = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(t)}`)
        const data = await summary.json()
        if (data.thumbnail?.source) {
          return data.thumbnail.source
        }
      }
    } catch {
      // ignore
    }
  }
  return null
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
              const photoUrl = await trySearchWikipedia(activity.title, destination)
              return { ...activity, dayNumber: day.dayNumber, color, lat, lng, photoUrl } as PlacedActivity
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
