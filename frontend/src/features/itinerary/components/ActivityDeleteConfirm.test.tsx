import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActivityDeleteConfirm } from './ActivityDeleteConfirm'

describe('ActivityDeleteConfirm', () => {
  it('renders trash button in idle state', () => {
    const onRequestConfirm = vi.fn()
    render(
      <ActivityDeleteConfirm
        isPending={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        onRequestConfirm={onRequestConfirm}
        confirmState="idle"
      />
    )

    expect(screen.getByTitle('Delete activity')).toBeInTheDocument()
  })

  it('renders confirmation prompt in confirming state', async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    const user = userEvent.setup()

    render(
      <ActivityDeleteConfirm
        isPending={false}
        onConfirm={onConfirm}
        onCancel={onCancel}
        onRequestConfirm={vi.fn()}
        confirmState="confirming"
      />
    )

    expect(screen.getByText('Sure?')).toBeInTheDocument()
    
    await user.click(screen.getByRole('button', { name: 'Yes' }))
    expect(onConfirm).toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'No' }))
    expect(onCancel).toHaveBeenCalled()
  })
})
