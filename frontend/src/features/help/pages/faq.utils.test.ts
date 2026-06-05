import { describe, it, expect } from 'vitest'
import { filterFaq, countForCat } from './faq.utils'
import type { FaqItem } from './faq.utils'

const ITEMS: FaqItem[] = [
  { id: 1, cat: 'gen',     color: '', q: 'Kako dolgo traja generiranje načrta?',   keywords: 'generiranje čas',          a: '' },
  { id: 2, cat: 'gen',     color: '', q: 'Koliko dni itinerarja lahko generiram?',  keywords: 'generiranje dnevi',         a: '' },
  { id: 3, cat: 'edit',    color: '', q: 'Ali lahko dodam ali odstranim aktivnosti?', keywords: 'urejanje dodam odstranim', a: '' },
  { id: 4, cat: 'groups',  color: '', q: 'Kako povabim nekoga v skupino?',           keywords: 'skupina povabi',            a: '' },
  { id: 5, cat: 'groups',  color: '', q: 'Kako deluje glasovanje?',                  keywords: 'skupina glasovanje upvote', a: '' },
  { id: 6, cat: 'export',  color: '', q: 'Kateri formati izvoza so podprti?',        keywords: 'izvoz pdf ics format',      a: '' },
  { id: 7, cat: 'export',  color: '', q: 'Ali je izvoz brezplačen?',                 keywords: 'izvoz brezplačen cena',     a: '' },
  { id: 8, cat: 'account', color: '', q: 'Kako izbrišem svoj račun?',               keywords: 'račun izbriši',             a: '' },
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
      const result = filterFaq(ITEMS, 'all', 'glasovanje')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(5)
    })

    it('finds items by keyword in keywords field', () => {
      const result = filterFaq(ITEMS, 'all', 'upvote')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(5)
    })

    it('multi-word query uses OR per word — "izvoz pdf" returns export items', () => {
      const result = filterFaq(ITEMS, 'all', 'izvoz pdf')
      expect(result.length).toBeGreaterThanOrEqual(1)
      expect(result.every(i => i.cat === 'export')).toBe(true)
    })

    it('multi-word query "povabi skupino" finds group invite item', () => {
      const result = filterFaq(ITEMS, 'all', 'povabi skupino')
      expect(result.some(i => i.id === 4)).toBe(true)
    })

    it('ignores words shorter than 2 characters', () => {
      // "v" is 1 char — should be ignored, only "skupino" matches
      const result = filterFaq(ITEMS, 'all', 'v skupino')
      expect(result.some(i => i.id === 4)).toBe(true)
    })

    it('returns empty when no match', () => {
      expect(filterFaq(ITEMS, 'all', 'neobstojece')).toHaveLength(0)
    })

    it('search ignores active category filter', () => {
      // cat=gen but query searches for "glasovanje" (groups) — should still return it
      const result = filterFaq(ITEMS, 'gen', 'glasovanje')
      expect(result.some(i => i.id === 5)).toBe(true)
    })

    it('search is case-insensitive', () => {
      const lower = filterFaq(ITEMS, 'all', 'glasovanje')
      const upper = filterFaq(ITEMS, 'all', 'GLASOVANJE')
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
