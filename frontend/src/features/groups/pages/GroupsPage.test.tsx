import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GroupsPage } from './GroupsPage'

// Mock Providers & APIs
vi.mock('@/app/Providers', () => ({
  useAuth: () => ({ user: { id: 'user-1', name: 'John Doe' } }),
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

describe('GroupsPage', () => {
  const setupMockQueries = (groups: unknown[] = [], invitations: unknown[] = []) => {
    let callCount = 0
    mockUseQuery.mockImplementation(() => {
      callCount++
      if (callCount % 2 !== 0) {
        return { data: { data: groups }, isLoading: false }
      } else {
        return { data: invitations, isLoading: false }
      }
    })
  }

  const renderComponent = () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <GroupsPage />
        </MemoryRouter>
      </QueryClientProvider>
    )
  }

  it('renders page header and title', () => {
    setupMockQueries()
    renderComponent()
    expect(screen.getByText('Travel Groups')).toBeInTheDocument()
  })

  it('renders "No groups yet" state when groups are empty', () => {
    setupMockQueries()
    renderComponent()
    expect(screen.getByText('No groups yet')).toBeInTheDocument()
  })

  it('renders list of groups', () => {
    const mockGroup = { id: 'gr-1', name: 'Alps Hiking', description: 'Fun trip', createdBy: { name: 'Alice' }, members: [] }
    setupMockQueries([mockGroup])
    renderComponent()
    expect(screen.getByText('Alps Hiking')).toBeInTheDocument()
  })
})
