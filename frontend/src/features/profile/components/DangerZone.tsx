import React from 'react'
import { Trash2 } from 'lucide-react'

interface Props {
  isDeleting: boolean
  onDelete: () => void
}

export const DangerZone: React.FC<Props> = ({ isDeleting, onDelete }) => (
  <div className="bg-red-50 rounded-3xl border border-red-100 p-8">
    <div className="flex items-center gap-4 mb-4">
      <div className="p-3 bg-red-100 rounded-2xl text-red-600">
        <Trash2 className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-red-900">Danger Zone</h3>
        <p className="text-red-600/70 text-sm">Once you delete your account, there is no going back.</p>
      </div>
    </div>
    <button
      onClick={() => {
        if (window.confirm('Are you sure? This action cannot be undone.')) onDelete()
      }}
      disabled={isDeleting}
      className="px-6 py-3 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-all shadow-sm disabled:opacity-50"
    >
      {isDeleting ? 'Deleting...' : 'Delete Account'}
    </button>
  </div>
)
