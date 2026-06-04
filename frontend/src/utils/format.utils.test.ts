import { describe, it, expect } from 'vitest'
import { formatDuration } from './format.utils'

describe('formatDuration', () => {
  it('should format minutes only when less than an hour', () => {
    expect(formatDuration(45)).toBe('45 min')
  })

  it('should format hours only when multiple of 60', () => {
    expect(formatDuration(120)).toBe('2 h')
  })

  it('should format both hours and minutes otherwise', () => {
    expect(formatDuration(75)).toBe('1 h 15 min')
  })
})
