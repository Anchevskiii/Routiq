import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, renderHook } from '@testing-library/react'
import { GoogleMapsProvider, useGoogleMaps } from './GoogleMapsProvider'

describe('GoogleMapsProvider', () => {
  const originalGoogle = globalThis.window.google

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset global google maps mock
    delete (globalThis.window as Omit<Window, 'google'> & { google?: unknown; initGoogleMaps?: unknown }).google
    delete (globalThis.window as Omit<Window, 'google'> & { google?: unknown; initGoogleMaps?: unknown }).initGoogleMaps
    const existingScript = document.getElementById('google-maps-sdk')
    if (existingScript) {
      existingScript.remove()
    }
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    globalThis.window.google = originalGoogle
    const existingScript = document.getElementById('google-maps-sdk')
    if (existingScript) {
      existingScript.remove()
    }
  })

  it('throws an error when useGoogleMaps is called outside of the provider', () => {
    expect(() => renderHook(() => useGoogleMaps())).toThrow(
      'useGoogleMaps must be used within a GoogleMapsProvider'
    )
  })

  it('sets loadError if VITE_GOOGLE_MAPS_API_KEY is not defined', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', '')

    const Consumer = () => {
      const { loadError } = useGoogleMaps()
      return <div>Error: {loadError?.message}</div>
    }

    render(
      <GoogleMapsProvider>
        <Consumer />
      </GoogleMapsProvider>
    )

    expect(screen.getByText('Error: Google Maps API key is not configured')).toBeInTheDocument()
  })

  it('sets isLoaded to true if google.maps is already present', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'fake-api-key')
    globalThis.window.google = { maps: {} } as unknown as typeof google

    const Consumer = () => {
      const { isLoaded } = useGoogleMaps()
      return <div>Loaded: {isLoaded ? 'yes' : 'no'}</div>
    }

    render(
      <GoogleMapsProvider>
        <Consumer />
      </GoogleMapsProvider>
    )

    expect(screen.getByText('Loaded: yes')).toBeInTheDocument()
  })

  it('creates and appends a script tag and invokes global callback', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'fake-api-key')

    const Consumer = () => {
      const { isLoaded, loadError } = useGoogleMaps()
      return (
        <div>
          Loaded: {isLoaded ? 'yes' : 'no'} | Error: {loadError ? 'yes' : 'no'}
        </div>
      )
    }

    const { rerender } = render(
      <GoogleMapsProvider>
        <Consumer />
      </GoogleMapsProvider>
    )

    // Initially loading
    expect(screen.getByText('Loaded: no | Error: no')).toBeInTheDocument()

    // Assert script tag was added
    const script = document.getElementById('google-maps-sdk') as HTMLScriptElement
    expect(script).toBeInTheDocument()
    expect(script.src).toContain('key=fake-api-key')

    // Simulate callback completion
    expect(globalThis.window.initGoogleMaps).toBeDefined()
    globalThis.window.initGoogleMaps?.()

    // Re-render to pick up new state
    rerender(
      <GoogleMapsProvider>
        <Consumer />
      </GoogleMapsProvider>
    )

    expect(screen.getByText('Loaded: yes | Error: no')).toBeInTheDocument()
  })

  it('sets loadError if the script fails to load', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'fake-api-key')

    const Consumer = () => {
      const { isLoaded, loadError } = useGoogleMaps()
      return (
        <div>
          Loaded: {isLoaded ? 'yes' : 'no'} | Error: {loadError?.message || 'none'}
        </div>
      )
    }

    const { rerender } = render(
      <GoogleMapsProvider>
        <Consumer />
      </GoogleMapsProvider>
    )

    const script = document.getElementById('google-maps-sdk')
    expect(script).toBeInTheDocument()

    // Dispatch error event on script
    const errorEvent = new Event('error')
    script?.dispatchEvent(errorEvent)

    rerender(
      <GoogleMapsProvider>
        <Consumer />
      </GoogleMapsProvider>
    )

    expect(screen.getByText('Loaded: no | Error: Failed to load Google Maps API')).toBeInTheDocument()
  })
})
