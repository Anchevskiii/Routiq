import React, { useState } from 'react'
import { useAuth } from '@/app/Providers'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { profileApi, type UserSettings } from '@/api/profile.api'
import { itineraryApi } from '@/api/itinerary.api'
import { groupsApi } from '@/api/groups.api'
import { supabase } from '@/api/supabase'
import toast from 'react-hot-toast'
import { MapPin, Users } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'

import { ProfileNav, type Section } from '../components/ProfileNav'
import { GeneralSection, type ProfileFormValues } from '../components/GeneralSection'
import { SecuritySection, type PasswordFormValues } from '../components/SecuritySection'
import { ToggleSection } from '../components/ToggleSection'
import { DangerZone } from '../components/DangerZone'

const NOTIFICATION_ITEMS = [
  { key: 'groupInvitations' as const, label: 'Group invitations', desc: 'When someone invites you to a group' },
  { key: 'comments' as const, label: 'Comments', desc: 'When someone comments on a shared itinerary' },
  { key: 'votes' as const, label: 'Votes', desc: 'When someone votes on an activity' },
  { key: 'tripReminders' as const, label: 'Trip reminders', desc: '24 hours before a trip starts' },
]

const PRIVACY_ITEMS = [
  { key: 'publicProfile' as const, label: 'Public profile', desc: 'Allow others to find you by name' },
  { key: 'sharedItineraries' as const, label: 'Shared itineraries', desc: 'Allow your itineraries to be viewed via share link' },
  { key: 'activityStatus' as const, label: 'Activity status', desc: 'Show when you were last active' },
]

export const ProfilePage: React.FC = () => {
  const { user, logout, refreshUser } = useAuth()
  const queryClient = useQueryClient()
  const [activeSection, setActiveSection] = useState<Section>('general')

  const { data: itinerariesData } = useQuery({ queryKey: ['itineraries-count'], queryFn: () => itineraryApi.listItineraries({ limit: 1 }) })
  const { data: groupsData } = useQuery({ queryKey: ['groups-count'], queryFn: () => groupsApi.getGroups() })
  const { data: settings } = useQuery({ queryKey: ['user-settings'], queryFn: profileApi.getSettings })

  const updateProfileMutation = useMutation({
    mutationFn: profileApi.updateProfile,
    onSuccess: async () => { toast.success('Profile updated'); await refreshUser() },
    onError: () => toast.error('Failed to update profile'),
  })

  const uploadAvatarMutation = useMutation({
    mutationFn: profileApi.uploadAvatar,
    onSuccess: async () => { toast.success('Avatar updated'); await refreshUser() },
    onError: () => toast.error('Failed to upload avatar'),
  })

  const changePasswordMutation = useMutation({
    mutationFn: async ({ newPassword }: PasswordFormValues) => {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
    },
    onSuccess: () => toast.success('Password changed'),
    onError: () => toast.error('Failed to change password'),
  })

  const updateSettingsMutation = useMutation({
    mutationFn: (payload: Partial<UserSettings>) => profileApi.updateSettings(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ['user-settings'] })
      const previous = queryClient.getQueryData<UserSettings>(['user-settings'])
      queryClient.setQueryData<UserSettings>(['user-settings'], old => old ? { ...old, ...payload } : old)
      return { previous }
    },
    onError: (_err, _payload, context) => {
      if (context?.previous) queryClient.setQueryData(['user-settings'], context.previous)
      toast.error('Failed to save setting')
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['user-settings'] }),
  })

  const deleteAccountMutation = useMutation({
    mutationFn: profileApi.deleteAccount,
    onSuccess: () => logout(),
    onError: () => toast.error('Failed to delete account'),
  })

  if (!user) return null

  const itineraryCount = itinerariesData?.meta?.total ?? 0
  const groupCount = Array.isArray(groupsData?.data) ? groupsData.data.length : 0

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Hero header */}
      <div className="relative rounded-[22px] overflow-hidden mb-8 border border-line shadow-card">
        <div className="h-24 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600" />
        <div className="bg-white dark:bg-[#1e1b38] px-6 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-10">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 rounded-[18px] overflow-hidden border-4 border-white dark:border-[#1e1b38] shadow-lg shrink-0">
                <Avatar src={user.avatarUrl} alt={user.name} size="xl" className="w-full h-full" />
              </div>
              <div className="pb-1">
                <h1 className="text-xl font-semibold tracking-tight text-ink leading-tight">{user.name}</h1>
                <p className="text-sm text-ink-faint font-mono">{user.email}</p>
              </div>
            </div>
            <div className="flex gap-4 pb-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500">
                  <MapPin className="w-3.5 h-3.5" />
                </span>
                <span className="font-semibold text-ink">{itineraryCount}</span>
                <span className="text-ink-faint text-xs">trips</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-900/30 text-violet-500">
                  <Users className="w-3.5 h-3.5" />
                </span>
                <span className="font-semibold text-ink">{groupCount}</span>
                <span className="text-ink-faint text-xs">groups</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
        <ProfileNav active={activeSection} onSelect={setActiveSection} onLogout={logout} />

        <div className="space-y-5">
          {activeSection === 'general' && (
            <GeneralSection
              user={user}
              isSaving={updateProfileMutation.isPending}
              isUploading={uploadAvatarMutation.isPending}
              onSave={(v: ProfileFormValues) => updateProfileMutation.mutate(v)}
              onAvatarChange={uploadAvatarMutation.mutate}
            />
          )}
          {activeSection === 'security' && (
            <SecuritySection
              isChanging={changePasswordMutation.isPending}
              onSubmit={(v: PasswordFormValues) => changePasswordMutation.mutate(v)}
            />
          )}
          {activeSection === 'notifications' && (
            <ToggleSection
              title="Notification Preferences"
              items={NOTIFICATION_ITEMS}
              settings={settings}
              onToggle={(key, value) => updateSettingsMutation.mutate({ [key]: value })}
            />
          )}
          {activeSection === 'privacy' && (
            <>
              <ToggleSection
                title="Privacy Settings"
                items={PRIVACY_ITEMS}
                settings={settings}
                onToggle={(key, value) => updateSettingsMutation.mutate({ [key]: value })}
              />
              <DangerZone
                isDeleting={deleteAccountMutation.isPending}
                onDelete={() => deleteAccountMutation.mutate()}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
