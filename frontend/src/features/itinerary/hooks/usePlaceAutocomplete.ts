import { useState, useRef, useEffect } from 'react'
import { useGoogleMaps } from '@/components/providers/GoogleMapsProvider'

interface PlaceData {
  address?: string
  placeId?: string
  latitude?: number
  longitude?: number
}

interface PlaceResult {
  name: string
  formatted_address?: string
  place_id?: string
  geometry?: { location: { lat: () => number; lng: () => number } }
}

export function usePlaceAutocomplete() {
  const { isLoaded } = useGoogleMaps()
  const [location, setLocation] = useState('')
  const [placeData, setPlaceData] = useState<PlaceData>({})
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return
    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      fields: ['name', 'formatted_address', 'place_id', 'geometry'],
    })
    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace() as PlaceResult | undefined
      if (!place) return
      if (place.name) setLocation(place.name)
      setPlaceData({
        address: place.formatted_address,
        placeId: place.place_id,
        latitude: place.geometry?.location.lat(),
        longitude: place.geometry?.location.lng(),
      })
    })
  }, [isLoaded])

  const handleLocationChange = (value: string) => {
    setLocation(value)
    setPlaceData({})
  }

  return { location, placeData, inputRef, handleLocationChange }
}
