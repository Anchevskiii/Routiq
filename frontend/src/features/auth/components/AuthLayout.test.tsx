import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthLayout } from './AuthLayout'

describe('AuthLayout', () => {
  it('renders all title elements and children correctly', () => {
    render(
      <MemoryRouter>
        <AuthLayout
          title="Plan your next trip,"
          highlightedTitle="one pin at a time."
          subtitle="Sign in to watch your itinerary come to life."
        >
          <div data-testid="child-element">Child Content</div>
        </AuthLayout>
      </MemoryRouter>
    )

    expect(screen.getByText('Routiq')).toBeInTheDocument()
    expect(screen.getByTitle('Back to Home')).toBeInTheDocument()
    expect(screen.getByText('Plan your next trip,')).toBeInTheDocument()
    expect(screen.getByText('one pin at a time.')).toBeInTheDocument()
    expect(screen.getByText('Sign in to watch your itinerary come to life.')).toBeInTheDocument()
    expect(screen.getByTestId('child-element')).toBeInTheDocument()
  })
})
