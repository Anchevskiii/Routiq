import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DashboardPage } from './DashboardPage'

// Mock Providers & APIs
vi.mock('@/app/Providers', () => ({
  useAuth: () => ({ user: { id: 'user-1', name: 'John Doe' } }),
}))

const mockUseQuery = vi.fn()
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...(actual as object),
    useQuery: (...args: unknown[]) => mockUseQuery(...args),
  }
})

describe('DashboardPage', () => {
  const setupMockQueries = (itineraries: unknown[] = [], groups: unknown[] = []) => {
    let callCount = 0
    mockUseQuery.mockImplementation(() => {
      callCount++
      if (callCount % 2 !== 0) {
        return { data: { data: itineraries, meta: { total: itineraries.length, sharedCount: 0 } }, isLoading: false }
      } else {
        return { data: { data: groups }, isLoading: false }
      }
    })
  }

  const renderComponent = () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </QueryClientProvider>
    )
  }

  it('renders greeting to the user', () => {
    setupMockQueries()
    renderComponent()
    expect(screen.getByText(/John/i)).toBeInTheDocument()
  })

  it('renders stats for itineraries and groups', () => {
    const mockItin = { id: 'it-1', destination: 'Rome', startDate: '2026-08-01', endDate: '2026-08-05' }
    const mockGroup = { id: 'gr-1', name: 'Family Trip' }
    setupMockQueries([mockItin], [mockGroup])
    renderComponent()
    expect(screen.getByText('1')).toBeInTheDocument() // stat total
  })
})
