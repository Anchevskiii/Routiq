import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AddActivityModal } from './AddActivityModal'
import toast from 'react-hot-toast'
import { ActivityType } from '@/types/itinerary.types'

type CustomGlobal = typeof globalThis & {
  mockHandleLocationChange?: (val: string) => void
}

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: vi.fn(),
}))

// Mock usePlaceAutocomplete using dynamic globalThis reference
vi.mock('../hooks/usePlaceAutocomplete', () => ({
  usePlaceAutocomplete: vi.fn(() => ({
    location: 'Paris',
    placeData: {
      address: 'Paris, France',
      placeId: 'paris-id',
      latitude: 48.8566,
      longitude: 2.3522,
    },
    inputRef: { current: null },
    handleLocationChange: (val: string) => {
      const g = globalThis as CustomGlobal
      if (g.mockHandleLocationChange) {
        g.mockHandleLocationChange(val)
      }
    },
  })),
}))

const mockMutate = vi.fn()
const mockUseMutation = vi.fn()

let isErrorMock = false
let isPendingMock = false
let mutationCallbacks: { onSuccess?: (data: unknown) => void } = {}

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...(actual as Record<string, unknown>),
    useMutation: (options: { onSuccess?: (data: unknown) => void }) => {
      mockUseMutation(options)
      mutationCallbacks = options
      return {
        mutate: mockMutate,
        isPending: isPendingMock,
        isError: isErrorMock,
        ...options,
      }
    },
  }
})

describe('AddActivityModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isErrorMock = false
    isPendingMock = false
    mutationCallbacks = {}
    ;(globalThis as CustomGlobal).mockHandleLocationChange = vi.fn()
  })

  it('renders modal in normal state and handles submission without conflicts', () => {
    const onAdded = vi.fn()
    const onClose = vi.fn()

    render(
      <AddActivityModal
        itineraryId="itinerary-1"
        dayId="day-1"
        existingActivities={[]}
        onAdded={onAdded}
        onClose={onClose}
      />
    )

    expect(screen.getByRole('heading', { name: 'Add Activity' })).toBeInTheDocument()
    expect(screen.getByLabelText(/Title/i)).toBeInTheDocument()

    // Simulate input and submission
    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'New Test Activity' } })
    // Ensure we change it to something different than the default state 'Paris' to trigger event
    fireEvent.change(screen.getByLabelText(/Location/i), { target: { value: 'London' } })
    expect((globalThis as CustomGlobal).mockHandleLocationChange).toHaveBeenCalledWith('London')

    fireEvent.submit(screen.getByRole('button', { name: 'Add Activity' }).closest('form')!)

    expect(mockMutate).toHaveBeenCalledWith(expect.objectContaining({
      title: 'New Test Activity',
      location: 'Paris', // default from mock autocomplete data
      address: 'Paris, France',
    }))
  })

  it('detects conflicts and shows conflict screen', () => {
    const existingActivities = [
      {
        id: 'act-1',
        activityType: ActivityType.ATTRACTION,
        sortOrder: 1,
        title: 'Existing',
        startTime: '10:00',
        durationMinutes: 120,
      }
    ]

    render(
      <AddActivityModal
        itineraryId="itinerary-1"
        dayId="day-1"
        existingActivities={existingActivities}
        onAdded={vi.fn()}
        onClose={vi.fn()}
      />
    )

    // Set title and conflicting startTime
    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'Conflict Act' } })
    fireEvent.click(screen.getByText('Optional'))
    const timeSlot = screen.getByText('11:00')
    fireEvent.click(timeSlot)

    // Submit form
    fireEvent.submit(screen.getByRole('button', { name: 'Add Activity' }).closest('form')!)

    // It should show the Time Conflict screen
    expect(screen.getByText('Time Conflict')).toBeInTheDocument()
    expect(screen.getByText(/Adding "Conflict Act" at 11:00 will change these activities/i)).toBeInTheDocument()

    // Click "Go back"
    fireEvent.click(screen.getByRole('button', { name: 'Go back' }))
    expect(screen.getByRole('heading', { name: 'Add Activity' })).toBeInTheDocument()
  })

  it('allows adding anyway from the conflict screen', () => {
    const existingActivities = [
      {
        id: 'act-1',
        activityType: ActivityType.ATTRACTION,
        sortOrder: 1,
        title: '', // falsy title to cover line 220 (c.detail)
        startTime: '10:00',
        durationMinutes: 120,
      }
    ]

    render(
      <AddActivityModal
        itineraryId="itinerary-1"
        dayId="day-1"
        existingActivities={existingActivities}
        onAdded={vi.fn()}
        onClose={vi.fn()}
      />
    )

    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'Conflict Act' } })
    fireEvent.click(screen.getByText('Optional'))
    fireEvent.click(screen.getByText('11:00'))

    // Submit form to trigger conflict step
    fireEvent.submit(screen.getByRole('button', { name: 'Add Activity' }).closest('form')!)
    expect(screen.getByText('Time Conflict')).toBeInTheDocument()

    // Click "Add anyway"
    fireEvent.click(screen.getByRole('button', { name: 'Add anyway' }))
    expect(mockMutate).toHaveBeenCalled()
  })

  it('renders error message when addMutation has error', () => {
    isErrorMock = true

    render(
      <AddActivityModal
        itineraryId="itinerary-1"
        dayId="day-1"
        existingActivities={[]}
        onAdded={vi.fn()}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
  })

  it('triggers toasts on successful mutation with trimmed or pushed activities', () => {
    const onAdded = vi.fn()
    const onClose = vi.fn()

    render(
      <AddActivityModal
        itineraryId="itinerary-1"
        dayId="day-1"
        existingActivities={[]}
        onAdded={onAdded}
        onClose={onClose}
      />
    )

    // Call onSuccess manually to trigger different toast conditions
    // Case 1: trimmedActivity and single pushedActivity
    if (mutationCallbacks.onSuccess) {
      mutationCallbacks.onSuccess({
        trimmedActivity: { title: 'Trimmed Activity', newDurationMinutes: 45 },
        pushedActivities: [{ title: 'Pushed One', newStartTime: '14:00' }],
      })
    }
    expect(toast).toHaveBeenCalledWith(
      expect.stringContaining('"Trimmed Activity" shortened to 45 min'),
      expect.any(Object)
    )
    expect(toast).toHaveBeenCalledWith(
      expect.stringContaining('"Pushed One" moved to 14:00'),
      expect.any(Object)
    )
    expect(onAdded).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()

    // Case 2: multiple pushed activities
    if (mutationCallbacks.onSuccess) {
      mutationCallbacks.onSuccess({
        pushedActivities: [
          { title: 'Pushed One', newStartTime: '14:00' },
          { title: 'Pushed Two', newStartTime: '15:30' },
        ],
      })
    }
    expect(toast).toHaveBeenCalledWith(
      expect.stringContaining('2 activities moved to avoid overlap'),
      expect.any(Object)
    )
  })

  it('closes modal when clicking backdrop or pressing Escape', () => {
    const onClose = vi.fn()
    render(
      <AddActivityModal
        itineraryId="itinerary-1"
        dayId="day-1"
        existingActivities={[]}
        onAdded={vi.fn()}
        onClose={onClose}
      />
    )

    // Backdrop click
    const backdrop = screen.getByTestId('add-activity-modal-backdrop')
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledTimes(1)

    // Keydown on backdrop (Escape)
    fireEvent.keyDown(backdrop, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(2)

    // Keydown on backdrop (Enter)
    fireEvent.keyDown(backdrop, { key: 'Enter' })
    expect(onClose).toHaveBeenCalledTimes(3)
  })
})
