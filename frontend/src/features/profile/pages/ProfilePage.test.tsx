import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProfilePage } from './ProfilePage'

// Mock Providers & APIs
vi.mock('@/app/Providers', () => ({
  useAuth: () => ({
    user: { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
    logout: vi.fn(),
    refreshUser: vi.fn(),
  }),
}))

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

describe('ProfilePage', () => {
  beforeEach(() => {
    mockUseMutation.mockReturnValue({
      mutate: vi.fn(), isPending: false,
    })
    mockUseQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'itineraries' && queryKey[1] === 'count') {
        return { data: { meta: { total: 5 } } }
      }
      if (queryKey[0] === 'groups' && queryKey[1] === 'count') {
        return { data: { data: [{}, {}] } }
      }
      if (queryKey[0] === 'user-settings') {
        return { data: {} }
      }
      return { data: undefined }
    })
  })

  const renderComponent = () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ProfilePage />
        </MemoryRouter>
      </QueryClientProvider>
    )
  }

  it('renders Profile Page hero and navigation', () => {
    renderComponent()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('General')).toBeInTheDocument()
    expect(screen.getByText('Security')).toBeInTheDocument()
  })

  it('shows profile stats', () => {
    renderComponent()
    expect(screen.getByText('5')).toBeInTheDocument() // Itinerary count
    expect(screen.getByText('2')).toBeInTheDocument() // Group count
  })
})
