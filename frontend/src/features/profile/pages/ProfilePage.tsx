import React, { useState } from 'react'
import { useAuth } from '@/app/Providers'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { profileApi, type UserSettings } from '@/api/profile.api'
import { itineraryApi } from '@/api/itinerary.api'
import { groupsApi } from '@/api/groups.api'
import { QUERY_KEYS } from '@/constants/queryKeys'
import toast from 'react-hot-toast'
import { ProfileHero }   from '../components/ProfileHero'
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

  const { data: itinerariesData } = useQuery({ queryKey: QUERY_KEYS.itinerariesCount, queryFn: () => itineraryApi.listItineraries({ limit: 1 }) })
  const { data: groupsData } = useQuery({ queryKey: QUERY_KEYS.groupsCount, queryFn: () => groupsApi.getGroups() })
  const { data: settings } = useQuery({ queryKey: QUERY_KEYS.settings, queryFn: profileApi.getSettings })

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
    mutationFn: profileApi.changePassword,
    onSuccess: () => toast.success('Password changed'),
    onError: () => toast.error('Failed to change password'),
  })

  const updateSettingsMutation = useMutation({
    mutationFn: (payload: Partial<UserSettings>) => profileApi.updateSettings(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.settings })
      const previous = queryClient.getQueryData<UserSettings>(QUERY_KEYS.settings)
      queryClient.setQueryData<UserSettings>(QUERY_KEYS.settings, old => old ? { ...old, ...payload } : old)
      return { previous }
    },
    onError: (_err, _payload, context) => {
      if (context?.previous) queryClient.setQueryData(QUERY_KEYS.settings, context.previous)
      toast.error('Failed to save setting')
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings }),
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

      <ProfileHero user={user} itineraryCount={itineraryCount} groupCount={groupCount} />

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
