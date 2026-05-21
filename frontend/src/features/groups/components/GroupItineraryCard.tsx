import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { groupsApi } from '@/api/groups.api'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { ROUTES } from '@/constants/routes'
import { differenceInDays } from 'date-fns'
import { Calendar, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import { getTravelTypeByValue } from '@/constants/travelTypes'
import { initials, avatarGrad } from '@/utils/avatar.utils'
import { VoteWidget } from './VoteWidget'
import type { GroupItinerary } from '@/types/group.types'

const THUMB_GRADIENTS = [
  'bg-gradient-to-br from-cyan-500 to-blue-800',
  'bg-gradient-to-br from-cyan-400 to-emerald-500',
  'bg-gradient-to-br from-rose-500 to-purple-600',
  'bg-gradient-to-br from-amber-400 to-orange-500',
  'bg-gradient-to-br from-amber-500 to-red-500',
]

function timeAgo(dateStr: string) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return '1 day ago'
  if (days < 7) return `${days} days ago`
  return `${Math.floor(days / 7)}w ago`
}

interface Props {
  groupItinerary: GroupItinerary
  index: number
  currentUserId?: string
}

export const GroupItineraryCard: React.FC<Props> = ({ groupItinerary, index, currentUserId }) => {
  const navigate = useNavigate()
  const { id: groupId } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { itinerary, score, votes } = groupItinerary

  const myVote = votes?.find(v => v.userId === currentUserId)
  const userVote = myVote?.voteType ?? null
  const upvoters = votes?.filter(v => v.voteType === 'UPVOTE') ?? []

  const days = differenceInDays(new Date(itinerary.endDate), new Date(itinerary.startDate)) + 1
  const thumbCls = THUMB_GRADIENTS[index % THUMB_GRADIENTS.length]
  const travelType = getTravelTypeByValue(itinerary.travelType)
  const emoji = travelType?.icon ?? '📍'

  const voteMutation = useMutation({
    mutationFn: (voteType: 'UPVOTE' | 'DOWNVOTE') =>
      groupsApi.vote(groupId!, groupItinerary.id, voteType),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.group(groupId!) }),
    onError: () => toast.error('Failed to register vote'),
  })

  return (
    <div
      className="grp-panel grp-it-card grid grid-cols-[96px_1fr_auto] gap-[18px] items-center rounded-[18px] p-[18px] border border-gray-200 dark:border-white/[0.07]"
      onClick={() => navigate(`${ROUTES.ITINERARY(itinerary.id)}?groupId=${groupId}`)}
    >
      {/* Thumb */}
      <div className={`${thumbCls} w-24 h-24 rounded-2xl flex items-center justify-center text-4xl shrink-0 border border-gray-200 dark:border-white/[0.07]`}>
        {emoji}
      </div>

      {/* Body */}
      <div className="min-w-0">
        {/* Author row */}
        <div className="flex items-center gap-2 mb-1.5">
          {itinerary.user?.avatarUrl ? (
            <img src={itinerary.user.avatarUrl} alt="" className="w-[22px] h-[22px] rounded-full object-cover shrink-0" />
          ) : (
            <div className={`w-[22px] h-[22px] rounded-full bg-gradient-to-br ${avatarGrad(itinerary.user?.name ?? 'U')} flex items-center justify-center text-[8px] font-bold text-white shrink-0`}>
              {initials(itinerary.user?.name ?? 'U')}
            </div>
          )}
          <span className="text-xs font-medium text-gray-500 dark:text-[#a3a1c8]">{itinerary.user?.name ?? 'Unknown'}</span>
          <span className="text-[11px] text-gray-400 dark:text-[#6e6c93] font-mono">· {timeAgo(groupItinerary.addedAt)}</span>
        </div>

        {/* Title */}
        <div className="text-lg font-semibold tracking-[-0.015em] text-gray-900 dark:text-[#f0eeff] mb-1.5 truncate">
          {itinerary.destination}
        </div>

        {/* Tags */}
        <div className="flex gap-2 flex-wrap mb-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-gray-500 dark:text-[#a3a1c8] bg-gray-100/60 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.07] px-2 py-1 rounded-[7px]">
            <Calendar size={10} strokeWidth={1.8} /> {days} days
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-gray-500 dark:text-[#a3a1c8] bg-gray-100/60 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.07] px-2 py-1 rounded-[7px]">
            <MapPin size={10} strokeWidth={1.8} /> {itinerary.destination}
          </span>
        </div>

        {/* Voter avatars */}
        {upvoters.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex">
              {upvoters.slice(0, 4).map((v, i) => (
                <div
                  key={v.id}
                  className={`w-[18px] h-[18px] rounded-full bg-gradient-to-br ${avatarGrad(v.user.name)} border-[1.5px] border-gray-100 dark:border-[#0f1022] flex items-center justify-center text-[7px] font-bold text-white${i === 0 ? '' : ' -ml-1.5'}`}
                >
                  {initials(v.user.name)}
                </div>
              ))}
              {upvoters.length > 4 && (
                <div className="w-[18px] h-[18px] rounded-full bg-gray-200/60 dark:bg-white/[0.08] border-[1.5px] border-gray-100 dark:border-[#0f1022] flex items-center justify-center text-[8px] text-gray-500 dark:text-[#a3a1c8] -ml-1.5">
                  +{upvoters.length - 4}
                </div>
              )}
            </div>
            <span className="text-[11px] text-gray-500 dark:text-[#a3a1c8]">{upvoters.length} voted</span>
          </div>
        )}
      </div>

      <VoteWidget
        score={score}
        userVote={userVote}
        isPending={voteMutation.isPending}
        onVote={dir => voteMutation.mutate(dir)}
      />
    </div>
  )
}
