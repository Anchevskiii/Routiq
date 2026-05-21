import React, { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { groupsApi } from '@/api/groups.api'
import { Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { useAuth } from '@/app/Providers'
import { initials, avatarGrad } from '@/utils/avatar.utils'

interface Props {
  groupId: string
}

export const GroupComments: React.FC<Props> = ({ groupId }) => {
  const [content, setContent] = useState('')
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const listRef = useRef<HTMLDivElement>(null)

  const { data: comments, isLoading } = useQuery({
    queryKey: ['group-comments', groupId],
    queryFn: () => groupsApi.getComments(groupId),
  })

  const commentMutation = useMutation({
    mutationFn: (text: string) => groupsApi.addComment(groupId, text),
    onSuccess: () => {
      setContent('')
      queryClient.invalidateQueries({ queryKey: ['group-comments', groupId] })
    },
    onError: () => toast.error('Failed to add comment'),
  })

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [comments])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    commentMutation.mutate(content)
  }

  return (
    <>
      <div ref={listRef} className="px-3.5 pt-2.5 pb-1 max-h-80 overflow-y-auto">
        {isLoading ? (
          <p className="py-5 text-center text-xs text-gray-400 dark:text-[#6e6c93]">Loading…</p>
        ) : !comments || comments.length === 0 ? (
          <p className="py-6 text-center text-xs text-gray-400 dark:text-[#6e6c93]">No messages yet. Start the conversation!</p>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="grp-comment grid grid-cols-[28px_1fr] gap-2.5 py-2.5">
              {comment.user.avatarUrl ? (
                <img src={comment.user.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
              ) : (
                <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarGrad(comment.user.name)} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
                  {initials(comment.user.name)}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                  <span className="text-xs font-semibold text-gray-900 dark:text-[#f0eeff]">{comment.user.name}</span>
                  <span className="text-[11px] font-mono text-gray-400 dark:text-[#6e6c93]">{format(new Date(comment.createdAt), 'HH:mm')}</span>
                </div>
                <p className="text-[13px] leading-relaxed text-gray-700 dark:text-[#d8d4ff] break-words m-0">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-gray-200 dark:border-white/[0.07] px-3.5 py-3 flex items-center gap-2.5 bg-gray-50 dark:bg-black/[0.15]"
      >
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
        ) : (
          <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarGrad(user?.name ?? 'Me')} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
            {initials(user?.name ?? 'Me')}
          </div>
        )}
        <input
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Write a comment… use @ to tag"
          className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-[#f0eeff] text-[13px] placeholder:text-gray-400 dark:text-[#6e6c93]"
        />
        <button
          type="submit"
          disabled={!content.trim() || commentMutation.isPending}
          className="w-[30px] h-[30px] rounded-[9px] grp-aurora flex items-center justify-center border-none cursor-pointer disabled:opacity-50 shrink-0"
        >
          <Send size={13} className="text-white" />
        </button>
      </form>
    </>
  )
}
