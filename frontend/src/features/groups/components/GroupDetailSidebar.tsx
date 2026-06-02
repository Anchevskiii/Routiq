import React, { useState } from 'react'
import { Users, MessageSquare, Plus, Trash2 } from 'lucide-react'
import { GroupComments } from './GroupComments'
import { RailBlock } from './RailBlock'
import type { GroupMember, GroupRole } from '@/types/group.types'
import { initials, avatarGrad } from '@/utils/avatar.utils'

const ROLE_LABELS: Record<GroupRole, string> = { OWNER: 'Owner', ADMIN: 'Admin', MODERATOR: 'Mod', MEMBER: 'Member' }
const ROLE_CLS: Record<GroupRole, string>    = { OWNER: 'grp-role-owner', ADMIN: 'grp-role-admin', MODERATOR: 'grp-role-mod', MEMBER: 'grp-role-member' }

interface Props {
  groupId: string
  members: GroupMember[]
  currentUserRole: GroupRole
  inviteEmail: string
  isInviting: boolean
  isRemoving: boolean
  onEmailChange: (v: string) => void
  onInvite: () => void
  onRemoveMember: (userId: string) => void
}

export const GroupDetailSidebar: React.FC<Props> = ({
  groupId, members, currentUserRole,
  inviteEmail, isInviting, onEmailChange, onInvite, onRemoveMember,
}) => {
  const [membersOpen, setMembersOpen]   = useState(true)
  const [commentsOpen, setCommentsOpen] = useState(true)
  const [showInvite, setShowInvite]     = useState(false)
  const [inviteError, setInviteError]   = useState<string | null>(null)

  const canManage = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN'
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleInvite = () => {
    const trimmed = inviteEmail.trim()
    if (!trimmed) {
      setInviteError('Email is required')
      return
    }
    if (!isValidEmail(trimmed)) {
      setInviteError('Enter a valid email')
      return
    }
    setInviteError(null)
    onInvite()
  }

  return (
    <div className="flex flex-col gap-3.5">
      {/* Members */}
      <RailBlock
        icon={<Users size={14} />}
        title="Members"
        count={members.length}
        open={membersOpen}
        onToggle={() => setMembersOpen(v => !v)}
        foot={canManage ? (
          showInvite ? (
            <>
              <div className="flex gap-2 px-3.5 py-2.5 border-t border-gray-200 dark:border-white/[0.07]">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => {
                    onEmailChange(e.target.value)
                    if (inviteError) setInviteError(null)
                  }}
                  onKeyDown={e => e.key === 'Enter' && handleInvite()}
                  placeholder="Email address"
                  className="flex-1 bg-gray-100/60 dark:bg-white/[0.04] border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-gray-900 dark:text-[#f0eeff] text-xs outline-none placeholder:text-gray-400 dark:text-[#6e6c93]"
                />
                <button
                  onClick={handleInvite}
                  disabled={!inviteEmail || isInviting}
                  className="px-3 py-1.5 rounded-lg border-none grp-aurora text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {isInviting ? '…' : 'Send'}
                </button>
              </div>
              {inviteError && (
                <p className="px-3.5 pb-2 text-[11px] text-red-400">
                  {inviteError}
                </p>
              )}
            </>
          ) : (
            <button
              onClick={() => setShowInvite(true)}
              className="w-full flex items-center gap-2 px-4 py-2.5 border-t border-gray-200 dark:border-white/[0.07] bg-transparent border-x-0 border-b-0 text-[#3b82f6] text-xs font-medium cursor-pointer hover:bg-[rgba(59,130,246,0.06)] transition-colors"
            >
              <Plus size={14} /> Invite to group
            </button>
          )
        ) : undefined}
      >
        <div className="p-2 pb-2.5">
          {members.map(m => (
            <div key={m.id} className="grp-member-row flex items-center gap-2.5 px-2.5 py-2 rounded-[10px]">
              <div className="relative shrink-0">
                {m.user.avatarUrl ? (
                  <img src={m.user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarGrad(m.user.name)} flex items-center justify-center text-[11px] font-bold text-white`}>
                    {initials(m.user.name)}
                  </div>
                )}
                {m.status === 'ACCEPTED' && (
                  <span className="absolute -right-px -bottom-px w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-gray-100 dark:border-[#161830] shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                )}
                {m.status === 'PENDING' && (
                  <span className="absolute -right-px -bottom-px w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-gray-100 dark:border-[#161830]" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap text-[13px] font-medium text-gray-900 dark:text-[#f0eeff]">
                  {m.user.name}
                  <span className={`grp-role-owner grp-role-admin grp-role-mod grp-role-member ${ROLE_CLS[m.role]} text-[9px] font-mono px-1.5 py-0.5 rounded-[5px] uppercase tracking-widest ml-1.5 inline-block`}>
                    {ROLE_LABELS[m.role]}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 dark:text-[#6e6c93] mt-0.5 truncate m-0">
                  {m.status === 'PENDING' ? 'Invitation pending' : m.user.email}
                </p>
              </div>

              {canManage && m.role !== 'OWNER' && (
                <button
                  onClick={() => onRemoveMember(m.userId)}
                  className="w-6 h-6 grid place-items-center rounded-md border-none bg-transparent text-gray-400 dark:text-[#6e6c93] cursor-pointer hover:text-red-400 hover:bg-red-500/[0.1] transition-colors shrink-0"
                  title="Remove member"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      </RailBlock>

      {/* Discussion */}
      <RailBlock
        icon={<MessageSquare size={14} />}
        title="Discussion"
        open={commentsOpen}
        onToggle={() => setCommentsOpen(v => !v)}
      >
        <GroupComments groupId={groupId} />
      </RailBlock>
    </div>
  )
}
