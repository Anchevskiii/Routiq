import React from 'react'
import { cn } from '@/utils/cn'

interface Props {
  name: string
  visible: boolean
  onSkip: () => void
}

export const WelcomeOverlay: React.FC<Props> = ({ name, visible, onSkip }) => (
  <>
    <div className={cn(
      'absolute inset-0 z-20 grid place-items-center transition-all duration-[800ms]',
      visible
        ? 'opacity-100 backdrop-blur-[8px] bg-[rgba(250,250,246,.65)] dark:bg-[rgba(12,11,26,.8)] pointer-events-auto'
        : 'opacity-0 backdrop-blur-none bg-transparent pointer-events-none',
    )}>
      <div className="text-center">
        <div className={cn(
          'w-16 h-16 mx-auto mb-6 rounded-[18px] gradient-aurora shadow-[0_20px_40px_-10px_rgba(124,92,255,.5)] grid place-items-center',
          visible ? 'lm-glyph-in' : 'scale-0',
        )}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
            <path d="M12 3 L18 20 L12 16 L6 20 Z"/>
          </svg>
        </div>

        <div className={cn(
          'text-xs font-medium tracking-[0.18em] uppercase text-ink-dim mb-3',
          visible ? 'lm-fade-up-0' : 'opacity-0',
        )}>
          Welcome back
        </div>

        <h2 className={cn(
          'text-[52px] font-medium leading-none tracking-[-0.04em] text-ink mb-2',
          visible ? 'lm-fade-up-1' : 'opacity-0',
        )}>
          {name}
          <em className="font-serif italic font-normal gradient-aurora-text">, ready to plan?</em>
        </h2>
      </div>
    </div>

    <button
      onClick={onSkip}
      className="absolute top-5 right-6 z-30 bg-white/70 dark:bg-[#1e1b38]/80 backdrop-blur-[10px] border border-[rgba(20,18,43,.08)] dark:border-[rgba(139,92,246,0.2)] text-ink-dim px-[13px] py-[7px] rounded-full text-xs font-medium cursor-pointer hover:text-ink transition-colors"
    >
      Skip →
    </button>
  </>
)
