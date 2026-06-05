import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SortableDaysList } from './SortableDaysList'
import { Day } from '@/types/itinerary.types'

// Mock the nested components if needed, or render them
vi.mock('./SortableDayCard', () => ({
  SortableDayCard: ({ day, onAddActivity }: { day: { id: string; dayNumber: number }; onAddActivity: (id: string) => void }) => (
    <div data-testid={`day-card-${day.id}`}>
      Day {day.dayNumber}
      <button onClick={() => onAddActivity(day.id)}>Add Activity</button>
    </div>
  )
}))

vi.mock('./AddActivityModal', () => ({
  AddActivityModal: ({ dayId, onClose }: { dayId: string; onClose: () => void }) => (
    <div data-testid="add-activity-modal">
      Modal for {dayId}
      <button onClick={onClose}>Close</button>
    </div>
  )
}))

const mockDays: Day[] = [
  {
    id: 'day-1',
    dayNumber: 1,
    date: '2026-06-05T00:00:00.000Z',
    activities: [],
  },
  {
    id: 'day-2',
    dayNumber: 2,
    date: '2026-06-06T00:00:00.000Z',
    activities: [],
  }
]

describe('SortableDaysList', () => {
  it('renders the list of days', () => {
    render(
      <SortableDaysList
        days={mockDays}
        itineraryId="itinerary-1"
        sensors={[]}
        addActivityDayId={null}
        onDragEnd={vi.fn()}
        onAddActivity={vi.fn()}
        onReorderActivities={vi.fn()}
        onActivityUpdated={vi.fn()}
        onActivityDeleted={vi.fn()}
        onCloseAddActivity={vi.fn()}
      />
    )

    expect(screen.getByTestId('day-card-day-1')).toBeInTheDocument()
    expect(screen.getByTestId('day-card-day-2')).toBeInTheDocument()
  })

  it('renders AddActivityModal when addActivityDayId is provided', () => {
    render(
      <SortableDaysList
        days={mockDays}
        itineraryId="itinerary-1"
        sensors={[]}
        addActivityDayId="day-1"
        onDragEnd={vi.fn()}
        onAddActivity={vi.fn()}
        onReorderActivities={vi.fn()}
        onActivityUpdated={vi.fn()}
        onActivityDeleted={vi.fn()}
        onCloseAddActivity={vi.fn()}
      />
    )

    expect(screen.getByTestId('add-activity-modal')).toBeInTheDocument()
  })
})
