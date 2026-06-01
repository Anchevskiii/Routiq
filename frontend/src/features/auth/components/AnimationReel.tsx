import React from 'react'
import { cn } from '@/utils/cn'

interface StepItem {
  id: number
  label: string
}

interface Props {
  steps: StepItem[]
  curStep: number
  doneSteps: number[]
}

export const AnimationReel: React.FC<Props> = ({ steps, curStep, doneSteps }) => (
  <div className="absolute left-1/2 bottom-10 -translate-x-1/2 flex items-center gap-3 z-10 text-xs font-medium font-sans text-ink-dim">
    {steps.map((item, idx) => {
      const isDone   = doneSteps.includes(item.id)
      const isActive = curStep === item.id && !isDone
      return (
        <React.Fragment key={item.id}>
          {idx > 0 && <span className="text-[#b8b4c8]">›</span>}
          <div className={cn(
            'flex items-center gap-[7px] px-[13px] py-[7px] rounded-full bg-white/70 dark:bg-[#1e1b38]/80 backdrop-blur-[10px] border border-[rgba(20,18,43,.07)] dark:border-[rgba(139,92,246,0.15)] transition-all duration-[400ms]',
            (isActive || isDone)
              ? 'opacity-100 text-ink shadow-[0_4px_12px_-4px_rgba(20,18,43,.12)]'
              : 'opacity-30 text-ink-dim',
          )}>
            <span className={cn(
              'w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-[400ms]',
              isDone   ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,.5)]' :
              isActive ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,.6)]' :
              'bg-[#b8b4c8]',
            )}/>
            {item.label}
          </div>
        </React.Fragment>
      )
    })}
  </div>
)
