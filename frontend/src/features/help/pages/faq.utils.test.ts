import { describe, it, expect } from 'vitest'
import { filterFaq, countForCat } from './faq.utils'
import type { FaqItem } from './faq.utils'

const ITEMS: FaqItem[] = [
  { id: 1, cat: 'gen',     color: '', q: 'How long does itinerary generation take?',       keywords: 'generation time duration',    a: '' },
  { id: 2, cat: 'gen',     color: '', q: 'How many days can I generate an itinerary for?', keywords: 'generation days length',       a: '' },
  { id: 3, cat: 'edit',    color: '', q: 'Can I add or remove activities?',                keywords: 'edit add remove activities',   a: '' },
  { id: 4, cat: 'groups',  color: '', q: 'How do I invite someone to a group?',            keywords: 'group invite member',          a: '' },
  { id: 5, cat: 'groups',  color: '', q: 'How does voting work?',                          keywords: 'group voting upvote downvote', a: '' },
  { id: 6, cat: 'export',  color: '', q: 'Which export formats are supported?',            keywords: 'export pdf ics format',        a: '' },
  { id: 7, cat: 'export',  color: '', q: 'Is exporting free?',                             keywords: 'export free cost price',       a: '' },
  { id: 8, cat: 'account', color: '', q: 'How do I delete my account?',                   keywords: 'account delete remove',        a: '' },
]

describe('filterFaq', () => {
  describe('category filter', () => {
    it('returns all items when cat is "all" and no query', () => {
      expect(filterFaq(ITEMS, 'all', '')).toHaveLength(8)
    })

    it('returns only gen items when cat is "gen"', () => {
      const result = filterFaq(ITEMS, 'gen', '')
      expect(result).toHaveLength(2)
      expect(result.every(i => i.cat === 'gen')).toBe(true)
    })

    it('returns only export items when cat is "export"', () => {
      const result = filterFaq(ITEMS, 'export', '')
      expect(result).toHaveLength(2)
      expect(result.every(i => i.cat === 'export')).toBe(true)
    })

    it('returns empty array when cat has no items', () => {
      expect(filterFaq([], 'gen', '')).toHaveLength(0)
    })
  })

  describe('search / word-split filter', () => {
    it('finds items by single keyword in question', () => {
      const result = filterFaq(ITEMS, 'all', 'voting')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(5)
    })

    it('finds items by keyword in keywords field', () => {
      const result = filterFaq(ITEMS, 'all', 'upvote')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(5)
    })

    it('multi-word query uses OR per word — "export pdf" returns export items', () => {
      const result = filterFaq(ITEMS, 'all', 'export pdf')
      expect(result.length).toBeGreaterThanOrEqual(1)
      expect(result.every(i => i.cat === 'export')).toBe(true)
    })

    it('multi-word query "invite group" finds group invite item', () => {
      const result = filterFaq(ITEMS, 'all', 'invite group')
      expect(result.some(i => i.id === 4)).toBe(true)
    })

    it('ignores words shorter than 2 characters', () => {
      // "a" is 1 char — should be ignored, only "group" matches
      const result = filterFaq(ITEMS, 'all', 'a group')
      expect(result.some(i => i.cat === 'groups')).toBe(true)
    })

    it('returns empty when no match', () => {
      expect(filterFaq(ITEMS, 'all', 'nonexistentquery')).toHaveLength(0)
    })

    it('search ignores active category filter', () => {
      // cat=gen but query searches for "voting" (groups) — should still return it
      const result = filterFaq(ITEMS, 'gen', 'voting')
      expect(result.some(i => i.id === 5)).toBe(true)
    })

    it('search is case-insensitive', () => {
      const lower = filterFaq(ITEMS, 'all', 'voting')
      const upper = filterFaq(ITEMS, 'all', 'VOTING')
      expect(lower).toEqual(upper)
    })
  })
})

describe('countForCat', () => {
  it('returns total count for "all"', () => {
    expect(countForCat(ITEMS, 'all')).toBe(8)
  })

  it('returns correct count per category', () => {
    expect(countForCat(ITEMS, 'gen')).toBe(2)
    expect(countForCat(ITEMS, 'groups')).toBe(2)
    expect(countForCat(ITEMS, 'export')).toBe(2)
    expect(countForCat(ITEMS, 'account')).toBe(1)
    expect(countForCat(ITEMS, 'edit')).toBe(1)
  })

  it('returns 0 for empty items', () => {
    expect(countForCat([], 'gen')).toBe(0)
  })
})
