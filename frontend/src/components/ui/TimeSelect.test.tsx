import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TimeSelect } from './TimeSelect'

describe('TimeSelect', () => {
  it('renders value or placeholder', () => {
    const { rerender } = render(<TimeSelect value="" onChange={vi.fn()} placeholder="Choose time" />)
    expect(screen.getByText('Choose time')).toBeInTheDocument()

    rerender(<TimeSelect value="14:30" onChange={vi.fn()} />)
    expect(screen.getByText('14:30')).toBeInTheDocument()
  })

  it('toggles dropdown and allows selecting a slot', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    render(<TimeSelect value="" onChange={onChange} />)

    const button = screen.getByRole('button', { name: /set time/i })
    await user.click(button)

    const slot = screen.getByRole('button', { name: '10:15' })
    expect(slot).toBeInTheDocument()

    await user.click(slot)
    expect(onChange).toHaveBeenCalledWith('10:15')
  })

  it('allows clearing the selection', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    render(<TimeSelect value="09:00" onChange={onChange} />)

    const clearBtn = screen.getByRole('button', { name: '' }) // The X element has role="button"
    await user.click(clearBtn)

    expect(onChange).toHaveBeenCalledWith('')
  })

  it('closes dropdown when clicking outside', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <TimeSelect value="" onChange={vi.fn()} />
      </div>
    )

    const button = screen.getByRole('button', { name: /set time/i })
    await user.click(button)
    expect(screen.getByRole('button', { name: '08:00' })).toBeInTheDocument()

    await user.click(screen.getByTestId('outside'))
    expect(screen.queryByRole('button', { name: '08:00' })).not.toBeInTheDocument()
  })
})
