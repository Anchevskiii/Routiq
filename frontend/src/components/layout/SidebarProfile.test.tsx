import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { SidebarProfile } from './SidebarProfile'

const mockLogout = vi.fn()
const mockNavigate = vi.fn()

vi.mock('@/app/Providers', () => ({
  useAuth: () => ({
    logout: mockLogout,
  }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('SidebarProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders collapsed state', () => {
    render(
      <MemoryRouter>
        <SidebarProfile collapsed={true} name="John Doe" email="john@example.com" />
      </MemoryRouter>
    )

    expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
    expect(screen.queryByText('john@example.com')).not.toBeInTheDocument()
  })

  it('renders expanded state and user information', () => {
    render(
      <MemoryRouter>
        <SidebarProfile collapsed={false} name="John Doe" email="john@example.com" />
      </MemoryRouter>
    )

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })

  it('opens and closes profile menu when clicked and logs out', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <SidebarProfile collapsed={false} name="John Doe" email="john@example.com" />
      </MemoryRouter>
    )

    const profileButton = screen.getByRole('button')
    await user.click(profileButton)

    // Verify popup items are rendered (they are created via createPortal)
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /help/i })).toBeInTheDocument()

    const signOutBtn = screen.getByRole('button', { name: /sign out/i })
    expect(signOutBtn).toBeInTheDocument()

    await user.click(signOutBtn)
    expect(mockLogout).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })
})
