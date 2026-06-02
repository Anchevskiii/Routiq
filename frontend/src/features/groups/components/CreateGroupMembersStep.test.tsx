import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateGroupMembersStep } from './CreateGroupMembersStep'

describe('CreateGroupMembersStep', () => {
  it('shows an error for an invalid email', async () => {
    const user = userEvent.setup()
    render(<CreateGroupMembersStep members={[]} onChange={vi.fn()} />)

    await user.type(screen.getByPlaceholderText('member@email.com'), 'not-an-email')
    await user.click(screen.getByRole('button', { name: /add/i }))

    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument()
  })
})
