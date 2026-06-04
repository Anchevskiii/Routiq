import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ItineraryMap } from './ItineraryMap'
import { useGoogleMaps } from '@/components/providers/GoogleMapsProvider'
import { usePlacedActivities } from '../hooks/usePlacedActivities'
import { ActivityType } from '@/types/itinerary.types'
import type { Day } from '@/types/itinerary.types'

// Mock subcomponents/hooks
vi.mock('@/components/providers/GoogleMapsProvider', () => ({
  useGoogleMaps: vi.fn(),
}))

vi.mock('../hooks/usePlacedActivities', () => ({
  usePlacedActivities: vi.fn(),
}))

// Mock google maps elements
const mockExtend = vi.fn()
const mockGetCenter = vi.fn(() => ({ lat: 0, lng: 0 }))
const mockFitBounds = vi.fn()

class MockLatLngBounds {
  extend = mockExtend
  getCenter = mockGetCenter
}

class MockMap {
  fitBounds = mockFitBounds
}

class MockInfoWindow {
  setContent = vi.fn()
  open = vi.fn()
  close = vi.fn()
}

class MockPinElement {}
class MockAdvancedMarkerElement {
  addListener = vi.fn()
  set map(_val: unknown) {}
}

describe('ItineraryMap', () => {
  beforeEach(() => {
    vi.stubGlobal('google', {
      maps: {
        LatLngBounds: MockLatLngBounds,
        Map: MockMap,
        InfoWindow: MockInfoWindow,
        marker: {
          PinElement: MockPinElement,
          AdvancedMarkerElement: MockAdvancedMarkerElement,
        },
        event: {
          trigger: vi.fn(),
        },
      },
    })

    vi.mocked(useGoogleMaps).mockReturnValue({
      isLoaded: true,
      loadError: null as unknown as Error,
    })

    mockExtend.mockClear()
    mockGetCenter.mockClear()
    mockFitBounds.mockClear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const mockDays: Day[] = [
    {
      id: 'day-1',
      dayNumber: 1,
      date: '2026-06-04',
      theme: 'Theme',
      activities: [],
    },
  ]

  it('renders loading spinner when loading or not loaded', () => {
    vi.mocked(usePlacedActivities).mockReturnValue({
      placed: [],
      loading: true,
    })

    render(<ItineraryMap days={mockDays} destination="Paris" />)
    expect(screen.getByText('Loading locations…')).toBeInTheDocument()
  })

  it('renders "No locations to display" when loaded but placed list is empty', () => {
    vi.mocked(usePlacedActivities).mockReturnValue({
      placed: [],
      loading: false,
    })

    render(<ItineraryMap days={mockDays} destination="Paris" />)
    expect(screen.getByText('No locations to display')).toBeInTheDocument()
  })

  it('renders map container and day tabs when locations are placed', () => {
    vi.mocked(usePlacedActivities).mockReturnValue({
      placed: [
        {
          id: 'act-1',
          activityType: ActivityType.ATTRACTION,
          sortOrder: 0,
          title: 'Eiffel Tower',
          description: 'Eiffel',
          location: 'Paris',
          startTime: 'Morning',
          latitude: 48.8584,
          longitude: 2.2945,
          dayNumber: 1,
          color: '#2563eb',
          lat: 48.8584,
          lng: 2.2945,
        },
        {
          id: 'act-2',
          activityType: ActivityType.ATTRACTION,
          sortOrder: 1,
          title: 'Louvre',
          description: 'Louvre',
          location: 'Paris',
          startTime: 'Afternoon',
          latitude: 48.8606,
          longitude: 2.3376,
          dayNumber: 2,
          color: '#0ea5e9',
          lat: 48.8606,
          lng: 2.3376,
        },
      ],
      loading: false,
    })

    const { container } = render(<ItineraryMap days={mockDays} destination="Paris" />)
    expect(screen.queryByText('Loading locations…')).not.toBeInTheDocument()
    expect(screen.queryByText('No locations to display')).not.toBeInTheDocument()
    // Day tabs should show up since daysWithPlaces length > 1
    expect(screen.getByText('Day 1')).toBeInTheDocument()
    expect(screen.getByText('Day 2')).toBeInTheDocument()

    // Test expanding/collapsing map tab height
    const expandButton = container.querySelector('button')
    if (expandButton) {
      act(() => {
        fireEvent.click(expandButton)
      })
    }
  })
})
