import { describe, it, expect } from 'vitest'
import {
  easeInOutCubic,
  makeSphere,
  makeTorus,
  makeHelix,
  makeGalaxy,
  makeBox,
  makeIcosahedron,
  mapWikiImages,
} from './landing.utils'

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

// ── shared shape helpers ─────────────────────────────────
function checkLength(pos: Float32Array, n: number) {
  expect(pos.length).toBe(n * 3)
}
function allFinite(pos: Float32Array) {
  for (let i = 0; i < pos.length; i++) expect(isFinite(pos[i])).toBe(true)
}
function maxAbsCoord(pos: Float32Array) {
  let m = 0
  for (let i = 0; i < pos.length; i++) m = Math.max(m, Math.abs(pos[i]))
  return m
}

// ── makeSphere ───────────────────────────────────────────
describe('makeSphere', () => {
  const pos = makeSphere(100)
  it('returns n*3 floats', () => checkLength(pos, 100))
  it('all values are finite', () => allFinite(pos))
  it('positions are within [-1.5, 1.5] (fibonacci sphere radius 1.5)', () => {
    expect(maxAbsCoord(pos)).toBeLessThanOrEqual(1.5 + 1e-9)
  })
  it('Y spans full range from -1.5 to 1.5', () => {
    const ys = Array.from({ length: 100 }, (_, i) => pos[i * 3 + 1])
    expect(Math.min(...ys)).toBeLessThan(-1.4)
    expect(Math.max(...ys)).toBeGreaterThan(1.4)
  })
})

// ── makeTorus ────────────────────────────────────────────
describe('makeTorus', () => {
  const pos = makeTorus(200)
  it('returns n*3 floats', () => checkLength(pos, 200))
  it('all values are finite', () => allFinite(pos))
  it('XY coords within torus outer bound (R+r = 1.52)', () => {
    for (let i = 0; i < 200; i++) {
      const x = pos[i * 3], y = pos[i * 3 + 1]
      const xyDist = Math.sqrt(x * x + y * y)
      expect(xyDist).toBeLessThanOrEqual(1.52 + 1e-9)
    }
  })
  it('Z within torus tube radius (r = 0.42)', () => {
    for (let i = 0; i < 200; i++) {
      expect(Math.abs(pos[i * 3 + 2])).toBeLessThanOrEqual(0.42 + 1e-9)
    }
  })
})

// ── makeHelix ────────────────────────────────────────────
describe('makeHelix', () => {
  const pos = makeHelix(100)
  it('returns n*3 floats', () => checkLength(pos, 100))
  it('all values are finite', () => allFinite(pos))
  it('XZ coords within radius 1.0 (cos/sin * 1.0)', () => {
    for (let i = 0; i < 100; i++) {
      const x = pos[i * 3], z = pos[i * 3 + 2]
      expect(Math.abs(x)).toBeLessThanOrEqual(1.0 + 1e-9)
      expect(Math.abs(z)).toBeLessThanOrEqual(1.0 + 1e-9)
    }
  })
  it('Y spans a helix range (t * 0.22, t in [-3π, 3π])', () => {
    const ys = Array.from({ length: 100 }, (_, i) => pos[i * 3 + 1])
    const yMax = Math.max(...ys), yMin = Math.min(...ys)
    expect(yMax).toBeGreaterThan(1.5)
    expect(yMin).toBeLessThan(-1.5)
  })
})

// ── makeGalaxy ───────────────────────────────────────────
describe('makeGalaxy', () => {
  const pos = makeGalaxy(300)
  it('returns n*3 floats', () => checkLength(pos, 300))
  it('all values are finite', () => allFinite(pos))
  it('XZ within galaxy radius (~1.8 + scatter)', () => {
    for (let i = 0; i < 300; i++) {
      const x = pos[i * 3], z = pos[i * 3 + 2]
      expect(Math.abs(x)).toBeLessThan(2.2)
      expect(Math.abs(z)).toBeLessThan(2.2)
    }
  })
  it('Y values are small (flat galaxy disk)', () => {
    for (let i = 0; i < 300; i++) {
      expect(Math.abs(pos[i * 3 + 1])).toBeLessThan(0.4)
    }
  })
})

// ── makeBox ──────────────────────────────────────────────
describe('makeBox', () => {
  const pos = makeBox(100)
  it('returns n*3 floats', () => checkLength(pos, 100))
  it('all values are finite', () => allFinite(pos))
  it('positions within box half-extent 1.1 (size 2.2)', () => {
    expect(maxAbsCoord(pos)).toBeLessThanOrEqual(1.1 + 1e-6)
  })
})

// ── makeIcosahedron ──────────────────────────────────────
describe('makeIcosahedron', () => {
  const pos = makeIcosahedron(100)
  it('returns n*3 floats', () => checkLength(pos, 100))
  it('all values are finite', () => allFinite(pos))
  it('positions near icosahedron radius 1.3', () => {
    for (let i = 0; i < 100; i++) {
      const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2]
      const r = Math.sqrt(x * x + y * y + z * z)
      expect(r).toBeLessThanOrEqual(1.3 + 0.01)
    }
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
