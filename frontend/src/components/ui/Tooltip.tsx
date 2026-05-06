import React from 'react'

export interface TooltipProps {
  content: React.ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
  children: React.ReactNode
}

export const Tooltip: React.FC<TooltipProps> = ({ content, placement = 'top', children }) => {
  return (
    <div className="tooltip-wrapper">
      {children}
      <div className={`tooltip-content tooltip-${placement}`}>
        {content}
      </div>
    </div>
  )
}
