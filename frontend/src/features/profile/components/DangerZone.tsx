import React from 'react'
import { Trash2 } from 'lucide-react'

interface Props {
  isDeleting: boolean
  onDelete: () => void
}

export const DangerZone: React.FC<Props> = ({ isDeleting, onDelete }) => (
  <div className="rounded-[22px] border border-red-200/60 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 p-6">
    <div className="flex items-start gap-4 mb-5">
      <div className="w-9 h-9 flex items-center justify-center rounded-[10px] bg-red-100 dark:bg-red-900/30 text-red-500 shrink-0 mt-0.5">
        <Trash2 className="w-4 h-4" />
      </div>
      <div>
        <p className="text-[11px] font-mono uppercase tracking-[0.1em] text-red-400 mb-1">Danger Zone</p>
        <p className="text-sm text-red-600/80 dark:text-red-400/70">Once you delete your account, there is no going back.</p>
      </div>
    </div>
    <button
      onClick={() => {
        if (window.confirm('Are you sure? This action cannot be undone.')) onDelete()
      }}
      disabled={isDeleting}
      className="px-5 py-[11px] border-[1.5px] border-red-300 dark:border-red-900/60 text-red-600 dark:text-red-400 text-sm font-semibold rounded-[12px] hover:bg-red-100 dark:hover:bg-red-900/20 transition-all disabled:opacity-50"
    >
      {isDeleting ? 'Deleting…' : 'Delete Account'}
    </button>
  </div>
)
