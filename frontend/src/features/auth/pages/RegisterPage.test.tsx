import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RegisterPage } from './RegisterPage'

vi.mock('@/features/auth/components/RegisterForm', () => ({
  RegisterForm: () => <div data-testid="mock-register-form">Mock RegisterForm</div>,
}))

describe('RegisterPage', () => {
  it('renders header, logo link, and back link', () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Routiq')).toBeInTheDocument()
    expect(screen.getByTitle('Back to Home')).toBeInTheDocument()
    expect(screen.getByText('Back to Home')).toBeInTheDocument()
    expect(screen.getByText(/Your next trip starts/i)).toBeInTheDocument()
  })

  it('renders the mocked RegisterForm', () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    )

    expect(screen.getByTestId('mock-register-form')).toBeInTheDocument()
  })
})
