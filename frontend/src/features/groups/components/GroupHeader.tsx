import React from 'react'
import { format } from 'date-fns'
import { Sparkles, Plus, Lock, Settings, Users } from 'lucide-react'
import type { Group, GroupRole } from '@/types/group.types'
import { initials, avatarGrad } from '@/utils/avatar.utils'

const ROLE_LABELS: Record<GroupRole, string> = { OWNER: 'Owner', ADMIN: 'Admin', MODERATOR: 'Moderator', MEMBER: 'Member' }

interface Props {
  group: Group
  onImport: () => void
  onGenerate: () => void
  onSettings: () => void
}

export const GroupHeader: React.FC<Props> = ({ group, onImport, onGenerate, onSettings }) => (
  <div className="grp-panel rounded-[22px] overflow-hidden mb-[22px] border border-gray-200 dark:border-white/[0.07]">
    {/* Cover */}
    {group.imageUrl ? (
      <div
        className="h-[180px] relative overflow-hidden"
        style={{ backgroundImage: `url(${group.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
    ) : (
      <div
        className={`h-[180px]${!group.themeColor ? ' grp-cover' : ''}`}
        style={group.themeColor ? { background: `linear-gradient(135deg, ${group.themeColor}cc, ${group.themeColor}88)` } : undefined}
      />
    )}

    {/* Body */}
    <div className="px-[26px] pt-[18px] pb-[22px] flex items-center gap-[22px] flex-wrap">
      {/* Floating icon */}
      <div
        className={`w-16 h-16 rounded-[18px] grid place-items-center -mt-12 shrink-0 border-[3px] border-gray-100 dark:border-[#161830] shadow-[0_12px_28px_-6px_rgba(37,99,235,0.6)]${!group.themeColor ? ' grp-aurora' : ''}`}
        style={group.themeColor ? { background: group.themeColor } : undefined}
      >
        <Users size={28} className="text-white" />
      </div>

      <div className="flex-1 min-w-[240px]">
        <div className="flex items-baseline gap-3 flex-wrap mb-1.5">
          <h1 className="m-0 text-[30px] font-medium text-gray-900 dark:text-[#f0eeff] tracking-tight">{group.name}</h1>
          <span className="inline-flex items-center gap-1 text-[10px] font-mono tracking-widest uppercase text-[#3b82f6] bg-[rgba(59,130,246,0.12)] px-[9px] py-1 rounded-full border border-[rgba(59,130,246,0.2)]">
            <Lock size={10} /> Private
          </span>
        </div>
        <div className="flex items-center gap-3.5 text-sm text-gray-500 dark:text-[#a3a1c8] flex-wrap">
          <span>{group.members.length} members · {group.itineraries?.length ?? 0} itineraries</span>
          <span className="w-1 h-1 rounded-full bg-[#6e6c93] inline-block" />
          <span>Created {format(new Date(group.createdAt), 'MMM yyyy')}</span>
          {group.description && (
            <>
              <span className="w-1 h-1 rounded-full bg-[#6e6c93] inline-block" />
              <span>{group.description}</span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 items-center flex-wrap">
        {/* Avatar stack */}
        <div className="flex mr-1">
          {group.members.slice(0, 5).map((m, i) => (
            <div
              key={m.id}
              title={`${m.user.name} (${ROLE_LABELS[m.role]})`}
              className={`w-[30px] h-[30px] rounded-full border-2 border-gray-100 dark:border-[#161830] ${m.user.avatarUrl ? '' : `bg-gradient-to-br ${avatarGrad(m.user.name)}`} grid place-items-center text-[10px] font-bold text-white overflow-hidden${i === 0 ? '' : ' -ml-2'}`}
            >
              {m.user.avatarUrl
                ? <img src={m.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                : initials(m.user.name)
              }
            </div>
          ))}
          {group.members.length > 5 && (
            <div className="w-[30px] h-[30px] rounded-full border-2 border-gray-100 dark:border-[#161830] bg-gray-200/60 dark:bg-white/[0.08] grid place-items-center text-[10px] text-gray-500 dark:text-[#a3a1c8] -ml-2">
              +{group.members.length - 5}
            </div>
          )}
        </div>

        <GhostBtn icon={<Plus size={13} />}     label="Import itinerary" onClick={onImport} />
        <GhostBtn icon={<Settings size={13} />} label="Settings"         onClick={onSettings} />
        <button
          onClick={onGenerate}
          className="grp-aurora inline-flex items-center gap-1.5 px-[13px] py-[9px] rounded-[11px] border-none text-white text-[13px] font-medium cursor-pointer shadow-[0_8px_22px_-8px_rgba(37,99,235,0.6)] hover:-translate-y-px transition-transform"
        >
          <Sparkles size={13} /> Generate AI itinerary
        </button>
      </div>
    </div>
  </div>
)

function GhostBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-[13px] py-[9px] rounded-[11px] text-[13px] font-medium cursor-pointer border border-gray-200 dark:border-white/[0.07] bg-gray-100/50 dark:bg-white/[0.03] text-gray-500 dark:text-[#a3a1c8] hover:text-[#f0eeff] hover:bg-gray-200/50 dark:bg-white/[0.06] hover:border-gray-300 dark:border-white/[0.14] transition-colors"
    >
      {icon} {label}
    </button>
  )
}
