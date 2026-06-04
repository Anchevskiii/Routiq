import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MapDayTabs } from './MapDayTabs'

describe('MapDayTabs', () => {
  it('renders all day tabs and expand button', () => {
    render(
      <MapDayTabs
        days={[1, 2]}
        selectedDay={null}
        expanded={false}
        onSelectDay={vi.fn()}
        onToggleExpand={vi.fn()}
      />
    )

    expect(screen.getByText('All days')).toBeInTheDocument()
    expect(screen.getByText('Day 1')).toBeInTheDocument()
    expect(screen.getByText('Day 2')).toBeInTheDocument()
    expect(screen.getByTitle('Expand')).toBeInTheDocument()
  })

  it('calls onSelectDay callback when day is clicked', async () => {
    const onSelectDay = vi.fn()
    const user = userEvent.setup()
    
    render(
      <MapDayTabs
        days={[1, 2]}
        selectedDay={1}
        expanded={false}
        onSelectDay={onSelectDay}
        onToggleExpand={vi.fn()}
      />
    )

    await user.click(screen.getByText('All days'))
    expect(onSelectDay).toHaveBeenCalledWith(null)

    await user.click(screen.getByText('Day 2'))
    expect(onSelectDay).toHaveBeenCalledWith(2)
  })

  it('calls onToggleExpand callback when expand button clicked', async () => {
    const onToggleExpand = vi.fn()
    const user = userEvent.setup()
    
    render(
      <MapDayTabs
        days={[1]}
        selectedDay={null}
        expanded={true}
        onSelectDay={vi.fn()}
        onToggleExpand={onToggleExpand}
      />
    )

    await user.click(screen.getByTitle('Collapse'))
    expect(onToggleExpand).toHaveBeenCalled()
  })
})
