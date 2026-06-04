import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VoteWidget } from './VoteWidget'

describe('VoteWidget', () => {
  it('renders score and vote buttons', () => {
    render(
      <VoteWidget
        score={5}
        userVote={null}
        isPending={false}
        onVote={vi.fn()}
      />
    )

    expect(screen.getByText('+5')).toBeInTheDocument()
    expect(screen.getByTitle('Upvote')).toBeInTheDocument()
    expect(screen.getByTitle('Downvote')).toBeInTheDocument()
  })

  it('calls onVote with UPVOTE when upvote clicked', async () => {
    const onVote = vi.fn()
    const user = userEvent.setup()
    render(
      <VoteWidget
        score={0}
        userVote={null}
        isPending={false}
        onVote={onVote}
      />
    )

    await user.click(screen.getByTitle('Upvote'))
    expect(onVote).toHaveBeenCalledWith('UPVOTE')
  })

  it('calls onRemoveVote when active upvote is clicked', async () => {
    const onRemoveVote = vi.fn()
    const user = userEvent.setup()
    render(
      <VoteWidget
        score={1}
        userVote="UPVOTE"
        isPending={false}
        onVote={vi.fn()}
        onRemoveVote={onRemoveVote}
      />
    )

    await user.click(screen.getByTitle('Remove vote'))
    expect(onRemoveVote).toHaveBeenCalled()
  })

  it('disables buttons when isPending is true', () => {
    render(
      <VoteWidget
        score={2}
        userVote={null}
        isPending={true}
        onVote={vi.fn()}
      />
    )

    expect(screen.getByTitle('Upvote')).toBeDisabled()
    expect(screen.getByTitle('Downvote')).toBeDisabled()
  })
})
