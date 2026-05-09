import React, { useRef } from 'react'
import { useAuth } from '@/app/Providers'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { profileApi } from '@/api/profile.api'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { User, Mail, Camera, LogOut, Trash2, Shield, Bell, Lock } from 'lucide-react'

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
    },
  })

  const updateProfileMutation = useMutation({
    mutationFn: profileApi.updateProfile,
    onSuccess: () => {
      toast.success('Profile updated successfully')
      queryClient.invalidateQueries({ queryKey: ['me'] })
      reset({ name: user?.name })
    },
    onError: () => toast.error('Failed to update profile'),
  })

  const uploadAvatarMutation = useMutation({
    mutationFn: profileApi.uploadAvatar,
    onSuccess: () => {
      toast.success('Avatar updated')
      queryClient.invalidateQueries({ queryKey: ['me'] })
    },
    onError: () => toast.error('Failed to upload avatar'),
  })

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const formData = new FormData()
      formData.append('file', file)
      uploadAvatarMutation.mutate(formData)
    }
  }

  const onSubmit = (values: ProfileFormValues) => {
    updateProfileMutation.mutate(values)
  }

  if (!user) return null

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900">Account Settings</h1>
        <p className="text-gray-500 mt-2">Manage your profile, preferences and security settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar Nav */}
        <div className="space-y-2">
          <nav className="flex flex-col gap-1">
            <ProfileNavLink icon={<User className="w-5 h-5" />} label="General" active />
            <ProfileNavLink icon={<Lock className="w-5 h-5" />} label="Security" />
            <ProfileNavLink icon={<Bell className="w-5 h-5" />} label="Notifications" />
            <ProfileNavLink icon={<Shield className="w-5 h-5" />} label="Privacy" />
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
          {/* Avatar Section */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Profile Picture</h3>
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="relative group">
                <div className="w-32 h-32 rounded-3xl bg-gray-100 overflow-hidden border-4 border-white shadow-lg">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-300">
                      {user.name.charAt(0)}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleAvatarClick}
                  className="absolute bottom-[-10px] right-[-10px] p-3 bg-primary text-white rounded-2xl shadow-xl hover:scale-110 transition-transform active:scale-95"
                >
                  <Camera className="w-5 h-5" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-gray-900 font-bold text-lg mb-1">Your Avatar</p>
                <p className="text-gray-500 text-sm mb-4">PNG or JPG, max 2MB.</p>
                <button
                  onClick={handleAvatarClick}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Change Photo
                </button>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Personal Details</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      {...register('name')}
                      className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all ${
                        errors.name ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-gray-50/50'
                      }`}
                    />
                  </div>
                  {errors.name && <p className="mt-1 text-xs text-red-600 font-bold">{errors.name.message}</p>}
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
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={!isDirty || updateProfileMutation.isPending}
                  className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg"
                >
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Danger Zone */}
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
            <button className="px-6 py-3 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-all shadow-sm">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const ProfileNavLink: React.FC<{ icon: React.ReactNode; label: string; active?: boolean }> = ({ icon, label, active }) => (
  <button
    className={`flex items-center px-4 py-3 rounded-xl font-bold transition-all ${
      active ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
    }`}
  >
    <span className="mr-3">{icon}</span>
    {label}
  </button>
)

