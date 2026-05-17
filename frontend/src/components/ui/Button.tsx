import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    return (
      <button 
        ref={ref} 
        className={`btn btn-${variant} btn-${size} ${className || ''}`} 
        disabled={isLoading || props.disabled} 
        {...props}
      >
        {isLoading ? 'Loading...' : children}
      </button>
    )
  }
)
Button.displayName = 'Button'
