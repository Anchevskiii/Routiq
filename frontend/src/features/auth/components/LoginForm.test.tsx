import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { LoginForm } from './LoginForm'

const mockLogin = vi.fn()
const mockLoginWithGoogle = vi.fn()
const mockSetLoginAnimating = vi.fn()
const mockOnSuccess = vi.fn()

vi.mock('@/app/Providers', () => ({
  useAuth: () => ({
    login: mockLogin,
    loginWithGoogle: mockLoginWithGoogle,
    setLoginAnimating: mockSetLoginAnimating,
  }),
}))

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders inputs and buttons', () => {
    render(
      <MemoryRouter>
        <LoginForm onSuccess={mockOnSuccess} />
      </MemoryRouter>
    )

    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <LoginForm onSuccess={mockOnSuccess} />
      </MemoryRouter>
    )

    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('Please enter a valid email address')).toBeInTheDocument()
    expect(await screen.findByText('Password must be at least 8 characters')).toBeInTheDocument()
  })

  it('submits form successfully with valid inputs', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValueOnce(undefined)

    render(
      <MemoryRouter>
        <LoginForm onSuccess={mockOnSuccess} />
      </MemoryRouter>
    )

    await user.type(screen.getByLabelText('Email'), 'test@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockSetLoginAnimating).toHaveBeenCalledWith(true)
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(mockOnSuccess).toHaveBeenCalledWith('test')
    })
  })

  it('toggles password visibility', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <LoginForm onSuccess={mockOnSuccess} />
      </MemoryRouter>
    )

    const pwInput = screen.getByLabelText('Password') as HTMLInputElement
    expect(pwInput.type).toBe('password')

    // Find the toggle button (it contains the Lock icon and Eye icon)
    // There is only one button with no text inside the password container.
    // Let's select it by container class or role
    const toggleBtn = screen.getByRole('button', { name: '' })
    await user.click(toggleBtn)

    expect(pwInput.type).toBe('text')

    await user.click(toggleBtn)
    expect(pwInput.type).toBe('password')
  })

  it('calls loginWithGoogle when Google button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <LoginForm onSuccess={mockOnSuccess} />
      </MemoryRouter>
    )

    await user.click(screen.getByRole('button', { name: /google/i }))

    expect(mockLoginWithGoogle).toHaveBeenCalled()
  })
})
