import { describe, it, expect, vi } from 'vitest'
import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GroupMember } from '@/types/group.types'

vi.mock('./GroupComments', () => ({
  GroupComments: () => null,
}))

import { GroupDetailSidebar } from './GroupDetailSidebar'

const members: GroupMember[] = [
  {
    id: 'm1',
    groupId: 'g1',
    userId: 'u1',
    role: 'OWNER',
    status: 'ACCEPTED',
    joinedAt: '2026-06-02T18:00:00Z',
    user: { id: 'u1', name: 'Owner', email: 'owner@routiq.test' },
  },
]

describe('GroupDetailSidebar', () => {
  it('blocks invalid invite email submission', async () => {
    const user = userEvent.setup()
    const onInvite = vi.fn()

    const Wrapper = () => {
      const [email, setEmail] = useState('')
      return (
        <GroupDetailSidebar
          groupId="g1"
          members={members}
          currentUserRole="OWNER"
          inviteEmail={email}
          isInviting={false}
          isRemoving={false}
          onEmailChange={setEmail}
          onInvite={onInvite}
          onRemoveMember={vi.fn()}
        />
      )
    }

    render(<Wrapper />)

    await user.click(screen.getByRole('button', { name: /invite to group/i }))

    const input = screen.getByPlaceholderText('Email address')
    await user.type(input, 'hello@test')

    await user.click(screen.getByRole('button', { name: /send/i }))

    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument()
    expect(onInvite).not.toHaveBeenCalled()
  })
})
