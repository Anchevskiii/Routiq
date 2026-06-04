import React, { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { groupsApi } from '@/api/groups.api'
import { Send, Smile, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/app/Providers'
import { initials, avatarGrad } from '@/utils/avatar.utils'
import { CommentItem } from './CommentItem'
import { EmojiPickerPanel } from './EmojiPickerPanel'
import type { Comment, CommentReaction } from '@/types/group.types'

interface Props {
  groupId: string
}

export const GroupComments: React.FC<Props> = ({ groupId }) => {
  const [content, setContent] = useState('')
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null)
  const [showInputEmoji, setShowInputEmoji] = useState(false)
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: comments, isLoading } = useQuery({
    queryKey: ['group-comments', groupId],
    queryFn: () => groupsApi.getComments(groupId),
  })

  const commentMutation = useMutation({
    mutationFn: ({ text, parentId }: { text: string; parentId?: string }) =>
      groupsApi.addComment(groupId, text, parentId),
    onMutate: async ({ text, parentId }) => {
      await queryClient.cancelQueries({ queryKey: ['group-comments', groupId] })
      const previousComments = queryClient.getQueryData<Comment[]>(['group-comments', groupId])

      const newComment: Comment = {
        id: `temp-${Date.now()}`,
        groupId,
        userId: user?.id ?? '',
        parentId,
        content: text,
        createdAt: new Date().toISOString(),
        user: {
          id: user?.id ?? '',
          name: user?.name ?? 'Me',
          avatarUrl: user?.avatarUrl,
        },
        replies: [],
        reactions: [],
      }

      queryClient.setQueryData<Comment[]>(['group-comments', groupId], (old) => {
        if (!old) return [newComment]
        if (parentId) {
          return old.map(c => {
            if (c.id === parentId) {
              return { ...c, replies: [...(c.replies ?? []), newComment] }
            }
            return c
          })
        }
        return [...old, newComment]
      })

      setContent('')
      setReplyTo(null)

      return { previousComments }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(['group-comments', groupId], context.previousComments)
      }
      toast.error('Failed to add comment')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['group-comments', groupId] })
    },
  })

  const reactionMutation = useMutation({
    mutationFn: ({ commentId, emoji }: { commentId: string; emoji: string }) =>
      groupsApi.toggleReaction(groupId, commentId, emoji),
    onMutate: async ({ commentId, emoji }) => {
      await queryClient.cancelQueries({ queryKey: ['group-comments', groupId] })
      const previousComments = queryClient.getQueryData<Comment[]>(['group-comments', groupId])

      queryClient.setQueryData<Comment[]>(['group-comments', groupId], (old) => {
        if (!old) return []

        const updateCommentReactions = (c: Comment): Comment => {
          if (c.id !== commentId) {
            if (c.replies?.length) {
              return { ...c, replies: c.replies.map(updateCommentReactions) }
            }
            return c
          }

          const existingReactions = c.reactions ?? []
          const userReactionIdx = existingReactions.findIndex(
            (r: CommentReaction) => r.emoji === emoji && r.userId === user?.id
          )

          const newReactions = [...existingReactions]
          if (userReactionIdx > -1) {
            newReactions.splice(userReactionIdx, 1)
          } else {
            newReactions.push({ emoji, userId: user?.id ?? '' })
          }

          return { ...c, reactions: newReactions }
        }

        return old.map(updateCommentReactions)
      })

      return { previousComments }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(['group-comments', groupId], context.previousComments)
      }
      toast.error('Failed to update reaction')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['group-comments', groupId] })
    },
  })

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [comments])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    commentMutation.mutate({ text: content, parentId: replyTo?.id })
  }

  const handleReply = (commentId: string, userName: string) => {
    setReplyTo({ id: commentId, name: userName })
    inputRef.current?.focus()
  }

  const handleInputEmoji = (emoji: string) => {
    setContent(v => v + emoji)
    setShowInputEmoji(false)
    inputRef.current?.focus()
  }

  return (
    <>
      <div ref={listRef} className="px-3.5 pt-2.5 pb-1 max-h-80 overflow-y-auto">
        {isLoading ? (
          <p className="py-5 text-center text-xs text-gray-400 dark:text-[#6e6c93]">Loading…</p>
        ) : !comments?.length ? (
          <p className="py-6 text-center text-xs text-gray-400 dark:text-[#6e6c93]">No messages yet. Start the conversation!</p>
        ) : (
          comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={user?.id}
              onReply={handleReply}
              onToggleReact={(commentId, emoji) => reactionMutation.mutate({ commentId, emoji })}
            />
          ))
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-gray-200 dark:border-white/[0.07] px-3.5 py-3 bg-gray-50 dark:bg-black/[0.15]"
      >
        {replyTo && (
          <div className="flex items-center gap-1.5 mb-2 px-1">
            <span className="text-[11px] text-gray-400 dark:text-[#6e6c93]">Replying to <strong className="text-gray-700 dark:text-[#d8d4ff]">{replyTo.name}</strong></span>
            <button type="button" onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {showInputEmoji && (
          <div className="mb-2">
            <EmojiPickerPanel onSelect={handleInputEmoji} />
          </div>
        )}

        <div className="flex items-center gap-2.5">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
          ) : (
            <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarGrad(user?.name ?? 'Me')} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
              {initials(user?.name ?? 'Me')}
            </div>
          )}
          <input
            ref={inputRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={replyTo ? `Reply to ${replyTo.name}…` : 'Write a message…'}
            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-[#f0eeff] text-[13px] placeholder:text-gray-400 dark:placeholder:text-[#6e6c93]"
          />
          <button
            type="button"
            onClick={() => setShowInputEmoji(v => !v)}
            className={`transition-colors ${showInputEmoji ? 'text-primary' : 'text-gray-400 dark:text-[#6e6c93] hover:text-primary'}`}
          >
            <Smile className="w-4 h-4" />
          </button>
          <button
            type="submit"
            disabled={!content.trim() || commentMutation.isPending}
            className="w-[30px] h-[30px] rounded-[9px] grp-aurora flex items-center justify-center border-none cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Send size={13} className="text-white" />
          </button>
        </div>
      </form>
    </>
  )
}
