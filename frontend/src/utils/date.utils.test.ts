import { describe, it, expect } from 'vitest'
import { formatDate, getDaysBetween, getDateRange, addMinutesToTime } from '@/utils/date.utils'

describe('date utils', () => {
  it('formats dates with default format', () => {
    expect(formatDate('2024-05-12')).toBe('12. 05. 2024')
  })

  it('formats dates with a custom format', () => {
    expect(formatDate('2024-05-12', 'yyyy/MM/dd')).toBe('2024/05/12')
  })

  it('calculates days between two dates', () => {
    expect(getDaysBetween('2024-05-10', '2024-05-12')).toBe(2)
  })

  it('builds an inclusive date range across months', () => {
    expect(getDateRange('2024-01-30', '2024-02-02')).toEqual([
      '2024-01-30',
      '2024-01-31',
      '2024-02-01',
      '2024-02-02',
    ])
  })

  it('builds a date range across DST boundaries', () => {
    expect(getDateRange('2024-03-09', '2024-03-11')).toHaveLength(3)
  })

  it('adds minutes to a time string', () => {
    expect(addMinutesToTime('10:00', 180)).toBe('13:00')
  })

  it('wraps time arithmetic across midnight', () => {
    expect(addMinutesToTime('23:30', 90)).toBe('01:00')
  })
})
