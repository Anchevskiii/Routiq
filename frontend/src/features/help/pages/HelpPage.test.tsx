import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HelpPage } from './HelpPage'

// Mock scrollIntoView since jsdom doesn't implement it
window.HTMLElement.prototype.scrollIntoView = vi.fn()

describe('HelpPage', () => {
  it('renders Help Center title and search input', () => {
    render(<HelpPage />)
    expect(screen.getByText('HELP CENTER')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search frequently asked questions…')).toBeInTheDocument()
  })

  it('filters FAQ by search query', async () => {
    const user = userEvent.setup()
    render(<HelpPage />)
    
    // Type query "voting" which should show "How does voting work?"
    const input = screen.getByPlaceholderText('Search frequently asked questions…')
    await user.type(input, 'voting')
    
    expect(screen.getByText('How does voting work?')).toBeInTheDocument()
    // Other FAQs shouldn't be visible (e.g. "How do I change my password?")
    expect(screen.queryByText('How do I change my password?')).not.toBeInTheDocument()
  })

  it('filters FAQ by category tabs when search is empty', async () => {
    const user = userEvent.setup()
    render(<HelpPage />)

    // Click "Groups" tab
    const groupsTab = screen.getByRole('button', { name: /Groups 3/i })
    await user.click(groupsTab)

    expect(screen.getByText('How does voting work?')).toBeInTheDocument()
    expect(screen.getByText('How do I invite someone to a group?')).toBeInTheDocument()
    expect(screen.queryByText('How long does itinerary generation take?')).not.toBeInTheDocument()
  })

  it('opens and closes FAQ item on click', async () => {
    const user = userEvent.setup()
    render(<HelpPage />)

    const questionButton = screen.getByText('How long does itinerary generation take?')
    // The parent item shouldn't have 'hp-open' class initially
    const itemContainer = questionButton.closest('.hp-faq-item')
    expect(itemContainer).not.toHaveClass('hp-open')

    // Click to open
    await user.click(questionButton)
    expect(itemContainer).toHaveClass('hp-open')

    // Click to close
    await user.click(questionButton)
    expect(itemContainer).not.toHaveClass('hp-open')
  })

  it('clicking popular chips sets search query and resets category', async () => {
    const user = userEvent.setup()
    render(<HelpPage />)

    const chip = screen.getByRole('button', { name: 'Voting' })
    await user.click(chip)

    const input = screen.getByPlaceholderText('Search frequently asked questions…') as HTMLInputElement
    expect(input.value).toBe('Voting')
    expect(screen.getByText('How does voting work?')).toBeInTheDocument()
  })

  it('shows empty results message when no matches found', async () => {
    const user = userEvent.setup()
    render(<HelpPage />)

    const input = screen.getByPlaceholderText('Search frequently asked questions…')
    await user.type(input, 'completely-random-nonexistent-search-term')

    expect(screen.getByText(/No results for/i)).toBeInTheDocument()
  })
})
