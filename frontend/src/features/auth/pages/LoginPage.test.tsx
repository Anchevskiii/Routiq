import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { LoginPage } from './LoginPage'

const mockSetLoginAnimating = vi.fn()

vi.mock('@/app/Providers', () => ({
  useAuth: () => ({
    setLoginAnimating: mockSetLoginAnimating,
  }),
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/features/auth/components/LoginForm', () => ({
  LoginForm: ({ onSuccess }: { onSuccess: (name: string) => void }) => (
    <div>
      <span>Mock LoginForm</span>
      <button data-testid="login-success-btn" onClick={() => onSuccess('Alice')}>
        Success
      </button>
    </div>
  ),
}))

vi.mock('@/features/auth/components/LoginMapAnimation', () => ({
  LoginMapAnimation: ({ name, onEnd }: { name: string; onEnd: () => void }) => (
    <div>
      <span data-testid="map-anim-name">{name}</span>
      <button data-testid="map-anim-end-btn" onClick={onEnd}>
        End Animation
      </button>
    </div>
  ),
}))

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders header, logo link, and back link', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Routiq')).toBeInTheDocument()
    expect(screen.getByTitle('Back to Home')).toBeInTheDocument()
    expect(screen.getByText('Back to Home')).toBeInTheDocument()
    expect(screen.getByText(/Plan your next trip/i)).toBeInTheDocument()
  })

  it('transitions from login to map animation upon success and completes animation', async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    // Initially we see LoginForm
    expect(screen.getByText('Mock LoginForm')).toBeInTheDocument()
    expect(screen.queryByTestId('map-anim-name')).not.toBeInTheDocument()

    // Trigger success
    const successBtn = screen.getByTestId('login-success-btn')
    await userEvent.click(successBtn)

    // Stage changes to map
    expect(screen.queryByText('Mock LoginForm')).not.toBeInTheDocument()
    const nameSpan = screen.getByTestId('map-anim-name')
    expect(nameSpan).toBeInTheDocument()
    expect(nameSpan.textContent).toBe('Alice')

    // Trigger end of animation
    const endAnimBtn = screen.getByTestId('map-anim-end-btn')
    await userEvent.click(endAnimBtn)

    expect(mockSetLoginAnimating).toHaveBeenCalledWith(false)
  })
})
