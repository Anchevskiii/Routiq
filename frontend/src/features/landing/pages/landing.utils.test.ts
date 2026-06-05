import { describe, it, expect } from 'vitest'
import { easeInOutCubic, mapWikiImages } from './landing.utils'

// ── easeInOutCubic ───────────────────────────────────────
describe('easeInOutCubic', () => {
  it('returns 0 at t=0', () => expect(easeInOutCubic(0)).toBe(0))
  it('returns 1 at t=1', () => expect(easeInOutCubic(1)).toBe(1))
  it('returns 0.5 at t=0.5 (symmetric midpoint)', () => {
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 10)
  })
  it('is monotonically increasing', () => {
    const steps = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
    for (let i = 1; i < steps.length; i++) {
      expect(easeInOutCubic(steps[i])).toBeGreaterThan(easeInOutCubic(steps[i - 1]))
    }
  })
  it('is slower at endpoints than at midpoint (ease characteristic)', () => {
    const earlySlope = easeInOutCubic(0.1) - easeInOutCubic(0)
    const midSlope   = easeInOutCubic(0.6) - easeInOutCubic(0.5)
    expect(midSlope).toBeGreaterThan(earlySlope)
  })
})

// ── mapWikiImages ────────────────────────────────────────
const WIKI_MAP = {
  'Eiffel Tower': 'Eiffel_Tower',
  'Colosseum':    'Colosseum',
  'Santorini':    'Santorini',
}

describe('mapWikiImages', () => {
  it('maps page titles to display names and thumbnail URLs', () => {
    const pages = {
      '1': { title: 'Eiffel Tower', thumbnail: { source: 'https://img/eiffel.jpg' } },
      '2': { title: 'Colosseum',    thumbnail: { source: 'https://img/colosseum.jpg' } },
    }
    const result = mapWikiImages(pages, WIKI_MAP)
    expect(result['Eiffel Tower']).toBe('https://img/eiffel.jpg')
    expect(result['Colosseum']).toBe('https://img/colosseum.jpg')
  })

  it('skips pages without thumbnails', () => {
    const pages = {
      '1': { title: 'Eiffel Tower' },
      '2': { title: 'Colosseum', thumbnail: { source: 'https://img/colosseum.jpg' } },
    }
    const result = mapWikiImages(pages, WIKI_MAP)
    expect(result['Eiffel Tower']).toBeUndefined()
    expect(result['Colosseum']).toBe('https://img/colosseum.jpg')
  })

  it('skips pages not in the wiki map', () => {
    const pages = {
      '1': { title: 'Big Ben', thumbnail: { source: 'https://img/bigben.jpg' } },
    }
    const result = mapWikiImages(pages, WIKI_MAP)
    expect(Object.keys(result)).toHaveLength(0)
  })

  it('returns empty object for empty pages', () => {
    expect(mapWikiImages({}, WIKI_MAP)).toEqual({})
  })

  it('handles underscored titles (Sagrada_Família)', () => {
    const map = { 'Sagrada Família': 'Sagrada_Família' }
    const pages = {
      '1': { title: 'Sagrada Família', thumbnail: { source: 'https://img/sagrada.jpg' } },
    }
    const result = mapWikiImages(pages, map)
    expect(result['Sagrada Família']).toBe('https://img/sagrada.jpg')
  })
})
