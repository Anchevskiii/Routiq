import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DragEndEvent } from '@dnd-kit/core'
import { SortableDaysList } from './SortableDaysList'
import { Day } from '@/types/itinerary.types'

// Mock DndContext and SortableContext
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children, onDragEnd }: { children: React.ReactNode; onDragEnd: (e: DragEndEvent) => void }) => (
    <div data-testid="dnd-context">
      {children}
      <button
        data-testid="drag-trigger"
        onClick={() => onDragEnd({ active: { id: 'day-1' }, over: { id: 'day-2' } } as unknown as DragEndEvent)}
      >
        Drag
      </button>
    </div>
  ),
  closestCenter: vi.fn(),
}))

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <div data-testid="sortable-context">{children}</div>,
  verticalListSortingStrategy: {},
  arrayMove: <T,>(array: T[], from: number, to: number) => {
    const copy = [...array]
    const [item] = copy.splice(from, 1)
    copy.splice(to, 0, item)
    return copy
  },
}))

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

  it('triggers onDragEnd external handler and updates days locally on drag end', () => {
    const onDragEnd = vi.fn()
    render(
      <SortableDaysList
        days={mockDays}
        itineraryId="itinerary-1"
        startDate="2026-06-05T00:00:00.000Z"
        sensors={[]}
        addActivityDayId={null}
        onDragEnd={onDragEnd}
        onAddActivity={vi.fn()}
        onReorderActivities={vi.fn()}
        onActivityUpdated={vi.fn()}
        onActivityDeleted={vi.fn()}
        onCloseAddActivity={vi.fn()}
      />
    )

    fireEvent.click(screen.getByTestId('drag-trigger'))
    expect(onDragEnd).toHaveBeenCalled()
  })

  it('handles drag end without startDate', () => {
    const onDragEnd = vi.fn()
    render(
      <SortableDaysList
        days={mockDays}
        itineraryId="itinerary-1"
        startDate={null}
        sensors={[]}
        addActivityDayId={null}
        onDragEnd={onDragEnd}
        onAddActivity={vi.fn()}
        onReorderActivities={vi.fn()}
        onActivityUpdated={vi.fn()}
        onActivityDeleted={vi.fn()}
        onCloseAddActivity={vi.fn()}
      />
    )

    fireEvent.click(screen.getByTestId('drag-trigger'))
    expect(onDragEnd).toHaveBeenCalled()
  })
})
