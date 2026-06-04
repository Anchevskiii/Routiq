import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { ThemeProvider, useTheme } from './useTheme'

describe('useTheme', () => {
  let matches = false

  beforeEach(() => {
    window.localStorage.clear()
    document.documentElement.className = ''
    matches = false

    vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })))
  })

  it('should throw an error if used outside ThemeProvider', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      renderHook(() => useTheme())
    }).toThrow('useTheme must be used within ThemeProvider')

    consoleErrorSpy.mockRestore()
  })

  it('should initialize theme from localStorage if present', () => {
    window.localStorage.setItem('routiq-theme', 'dark')
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    )

    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe('dark')
    expect(result.current.isDark).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('should fallback to prefers-color-scheme if localStorage is empty', () => {
    matches = true
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    )

    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe('dark')
    expect(result.current.isDark).toBe(true)
  })

  it('should toggle theme from light to dark and vice versa', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    )

    const { result } = renderHook(() => useTheme(), { wrapper })
    
    const initial = result.current.theme
    const target = initial === 'dark' ? 'light' : 'dark'

    act(() => {
      result.current.toggle()
    })

    expect(result.current.theme).toBe(target)
    expect(window.localStorage.getItem('routiq-theme')).toBe(target)

    act(() => {
      result.current.toggle()
    })

    expect(result.current.theme).toBe(initial)
  })
})

