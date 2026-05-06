import React from 'react'

export interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral'
  children: React.ReactNode
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', children }) => {
  return <span className={`badge badge-${variant}`}>{children}</span>
}
