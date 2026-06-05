import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePagination } from './usePagination'

describe('usePagination', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => usePagination())
    expect(result.current.page).toBe(1)
    expect(result.current.limit).toBe(10)
  })

  it('should initialize with custom options', () => {
    const { result } = renderHook(() => usePagination({ initialPage: 3, initialLimit: 20 }))
    expect(result.current.page).toBe(3)
    expect(result.current.limit).toBe(20)
  })

  it('should navigate to next and previous pages', () => {
    const { result } = renderHook(() => usePagination({ initialPage: 1 }))

    act(() => {
      result.current.nextPage()
    })
    expect(result.current.page).toBe(2)

    act(() => {
      result.current.prevPage()
    })
    expect(result.current.page).toBe(1)
  })

  it('should not allow page number below 1', () => {
    const { result } = renderHook(() => usePagination({ initialPage: 1 }))

    act(() => {
      result.current.prevPage()
    })
    expect(result.current.page).toBe(1)
  })

  it('should reset page back to 1', () => {
    const { result } = renderHook(() => usePagination({ initialPage: 5 }))

    act(() => {
      result.current.reset()
    })
    expect(result.current.page).toBe(1)
  })

  it('should set page and limit explicitly', () => {
    const { result } = renderHook(() => usePagination())

    act(() => {
      result.current.setPage(4)
      result.current.setLimit(50)
    })
    expect(result.current.page).toBe(4)
    expect(result.current.limit).toBe(50)
  })
})
