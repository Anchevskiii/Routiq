import React from 'react'

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className={className}>
        <input type="checkbox" ref={ref} {...props} />
        <span>{label}</span>
      </label>
    )
  }
)
Checkbox.displayName = 'Checkbox'
