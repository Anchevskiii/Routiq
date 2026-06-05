import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NotificationsPage } from './NotificationsPage'

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

describe('NotificationsPage', () => {
  beforeEach(() => {
    mockUseMutation.mockReturnValue({
      mutate: vi.fn(), isPending: false,
    })
  })

  const renderComponent = () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <NotificationsPage />
        </MemoryRouter>
      </QueryClientProvider>
    )
  }

  it('renders page header', () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: true })
    renderComponent()
    expect(screen.getByText('Notifications')).toBeInTheDocument()
  })

  it('renders "No notifications" state when list is empty', () => {
    mockUseQuery.mockReturnValue({ data: [], isLoading: false })
    renderComponent()
    expect(screen.getByText('No notifications')).toBeInTheDocument()
  })

  it('renders list of pending invitations', () => {
    const mockInv = {
      id: 'inv-1',
      groupId: 'grp-1',
      group: {
        name: 'Weekend Getaway',
        createdBy: { name: 'Alice Smith' },
      },
    }
    mockUseQuery.mockReturnValue({ data: [mockInv], isLoading: false })
    renderComponent()
    expect(screen.getByText(/Alice Smith/)).toBeInTheDocument()
    expect(screen.getByText(/Weekend Getaway/)).toBeInTheDocument()
  })
})
