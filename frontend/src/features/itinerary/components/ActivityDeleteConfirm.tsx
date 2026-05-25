import React from 'react'
import { Trash2 } from 'lucide-react'

interface Props {
  isPending: boolean
  onConfirm: () => void
  onCancel: () => void
  onRequestConfirm: () => void
  confirmState: 'idle' | 'confirming'
}

export const ActivityDeleteConfirm: React.FC<Props> = ({
  isPending,
  onConfirm,
  onCancel,
  onRequestConfirm,
  confirmState,
}) => {
  if (confirmState === 'confirming') return (
    <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg px-2 py-1">
      <span className="text-xs font-bold text-red-600">Sure?</span>
      <button
        onClick={onConfirm}
        disabled={isPending}
        className="text-xs font-black text-red-600 hover:text-red-700 disabled:opacity-50"
      >
        {isPending ? '...' : 'Yes'}
      </button>
      <button onClick={onCancel} className="text-xs font-bold text-gray-500 hover:text-gray-700">
        No
      </button>
    </div>
  )

  return (
    <button
      onClick={onRequestConfirm}
      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-300 dark:text-slate-600 hover:text-red-500 transition-colors"
      title="Delete activity"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
}
