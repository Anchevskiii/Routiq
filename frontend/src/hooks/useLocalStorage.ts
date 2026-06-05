import { useState } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof globalThis.window === 'undefined') {
      return initialValue
    }
    try {
      const item = globalThis.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn(error)
      }
      return initialValue
    }
  })

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = typeof value === 'function' ? (value as Function)(storedValue) : value
      setStoredValue(valueToStore)
      if (typeof globalThis.window !== 'undefined') {
        globalThis.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn(error)
      }
    }
  }

  return [storedValue, setValue] as const
}

