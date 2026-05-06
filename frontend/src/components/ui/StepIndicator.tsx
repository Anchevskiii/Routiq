import React from 'react'

export interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, totalSteps }) => {
  return (
    <div className="step-indicator">
      {Array.from({ length: totalSteps }).map((_, idx) => {
        const step = idx + 1
        return (
          <div 
            key={step} 
            className={`step ${step <= currentStep ? 'active' : ''}`}
          >
            {step}
          </div>
        )
      })}
    </div>
  )
}
