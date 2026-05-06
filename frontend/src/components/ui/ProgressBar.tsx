import React from 'react'

export interface ProgressBarProps {
  progress: number // 0 to 100
  className?: string
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, className }) => {
  return (
    <div className={`progress-bar-container ${className || ''}`}>
      <div 
        className="progress-bar-fill" 
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} 
      />
    </div>
  )
}
