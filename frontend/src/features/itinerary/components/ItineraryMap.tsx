import React, { useEffect, useRef, useState, useCallback } from 'react'
import { MapPin, Loader2, Maximize2 } from 'lucide-react'
import { useGoogleMaps } from '@/components/providers/GoogleMapsProvider'
import type { Day } from '@/types/itinerary.types'
import { usePlacedActivities, type PlacedActivity } from '../hooks/usePlacedActivities'
import { MapDayTabs }     from './MapDayTabs'
import { MapActivityBar } from './MapActivityBar'
import { useItinerarySelection } from '../context/ItinerarySelectionContext'

interface Props {
  days: Day[]
  destination: string
  fullscreen?: boolean
}

interface PlacedActivityExtended extends PlacedActivity {
  photoUrl?: string | null
}

const getGoogleMapsUrl = (title: string, location?: string | null, destination?: string, placeId?: string | null): string => {
  let querySuffix = ''
  if (location) {
    querySuffix = ' ' + location
  } else if (destination) {
    querySuffix = ' ' + destination
  }
  const base = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(title + querySuffix)}`
  return placeId ? `${base}&query_place_id=${placeId}` : base
}

function infoHtml(a: PlacedActivityExtended, destination?: string) {
  const mapsUrl = getGoogleMapsUrl(a.title, a.location, destination, a.placeId)

  return `<div style="font-family:system-ui,sans-serif;padding:0;min-width:180px;max-width:230px;color:#14122b">
    ${a.photoUrl ? `<div style="width:calc(100% + 24px);margin:-12px -12px 8px -12px;height:85px;overflow:hidden;border-radius:8px 8px 0 0"><img src="${a.photoUrl}" alt="${a.title}" style="width:100%;height:100%;object-fit:cover" /></div>` : ''}
    <div style="${a.photoUrl ? '' : 'padding-top:4px;'}">
      <div style="font-size:10px;font-weight:700;color:${a.color};text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px">Day ${a.dayNumber}</div>
      <div style="font-size:12px;font-weight:600;line-height:1.35;margin-bottom:2px">${a.title}</div>
      ${a.startTime ? `<div style="font-size:10px;color:#9b98be">${a.startTime}</div>` : ''}
      <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-top:6px;font-size:11px;font-weight:600;color:#2563eb;text-decoration:none">View on Google Maps ↗</a>
    </div>
  </div>`
}

export const ItineraryMap: React.FC<Readonly<Props>> = ({ days, destination, fullscreen = false }) => {
  const { isLoaded, loadError } = useGoogleMaps()
  const { placed, loading } = usePlacedActivities(days, isLoaded, destination)
  const { selectedActivityId } = useItinerarySelection()
  const mapRef         = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef     = useRef<{ marker: google.maps.marker.AdvancedMarkerElement; activity: PlacedActivity }[]>([])
  const infoWindowRef  = useRef<google.maps.InfoWindow | null>(null)
  const [active, setActive]           = useState<PlacedActivity | null>(null)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [expanded, setExpanded]       = useState(false)

  useEffect(() => {
    if (!isLoaded || !mapRef.current || placed.length === 0) return
    const bounds = new google.maps.LatLngBounds()
    placed.forEach(a => bounds.extend({ lat: a.lat, lng: a.lng }))

    mapInstanceRef.current ??= new google.maps.Map(mapRef.current, {
      zoom: 13,
      center: bounds.getCenter(),
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID ?? 'DEMO_MAP_ID',
    })

    infoWindowRef.current = new google.maps.InfoWindow()
    markersRef.current.forEach(m => { m.marker.map = null })
    markersRef.current = []
    placed.forEach((activity, idx) => {
      const pin = new google.maps.marker.PinElement({
        background: activity.color,
        borderColor: 'rgba(255,255,255,0.9)',
        glyphColor: 'white',
        glyphText: String(idx + 1),
        scale: 1.1,
      })
      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: { lat: activity.lat, lng: activity.lng },
        map: mapInstanceRef.current!,
        title: activity.title,
        zIndex: idx,
      })
      marker.appendChild(pin)
      marker.addListener('gmp-click', () => {
        setActive(activity)
        infoWindowRef.current?.setContent(infoHtml(activity, destination))
        infoWindowRef.current?.open(mapInstanceRef.current!, marker)
      })
      markersRef.current.push({ marker, activity })
    })
    mapInstanceRef.current.fitBounds(bounds, 48)
  }, [placed, isLoaded, destination])

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

  // Rebuild a pin element for a marker — selected = larger blue, normal = activity colour
  // Returns PinElement directly to avoid deprecated content/element usage
  const rebuildPin = useCallback((activity: PlacedActivity, isSelected: boolean) => {
    const idx = placed.findIndex(a => a.id === activity.id)
    return new google.maps.marker.PinElement({
      background: isSelected ? '#2563eb' : activity.color,
      borderColor: isSelected ? '#ffffff' : 'rgba(255,255,255,0.9)',
      glyphColor: 'white',
      glyphText: idx === -1 ? undefined : String(idx + 1),
      scale: isSelected ? 1.4 : 1.1,
    })
  }, [placed])

  // Centre map and highlight marker when an activity is selected from the list
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !isLoaded) return

    markersRef.current.forEach(({ marker, activity }) => {
      while (marker.firstChild) {
        marker.removeChild(marker.firstChild)
      }
      marker.appendChild(rebuildPin(activity, activity.id === selectedActivityId))
    })

    if (!selectedActivityId) return
    const found = markersRef.current.find(({ activity }) => activity.id === selectedActivityId)
    if (!found) return
    map.panTo({ lat: found.activity.lat, lng: found.activity.lng })
    setActive(found.activity)
    infoWindowRef.current?.setContent(infoHtml(found.activity, destination))
    infoWindowRef.current?.open(map, found.marker)
  }, [selectedActivityId, isLoaded, rebuildPin, destination])

  const toggleExpand = () => {
    setExpanded(e => !e)
    setTimeout(() => {
      if (mapInstanceRef.current) {
        google.maps.event.trigger(mapInstanceRef.current, 'resize')
        fitVisible(markersRef.current.filter(({ activity }) => selectedDay === null || activity.dayNumber === selectedDay).map(({ activity }) => activity))
      }
    }, 300)
  }

  if (loadError) return null

  const daysWithPlaces = [...new Set(placed.map(a => a.dayNumber))].sort((a, b) => a - b)

  let heightClass = 'h-[320px]'
  if (fullscreen) {
    heightClass = 'flex-1 min-h-0'
  } else if (expanded) {
    heightClass = 'h-[520px]'
  }

  return (
    <div className={`rounded-2xl overflow-hidden shadow-sm border border-blue-600/10 ${fullscreen ? 'h-full flex flex-col' : ''}`}>
      {daysWithPlaces.length > 1 && (
        <MapDayTabs days={daysWithPlaces} selectedDay={selectedDay} expanded={expanded} onSelectDay={setSelectedDay} onToggleExpand={toggleExpand} />
      )}
      <div className={`relative transition-[height] duration-300 ${heightClass}`}>
        <div ref={mapRef} className="h-full w-full" />
        {daysWithPlaces.length <= 1 && (
          <button onClick={toggleExpand} title={expanded ? 'Collapse' : 'Expand'} className="absolute top-2 right-2 z-10 bg-white dark:bg-[#1e1b38] border border-line rounded-lg p-1.5 shadow-sm text-ink-faint hover:text-ink transition-colors">
            <Maximize2 className="w-4 h-4" />
          </button>
        )}
        {(loading || !isLoaded) && (
          <div className="absolute inset-0 bg-blue-50/80 dark:bg-[#0c0b1a]/80 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            <p className="text-xs font-medium text-blue-600">Loading locations…</p>
          </div>
        )}
        {isLoaded && !loading && placed.length === 0 && (
          <div className="absolute inset-0 bg-blue-50/60 dark:bg-[#0c0b1a]/60 flex flex-col items-center justify-center gap-2">
            <MapPin className="w-7 h-7 text-blue-600" />
            <p className="text-sm font-medium text-ink-dim">No locations to display</p>
          </div>
        )}
      </div>
      {active && <MapActivityBar activity={active} destination={destination} />}
    </div>
  )
}
