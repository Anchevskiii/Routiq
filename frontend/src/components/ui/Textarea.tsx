import React from 'react'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className={className}>
        {label && <label>{label}</label>}
        <textarea ref={ref} {...props} />
        {error && <span className="error">{error}</span>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'
