import React from 'react'
import { Maximize2 } from 'lucide-react'

const COLORS = [
  '#2563eb', '#0ea5e9', '#10b981', '#f59e0b',
  '#ef4444', '#3b82f6', '#06b6d4', '#84cc16',
]

interface Props {
  days: number[]
  selectedDay: number | null
  expanded: boolean
  onSelectDay: (day: number | null) => void
  onToggleExpand: () => void
}

export const MapDayTabs: React.FC<Props> = ({ days, selectedDay, expanded, onSelectDay, onToggleExpand }) => (
  <div className="bg-white dark:bg-[#16142e] px-3 pt-3 pb-2 border-b border-slate-100 dark:border-blue-600/10 flex items-center gap-1.5 flex-wrap">
    <button
      onClick={() => onSelectDay(null)}
      className={[
        'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
        selectedDay === null
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-ink-dim hover:bg-blue-600 dark:hover:bg-blue-900/30',
      ].join(' ')}
    >
      All days
    </button>
    {days.map(dn => (
      <button
        key={dn}
        onClick={() => onSelectDay(dn === selectedDay ? null : dn)}
        className={[
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
          selectedDay === dn
            ? 'text-white shadow-sm'
            : 'text-ink-dim hover:bg-blue-600 dark:hover:bg-blue-900/30',
        ].join(' ')}
        style={selectedDay === dn ? { background: COLORS[(dn - 1) % COLORS.length] } : undefined}
      >
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[(dn - 1) % COLORS.length] }} />
        Day {dn}
      </button>
    ))}
    <button
      onClick={onToggleExpand}
      title={expanded ? 'Collapse' : 'Expand'}
      className="ml-auto p-1.5 rounded-lg text-ink-faint hover:bg-blue-600 dark:hover:bg-blue-900/30 transition-colors"
    >
      <Maximize2 className="w-3.5 h-3.5" />
    </button>
  </div>
)
