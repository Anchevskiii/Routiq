import React from 'react'
import { Shield, Mail, Trash2 } from 'lucide-react'
import type { GroupMember } from '@/types/group.types'

interface Props {
  members: GroupMember[]
  inviteEmail: string
  isInviting: boolean
  isRemoving: boolean
  onEmailChange: (v: string) => void
  onInvite: () => void
  onRemoveMember: (userId: string) => void
}

export const GroupDetailSidebar: React.FC<Props> = ({
  members, inviteEmail, isInviting, onEmailChange, onInvite, onRemoveMember,
}) => (
  <div className="space-y-8">
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Invite Members</h3>
      <div className="space-y-4">
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="Email address"
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
          />
        </div>
        <p className="text-[10px] text-gray-400 italic">User must already have a Routiq account.</p>
        <button
          onClick={onInvite}
          disabled={!inviteEmail || isInviting}
          className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md"
        >
          {isInviting ? 'Sending...' : 'Send Invitation'}
        </button>
      </div>
    </div>

    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-8 border-b border-gray-50 flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">Members</h3>
        <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-lg font-bold">{members.length}</span>
      </div>
      <div className="divide-y divide-gray-50">
        {members.map((member) => (
          <div key={member.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border border-gray-200 shadow-inner">
                {member.user.avatarUrl
                  ? <img src={member.user.avatarUrl} alt={member.user.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400 uppercase">{member.user.name.charAt(0)}</div>
                }
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  {member.user.name}
                  {member.role === 'OWNER' && <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded font-black tracking-tighter">OWNER</span>}
                  {member.role === 'ADMIN' && <Shield className="w-3.5 h-3.5 text-primary" />}
                  {member.role === 'MODERATOR' && <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded font-bold">MOD</span>}
                </div>
                <div className="flex items-center gap-2">
                   <div className="text-xs text-gray-400 font-medium">{member.user.email}</div>
                   {member.status === 'PENDING' && <span className="text-[10px] bg-gray-100 text-gray-500 px-1 rounded animate-pulse font-bold">INVITED</span>}
                </div>
              </div>
            </div>
            {member.role !== 'OWNER' && (
              <button onClick={() => onRemoveMember(member.userId)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  </div>
)
