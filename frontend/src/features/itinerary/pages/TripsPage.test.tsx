import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TripsPage } from './TripsPage'

const mockUseQuery = vi.fn()

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...(actual as object),
    useQuery: (...args: unknown[]) => mockUseQuery(...args),
  }
})

describe('TripsPage', () => {
  const renderComponent = () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <TripsPage />
        </MemoryRouter>
      </QueryClientProvider>
    )
  }

  it('renders page header', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: true })
    renderComponent()
    expect(screen.getByText('My Trips')).toBeInTheDocument()
  })

  it('renders "No itineraries found" state when list is empty', () => {
    mockUseQuery.mockReturnValue({ data: { data: [] }, isLoading: false })
    renderComponent()
    expect(screen.getByText('No itineraries found')).toBeInTheDocument()
  })

  it('renders list of trip cards on success', () => {
    const mockTrip = {
      id: 'trip-1',
      destination: 'London, UK',
      startDate: '2026-09-01',
      endDate: '2026-09-05',
      totalDays: 5,
    }
    mockUseQuery.mockReturnValue({ data: { data: [mockTrip] }, isLoading: false })
    renderComponent()
    expect(screen.getByText('London, UK')).toBeInTheDocument()
  })
})
