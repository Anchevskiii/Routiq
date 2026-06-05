import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMediaQuery } from './useMediaQuery'

describe('useMediaQuery', () => {
  let matches = false
  const listeners = new Set<() => void>()

  beforeEach(() => {
    matches = false
    listeners.clear()
    
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
      get matches() { return matches },
      media: query,
      onchange: null,
      addListener: vi.fn(), // Deprecated but often mock-configured
      removeListener: vi.fn(),
      addEventListener: vi.fn().mockImplementation((_event: string, callback: () => void) => {
        listeners.add(callback)
      }),
      removeEventListener: vi.fn().mockImplementation((_event: string, callback: () => void) => {
        listeners.delete(callback)
      }),
      dispatchEvent: vi.fn(),
    })))
  })

  it('should return initial match status', () => {
    matches = true
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    expect(result.current).toBe(true)
  })

  it('should update status when media query changes', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    expect(result.current).toBe(false)

    matches = true
    act(() => {
      listeners.forEach((listener) => listener())
    })

    expect(result.current).toBe(true)
  })
})

