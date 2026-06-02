import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { PlannerForm } from './PlannerForm'

beforeEach(() => {
  global.fetch = vi.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ originalimage: null, description: null }),
    })
  )
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
})

// Helper act wrapper for rendering/fireEvent in react-hook-form
async function act(callback: () => Promise<void> | void) {
  await React.act(callback)
}
