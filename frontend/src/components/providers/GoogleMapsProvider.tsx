import React, { createContext, useContext, useEffect, useState } from 'react'

declare global {
  interface Window {
    initGoogleMaps?: () => void
  }
}

interface GoogleMapsContextType {
  isLoaded: boolean
  loadError: Error | null
}

const GoogleMapsContext = createContext<GoogleMapsContextType | undefined>(undefined)

export const useGoogleMaps = () => {
  const context = useContext(GoogleMapsContext)
  if (context === undefined) {
    throw new Error('useGoogleMaps must be used within a GoogleMapsProvider')
  }
  return context
}

interface GoogleMapsProviderProps {
  children: React.ReactNode
}

export const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState<Error | null>(null)

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      setLoadError(new Error('Google Maps API key is not configured'))
      return
    }

    // Define the global callback
    globalThis.window.initGoogleMaps = () => {
      setIsLoaded(true)
      setLoadError(null)
    }

    if (globalThis.window.google?.maps) {
      setIsLoaded(true)
      return
    }

    const SCRIPT_ID = 'google-maps-sdk'
    const existingScript = globalThis.window.document.getElementById(SCRIPT_ID)
    
    if (existingScript) {
      // If script exists but google.maps is not yet loaded, wait for the callback
      return
    }

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    // Use the latest loading=async pattern
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry,marker&loading=async&callback=initGoogleMaps`
    script.async = true
    script.defer = true

    const handleError = () => {
      setLoadError(new Error('Failed to load Google Maps API'))
      setIsLoaded(false)
    }

    script.addEventListener('error', handleError)
    document.head.appendChild(script)

    return () => {
      script.removeEventListener('error', handleError)
    }
  }, [])

  const value: GoogleMapsContextType = {
    isLoaded,
    loadError,
  }

  return (
    <GoogleMapsContext.Provider value={value}>
      {children}
    </GoogleMapsContext.Provider>
  )
}
