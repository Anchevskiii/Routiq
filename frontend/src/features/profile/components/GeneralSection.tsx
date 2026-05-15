import React, { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Mail, Camera } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import type { User as UserType } from '@/types/auth.types'

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
})

export type ProfileFormValues = z.infer<typeof profileSchema>

interface Props {
  user: UserType
  isSaving: boolean
  isUploading: boolean
  onSave: (values: ProfileFormValues) => void
  onAvatarChange: (formData: FormData) => void
}

export const GeneralSection: React.FC<Props> = ({ user, isSaving, isUploading, onSave, onAvatarChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, formState: { errors, isDirty }, reset } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name },
  })

  useEffect(() => { reset({ name: user.name }) }, [user.name, reset])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const formData = new FormData()
      formData.append('avatar', file)
      onAvatarChange(formData)
    }
  }

  return (
    <>
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Profile Picture</h3>
        <div className="flex flex-col sm:flex-row items-center gap-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white shadow-lg">
              <Avatar src={user.avatarUrl} alt={user.name} size="xl" className="w-full h-full rounded-3xl" />
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute bottom-[-10px] right-[-10px] p-3 bg-primary text-white rounded-2xl shadow-xl hover:scale-110 transition-transform disabled:opacity-50"
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
              disabled={isUploading}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              {isUploading ? 'Uploading...' : 'Change Photo'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Personal Details</h3>
        <form onSubmit={handleSubmit(onSave)} className="space-y-6">
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
          <button
            type="submit"
            disabled={!isDirty || isSaving}
            className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </>
  )
}
