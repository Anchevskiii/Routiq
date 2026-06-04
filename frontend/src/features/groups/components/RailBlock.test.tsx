import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RailBlock } from './RailBlock'

describe('RailBlock', () => {
  it('renders title, count, and children', () => {
    render(
      <RailBlock
        icon={<span>Icon</span>}
        title="Rail Title"
        count={3}
        open={true}
        onToggle={vi.fn()}
      >
        <div>Content Body</div>
      </RailBlock>
    )

    expect(screen.getByText('Rail Title')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('Content Body')).toBeInTheDocument()
  })

  it('triggers onToggle callback when clicked', async () => {
    const onToggle = vi.fn()
    const user = userEvent.setup()
    
    render(
      <RailBlock
        icon={<span>Icon</span>}
        title="Rail Title"
        open={false}
        onToggle={onToggle}
      >
        <div>Content Body</div>
      </RailBlock>
    )

    await user.click(screen.getByRole('button'))
    expect(onToggle).toHaveBeenCalled()
  })
})
