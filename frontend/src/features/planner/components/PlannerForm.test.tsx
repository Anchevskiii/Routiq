import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { PlannerForm } from './PlannerForm'

vi.mock('@/components/providers/GoogleMapsProvider', () => ({
  useGoogleMaps: () => ({ isLoaded: true }),
}))

class MockAutocomplete {
  addListener = vi.fn()
  getPlace = vi.fn(() => ({
    formatted_address: 'Rome, Italy',
    name: 'Rome',
    place_id: 'rome_id',
    geometry: {
      location: {
        lat: () => 41.9,
        lng: () => 12.5,
      },
    },
  }))
}

beforeEach(() => {
  vi.stubGlobal('google', {
    maps: {
      places: {
        Autocomplete: MockAutocomplete,
      },
    },
  })
  global.fetch = vi.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ originalimage: null, description: null }),
    })
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('PlannerForm', () => {
  it('disables the submit button until required fields are filled', () => {
    const onSubmit = vi.fn()
    render(<PlannerForm onSubmit={onSubmit} isLoading={false} />)

    const submitBtn = screen.getByRole('button', { name: /Complete 4 fields/i })
    expect(submitBtn).toBeDisabled()
  })

  it('validates and shows errors upon form submission', async () => {
    const onSubmit = vi.fn()
    const { container } = render(<PlannerForm onSubmit={onSubmit} isLoading={false} />)

    // Trigger validation by firing the submit event directly on the form
    const form = container.querySelector('form')
    if (!form) throw new Error('Form not found')

    await act(async () => {
      fireEvent.submit(form)
    })

    // Expect Zod errors
    expect(await screen.findByText('Destination must be at least 2 characters')).toBeInTheDocument()
    expect(await screen.findByText('Travel type is required')).toBeInTheDocument()
  })

  it('allows filling destination and experience types', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<PlannerForm onSubmit={onSubmit} isLoading={false} />)

    const destInput = screen.getByPlaceholderText('e.g. Tokyo, Lisbon, Reykjavík…')
    await user.type(destInput, 'Rome')

    const culturalBtn = screen.getAllByRole('button', { name: /Cultural/i })[0]
    await user.click(culturalBtn)

    expect(destInput).toHaveValue('Rome')
  })

  it('displays the correct missing fields count on the submit button', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<PlannerForm onSubmit={onSubmit} isLoading={false} />)

    // Initially 4 required fields are missing
    expect(screen.getByRole('button', { name: /Complete 4 fields/i })).toBeInTheDocument()

    // Fill destination
    const destInput = screen.getByPlaceholderText('e.g. Tokyo, Lisbon, Reykjavík…')
    await user.type(destInput, 'Rome')
    expect(screen.getByRole('button', { name: /Complete 3 fields/i })).toBeInTheDocument()

    // Click experience type
    const culturalBtn = screen.getAllByRole('button', { name: /Cultural/i })[0]
    await user.click(culturalBtn)
    expect(screen.getByRole('button', { name: /Complete 2 fields/i })).toBeInTheDocument()
  })
})

// Helper act wrapper for rendering/fireEvent in react-hook-form
async function act(callback: () => Promise<void> | void) {
  await React.act(callback)
}
