import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { groupsApi } from '@/api/groups.api'
import { Send, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface Props {
  groupId: string
}

export const GroupComments: React.FC<Props> = ({ groupId }) => {
  const [content, setContent] = useState('')
  const queryClient = useQueryClient()

  const { data: comments, isLoading } = useQuery({
    queryKey: ['group-comments', groupId],
    queryFn: () => groupsApi.getComments(groupId),
  })

  const commentMutation = useMutation({
    mutationFn: (text: string) => groupsApi.addComment(groupId, text),
    onSuccess: () => {
      setContent('')
      queryClient.invalidateQueries({ queryKey: ['group-comments', groupId] })
      toast.success('Comment added')
    },
    onError: () => toast.error('Failed to add comment'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    commentMutation.mutate(content)
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-8 border-b border-gray-50 flex items-center gap-3">
        <MessageCircle className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold text-gray-900">Group Discussion</h2>
      </div>

      <div className="p-8 space-y-6 max-h-[500px] overflow-y-auto bg-gray-50/30">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-2xl" />
            ))}
          </div>
        ) : !comments || comments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 font-medium">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                {comment.user.avatarUrl 
                  ? <img src={comment.user.avatarUrl} alt={comment.user.name} className="w-full h-full object-cover" />
                  : <span className="text-xs font-bold text-gray-400">{comment.user.name.charAt(0)}</span>
                }
              </div>
              <div className="flex-1">
                <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-black text-gray-900">{comment.user.name}</span>
                    <span className="text-[10px] text-gray-400 font-bold">{format(new Date(comment.createdAt), 'HH:mm')}</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{comment.content}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 bg-white border-t border-gray-50 flex gap-4">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-6 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/5 outline-none transition-all"
        />
        <button
          type="submit"
          disabled={!content.trim() || commentMutation.isPending}
          className="p-3 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  )
}
