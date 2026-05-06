import React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, ...props }, ref) => {
    return (
      <div className={className}>
        {label && <label>{label}</label>}
        <input ref={ref} {...props} />
        {error && <span className="error">{error}</span>}
        {helperText && <span className="helper">{helperText}</span>}
      </div>
    )
  }
)
Input.displayName = 'Input'
