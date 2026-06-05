import React from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

interface Props {
  score: number
  userVote: 'UPVOTE' | 'DOWNVOTE' | null
  isPending: boolean
  onVote: (dir: 'UPVOTE' | 'DOWNVOTE') => void
  onRemoveVote?: () => void
}

export const VoteWidget: React.FC<Props> = ({ score, userVote, isPending, onVote, onRemoveVote }) => (
  <div
    className="flex flex-col items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.07] min-w-[82px] text-center"
  >
    <span className="grp-aurora-text text-[22px] font-semibold leading-none tracking-[-0.02em]">
      {score > 0 ? `+${score}` : score}
    </span>
    <span className="text-[10px] font-mono text-gray-400 dark:text-[#6e6c93] uppercase tracking-widest">Score</span>
    <div className="flex gap-1.5 mt-1">
      <button
        type="button"
        className={`grp-vote-btn w-[30px] h-[30px] rounded-lg border border-gray-200 dark:border-white/[0.07] bg-gray-100/50 dark:bg-white/[0.03] text-gray-400 dark:text-[#a3a1c8] grid place-items-center cursor-pointer ${userVote === 'UPVOTE' ? 'grp-vote-up-active' : ''}`}
        disabled={isPending}
        onClick={e => { e.stopPropagation(); userVote === 'UPVOTE' ? onRemoveVote?.() : onVote('UPVOTE'); }}
        title={userVote === 'UPVOTE' ? 'Remove vote' : 'Upvote'}
      >
        <ChevronUp size={14} strokeWidth={2.2} />
      </button>
      <button
        type="button"
        className={`grp-vote-btn w-[30px] h-[30px] rounded-lg border border-gray-200 dark:border-white/[0.07] bg-gray-100/50 dark:bg-white/[0.03] text-gray-400 dark:text-[#a3a1c8] grid place-items-center cursor-pointer ${userVote === 'DOWNVOTE' ? 'grp-vote-down-active' : ''}`}
        disabled={isPending}
        onClick={e => { e.stopPropagation(); userVote === 'DOWNVOTE' ? onRemoveVote?.() : onVote('DOWNVOTE'); }}
        title={userVote === 'DOWNVOTE' ? 'Remove vote' : 'Downvote'}
      >
        <ChevronDown size={14} strokeWidth={2.2} />
      </button>
    </div>
  </div>
)
