import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AttractionCard } from './AttractionCard'
import { ItinerarySelectionProvider, useItinerarySelection } from '../context/ItinerarySelectionContext'
import { ActivityType } from '@/types/itinerary.types'
import type { Activity } from '@/types/itinerary.types'

vi.mock('@/api/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}))

vi.mock('./ActivityDeleteConfirm', () => ({
  ActivityDeleteConfirm: () => null,
}))
vi.mock('./ActivityEditForm', () => ({
  ActivityEditForm: () => null,
}))

const mockActivity: Activity = {
  id: 'act-1',
  activityType: ActivityType.ATTRACTION,
  sortOrder: 0,
  title: 'Eiffel Tower',
  location: 'Paris',
  startTime: '09:00',
  durationMinutes: 120,
}

function renderCard(activity = mockActivity) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <ItinerarySelectionProvider>
        <AttractionCard activity={activity} itineraryId="itin-1" />
      </ItinerarySelectionProvider>
    </QueryClientProvider>
  )
}

describe('AttractionCard', () => {
  it('renders activity title and location', () => {
    renderCard()
    expect(screen.getByTestId('activity-title').textContent).toBe('Eiffel Tower')
    expect(screen.getByText('Paris')).toBeInTheDocument()
  })

  it('applies blue selection border when clicked', () => {
    renderCard()
    const card = screen.getByTestId('activity-title').closest('[class*="rounded-[12px]"]')
    expect(card?.className).not.toContain('border-blue-500')
    fireEvent.click(card!)
    expect(card?.className).toContain('border-blue-500')
  })

  it('deselects when clicked again', () => {
    renderCard()
    const card = screen.getByTestId('activity-title').closest('[class*="rounded-[12px]"]')
    fireEvent.click(card!)
    fireEvent.click(card!)
    expect(card?.className).not.toContain('border-blue-500')
  })

  it('selecting one card deselects another', () => {
    const act2: Activity = { ...mockActivity, id: 'act-2', title: 'Louvre' }
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const SelectedDisplay: React.FC = () => {
      const { selectedActivityId } = useItinerarySelection()
      return <span data-testid="sel">{selectedActivityId ?? 'none'}</span>
    }
    render(
      <QueryClientProvider client={qc}>
        <ItinerarySelectionProvider>
          <AttractionCard activity={mockActivity} itineraryId="itin-1" />
          <AttractionCard activity={act2} itineraryId="itin-1" />
          <SelectedDisplay />
        </ItinerarySelectionProvider>
      </QueryClientProvider>
    )
    const [card1, card2] = screen.getAllByTestId('activity-title').map(
      el => el.closest('[class*="rounded-[12px]"]')!
    )
    fireEvent.click(card1)
    expect(screen.getByTestId('sel').textContent).toBe('act-1')
    fireEvent.click(card2)
    expect(screen.getByTestId('sel').textContent).toBe('act-2')
  })
})
