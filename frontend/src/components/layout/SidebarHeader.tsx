import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  collapsed: boolean
  onExpand: () => void
  onCollapse: () => void
}

export const SidebarHeader: React.FC<Props> = ({ collapsed, onExpand, onCollapse }) => {
  if (collapsed) {
    return (
      <div className="flex items-center justify-center min-h-[60px] mb-1">
        <button
          className="w-[34px] h-[34px] flex items-center justify-center rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors text-indigo-400 dark:text-indigo-500"
          onClick={onExpand}
          title="Expand sidebar"
        >
          <ChevronRight strokeWidth={2} className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2.5 px-3.5 py-4 mb-1 min-h-[60px]">
      <div className="w-[34px] h-[34px] flex items-center justify-center rounded-xl shrink-0 shadow-[0_4px_14px_rgba(99,102,241,0.35)] gradient-aurora">
        <svg viewBox="0 0 28 28" width="20" height="20" fill="none">
          <defs>
            <linearGradient id="aurora-logo" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="1" stopColor="#e0e7ff" />
            </linearGradient>
          </defs>
          <circle cx="14" cy="14" r="13" fill="url(#aurora-logo)" />
          <path d="M8 18 L14 6 L20 18 L14 14 Z" fill="#6366f1" />
        </svg>
      </div>
      <span className="font-bold text-[15px] tracking-tight text-indigo-950 dark:text-indigo-100 whitespace-nowrap">
        Routiq
      </span>
      <button
        className="ml-auto w-[26px] h-[26px] flex items-center justify-center rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors text-indigo-300 dark:text-indigo-500 shrink-0"
        onClick={onCollapse}
        title="Collapse sidebar"
      >
        <ChevronLeft strokeWidth={2} className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
