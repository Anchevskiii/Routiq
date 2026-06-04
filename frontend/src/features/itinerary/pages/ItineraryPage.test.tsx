import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockUseQuery = vi.fn()
const mockUseMutation = vi.fn()

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...(actual as object),
    useQuery: (...args: unknown[]) => mockUseQuery(...args),
    useMutation: (...args: unknown[]) => mockUseMutation(...args),
  }
})

vi.mock('@/api/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  },
}))

vi.mock('@/app/Providers', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}))

vi.mock('../components/ItineraryHeader', () => ({
  ItineraryHeader: () => <div data-testid="itinerary-header" />,
}))
vi.mock('../components/ItineraryMap', () => ({
  ItineraryMap: () => <div data-testid="itinerary-map" />,
}))
vi.mock('../components/SortableDaysList', () => ({
  SortableDaysList: () => <div data-testid="sortable-days-list" />,
}))
vi.mock('@/features/groups/components/GroupDetailSidebar', () => ({
  GroupDetailSidebar: () => <div data-testid="group-sidebar" />,
}))
vi.mock('@dnd-kit/core', () => ({
  useSensor: vi.fn(() => ({})),
  useSensors: vi.fn(() => []),
  PointerSensor: class {},
}))
vi.mock('@dnd-kit/sortable', () => ({
  arrayMove: vi.fn((arr: unknown[]) => arr),
}))

import { ItineraryPage } from './ItineraryPage'

// ─── Test data ────────────────────────────────────────────────────────────────

const mockMutation = {
  mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false,
  isSuccess: false, isError: false, isIdle: true,
  status: 'idle', reset: vi.fn(), error: null,
  data: undefined, variables: undefined, context: undefined,
  failureCount: 0, failureReason: null, submittedAt: 0,
}

const mockItinerary = {
  id: 'itin-1',
  userId: 'user-1',
  destination: 'Paris, France',
  startDate: '2026-07-01',
  endDate: '2026-07-03',
  travelType: 'CULTURAL' as const,
  totalDays: 3,
  days: [{ id: 'day-1', dayNumber: 1, date: '2026-07-01', theme: 'Day 1', activities: [] }],
  generalTips: [],
  isPublic: false,
  shareToken: null,
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-06-01T00:00:00Z',
}

function renderPage(path = '/itinerary/itin-1') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/itinerary/:id" element={<ItineraryPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ItineraryPage', () => {
  beforeEach(() => {
    mockUseMutation.mockReturnValue(mockMutation)
  })

  // useQuery is called twice per render: itinerary (odd calls) + group (even calls, disabled)
  const itineraryResult = (data: typeof mockItinerary | undefined, loading = false, error: Error | null = null) => {
    let calls = 0
    mockUseQuery.mockImplementation(() => {
      calls++
      return calls % 2 !== 0
        ? { data, isLoading: loading, error }
        : { data: undefined, isLoading: false, error: null }
    })
  }

  it('renders loading skeleton while fetching', () => {
    itineraryResult(undefined, true)
    renderPage()
    expect(document.querySelector('.animate-pulse')).toBeTruthy()
  })

  it('renders error state when itinerary is not found', () => {
    itineraryResult(undefined, false, new Error('Not found'))
    renderPage()
    expect(screen.getByText('Itinerary not found')).toBeInTheDocument()
    expect(screen.getByText('Go back to Dashboard')).toBeInTheDocument()
  })

  it('renders daily route tab with itinerary on success', () => {
    itineraryResult(mockItinerary)
    renderPage()
    expect(screen.getByTestId('itinerary-header')).toBeInTheDocument()
    expect(screen.getByText('Daily Route')).toBeInTheDocument()
    expect(screen.getByTestId('sortable-days-list')).toBeInTheDocument()
  })

  it('switches to map tab and shows fullscreen map', () => {
    itineraryResult(mockItinerary)
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /map/i }))
    expect(screen.getByTestId('itinerary-map')).toBeInTheDocument()
  })

  it('map aside has hidden and lg:flex classes for responsive behaviour', () => {
    itineraryResult(mockItinerary)
    renderPage()
    const aside = document.querySelector('aside')
    expect(aside).toBeTruthy()
    expect(aside?.className).toContain('hidden')
    expect(aside?.className).toContain('lg:flex')
  })
})
