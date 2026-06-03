import React from 'react'
import { GroupItineraryCard } from './GroupItineraryCard'
import type { GroupItinerary, GroupRole } from '@/types/group.types'

const ROLE_LABELS: Record<GroupRole, string> = { OWNER: 'Owner', ADMIN: 'Admin', MODERATOR: 'Moderator', MEMBER: 'Member' }

interface Props {
  itineraries: GroupItinerary[]
  currentUserRole: GroupRole
  currentUserId?: string
  toastDismissed: boolean
  onDismissToast: () => void
  onAddItinerary: () => void
}

export const GroupItinerariesTab: React.FC<Props> = ({
  itineraries, currentUserRole, currentUserId, toastDismissed, onDismissToast, onAddItinerary,
}) => (
  <>
    <div className="flex items-center gap-3 mb-3.5">
      <h2 className="m-0 text-base font-semibold text-gray-900 dark:text-[#f0eeff] tracking-tight">Group itineraries</h2>
      <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-[#a3a1c8] bg-gray-100 dark:bg-white/[0.04] border border-dashed border-gray-300 dark:border-white/[0.14] px-2.5 py-1.5 rounded-full whitespace-nowrap">
        You're a <strong className="text-gray-900 dark:text-[#f0eeff] font-semibold ml-0.5">{ROLE_LABELS[currentUserRole]}</strong>
      </span>
      {/* Top voted button removed */}
    </div>

    {!toastDismissed && (
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-blue-50 dark:bg-[rgba(59,130,246,0.06)] border border-blue-200 dark:border-[rgba(59,130,246,0.18)] text-gray-700 dark:text-[#d8d4ff] text-[12.5px] leading-relaxed mb-3.5">
        <span className="text-[10px] font-mono font-semibold text-blue-600 bg-blue-100 dark:bg-[rgba(59,130,246,0.12)] border border-blue-200 dark:border-[rgba(59,130,246,0.25)] px-1.5 py-1 rounded uppercase tracking-widest shrink-0">
          Shared data
        </span>
        <span>Edits update the underlying trip data — changes affect anyone they're shared with.</span>
        <button onClick={onDismissToast} className="ml-auto cursor-pointer text-gray-400 hover:text-gray-600 dark:text-[#6e6c93] dark:hover:text-[#f0eeff] text-base leading-none border-none bg-transparent shrink-0">×</button>
      </div>
    )}

    {itineraries.length === 0 ? (
      <div className="grp-panel rounded-[18px] border border-gray-200 dark:border-white/[0.07] px-6 py-12 text-center">
        <div className="text-4xl mb-3">🗺️</div>
        <h3 className="m-0 mb-2 text-base font-semibold text-gray-900 dark:text-[#f0eeff]">No itineraries yet</h3>
        <p className="m-0 mb-5 text-sm text-gray-400 dark:text-[#6e6c93]">Start collaborating by adding the first itinerary.</p>
        <button onClick={onAddItinerary} className="grp-aurora px-5 py-2.5 rounded-[11px] border-none text-white text-[13px] font-semibold cursor-pointer">
          Add Itinerary
        </button>
      </div>
    ) : (
      <div className="flex flex-col gap-3.5">
        {itineraries.map((gi, i) => (
          <GroupItineraryCard key={gi.id} groupItinerary={gi} index={i} currentUserId={currentUserId} />
        ))}
      </div>
    )}
  </>
)
