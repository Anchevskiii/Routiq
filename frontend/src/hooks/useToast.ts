import { useState, useCallback } from 'react'

export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

export interface ToastMessage {
  id: string
  message: string
  variant: ToastVariant
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const array = new Uint32Array(1)
    window.crypto.getRandomValues(array)
    const id = array[0].toString(36)
    setToasts((prev) => [...prev, { id, message, variant }])

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toasts, addToast, removeToast }
}
