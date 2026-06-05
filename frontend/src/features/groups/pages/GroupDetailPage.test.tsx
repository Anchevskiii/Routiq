import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GroupDetailPage } from './GroupDetailPage'

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

vi.mock('@/features/groups/components/GroupDetailSidebar', () => ({
  GroupDetailSidebar: () => <div data-testid="group-sidebar" />,
}))

vi.mock('@/features/groups/components/GroupHeader', () => ({
  GroupHeader: ({ group }: { group: { name: string } }) => (
    <div data-testid="group-header">{group.name}</div>
  ),
}))

vi.mock('@/features/groups/components/GroupItinerariesTab', () => ({
  GroupItinerariesTab: () => <div data-testid="group-itineraries-tab" />,
}))

describe('GroupDetailPage', () => {
  const mockMutation = {
    mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false,
    isSuccess: false, isError: false, isIdle: true,
  }

  const mockGroup = {
    id: 'grp-1',
    name: 'Euro Trip 2026',
    description: 'Adventure trip',
    members: [{ userId: 'user-1', role: 'OWNER', user: { name: 'John Doe' } }],
    itineraries: [],
  }

  beforeEach(() => {
    mockUseMutation.mockReturnValue(mockMutation)
  })

  const renderComponent = (path = '/groups/grp-1') => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/groups/:id" element={<GroupDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )
  }

  it('renders loading skeleton while fetching', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: true })
    const { container } = renderComponent()
    expect(container.querySelector('.animate-pulse')).toBeTruthy()
  })

  it('renders group detail elements on success', () => {
    mockUseQuery.mockReturnValue({ data: mockGroup, isLoading: false })
    renderComponent()
    expect(screen.getByTestId('group-header')).toHaveTextContent('Euro Trip 2026')
    expect(screen.getByTestId('group-sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('group-itineraries-tab')).toBeInTheDocument()
  })
})
