import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { CookieConsent } from './CookieConsent'

// Mock framer-motion to disable animations in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.ComponentPropsWithoutRef<'div'>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('CookieConsent', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    globalThis.localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows cookie consent banner after delay if no consent is stored', () => {
    render(
      <MemoryRouter>
        <CookieConsent />
      </MemoryRouter>
    )

    // Initially hidden
    expect(screen.queryByText('Cookie Consent')).not.toBeInTheDocument()

    // Advance timers by 1500ms
    act(() => {
      vi.advanceTimersByTime(1500)
    })

    // Now it should be visible
    expect(screen.getByText('Cookie Consent')).toBeInTheDocument()
  })

  it('does not show banner if consent has already been accepted', () => {
    globalThis.localStorage.setItem('routiq_cookie_consent', 'accepted')

    render(
      <MemoryRouter>
        <CookieConsent />
      </MemoryRouter>
    )

    act(() => {
      vi.advanceTimersByTime(1500)
    })

    expect(screen.queryByText('Cookie Consent')).not.toBeInTheDocument()
  })

  it('allows accepting cookies', () => {
    render(
      <MemoryRouter>
        <CookieConsent />
      </MemoryRouter>
    )

    act(() => {
      vi.advanceTimersByTime(1500)
    })

    const acceptBtn = screen.getByText('Accept All')
    act(() => {
      acceptBtn.click()
    })

    expect(globalThis.localStorage.getItem('routiq_cookie_consent')).toBe('accepted')
    expect(screen.queryByText('Cookie Consent')).not.toBeInTheDocument()
  })

  it('allows declining cookies', () => {
    render(
      <MemoryRouter>
        <CookieConsent />
      </MemoryRouter>
    )

    act(() => {
      vi.advanceTimersByTime(1500)
    })

    const declineBtn = screen.getByText('Essential Only')
    act(() => {
      declineBtn.click()
    })

    expect(globalThis.localStorage.getItem('routiq_cookie_consent')).toBe('declined')
    expect(screen.queryByText('Cookie Consent')).not.toBeInTheDocument()
  })
})
