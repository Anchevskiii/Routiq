import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { X, Settings, Users, AlertTriangle, Image as ImageIcon, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

import { groupsApi } from '@/api/groups.api'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/app/Providers'
import { THEME_COLORS } from './CreateGroupInfoStep'
import type { Group, GroupMember, GroupRole } from '@/types/group.types'

type Tab = 'general' | 'members' | 'danger'

interface Props {
  group: Group
  currentUserRole: GroupRole
  onClose: () => void
}

export const GroupSettingsModal: React.FC<Props> = ({ group, currentUserRole, onClose }) => {
  const [tab, setTab]             = useState<Tab>('general')
  const [name, setName]           = useState(group.name)
  const [desc, setDesc]           = useState(group.description ?? '')
  const [color, setColor]         = useState(group.themeColor ?? '#3b82f6')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(group.imageUrl ?? null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.group(group.id) })
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groups })
  }

  const updateMutation = useMutation({
    mutationFn: async () => {
      // Upload image via backend (bypasses Supabase RLS)
      if (imageFile) {
        await groupsApi.uploadGroupImage(group.id, imageFile)
      }
      // Update other fields (exclude imageUrl — upload handles it separately)
      return groupsApi.updateGroup(group.id, {
        name: name.trim(),
        description: desc.trim() || undefined,
        themeColor: color,
      })
    },
    onSuccess: () => { toast.success('Group updated'); invalidate() },
    onError: (err: unknown) => {
      const apiMsg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message
      const localMsg = (err as Error)?.message
      toast.error(apiMsg ?? localMsg ?? 'Failed to update group')
    },
  })

  const roleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      groupsApi.updateMemberRole(group.id, memberId, role),
    onSuccess: () => { toast.success('Role updated'); invalidate() },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message
      toast.error(msg ?? 'Failed to update role')
    },
  })

  const removeMutation = useMutation({
    mutationFn: (userId: string) => groupsApi.removeMember(group.id, userId),
    onSuccess: () => { toast.success('Member removed'); invalidate() },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message
      toast.error(msg ?? 'Failed to remove member')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => groupsApi.deleteGroup(group.id),
    onSuccess: () => {
      toast.success('Group deleted')
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groups })
      onClose()
      navigate(ROUTES.GROUPS)
    },
    onError: () => toast.error('Failed to delete group'),
  })

  // Role hierarchy: OWNER=4, ADMIN=3, MODERATOR=2, MEMBER=1
  const HIERARCHY: Record<GroupRole, number> = { OWNER: 4, ADMIN: 3, MODERATOR: 2, MEMBER: 1 }

  // Can the current user change this member's role?
  const canChangeRole = (member: GroupMember): boolean => {
    if (member.userId === user?.id) return false                        // can't change own role
    if (member.status !== 'ACCEPTED') return false
    if (currentUserRole === 'OWNER') return member.role !== 'OWNER'    // OWNER can change all except other OWNERs
    if (currentUserRole === 'ADMIN') return HIERARCHY[member.role] < HIERARCHY['ADMIN']  // ADMIN only below themselves
    return false
  }

  // Which roles can the current user assign?
  const assignableRoles = (): { value: GroupRole; label: string }[] => {
    if (currentUserRole === 'OWNER') return [
      { value: 'ADMIN',     label: 'Admin'     },
      { value: 'MODERATOR', label: 'Moderator' },
      { value: 'MEMBER',    label: 'Member'    },
    ]
    if (currentUserRole === 'ADMIN') return [
      { value: 'MODERATOR', label: 'Moderator' },
      { value: 'MEMBER',    label: 'Member'    },
    ]
    return []
  }

  // Can the current user remove this member?
  const canRemove = (member: GroupMember): boolean => {
    if (member.userId === user?.id) return false
    if (member.status !== 'ACCEPTED') return false
    if (currentUserRole === 'OWNER') return member.role !== 'OWNER'
    if (currentUserRole === 'ADMIN') return HIERARCHY[member.role] < HIERARCHY['ADMIN']
    return false
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setImageFile(f)
    setPreviewUrl(URL.createObjectURL(f))
  }

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-[13px] font-medium rounded-[10px] transition-colors ${
      tab === t
        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
        : 'text-gray-500 dark:text-[#a3a1c8] hover:text-gray-800 dark:hover:text-[#f0eeff]'
    }`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white dark:bg-[#13111f] border border-gray-200 dark:border-white/[0.08] rounded-[22px] shadow-2xl w-full max-w-[560px] max-h-[85vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-white/[0.07]">
          <Settings className="w-4 h-4 text-gray-400 dark:text-[#6e6c93]" />
          <span className="font-semibold text-gray-900 dark:text-[#f0eeff] text-[15px]">Group Settings</span>
          <button onClick={onClose} className="ml-auto w-8 h-8 rounded-lg grid place-items-center text-gray-400 hover:text-gray-700 dark:hover:text-[#f0eeff] hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-3">
          <button className={tabClass('general')} onClick={() => setTab('general')}>General</button>
          <button className={tabClass('members')} onClick={() => setTab('members')}>
            <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Members</span>
          </button>
          {currentUserRole === 'OWNER' && (
            <button className={`${tabClass('danger')} ${tab === 'danger' ? '!text-red-500 !bg-red-50 dark:!bg-red-500/10' : 'hover:!text-red-500'}`} onClick={() => setTab('danger')}>
              Danger Zone
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">

          {/* ── General ── */}
          {tab === 'general' && (
            <div className="flex flex-col gap-4">
              {/* Image */}
              <div className="flex justify-center">
                <label className="relative cursor-pointer">
                  <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
                  <div className={`w-[88px] h-[88px] rounded-full overflow-hidden grid place-items-center ${previewUrl ? 'border-[3px] border-blue-500/40' : 'bg-gray-100 dark:bg-white/[0.04] border-2 border-dashed border-gray-300 dark:border-white/[0.2]'}`}>
                    {previewUrl
                      ? <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                      : <div className="text-center"><ImageIcon size={20} className="text-gray-400 mx-auto" /><span className="text-[10px] text-gray-400 mt-1 block">Upload</span></div>
                    }
                  </div>
                  <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-blue-500 grid place-items-center text-white text-xs border-2 border-white dark:border-[#13111f]">
                    +
                  </div>
                </label>
              </div>

              {/* Name */}
              <div>
                <label className="block text-[11px] font-bold text-gray-400 dark:text-[#6e6c93] uppercase tracking-widest mb-1.5">Group Name *</label>
                <input
                  value={name} onChange={e => setName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] rounded-[10px] px-3.5 py-2.5 text-gray-900 dark:text-[#f0eeff] text-[13px] outline-none focus:border-blue-500/40 transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-gray-400 dark:text-[#6e6c93] uppercase tracking-widest mb-1.5">Description</label>
                <textarea
                  value={desc} onChange={e => setDesc(e.target.value)} rows={3}
                  className="w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.1] rounded-[10px] px-3.5 py-2.5 text-gray-900 dark:text-[#f0eeff] text-[13px] outline-none resize-none focus:border-blue-500/40 transition-colors"
                />
              </div>

              {/* Theme color */}
              <div>
                <label className="block text-[11px] font-bold text-gray-400 dark:text-[#6e6c93] uppercase tracking-widest mb-1.5">Theme Color</label>
                <div className="flex gap-2.5">
                  {THEME_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setColor(c)}
                      className="w-8 h-8 rounded-full transition-all outline-none"
                      style={{ backgroundColor: c, border: color === c ? '3px solid white' : '3px solid transparent', boxShadow: color === c ? `0 0 0 2px ${c}` : 'none' }}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={() => updateMutation.mutate()}
                disabled={!name.trim() || updateMutation.isPending}
                className="w-full py-2.5 rounded-[11px] bg-blue-500 text-white text-[13px] font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 mt-1"
              >
                {updateMutation.isPending ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          )}

          {/* ── Members ── */}
          {tab === 'members' && (
            <div className="flex flex-col gap-2">
              {group.members
                .filter(m => m.status === 'ACCEPTED')
                .sort((a, b) => (HIERARCHY[b.role] ?? 0) - (HIERARCHY[a.role] ?? 0))
                .map(member => (
                  <div key={member.id} className="flex items-center gap-3 py-2.5 px-3 rounded-[12px] bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 dark:bg-blue-500/15 grid place-items-center text-[11px] font-bold text-blue-600 dark:text-blue-400 shrink-0 overflow-hidden">
                      {member.user.avatarUrl
                        ? <img src={member.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                        : member.user.name.slice(0, 2).toUpperCase()
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-gray-900 dark:text-[#f0eeff] truncate">
                        {member.user.name}
                        {member.userId === user?.id && <span className="ml-1.5 text-[10px] text-gray-400">(you)</span>}
                      </div>
                      <div className="text-[11px] text-gray-400 dark:text-[#6e6c93] truncate">{member.user.email}</div>
                    </div>

                    {/* Role selector or badge */}
                    {canChangeRole(member) ? (
                      <div className="relative">
                        <select
                          value={member.role}
                          onChange={e => roleMutation.mutate({ memberId: member.userId, role: e.target.value })}
                          disabled={roleMutation.isPending}
                          className="appearance-none bg-gray-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.08] rounded-[8px] pl-2.5 pr-6 py-1.5 text-[12px] font-medium text-gray-700 dark:text-[#c8c6e8] outline-none cursor-pointer disabled:opacity-50"
                        >
                          {assignableRoles().map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                      </div>
                    ) : (
                      <span className="text-[11px] font-mono text-gray-400 dark:text-[#6e6c93] px-2 py-1 bg-gray-100 dark:bg-white/[0.04] rounded-[6px]">
                        {member.role}
                      </span>
                    )}

                    {/* Remove button */}
                    {canRemove(member) && (
                      <button
                        onClick={() => removeMutation.mutate(member.userId)}
                        disabled={removeMutation.isPending}
                        className="text-[11px] text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors px-1 disabled:opacity-40"
                        title="Remove member"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
            </div>
          )}

          {/* ── Danger Zone ── */}
          {tab === 'danger' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3 p-4 rounded-[14px] bg-red-50 dark:bg-red-500/[0.06] border border-red-200 dark:border-red-500/20">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[13px] font-semibold text-red-700 dark:text-red-400 mb-1">Delete group</div>
                  <div className="text-[12px] text-red-600/80 dark:text-red-400/70">
                    This will permanently delete the group and all associated data. This action cannot be undone.
                  </div>
                </div>
              </div>

              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full py-2.5 rounded-[11px] border border-red-300 dark:border-red-500/30 text-red-500 dark:text-red-400 text-[13px] font-semibold hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  Delete group…
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setConfirmDelete(false)}
                    className="flex-1 py-2.5 rounded-[11px] border border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-[#a3a1c8] text-[13px] font-semibold hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors">
                    Cancel
                  </button>
                  <button onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}
                    className="flex-1 py-2.5 rounded-[11px] bg-red-500 text-white text-[13px] font-semibold hover:bg-red-600 transition-colors disabled:opacity-50">
                    {deleteMutation.isPending ? 'Deleting…' : 'Confirm delete'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
