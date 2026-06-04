import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from './useLocalStorage'

describe('useLocalStorage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('should return initial value if storage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))
    expect(result.current[0]).toBe('initial')
  })

  it('should return existing value from local storage', () => {
    window.localStorage.setItem('test-key', JSON.stringify('stored-value'))
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))
    expect(result.current[0]).toBe('stored-value')
  })

  it('should update local storage and state when setValue is called', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))
    
    act(() => {
      result.current[1]('new-value')
    })
    
    expect(result.current[0]).toBe('new-value')
    expect(JSON.parse(window.localStorage.getItem('test-key') || '')).toBe('new-value')
  })

  it('should handle functional updates', () => {
    const { result } = renderHook(() => useLocalStorage<number>('counter', 0))
    
    act(() => {
      result.current[1]((prev) => prev + 1)
    })
    
    expect(result.current[0]).toBe(1)
    expect(JSON.parse(window.localStorage.getItem('counter') || '')).toBe(1)
  })

  it('should gracefully handle errors when JSON parsing fails', () => {
    window.localStorage.setItem('test-key', 'invalid-json{')
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))
    
    expect(result.current[0]).toBe('initial')
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('should handle storage errors when writing fails', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const setItemSpy = vi.fn().mockImplementation(() => {
      throw new Error('Storage full')
    })
    const mockStorage = {
      getItem: vi.fn(),
      setItem: setItemSpy,
      clear: vi.fn(),
      removeItem: vi.fn(),
      length: 0,
      key: vi.fn(),
    }
    vi.stubGlobal('localStorage', mockStorage)
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))
    
    act(() => {
      result.current[1]('new-value')
    })
    
    expect(result.current[0]).toBe('new-value')
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
    vi.unstubAllGlobals()
  })
})

