import { describe, it, expect } from 'vitest'
import { buildDirectionsUrl } from './map.utils'

describe('buildDirectionsUrl', () => {
  it('should return google maps URL with origin and destination encoded', () => {
    const url = buildDirectionsUrl('Paris, France', 'London, UK')
    expect(url).toContain('https://www.google.com/maps/dir/')
    expect(url).toContain('origin=Paris%2C%20France')
    expect(url).toContain('destination=London%2C%20UK')
  })
})
