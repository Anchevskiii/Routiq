import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as ReactQuery from '@tanstack/react-query'

// ─── Mock heavy sub-components ────────────────────────────────────────────────

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
vi.mock('@/api/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}))
vi.mock('@/app/Providers', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}))
vi.mock('@dnd-kit/core', () => ({
  useSensor: vi.fn(() => ({})),
  useSensors: vi.fn(() => []),
  PointerSensor: class {},
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
vi.mock('@dnd-kit/sortable', () => ({
  arrayMove: vi.fn((arr: unknown[]) => arr),
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  verticalListSortingStrategy: {},
}))

import { ItineraryPage } from './ItineraryPage'

// ─── Shared test data ─────────────────────────────────────────────────────────

const mockItinerary = {
  id: 'itin-1',
  userId: 'user-1',
  destination: 'Paris, France',
  startDate: '2026-07-01',
  endDate: '2026-07-03',
  travelType: 'CULTURAL' as const,
  totalDays: 3,
  days: [
    { id: 'day-1', dayNumber: 1, date: '2026-07-01', theme: 'Day 1', activities: [] },
  ],
  generalTips: [],
  isPublic: false,
  shareToken: null,
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-06-01T00:00:00Z',
}

function renderPage(path = '/itinerary/itin-1') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
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
    vi.spyOn(ReactQuery, 'useMutation').mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: false,
      isSuccess: false,
      isError: false,
      isIdle: true,
      status: 'idle',
      reset: vi.fn(),
      error: null,
      data: undefined,
      variables: undefined,
      context: undefined,
      failureCount: 0,
      failureReason: null,
      submittedAt: 0,
    } as unknown as ReturnType<typeof ReactQuery.useMutation>)
  })

  it('renders loading skeleton while fetching', () => {
    vi.spyOn(ReactQuery, 'useQuery').mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      status: 'pending',
    } as unknown as ReturnType<typeof ReactQuery.useQuery>)

    renderPage()
    expect(document.querySelector('.animate-pulse')).toBeTruthy()
  })

  it('renders error state when itinerary is not found', () => {
    vi.spyOn(ReactQuery, 'useQuery').mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Not found'),
      status: 'error',
    } as unknown as ReturnType<typeof ReactQuery.useQuery>)

    renderPage()
    expect(screen.getByText('Itinerary not found')).toBeInTheDocument()
    expect(screen.getByText('Go back to Dashboard')).toBeInTheDocument()
  })

  it('renders daily route tab on success', () => {
    vi.spyOn(ReactQuery, 'useQuery').mockReturnValue({
      data: mockItinerary,
      isLoading: false,
      error: null,
      status: 'success',
    } as unknown as ReturnType<typeof ReactQuery.useQuery>)

    renderPage()
    expect(screen.getByTestId('itinerary-header')).toBeInTheDocument()
    expect(screen.getByText('Daily Route')).toBeInTheDocument()
    expect(screen.getByTestId('sortable-days-list')).toBeInTheDocument()
  })

  it('switches to map tab and shows fullscreen map', () => {
    vi.spyOn(ReactQuery, 'useQuery').mockReturnValue({
      data: mockItinerary,
      isLoading: false,
      error: null,
      status: 'success',
    } as unknown as ReturnType<typeof ReactQuery.useQuery>)

    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /map/i }))
    expect(screen.getByTestId('itinerary-map')).toBeInTheDocument()
  })

  it('map aside has hidden lg:flex classes for responsive behaviour', () => {
    vi.spyOn(ReactQuery, 'useQuery').mockReturnValue({
      data: mockItinerary,
      isLoading: false,
      error: null,
      status: 'success',
    } as unknown as ReturnType<typeof ReactQuery.useQuery>)

    renderPage()
    const aside = document.querySelector('aside')
    expect(aside).toBeTruthy()
    expect(aside?.className).toContain('hidden')
    expect(aside?.className).toContain('lg:flex')
  })
})
