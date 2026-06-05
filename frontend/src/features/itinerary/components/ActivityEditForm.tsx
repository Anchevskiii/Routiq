import React from 'react'
import { TimeSelect } from '@/components/ui/TimeSelect'
import { DurationSelect } from '@/components/ui/DurationSelect'

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
  <div className="mb-3 p-4 bg-gray-50 dark:bg-slate-800/40 rounded-xl border border-gray-100 dark:border-slate-700 space-y-3">
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="edit-starttime" className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Start Time</label>
        <TimeSelect id="edit-starttime" value={editTime} onChange={onTimeChange} placeholder="Not set" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="edit-duration" className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Duration</label>
        <DurationSelect id="edit-duration" value={editDuration} onChange={onDurationChange} />
      </div>
    </div>
    <div className="flex gap-2 pt-1">
      <button
        onClick={onSave}
        disabled={isPending}
        className="flex-1 py-2 bg-primary text-white text-xs font-black rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {isPending ? 'Saving…' : 'Save'}
      </button>
      <button
        onClick={onCancel}
        className="px-4 py-2 text-xs font-bold text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
      >
        Cancel
      </button>
    </div>
  </div>
)
