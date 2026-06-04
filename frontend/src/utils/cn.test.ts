import { describe, it, expect } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('merges classNames correctly', () => {
    expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white')
  })

  it('handles conditional classNames', () => {
    expect(cn('bg-red-500', false && 'text-white', true && 'font-bold')).toBe('bg-red-500 font-bold')
  })

  it('resolves tailwind conflicts', () => {
    expect(cn('p-4 p-6')).toBe('p-6')
  })

  it('handles empty inputs', () => {
    expect(cn()).toBe('')
  })
})
