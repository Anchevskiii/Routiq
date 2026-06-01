import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, MapPin, Settings, Trash2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { groupsApi } from '@/api/groups.api'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { ROUTES } from '@/constants/routes'
import type { Group, GroupMember } from '@/types/group.types'
import { initials, avatarGrad } from '@/utils/avatar.utils'

interface Props {
  group: Group
  currentUserId?: string
}

export const GroupCard: React.FC<Props> = ({ group, currentUserId: _currentUserId }) => {
  const [confirm, setConfirm] = useState(false)
  const memberCount    = group.members?.length    ?? group.memberCount    ?? 0
  const itineraryCount = group.itineraries?.length ?? group.itineraryCount ?? 0
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => groupsApi.deleteGroup(group.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groups })
      toast.success('Group deleted')
    },
    onError: () => {
      setConfirm(false)
      toast.error('Only the group owner can delete this group')
    },
  })

  return (
    <motion.div layout exit={{ opacity: 0, scale: 0.9 }}>
      <AnimatePresence mode="wait">
        {confirm ? (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="rounded-[20px] bg-white dark:bg-[#16142e] shadow-sm border border-red-100 dark:border-red-900/30 p-6 flex flex-col items-center justify-center gap-4 h-[250px]"
          >
            <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-500">
              <Trash2 size={18} />
            </div>
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-300 text-center">
              Delete <span className="text-red-500 font-bold">{group.name}</span>?
            </p>
            <div className="flex gap-2 w-full">
              <button
                onClick={() => setConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? '…' : 'Delete'}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="card"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15 }}
          >
            <Link
              to={ROUTES.GROUP_DETAIL(group.id)}
              className="grp-panel grp-card flex flex-col h-[250px] rounded-[20px] overflow-hidden border border-gray-200 dark:border-white/[0.07] no-underline group/card"
            >
              {/* Top bar */}
              <div
                className={`h-20 relative overflow-hidden shrink-0${!group.imageUrl && !group.themeColor ? ' grp-aurora' : ''}`}
                style={
                  group.imageUrl
                    ? { backgroundImage: `url(${group.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    : group.themeColor
                      ? { background: group.themeColor }
                      : undefined
                }
              >
                {group.imageUrl && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                )}
                <div className="grp-card-gear absolute top-2.5 right-2.5 w-[30px] h-[30px] rounded-lg bg-black/35 backdrop-blur-sm grid place-items-center border border-white/[0.15]">
                  <Settings size={13} className="text-white" />
                </div>
                <button
                  onClick={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    setConfirm(true)
                  }}
                  className="absolute top-2.5 left-2.5 w-[30px] h-[30px] rounded-lg backdrop-blur-sm grid place-items-center border border-white/[0.15] bg-black/35 text-white/70 hover:bg-red-500/70 hover:border-red-400/50 hover:text-white transition-all opacity-0 group-hover/card:opacity-100 disabled:opacity-50"
                  title="Delete group"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Body */}
              <div className="px-[18px] pt-4 pb-[18px] flex-1 flex flex-col">
                {/* Avatar stack */}
                <div className="flex mb-3">
                  {(group.members ?? []).slice(0, 4).map((m: GroupMember, i: number) => (
                    <div
                      key={m.id}
                      title={m.user.name}
                      className={`w-7 h-7 rounded-full border-2 border-gray-100 dark:border-[#161830] ${m.user.avatarUrl ? '' : `bg-gradient-to-br ${avatarGrad(m.user.name)}`} flex items-center justify-center text-[9px] font-bold text-white overflow-hidden${i === 0 ? '' : ' -ml-2'}`}
                    >
                      {m.user.avatarUrl
                        ? <img src={m.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                        : initials(m.user.name)
                      }
                    </div>
                  ))}
                  {memberCount > 4 && (
                    <div
                      className="w-7 h-7 rounded-full border-2 border-gray-100 dark:border-[#161830] bg-gray-200/60 dark:bg-white/[0.08] flex items-center justify-center text-[9px] text-gray-500 dark:text-[#a3a1c8] -ml-2"
                    >
                      +{memberCount - 4}
                    </div>
                  )}
                </div>

                <p className="text-[17px] font-semibold text-gray-900 dark:text-[#f0eeff] tracking-[-0.015em] truncate mb-1 m-0">
                  {group.name}
                </p>

                {group.description ? (
                  <p className="text-[13px] text-gray-400 dark:text-[#6e6c93] mb-3 line-clamp-2 m-0 leading-tight">{group.description}</p>
                ) : (
                  <p className="text-[13px] text-transparent select-none mb-3 line-clamp-2 m-0 leading-tight">No description provided for this group.</p>
                )}

                <div className="flex gap-3.5 mt-auto">
                  <span className="inline-flex items-center gap-1 text-xs font-mono text-gray-400 dark:text-[#6e6c93]">
                    <Users size={11} strokeWidth={1.8} /> {memberCount}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-mono text-gray-400 dark:text-[#6e6c93]">
                    <MapPin size={11} strokeWidth={1.8} /> {itineraryCount}
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
