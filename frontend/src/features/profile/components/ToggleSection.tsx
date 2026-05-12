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
  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-2">
    <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
    {items.map(item => (
      <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
        <div>
          <p className="font-bold text-gray-900 text-sm">{item.label}</p>
          <p className="text-gray-400 text-xs mt-0.5">{item.desc}</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={settings?.[item.key] ?? true}
            onChange={e => onToggle(item.key, e.target.checked)}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:bg-primary transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
        </label>
      </div>
    ))}
  </div>
)
