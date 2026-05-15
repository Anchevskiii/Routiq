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

    // Check if script is already loaded or being loaded
    const SCRIPT_ID = 'google-maps-sdk'
    const existingScript = document.getElementById(SCRIPT_ID)
    
    if (window.google?.maps || existingScript) {
      setIsLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    // Use the latest loading=async pattern
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&loading=async&callback=initGoogleMaps`
    script.async = true
    script.defer = true

    // Define the global callback
    window.initGoogleMaps = () => {
      setIsLoaded(true)
      setLoadError(null)
    }

    const handleError = () => {
      setLoadError(new Error('Failed to load Google Maps API'))
      setIsLoaded(false)
    }

    script.addEventListener('error', handleError)

    document.head.appendChild(script)

    return () => {
      script.removeEventListener('error', handleError)
      delete window.initGoogleMaps
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
