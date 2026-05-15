import React, { useEffect, useRef, useState, useCallback } from 'react'
import { MapPin, ExternalLink, Loader2, Maximize2 } from 'lucide-react'
import { useGoogleMaps } from '@/components/providers/GoogleMapsProvider'
import { buildDirectionsUrl } from '@/utils/map.utils'
import type { Day, Activity } from '@/types/itinerary.types'

interface PlacedActivity extends Activity {
  dayNumber: number
  color: string
  lat: number
  lng: number
}

interface Props {
  days: Day[]
  destination: string
}

const COLORS = [
  '#6366f1', '#0ea5e9', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16',
]

async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    const geocoder = new google.maps.Geocoder()
    geocoder.geocode({ address: query }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const loc = results[0].geometry.location
        resolve({ lat: loc.lat(), lng: loc.lng() })
      } else {
        resolve(null)
      }
    })
  })
}

export const ItineraryMap: React.FC<Props> = ({ days, destination }) => {
  const { isLoaded, loadError } = useGoogleMaps()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<{ marker: google.maps.marker.AdvancedMarkerElement; activity: PlacedActivity }[]>([])
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)
  const [placed, setPlaced] = useState<PlacedActivity[]>([])
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState<PlacedActivity | null>(null)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [expanded, setExpanded] = useState(false)

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
            const query = activity.address
              ? `${activity.address}, ${destination}`
              : `${activity.title}, ${destination}`
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

  useEffect(() => {
    if (!isLoaded || !mapRef.current || placed.length === 0) return

    const bounds = new google.maps.LatLngBounds()
    placed.forEach(a => bounds.extend({ lat: a.lat, lng: a.lng }))

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        zoom: 13,
        center: bounds.getCenter(),
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID ?? 'DEMO_MAP_ID',
      })
    }

    infoWindowRef.current = new google.maps.InfoWindow()
    markersRef.current.forEach(m => { m.marker.map = null })
    markersRef.current = []

    placed.forEach((activity, idx) => {
      const pin = new google.maps.marker.PinElement({
        background: activity.color,
        borderColor: 'rgba(255,255,255,0.9)',
        glyphColor: 'white',
        glyph: String(idx + 1),
        scale: 1.1,
      })

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: { lat: activity.lat, lng: activity.lng },
        map: mapInstanceRef.current!,
        title: activity.title,
        content: pin,
        zIndex: idx,
      })

      marker.addListener('click', () => {
        setActive(activity)
        infoWindowRef.current?.setContent(`
          <div style="font-family:system-ui,sans-serif;padding:2px;min-width:130px">
            <div style="font-size:10px;font-weight:700;color:${activity.color};text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px">Dan ${activity.dayNumber}</div>
            <div style="font-size:13px;font-weight:600;color:#14122b;line-height:1.3">${activity.title}</div>
            ${activity.startTime ? `<div style="font-size:11px;color:#9b98be;margin-top:2px">${activity.startTime}</div>` : ''}
          </div>
        `)
        infoWindowRef.current?.open(mapInstanceRef.current!, marker)
      })

      markersRef.current.push({ marker, activity })
    })

    mapInstanceRef.current.fitBounds(bounds, 48)
  }, [placed])

  // Filter markers when selectedDay changes
  const fitVisible = useCallback((visible: PlacedActivity[]) => {
    if (!mapInstanceRef.current || visible.length === 0) return
    const bounds = new google.maps.LatLngBounds()
    visible.forEach(a => bounds.extend({ lat: a.lat, lng: a.lng }))
    mapInstanceRef.current.fitBounds(bounds, 64)
  }, [])

  useEffect(() => {
    if (markersRef.current.length === 0) return
    const visible: PlacedActivity[] = []
    markersRef.current.forEach(({ marker, activity }) => {
      const show = selectedDay === null || activity.dayNumber === selectedDay
      marker.map = show ? mapInstanceRef.current! : null
      if (show) visible.push(activity)
    })
    fitVisible(visible)
    setActive(null)
    infoWindowRef.current?.close()
  }, [selectedDay, fitVisible])

  const toggleExpand = () => {
    setExpanded(e => !e)
    setTimeout(() => {
      if (mapInstanceRef.current) {
        google.maps.event.trigger(mapInstanceRef.current, 'resize')
        const visible = markersRef.current
          .filter(({ activity }) => selectedDay === null || activity.dayNumber === selectedDay)
          .map(({ activity }) => activity)
        fitVisible(visible)
      }
    }, 300)
  }

  if (loadError) return null

  const daysWithPlaces = [...new Set(placed.map(a => a.dayNumber))].sort()
  const mapHeight = expanded ? 520 : 320

  return (
    <div
      ref={containerRef}
      className="rounded-2xl overflow-hidden shadow-sm border border-indigo-500/10"
    >
      {/* Day filter tabs */}
      {daysWithPlaces.length > 1 && (
        <div className="bg-white dark:bg-[#16142e] px-3 pt-3 pb-2 border-b border-slate-100 dark:border-indigo-500/10 flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedDay(null)}
            className={[
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
              selectedDay === null
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-ink-dim hover:bg-indigo-50 dark:hover:bg-indigo-900/30',
            ].join(' ')}
          >
            Vsi dnevi
          </button>
          {daysWithPlaces.map(dn => (
            <button
              key={dn}
              onClick={() => setSelectedDay(dn === selectedDay ? null : dn)}
              className={[
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                selectedDay === dn
                  ? 'text-white shadow-sm'
                  : 'text-ink-dim hover:bg-indigo-50 dark:hover:bg-indigo-900/30',
              ].join(' ')}
              style={selectedDay === dn ? { background: COLORS[(dn - 1) % COLORS.length] } : undefined}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: COLORS[(dn - 1) % COLORS.length] }}
              />
              Dan {dn}
            </button>
          ))}
          <button
            onClick={toggleExpand}
            title={expanded ? 'Zmanjšaj' : 'Povečaj'}
            className="ml-auto p-1.5 rounded-lg text-ink-faint hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Map */}
      <div className="relative transition-[height] duration-300" style={{ height: mapHeight }}>
        <div ref={mapRef} className="h-full w-full" />
        {/* Expand button when no day tabs shown */}
        {daysWithPlaces.length <= 1 && (
          <button
            onClick={toggleExpand}
            title={expanded ? 'Zmanjšaj' : 'Povečaj'}
            className="absolute top-2 right-2 z-10 bg-white dark:bg-[#1e1b38] border border-line rounded-lg p-1.5 shadow-sm text-ink-faint hover:text-ink transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}
        {(loading || !isLoaded) && (
          <div className="absolute inset-0 bg-indigo-50/80 dark:bg-[#0c0b1a]/80 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            <p className="text-xs font-medium text-indigo-400">Nalagam lokacije…</p>
          </div>
        )}
        {isLoaded && !loading && placed.length === 0 && (
          <div className="absolute inset-0 bg-indigo-50/60 dark:bg-[#0c0b1a]/60 flex flex-col items-center justify-center gap-2">
            <MapPin className="w-7 h-7 text-indigo-300" />
            <p className="text-sm font-medium text-ink-dim">Ni lokacij za prikaz</p>
          </div>
        )}
      </div>

      {/* Active activity bar */}
      {active && (
        <div className="bg-white dark:bg-[#16142e] px-4 py-3 border-t border-slate-100 dark:border-indigo-500/10 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-bold" style={{ color: active.color }}>Dan {active.dayNumber}</div>
            <div className="text-sm font-semibold text-indigo-950 dark:text-indigo-100 truncate">{active.title}</div>
          </div>
          <a
            href={buildDirectionsUrl(destination, active.address ?? active.title ?? destination)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-semibold text-indigo-500 hover:text-indigo-700 shrink-0"
          >
            Pot <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  )
}
