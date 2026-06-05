import React from 'react'

interface DurationSelectProps {
  value: string
  onChange: (v: string) => void
  className?: string
}

const PRESETS = [
  { label: '15m', value: '15' },
  { label: '30m', value: '30' },
  { label: '45m', value: '45' },
  { label: '1h', value: '60' },
  { label: '1.5h', value: '90' },
  { label: '2h', value: '120' },
  { label: '3h', value: '180' },
]

export const DurationSelect: React.FC<DurationSelectProps> = ({ value, onChange, className = '' }) => {
  const num = Number(value)

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map(p => (
          <button
            key={p.value}
            type="button"
            onClick={() => onChange(p.value)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all
              ${value === p.value
                ? 'bg-primary text-white shadow-sm'
                : 'bg-gray-100 dark:bg-slate-700/60 text-gray-600 dark:text-slate-300 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary'
              }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={5}
          step={5}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-20 text-sm font-medium text-gray-900 dark:text-blue-300 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-primary transition-colors"
        />
        <span className="text-xs text-gray-400 dark:text-slate-500 font-medium">
          {num > 0 ? `= ${Math.floor(num / 60) > 0 ? `${Math.floor(num / 60)}h ` : ''}${num % 60 > 0 ? `${num % 60}m` : ''}` : 'min'}
        </span>
      </div>
    </div>
  )
}
