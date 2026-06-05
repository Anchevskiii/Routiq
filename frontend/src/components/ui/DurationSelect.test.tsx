import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DurationSelect } from './DurationSelect'

describe('DurationSelect', () => {
  it('renders presets and custom duration input', () => {
    render(<DurationSelect value="60" onChange={vi.fn()} />)

    expect(screen.getByText('15m')).toBeInTheDocument()
    expect(screen.getByText('1h')).toBeInTheDocument()
    expect(screen.getByRole('spinbutton')).toHaveValue(60)
    expect(screen.getByText('= 1h')).toBeInTheDocument()
  })

  it('formats combined hours and minutes correctly', () => {
    render(<DurationSelect value="95" onChange={vi.fn()} />)
    expect(screen.getByText('= 1h 35m')).toBeInTheDocument()
  })

  it('triggers onChange when a preset is clicked', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    render(<DurationSelect value="60" onChange={onChange} />)

    await user.click(screen.getByText('30m'))
    expect(onChange).toHaveBeenCalledWith('30')
  })

  it('triggers onChange when custom input is changed', async () => {
    const onChange = vi.fn()
    const { container } = render(<DurationSelect value="60" onChange={onChange} />)

    const input = screen.getByRole('spinbutton')
    fireEvent.change(input, { target: { value: '120' } })

    expect(onChange).toHaveBeenCalledWith('120')
  })
})
