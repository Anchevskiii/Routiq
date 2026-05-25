import React from 'react'

interface Props {
  editTime: string
  editDuration: string
  isPending: boolean
  onTimeChange: (v: string) => void
  onDurationChange: (v: string) => void
  onSave: () => void
  onCancel: () => void
}

export const ActivityEditForm: React.FC<Props> = ({
  editTime,
  editDuration,
  isPending,
  onTimeChange,
  onDurationChange,
  onSave,
  onCancel,
}) => (
  <div className="flex flex-wrap items-end gap-3 mb-3 p-3 bg-gray-50 dark:bg-slate-800/40 rounded-xl border border-gray-100 dark:border-slate-700">
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Start Time</label>
      <input
        type="time"
        value={editTime}
        onChange={e => onTimeChange(e.target.value)}
        className="text-sm font-bold text-gray-900 dark:text-blue-300 bg-white dark:bg-[#1e1b38] border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary"
      />
    </div>
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Duration (min)</label>
      <input
        type="number"
        min={5}
        step={5}
        value={editDuration}
        onChange={e => onDurationChange(e.target.value)}
        className="w-24 text-sm font-bold text-gray-900 dark:text-blue-300 bg-white dark:bg-[#1e1b38] border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary"
      />
    </div>
    <button
      onClick={onSave}
      disabled={isPending}
      className="px-4 py-1.5 bg-primary text-white text-xs font-black rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
    >
      {isPending ? 'Saving…' : 'Save'}
    </button>
    <button
      onClick={onCancel}
      className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
    >
      Cancel
    </button>
  </div>
)
