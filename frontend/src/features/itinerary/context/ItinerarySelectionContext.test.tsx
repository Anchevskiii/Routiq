import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import React from 'react'
import { ItinerarySelectionProvider, useItinerarySelection } from './ItinerarySelectionContext'

const Consumer: React.FC = () => {
  const { selectedActivityId, setSelectedActivityId } = useItinerarySelection()
  return (
    <div>
      <span data-testid="selected">{selectedActivityId ?? 'none'}</span>
      <button onClick={() => setSelectedActivityId('act-1')}>select</button>
      <button onClick={() => setSelectedActivityId(null)}>clear</button>
    </div>
  )
}

describe('ItinerarySelectionContext', () => {
  it('defaults to null selectedActivityId', () => {
    render(<ItinerarySelectionProvider><Consumer /></ItinerarySelectionProvider>)
    expect(screen.getByTestId('selected').textContent).toBe('none')
  })

  it('updates selectedActivityId when set', () => {
    render(<ItinerarySelectionProvider><Consumer /></ItinerarySelectionProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'select' }))
    expect(screen.getByTestId('selected').textContent).toBe('act-1')
  })

  it('clears selectedActivityId when set to null', () => {
    render(<ItinerarySelectionProvider><Consumer /></ItinerarySelectionProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'select' }))
    fireEvent.click(screen.getByRole('button', { name: 'clear' }))
    expect(screen.getByTestId('selected').textContent).toBe('none')
  })

  it('useItinerarySelection returns default context outside provider', () => {
    const Bare: React.FC = () => {
      const { selectedActivityId } = useItinerarySelection()
      return <span data-testid="bare">{selectedActivityId ?? 'none'}</span>
    }
    render(<Bare />)
    expect(screen.getByTestId('bare').textContent).toBe('none')
  })
})
