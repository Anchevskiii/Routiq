import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { GroupItineraryCard } from './GroupItineraryCard'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { groupsApi } from '@/api/groups.api'
import toast from 'react-hot-toast'

// Mock react-router-dom hooks
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: 'group-123' }),
  }
})

// Mock groups.api
vi.mock('@/api/groups.api', () => ({
  groupsApi: {
    vote: vi.fn(),
    removeVote: vi.fn(),
    removeItineraryFromGroup: vi.fn(),
  },
}))

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockGroupItinerary = {
  id: 'gi-123',
  groupId: 'group-123',
  itineraryId: 'it-123',
  addedAt: new Date().toISOString(),
  score: 1,
  itinerary: {
    id: 'it-123',
    destination: 'Paris',
    startDate: '2026-06-10',
    endDate: '2026-06-15',
    travelType: 'CULTURAL',
    createdAt: new Date().toISOString(),
    user: {
      id: 'user-456',
      name: 'John Doe',
      avatarUrl: 'https://example.com/avatar.jpg',
    },
  },
  votes: [
    {
      id: 'v-1',
      groupItineraryId: 'gi-123',
      userId: 'user-111',
      voteType: 'UPVOTE' as const,
      createdAt: new Date().toISOString(),
      user: {
        id: 'user-111',
        name: 'Alice',
      },
    },
  ],
  _count: {
    votes: 1,
  },
}

describe('GroupItineraryCard', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    })
  })

  const renderCard = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <GroupItineraryCard
            groupItinerary={mockGroupItinerary}
            index={0}
            currentUserId="user-111"
            {...props}
          />
        </MemoryRouter>
      </QueryClientProvider>
    )
  }

  it('renders itinerary details correctly', () => {
    renderCard()

    expect(screen.getAllByText('Paris')).toHaveLength(2) // destination and tag
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('6 days')).toBeInTheDocument()
  })

  it('navigates to itinerary detail page when card is clicked', async () => {
    const { container } = renderCard()
    const user = userEvent.setup()

    const card = container.querySelector('.grp-it-card')!
    await user.click(card)

    expect(mockNavigate).toHaveBeenCalledWith('/itinerary/it-123?groupId=group-123')
  })

  it('navigates to itinerary detail page when Enter or Space is pressed', () => {
    const { container } = renderCard()

    const card = container.querySelector('.grp-it-card')!
    
    // Press Enter
    fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' })
    expect(mockNavigate).toHaveBeenCalledWith('/itinerary/it-123?groupId=group-123')

    // Press Space
    fireEvent.keyDown(card, { key: ' ', code: 'Space' })
    expect(mockNavigate).toHaveBeenCalledWith('/itinerary/it-123?groupId=group-123')
  })

  it('calls vote API when vote button is clicked', async () => {
    vi.mocked(groupsApi.vote).mockResolvedValue({} as any)
    renderCard({ currentUserId: 'user-different' })
    const user = userEvent.setup()

    const upvoteButton = screen.getByTitle('Upvote')
    await user.click(upvoteButton)

    expect(groupsApi.vote).toHaveBeenCalledWith('group-123', 'gi-123', 'UPVOTE')
  })

  it('calls removeVote API when already active upvote button is clicked', async () => {
    vi.mocked(groupsApi.removeVote).mockResolvedValue({} as any)
    renderCard()
    const user = userEvent.setup()

    const upvoteButton = screen.getByTitle('Remove vote')
    await user.click(upvoteButton)

    expect(groupsApi.removeVote).toHaveBeenCalledWith('group-123', 'gi-123')
  })

  it('calls removeItineraryFromGroup API when delete is confirmed', async () => {
    vi.mocked(groupsApi.removeItineraryFromGroup).mockResolvedValue({} as any)
    renderCard()
    const user = userEvent.setup()

    const deleteButton = screen.getByTitle('Remove from group')
    
    // First click should trigger confirmation state
    await user.click(deleteButton)
    expect(groupsApi.removeItineraryFromGroup).not.toHaveBeenCalled()
    expect(deleteButton).toHaveAttribute('title', 'Click again to confirm')

    // Second click should execute removal
    await user.click(deleteButton)
    expect(groupsApi.removeItineraryFromGroup).toHaveBeenCalledWith('group-123', 'gi-123')
  })
})
