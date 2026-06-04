import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePlaceAutocomplete } from './usePlaceAutocomplete'
import { useGoogleMaps } from '@/components/providers/GoogleMapsProvider'

vi.mock('@/components/providers/GoogleMapsProvider', () => ({
  useGoogleMaps: vi.fn(),
}))

describe('usePlaceAutocomplete', () => {
  let addListenerMock: any
  let getPlaceMock: any

  beforeEach(() => {
    addListenerMock = vi.fn()
    getPlaceMock = vi.fn()

    const mockAutocomplete = vi.fn().mockImplementation(() => ({
      addListener: addListenerMock,
      getPlace: getPlaceMock,
    }))

    vi.stubGlobal('google', {
      maps: {
        places: {
          Autocomplete: mockAutocomplete,
        },
      },
    })

    vi.mocked(useGoogleMaps).mockReturnValue({
      isLoaded: true,
      loadError: null as unknown as Error,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('should not initialize Autocomplete if Google Maps is not loaded', () => {
    vi.mocked(useGoogleMaps).mockReturnValue({
      isLoaded: false,
      loadError: null as unknown as Error,
    })

    const { result } = renderHook(() => usePlaceAutocomplete())
    expect(result.current.location).toBe('')
    expect(result.current.placeData).toEqual({})
  })

  it('should initialize Autocomplete and add place_changed listener if loaded', () => {
    const { result } = renderHook(() => usePlaceAutocomplete())
    
    // Simulate ref assignment
    const mockInput = document.createElement('input')
    Object.defineProperty(result.current.inputRef, 'current', {
      value: mockInput,
      writable: true,
    })

    // Trigger effect
    const { rerender } = renderHook(() => usePlaceAutocomplete())
    
    expect(result.current.location).toBe('')
    expect(result.current.placeData).toEqual({})
  })

  it('should update location and placeData when handleLocationChange is called', () => {
    const { result } = renderHook(() => usePlaceAutocomplete())
    
    act(() => {
      result.current.handleLocationChange('New York')
    })

    expect(result.current.location).toBe('New York')
    expect(result.current.placeData).toEqual({})
  })
})
