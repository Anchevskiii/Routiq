import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useStream } from './useStream'

// Mock Supabase
vi.mock('@/api/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => Promise.resolve({
        data: {
          session: {
            access_token: 'fake-jwt-token',
          },
        },
      }),
    },
  },
}))

describe('useStream', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('console', {
      log: vi.fn(),
      error: vi.fn(),
    })
  })

  it('should initialize with default states', () => {
    const { result } = renderHook(() => useStream())
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('should handle successful SSE stream processing', async () => {
    const sseLines = [
      'data: {"type":"progress","step":1}\n',
      'data: {"type":"complete","result":"ok"}\n',
    ]
    let lineIdx = 0

    const mockReader = {
      read: vi.fn().mockImplementation(async () => {
        if (lineIdx >= sseLines.length) {
          return { done: true, value: undefined }
        }
        const encoder = new TextEncoder()
        const val = encoder.encode(sseLines[lineIdx++])
        return { done: false, value: val }
      }),
      cancel: vi.fn().mockResolvedValue(undefined),
    }

    const mockResponse = {
      ok: true,
      body: {
        getReader: () => mockReader,
      },
    }

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))

    const { result } = renderHook(() => useStream())

    const onSuccess = vi.fn()
    const onProgress = vi.fn()
    const onError = vi.fn()

    await act(async () => {
      await result.current.stream('/api/test', { key: 'value' }, {
        onSuccess,
        onProgress,
        onError,
      })
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-jwt-token',
      }),
    }))

    expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({ type: 'progress', step: 1 }))
    expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ type: 'complete', result: 'ok' }))
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('should handle SSE server-side error payload', async () => {
    const sseLines = [
      'data: {"type":"error","error":"Generation failed"}\n',
    ]

    const mockReader = {
      read: vi.fn().mockResolvedValueOnce({
        done: false,
        value: new TextEncoder().encode(sseLines[0]),
      }).mockResolvedValue({ done: true, value: undefined }),
      cancel: vi.fn().mockResolvedValue(undefined),
    }

    const mockResponse = {
      ok: true,
      body: {
        getReader: () => mockReader,
      },
    }

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))

    const { result } = renderHook(() => useStream())

    const onError = vi.fn()

    await act(async () => {
      await result.current.stream('/api/test', {}, { onError })
    })

    expect(onError).toHaveBeenCalledWith('Generation failed')
    expect(result.current.error).toBe('Generation failed')
    expect(mockReader.cancel).toHaveBeenCalled()
  })

  it('should handle HTTP error status', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
    }

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))

    const { result } = renderHook(() => useStream())
    const onError = vi.fn()

    await act(async () => {
      await result.current.stream('/api/test', {}, { onError })
    })

    expect(onError).toHaveBeenCalledWith('HTTP error! status: 500')
    expect(result.current.error).toBe('HTTP error! status: 500')
  })
})

