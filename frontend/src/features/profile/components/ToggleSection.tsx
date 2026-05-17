import React from 'react'
import type { UserSettings } from '@/api/profile.api'

interface ToggleItem {
  key: keyof UserSettings
  label: string
  desc: string
}

interface Props {
  title: string
  items: ToggleItem[]
  settings: UserSettings | undefined
  onToggle: (key: keyof UserSettings, value: boolean) => void
}

export const ToggleSection: React.FC<Props> = ({ title, items, settings, onToggle }) => (
  <div className="bg-white dark:bg-[#1e1b38] border border-line rounded-[22px] shadow-card p-6">
    <p className="text-[11px] font-mono uppercase tracking-[0.1em] text-ink-faint mb-5">{title}</p>
    <div className="space-y-1">
      {items.map((item, i) => (
        <div
          key={item.key}
          className={[
            'flex items-center justify-between py-3.5 px-1',
            i < items.length - 1 ? 'border-b border-line' : '',
          ].join(' ')}
        >
          <div>
            <p className="text-sm font-semibold text-ink">{item.label}</p>
            <p className="text-xs text-ink-faint mt-0.5">{item.desc}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={settings?.[item.key] ?? true}
              onChange={e => onToggle(item.key, e.target.checked)}
            />
            <div className="w-10 h-5 bg-line peer-focus:ring-2 peer-focus:ring-indigo-500/30 rounded-full peer peer-checked:bg-gradient-to-r peer-checked:from-indigo-500 peer-checked:to-violet-500 transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:shadow-sm after:transition-all peer-checked:after:translate-x-5" />
          </label>
        </div>
      ))}
    </div>
  </div>
)
