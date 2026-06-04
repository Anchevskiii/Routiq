import React, { useRef, useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, MessageCircle, ThumbsUp, Users, Calendar, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { notificationsApi, type AppNotification } from '@/api/notifications.api'
import { ROUTES } from '@/constants/routes'

const TYPE_ICON: Record<AppNotification['type'], React.ReactNode> = {
  GROUP_INVITATION: <Users className="w-4 h-4 text-blue-500" />,
  COMMENT:          <MessageCircle className="w-4 h-4 text-emerald-500" />,
  VOTE:             <ThumbsUp className="w-4 h-4 text-amber-500" />,
  TRIP_REMINDER:    <Calendar className="w-4 h-4 text-violet-500" />,
}

const TYPE_BG: Record<AppNotification['type'], string> = {
  GROUP_INVITATION: 'bg-blue-50 dark:bg-blue-500/10',
  COMMENT:          'bg-emerald-50 dark:bg-emerald-500/10',
  VOTE:             'bg-amber-50 dark:bg-amber-500/10',
  TRIP_REMINDER:    'bg-violet-50 dark:bg-violet-500/10',
}

function getNavTarget(notif: AppNotification): string | null {
  const d = notif.data ?? {}
  if (notif.type === 'GROUP_INVITATION' && d.groupId) return ROUTES.GROUPS
  if (notif.type === 'COMMENT' && d.groupId) return ROUTES.GROUP_DETAIL(d.groupId as string)
  if (notif.type === 'VOTE' && d.itineraryId) return ROUTES.ITINERARY(d.itineraryId as string)
  if (notif.type === 'TRIP_REMINDER' && d.itineraryId) return ROUTES.ITINERARY(d.itineraryId as string)
  return null
}

export const NotificationsDropdown: React.FC = () => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getNotifications(1, 15),
    refetchInterval: 30_000,
    staleTime: 15_000,
  })

  const unread = data?.unread ?? 0
  const notifications = data?.notifications ?? []

  const markReadMutation = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleClick = (notif: AppNotification) => {
    if (!notif.readAt) markReadMutation.mutate(notif.id)
    const target = getNavTarget(notif)
    if (target) { navigate(target); setOpen(false) }
  }

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Notifications"
        className="relative w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-blue-900/30 transition-colors"
      >
        <Bell className="w-[17px] h-[17px]" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full bg-blue-600 border-2 border-white dark:border-[#0c0b1a] flex items-center justify-center text-[9px] font-bold text-white px-[3px]">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] w-[340px] bg-white dark:bg-[#1a1830] border border-gray-100 dark:border-white/[0.08] rounded-[18px] shadow-xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/[0.07]">
            <span className="text-[14px] font-semibold text-gray-900 dark:text-[#f0eeff]">
              Notifications {unread > 0 && <span className="ml-1.5 text-[11px] font-mono text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded-full">{unread}</span>}
            </span>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button onClick={() => markAllMutation.mutate()}
                  className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-[#6e6c93] hover:text-blue-500 dark:hover:text-blue-400 transition-colors px-2 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.04]">
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="w-7 h-7 grid place-items-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-[#f0eeff] hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400 dark:text-[#6e6c93]">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No notifications yet
              </div>
            ) : (
              notifications.map(notif => (
                <button key={notif.id} onClick={() => handleClick(notif)}
                  className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors border-b border-gray-50 dark:border-white/[0.04] last:border-0 ${!notif.readAt ? 'bg-blue-50/40 dark:bg-blue-500/[0.04]' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-[10px] grid place-items-center flex-shrink-0 mt-0.5 ${TYPE_BG[notif.type]}`}>
                    {TYPE_ICON[notif.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[13px] leading-snug mb-0.5 ${!notif.readAt ? 'font-semibold text-gray-900 dark:text-[#f0eeff]' : 'font-medium text-gray-700 dark:text-[#c8c6e8]'}`}>
                      {notif.title}
                    </div>
                    {notif.body && (
                      <div className="text-[11px] text-gray-400 dark:text-[#6e6c93] truncate">{notif.body}</div>
                    )}
                    <div className="text-[10px] text-gray-300 dark:text-[#4e4c6a] mt-1">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                  {!notif.readAt && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
