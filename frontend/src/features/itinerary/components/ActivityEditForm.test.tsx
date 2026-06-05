import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActivityEditForm } from './ActivityEditForm'

describe('ActivityEditForm', () => {
  it('renders input elements and labels correctly', () => {
    render(
      <ActivityEditForm
        editTime="10:00"
        editDuration="60"
        isPending={false}
        onTimeChange={vi.fn()}
        onDurationChange={vi.fn()}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByText('Start Time')).toBeInTheDocument()
    expect(screen.getByText('Duration')).toBeInTheDocument()
    expect(screen.getByText('10:00')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('triggers onSave and onCancel actions', async () => {
    const onSave = vi.fn()
    const onCancel = vi.fn()
    const user = userEvent.setup()

    render(
      <ActivityEditForm
        editTime="10:00"
        editDuration="60"
        isPending={false}
        onTimeChange={vi.fn()}
        onDurationChange={vi.fn()}
        onSave={onSave}
        onCancel={onCancel}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('shows saving text and disables save button when isPending is true', () => {
    render(
      <ActivityEditForm
        editTime="10:00"
        editDuration="60"
        isPending={true}
        onTimeChange={vi.fn()}
        onDurationChange={vi.fn()}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled()
  })
})
