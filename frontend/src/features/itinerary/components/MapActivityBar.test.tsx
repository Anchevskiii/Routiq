import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MapActivityBar } from './MapActivityBar'
import { ActivityType } from '@/types/itinerary.types'

describe('MapActivityBar', () => {
  it('renders day number, title, and directions link', () => {
    const mockActivity = {
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
    }

    render(<MapActivityBar activity={mockActivity} destination="Paris" />)

    expect(screen.getByText('Day 1')).toBeInTheDocument()
    expect(screen.getByText('Eiffel Tower')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /directions/i })).toHaveAttribute(
      'href',
      expect.stringContaining('https://www.google.com/maps/dir/')
    )
  })
})
