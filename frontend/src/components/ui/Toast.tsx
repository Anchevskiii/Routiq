import React from 'react'
import type { ToastMessage } from '@/hooks/useToast'

export interface ToastProps {
  toasts: ToastMessage[]
  removeToast: (id: string) => void
}

export const Toast: React.FC<ToastProps> = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.variant}`}>
          <span>{toast.message}</span>
          <button onClick={() => removeToast(toast.id)}>X</button>
        </div>
      ))}
    </div>
  )
}
