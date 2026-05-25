import React from 'react'
import { ChevronDown } from 'lucide-react'

interface Props {
  icon: React.ReactNode
  title: string
  count?: number
  open: boolean
  onToggle: () => void
  foot?: React.ReactNode
  children: React.ReactNode
}

export const RailBlock: React.FC<Props> = ({ icon, title, count, open, onToggle, foot, children }) => (
  <div className="grp-panel rounded-[18px] overflow-hidden border border-gray-200 dark:border-white/[0.07]">
    <button
      onClick={onToggle}
      className="w-full px-4 py-3.5 flex items-center gap-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors bg-transparent border-none text-left"
    >
      <div className="w-7 h-7 rounded-[9px] bg-blue-50 dark:bg-[rgba(59,130,246,0.12)] flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
        {icon}
      </div>
      <span className="flex-1 text-[13px] font-semibold text-gray-900 dark:text-[#f0eeff] tracking-tight">{title}</span>
      {count != null && (
        <span className="text-[11px] font-mono text-gray-400 dark:text-[#6e6c93] bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.07] px-1.5 py-0.5 rounded-full">
          {count}
        </span>
      )}
      <ChevronDown
        size={14}
        className={`text-gray-400 dark:text-[#6e6c93] transition-transform duration-200 ${open ? 'rotate-0' : '-rotate-90'}`}
      />
    </button>

    <div className={`grp-rail-body${open ? '' : ' collapsed'}`}>
      {children}
      {foot}
    </div>
  </div>
)
