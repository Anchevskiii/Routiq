import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { PrivacyPage } from './PrivacyPage'
import { TermsPage } from './TermsPage'
import { LegalLayout } from './LegalLayout'

describe('LegalPages', () => {
  it('renders PrivacyPage content', () => {
    render(
      <MemoryRouter>
        <PrivacyPage />
      </MemoryRouter>
    )
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument()
    expect(screen.getByText('1. Introduction')).toBeInTheDocument()
    expect(screen.getByText(/We respect your privacy and are committed to protecting/i)).toBeInTheDocument()
  })

  it('renders TermsPage content', () => {
    render(
      <MemoryRouter>
        <TermsPage />
      </MemoryRouter>
    )
    expect(screen.getByText('Terms of Service')).toBeInTheDocument()
    expect(screen.getByText('1. Agreement to Terms')).toBeInTheDocument()
    expect(screen.getByText(/By accessing or using Routiq, you agree to be bound/i)).toBeInTheDocument()
  })

  it('renders LegalLayout with children', () => {
    render(
      <MemoryRouter>
        <LegalLayout title="Test Title" lastUpdated="June 5, 2026">
          <div>Test Child Content</div>
        </LegalLayout>
      </MemoryRouter>
    )
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Last updated: June 5, 2026')).toBeInTheDocument()
    expect(screen.getByText('Test Child Content')).toBeInTheDocument()
    expect(screen.getByText('Back to Home')).toBeInTheDocument()
  })
})
