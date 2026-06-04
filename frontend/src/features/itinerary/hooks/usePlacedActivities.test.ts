import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { usePlacedActivities } from './usePlacedActivities'
import { ActivityType } from '@/types/itinerary.types'
import type { Day } from '@/types/itinerary.types'

// Mock Geocoder results types to avoid any type
interface MockLatLng {
  lat: () => number
  lng: () => number
}

interface MockGeometry {
  location: MockLatLng
}

interface MockGeocodeResult {
  geometry: MockGeometry
}

// Mock Geocoder class
const mockGeocode = vi.fn()

class MockGeocoder {
  geocode(
    request: { address: string },
    callback: (results: MockGeocodeResult[] | null, status: string) => void
  ) {
    mockGeocode(request, callback)
  }
}

describe('usePlacedActivities', () => {
  beforeEach(() => {
    vi.stubGlobal('google', {
      maps: {
        Geocoder: MockGeocoder,
      },
    })
    mockGeocode.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const mockDays: Day[] = [
    {
      id: 'day-1',
      dayNumber: 1,
      date: '2026-06-04',
      theme: 'City Tour',
      activities: [
        {
          id: 'act-1',
          activityType: ActivityType.ATTRACTION,
          sortOrder: 0,
          title: 'Eiffel Tower',
          description: 'Visit Eiffel Tower',
          location: 'Champ de Mars, Paris',
          startTime: 'Morning',
          latitude: 48.8584,
          longitude: 2.2945,
        },
        {
          id: 'act-2',
          activityType: ActivityType.ATTRACTION,
          sortOrder: 1,
          title: 'Louvre Museum',
          description: 'Visit Louvre',
          location: 'Rue de Rivoli, Paris',
          startTime: 'Afternoon',
          latitude: undefined, // Missing coords, should trigger geocode
          longitude: undefined,
        },
      ],
    },
  ]

  it('should return empty placed activities and loading false when isLoaded is false', () => {
    const { result } = renderHook(() => usePlacedActivities(mockDays, false))
    expect(result.current.placed).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(mockGeocode).not.toHaveBeenCalled()
  })

  it('should directly map activities with existing coords and geocode those without', async () => {
    // Mock geocode to successfully resolve Louvre coordinates
    mockGeocode.mockImplementation(
      (
        request: { address: string },
        callback: (results: MockGeocodeResult[] | null, status: string) => void
      ) => {
        if (request.address.includes('Rue de Rivoli') || request.address.includes('Louvre Museum')) {
          callback(
            [
              {
                geometry: {
                  location: {
                    lat: () => 48.8606,
                    lng: () => 2.3376,
                  },
                },
              },
            ],
            'OK'
          )
        } else {
          callback(null, 'ZERO_RESULTS')
        }
      }
    )

    const { result } = renderHook(() => usePlacedActivities(mockDays, true, 'Paris'))

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.placed).toHaveLength(2)
    // First activity (Eiffel Tower) has stored coordinates
    expect(result.current.placed[0]).toEqual(
      expect.objectContaining({
        id: 'act-1',
        dayNumber: 1,
        lat: 48.8584,
        lng: 2.2945,
        color: '#2563eb',
      })
    )
    // Second activity (Louvre) has geocoded coordinates
    expect(result.current.placed[1]).toEqual(
      expect.objectContaining({
        id: 'act-2',
        dayNumber: 1,
        lat: 48.8606,
        lng: 2.3376,
        color: '#2563eb',
      })
    )

    expect(mockGeocode).toHaveBeenCalledWith(
      { address: 'Rue de Rivoli, Paris, Paris' },
      expect.any(Function)
    )
  })

  it('should skip activity if geocoding fails', async () => {
    mockGeocode.mockImplementation(
      (
        _request: { address: string },
        callback: (results: MockGeocodeResult[] | null, status: string) => void
      ) => {
        callback(null, 'ZERO_RESULTS')
      }
    )

    const { result } = renderHook(() => usePlacedActivities(mockDays, true))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Only Eiffel Tower should be placed, Louvre should be skipped since geocoding failed
    expect(result.current.placed).toHaveLength(1)
    expect(result.current.placed[0].id).toBe('act-1')
  })

  it('should fall back to title if location is not provided', async () => {
    const daysWithMissingLocation: Day[] = [
      {
        id: 'day-1',
        dayNumber: 1,
        date: '2026-06-04',
        theme: 'City Tour',
        activities: [
          {
            id: 'act-3',
            activityType: ActivityType.ATTRACTION,
            sortOrder: 0,
            title: 'Arc de Triomphe',
            description: 'Arc',
            location: '', // empty location
            startTime: 'Morning',
            latitude: undefined,
            longitude: undefined,
          },
        ],
      },
    ]

    mockGeocode.mockImplementation(
      (
        _request: { address: string },
        callback: (results: MockGeocodeResult[] | null, status: string) => void
      ) => {
        callback(
          [
            {
              geometry: {
                location: {
                  lat: () => 48.8738,
                  lng: () => 2.295,
                },
              },
            },
          ],
          'OK'
        )
      }
    )

    const { result } = renderHook(() => usePlacedActivities(daysWithMissingLocation, true))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.placed).toHaveLength(1)
    expect(result.current.placed[0].lat).toBe(48.8738)
    expect(mockGeocode).toHaveBeenCalledWith(
      { address: 'Arc de Triomphe' },
      expect.any(Function)
    )
  })

  it('should not update state if hook is unmounted during async process', async () => {
    let pendingCallback: ((results: MockGeocodeResult[] | null, status: string) => void) | null = null

    mockGeocode.mockImplementation(
      (
        _request: { address: string },
        callback: (results: MockGeocodeResult[] | null, status: string) => void
      ) => {
        pendingCallback = callback
      }
    )

    const { result, unmount } = renderHook(() => usePlacedActivities(mockDays, true))

    expect(result.current.loading).toBe(true)

    // Unmount hook before geocode callback returns
    unmount()

    if (pendingCallback) {
      (pendingCallback as (results: MockGeocodeResult[] | null, status: string) => void)(
        [
          {
            geometry: {
              location: {
                lat: () => 48.8606,
                lng: () => 2.3376,
              },
            },
          },
        ],
        'OK'
      )
    }

    // Since it is unmounted, result should not update further
    expect(result.current.placed).toEqual([])
  })
})
