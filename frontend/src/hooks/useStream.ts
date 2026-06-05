import { useState, useCallback } from 'react'
import { supabase } from '@/api/supabase'

export interface StreamOptions<T, P = unknown> {
  onSuccess?: (data: T) => void
  onError?: (error: string) => void
  onProgress?: (data: P) => void
}

export const useStream = <T = unknown, P = unknown>() => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stream = useCallback(async (url: string, body: unknown, options?: StreamOptions<T, P>) => {
    setIsLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No readable stream')

      const decoder = new TextDecoder()
      let buffer = ''

      let chunk = await reader.read()
      while (!chunk.done) {
        buffer += decoder.decode(chunk.value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonString = line.replace('data: ', '')
            try {
              const data = JSON.parse(jsonString) as {
                type?: string
                error?: string
              }

              if (data.type === 'error') {
                const message = data.error || 'Unknown stream error'
                setError(message)
                options?.onError?.(message)
                setIsLoading(false)
                reader.cancel().catch(() => undefined)
                return
              }
              
              if (data.type === 'complete') {
                options?.onSuccess?.(data as T)
              } else {
                options?.onProgress?.(data as P)
              }
            } catch (e) {
              if (import.meta.env.DEV) {
                console.error('Error parsing SSE data:', e)
              }
            }
          }
        }
        chunk = await reader.read()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      options?.onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { stream, isLoading, error }
}
