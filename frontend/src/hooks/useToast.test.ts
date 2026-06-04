import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useToast } from './useToast'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with empty toasts', () => {
    const { result } = renderHook(() => useToast())
    expect(result.current.toasts).toEqual([])
  })

  it('should add a toast and automatically remove it after 5 seconds', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.addToast('Test Message', 'success')
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0]).toEqual({
      id: expect.any(String),
      message: 'Test Message',
      variant: 'success',
    })

    // Fast-forward 5 seconds
    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(result.current.toasts).toHaveLength(0)
  })

  it('should use default variant info if not provided', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.addToast('Test Message')
    })

    expect(result.current.toasts[0].variant).toBe('info')
  })

  it('should manually remove a toast by id', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.addToast('First')
      result.current.addToast('Second')
    })

    expect(result.current.toasts).toHaveLength(2)
    const firstId = result.current.toasts[0].id

    act(() => {
      result.current.removeToast(firstId)
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].message).toBe('Second')
  })
})
