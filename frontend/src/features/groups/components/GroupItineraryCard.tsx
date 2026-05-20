import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { Calendar, User, ExternalLink, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { groupsApi } from '@/api/groups.api'
import { QUERY_KEYS } from '@/constants/queryKeys'
import toast from 'react-hot-toast'
import type { GroupItinerary } from '@/types/group.types'

interface Props {
  groupItinerary: GroupItinerary
}

export const GroupItineraryCard: React.FC<Props> = ({ groupItinerary }) => {
  const { itinerary, score } = groupItinerary
  const { id: groupId } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const voteMutation = useMutation({
    mutationFn: (voteType: 'UPVOTE' | 'DOWNVOTE') => 
      groupsApi.vote(groupId!, groupItinerary.id, voteType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.group(groupId!) })
    },
    onError: () => toast.error('Failed to register vote'),
  })

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
      <div className="p-8">
        <div className="flex justify-between items-start mb-6">
          <div className="flex gap-4">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-gray-100">
              📍
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{itinerary.destination}</h3>
              <div className="flex items-center text-sm text-gray-500 mt-1 gap-4">
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1 text-primary" />
                  {format(new Date(itinerary.startDate), 'MMM d')} – {format(new Date(itinerary.endDate), 'MMM d')}
                </span>
                <span className="flex items-center">
                  <User className="w-4 h-4 mr-1 text-primary" />
                  Added by {itinerary.user.name}
                </span>
              </div>
            </div>
          </div>
          <Link
            to={ROUTES.ITINERARY(itinerary.id)}
            className="p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-primary hover:bg-primary/10 transition-all"
          >
            <ExternalLink className="w-5 h-5" />
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-gray-50 rounded-2xl p-1 shadow-inner border border-gray-100">
            <button 
              onClick={() => voteMutation.mutate('UPVOTE')}
              disabled={voteMutation.isPending}
              className="p-3 hover:bg-white hover:text-primary hover:shadow-sm rounded-xl transition-all"
            >
              <ThumbsUp className="w-5 h-5" />
            </button>
            
            <div className={`px-4 font-black text-lg ${score >= 0 ? 'text-primary' : 'text-red-500'}`}>
              {score > 0 ? `+${score}` : score}
            </div>

            <button 
              onClick={() => voteMutation.mutate('DOWNVOTE')}
              disabled={voteMutation.isPending}
              className="p-3 hover:bg-white hover:text-red-500 hover:shadow-sm rounded-xl transition-all"
            >
              <ThumbsDown className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1" />

          <div className="flex items-center gap-2 px-6 py-3 bg-gray-50 rounded-2xl font-bold text-gray-400">
            <MessageSquare className="w-5 h-5" />
            <span>Discussion</span>
          </div>
        </div>
      </div>
    </div>
  )
}
