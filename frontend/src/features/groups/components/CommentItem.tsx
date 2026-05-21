import React, { useState } from 'react'
import { format } from 'date-fns'
import { SmilePlus } from 'lucide-react'
import { initials, avatarGrad } from '@/utils/avatar.utils'
import { EmojiPickerPanel } from './EmojiPickerPanel'
import type { Comment } from '@/types/group.types'

interface Props {
  comment: Comment
  currentUserId?: string
  onReply: (commentId: string, userName: string) => void
  onToggleReact: (commentId: string, emoji: string) => void
  isReply?: boolean
}

function groupReactions(reactions: Comment['reactions'], currentUserId?: string) {
  const map: Record<string, { count: number; hasReacted: boolean }> = {}
  for (const r of reactions ?? []) {
    if (!map[r.emoji]) map[r.emoji] = { count: 0, hasReacted: false }
    map[r.emoji].count++
    if (r.userId === currentUserId) map[r.emoji].hasReacted = true
  }
  return Object.entries(map)
}

export const CommentItem: React.FC<Props> = ({
  comment, currentUserId, onReply, onToggleReact, isReply = false,
}) => {
  const [showPicker, setShowPicker] = useState(false)
  const grouped = groupReactions(comment.reactions, currentUserId)

  const handleEmojiSelect = (emoji: string) => {
    onToggleReact(comment.id, emoji)
    setShowPicker(false)
  }

  return (
    <div className={`${isReply ? 'ml-9 pl-3 border-l-2 border-gray-100 dark:border-white/[0.06]' : 'border-b border-gray-100 dark:border-white/[0.05] last:border-0'} py-2.5`}>
      <div className="grid grid-cols-[28px_1fr] gap-2.5 group/item">
        {comment.user.avatarUrl ? (
          <img src={comment.user.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5" />
        ) : (
          <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarGrad(comment.user.name)} flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5`}>
            {initials(comment.user.name)}
          </div>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs font-semibold text-gray-900 dark:text-[#f0eeff]">{comment.user.name}</span>
            <span className="text-[11px] font-mono text-gray-400 dark:text-[#6e6c93]">{format(new Date(comment.createdAt), 'HH:mm')}</span>
          </div>

          <p className="text-[13px] leading-relaxed text-gray-700 dark:text-[#d8d4ff] break-words m-0">{comment.content}</p>

          {grouped.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {grouped.map(([emoji, { count, hasReacted }]) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onToggleReact(comment.id, emoji)}
                  className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[12px] border transition-colors ${
                    hasReacted
                      ? 'bg-primary/10 border-primary/30 text-primary'
                      : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-[#a09ec8]'
                  }`}
                >
                  <span>{emoji}</span>
                  <span className="font-semibold ml-0.5">{count}</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 mt-1.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
            {!isReply && (
              <button type="button" onClick={() => onReply(comment.id, comment.user.name)}
                className="text-[11px] font-semibold text-gray-400 dark:text-[#6e6c93] hover:text-primary transition-colors">
                Reply
              </button>
            )}
            <button type="button" onClick={() => setShowPicker(v => !v)}
              className={`flex items-center gap-1 text-[11px] font-semibold transition-colors ${showPicker ? 'text-primary' : 'text-gray-400 dark:text-[#6e6c93] hover:text-primary'}`}>
              <SmilePlus className="w-3.5 h-3.5" />
              React
            </button>
          </div>

          {showPicker && (
            <div className="mt-2">
              <EmojiPickerPanel onSelect={handleEmojiSelect} />
            </div>
          )}
        </div>
      </div>

      {comment.replies?.map(reply => (
        <CommentItem key={reply.id} comment={reply} currentUserId={currentUserId}
          onReply={onReply} onToggleReact={onToggleReact} isReply />
      ))}
    </div>
  )
}
