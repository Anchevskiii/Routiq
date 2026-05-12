import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/app/Providers'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { profileApi, type UserSettings } from '@/api/profile.api'
import { itineraryApi } from '@/api/itinerary.api'
import { groupsApi } from '@/api/groups.api'
import { supabase } from '@/api/supabase'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Avatar } from '@/components/ui/Avatar'
import {
  User, Mail, Camera, LogOut, Trash2, Shield, Bell, Lock,
  MapPin, Users, Eye, EyeOff,
} from 'lucide-react'

type Section = 'general' | 'security' | 'notifications' | 'privacy'

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
})

const passwordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type ProfileFormValues = z.infer<typeof profileSchema>
type PasswordFormValues = z.infer<typeof passwordSchema>

export const ProfilePage: React.FC = () => {
  const { user, logout, refreshUser } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeSection, setActiveSection] = useState<Section>('general')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const queryClient = useQueryClient()

  const { data: settings } = useQuery({
    queryKey: ['user-settings'],
    queryFn: profileApi.getSettings,
  })

  const updateSettingsMutation = useMutation({
    mutationFn: (payload: Partial<UserSettings>) => profileApi.updateSettings(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ['user-settings'] })
      const previous = queryClient.getQueryData<UserSettings>(['user-settings'])
      queryClient.setQueryData<UserSettings>(['user-settings'], old =>
        old ? { ...old, ...payload } : old
      )
      return { previous }
    },
    onError: (_err, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['user-settings'], context.previous)
      }
      toast.error('Failed to save setting')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] })
    },
  })

  const handleToggle = (key: keyof UserSettings, value: boolean) => {
    updateSettingsMutation.mutate({ [key]: value })
  }

  const { data: itinerariesData } = useQuery({
    queryKey: ['itineraries-count'],
    queryFn: () => itineraryApi.listItineraries({ limit: 1 }),
  })

  const { data: groupsData } = useQuery({
    queryKey: ['groups-count'],
    queryFn: () => groupsApi.getGroups(),
  })

  const itineraryCount = itinerariesData?.meta?.total ?? 0
  const groupCount = Array.isArray(groupsData?.data) ? groupsData.data.length : 0

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isDirty: isProfileDirty },
    reset: resetProfile,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '' },
  })

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  })

  useEffect(() => {
    if (user) resetProfile({ name: user.name })
  }, [user, resetProfile])

  const updateProfileMutation = useMutation({
    mutationFn: profileApi.updateProfile,
    onSuccess: async () => {
      toast.success('Profile updated')
      await refreshUser()
    },
    onError: () => toast.error('Failed to update profile'),
  })

  const uploadAvatarMutation = useMutation({
    mutationFn: profileApi.uploadAvatar,
    onSuccess: async () => {
      toast.success('Avatar updated')
      await refreshUser()
    },
    onError: () => toast.error('Failed to upload avatar'),
  })

  const changePasswordMutation = useMutation({
    mutationFn: async ({ newPassword }: PasswordFormValues) => {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Password changed')
      resetPassword()
    },
    onError: () => toast.error('Failed to change password'),
  })

  const deleteAccountMutation = useMutation({
    mutationFn: profileApi.deleteAccount,
    onSuccess: () => logout(),
    onError: () => toast.error('Failed to delete account'),
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const formData = new FormData()
      formData.append('avatar', file)
      uploadAvatarMutation.mutate(formData)
    }
  }

  if (!user) return null

  const navItems: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'General', icon: <User className="w-5 h-5" /> },
    { id: 'security', label: 'Security', icon: <Lock className="w-5 h-5" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
    { id: 'privacy', label: 'Privacy', icon: <Shield className="w-5 h-5" /> },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900">Account Settings</h1>
        <p className="text-gray-500 mt-2">Manage your profile, preferences and security settings.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-gray-900">{itineraryCount}</p>
            <p className="text-sm text-gray-500">Itineraries</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-gray-900">{groupCount}</p>
            <p className="text-sm text-gray-500">Groups</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar Nav */}
        <div className="space-y-2">
          <nav className="flex flex-col gap-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center px-4 py-3 rounded-xl font-bold transition-all ${
                  activeSection === item.id
                    ? 'bg-primary text-white shadow-md'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="pt-8">
            <button
              onClick={logout}
              className="flex items-center w-full px-4 py-3 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="md:col-span-2 space-y-8">

          {/* ── General ── */}
          {activeSection === 'general' && (
            <>
              {/* Avatar */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Profile Picture</h3>
                <div className="flex flex-col sm:flex-row items-center gap-8">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white shadow-lg">
                      <Avatar src={user.avatarUrl} alt={user.name} size="xl" className="w-full h-full rounded-3xl" />
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadAvatarMutation.isPending}
                      className="absolute bottom-[-10px] right-[-10px] p-3 bg-primary text-white rounded-2xl shadow-xl hover:scale-110 transition-transform active:scale-95 disabled:opacity-50"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-gray-900 font-bold text-lg mb-1">Your Avatar</p>
                    <p className="text-gray-500 text-sm mb-4">PNG or JPG, max 5MB.</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadAvatarMutation.isPending}
                      className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
                    >
                      {uploadAvatarMutation.isPending ? 'Uploading...' : 'Change Photo'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Personal Details */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Personal Details</h3>
                <form onSubmit={handleProfileSubmit(v => updateProfileMutation.mutate(v))} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        {...registerProfile('name')}
                        className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all ${
                          profileErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-gray-50/50'
                        }`}
                      />
                    </div>
                    {profileErrors.name && <p className="mt-1 text-xs text-red-600 font-bold">{profileErrors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={user.email}
                        disabled
                        className="w-full pl-12 pr-4 py-3 border border-gray-100 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed outline-none"
                      />
                    </div>
                    <p className="mt-2 text-xs text-gray-400">Email cannot be changed.</p>
                  </div>
                  <button
                    type="submit"
                    disabled={!isProfileDirty || updateProfileMutation.isPending}
                    className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg"
                  >
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>
            </>
          )}

          {/* ── Security ── */}
          {activeSection === 'security' && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Change Password</h3>
              <p className="text-gray-500 text-sm mb-6">Choose a strong password with at least 8 characters.</p>
              <form onSubmit={handlePasswordSubmit(v => changePasswordMutation.mutate(v))} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      {...registerPassword('newPassword')}
                      className={`w-full pl-12 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all ${
                        passwordErrors.newPassword ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-gray-50/50'
                      }`}
                    />
                    <button type="button" onClick={() => setShowNewPassword(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {passwordErrors.newPassword && <p className="mt-1 text-xs text-red-600 font-bold">{passwordErrors.newPassword.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      {...registerPassword('confirmPassword')}
                      className={`w-full pl-12 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all ${
                        passwordErrors.confirmPassword ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-gray-50/50'
                      }`}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && <p className="mt-1 text-xs text-red-600 font-bold">{passwordErrors.confirmPassword.message}</p>}
                </div>
                <button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg"
                >
                  {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>
          )}

          {/* ── Notifications ── */}
          {activeSection === 'notifications' && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">
              <h3 className="text-xl font-bold text-gray-900">Notification Preferences</h3>
              {([
                { key: 'groupInvitations' as const, label: 'Group invitations', desc: 'When someone invites you to a group' },
                { key: 'comments' as const, label: 'Comments', desc: 'When someone comments on a shared itinerary' },
                { key: 'votes' as const, label: 'Votes', desc: 'When someone votes on an activity' },
                { key: 'tripReminders' as const, label: 'Trip reminders', desc: '24 hours before a trip starts' },
              ]).map(item => (
                <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{item.label}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings?.[item.key] ?? true}
                      onChange={e => handleToggle(item.key, e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:bg-primary transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* ── Privacy ── */}
          {activeSection === 'privacy' && (
            <>
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">
                <h3 className="text-xl font-bold text-gray-900">Privacy Settings</h3>
                {([
                  { key: 'publicProfile' as const, label: 'Public profile', desc: 'Allow others to find you by name' },
                  { key: 'sharedItineraries' as const, label: 'Shared itineraries', desc: 'Allow your itineraries to be viewed via share link' },
                  { key: 'activityStatus' as const, label: 'Activity status', desc: 'Show when you were last active' },
                ]).map(item => (
                  <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{item.label}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings?.[item.key] ?? true}
                        onChange={e => handleToggle(item.key, e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:bg-primary transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                    </label>
                  </div>
                ))}
              </div>

              <div className="bg-red-50 rounded-3xl border border-red-100 p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-red-100 rounded-2xl text-red-600">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-red-900">Danger Zone</h3>
                    <p className="text-red-600/70 text-sm">Once you delete your account, there is no going back.</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure? This action cannot be undone.')) {
                      deleteAccountMutation.mutate()
                    }
                  }}
                  disabled={deleteAccountMutation.isPending}
                  className="px-6 py-3 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-all shadow-sm disabled:opacity-50"
                >
                  {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
