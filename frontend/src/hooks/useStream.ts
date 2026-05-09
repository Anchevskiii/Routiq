import { useState, useCallback } from 'react'
import { supabase } from '@/api/supabase'

export interface StreamOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: string) => void
  onProgress?: (data: unknown) => void
}

export const useStream = <T = unknown>() => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stream = useCallback(async (url: string, body: unknown, options?: StreamOptions<T>) => {
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

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonString = line.replace('data: ', '')
            try {
              const data = JSON.parse(jsonString)
              
              if (data.type === 'error') {
                throw new Error(data.error)
              }
              
              if (data.type === 'complete') {
                options?.onSuccess?.(data as T)
              } else {
                options?.onProgress?.(data)
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e)
            }
          }
        }
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
