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
      {/* Avatar card */}
      <div className="bg-white dark:bg-[#1e1b38] border border-line rounded-[22px] shadow-card p-6">
        <p className="text-[11px] font-mono uppercase tracking-[0.1em] text-ink-faint mb-4">Profile Picture</p>
        <div className="flex items-center gap-6">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-[16px] overflow-hidden border-2 border-line shadow-sm">
              <Avatar src={user.avatarUrl} alt={user.name} size="xl" className="w-full h-full" />
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute -bottom-2 -right-2 w-8 h-8 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-500 text-white rounded-[10px] shadow-[0_4px_12px_rgba(99,102,241,0.4)] hover:scale-110 transition-transform disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          </div>
          <div>
            <p className="font-semibold text-ink text-sm mb-0.5">Your avatar</p>
            <p className="text-ink-faint text-xs mb-3">PNG or JPG, max 5 MB</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-3.5 py-1.5 border-[1.5px] border-line rounded-[10px] text-xs font-semibold text-ink-dim hover:text-ink hover:border-line-strong transition-all disabled:opacity-50"
            >
              {isUploading ? 'Uploading…' : 'Change photo'}
            </button>
          </div>
        </div>
      </div>

      {/* Personal details card */}
      <div className="bg-white dark:bg-[#1e1b38] border border-line rounded-[22px] shadow-card p-6">
        <p className="text-[11px] font-mono uppercase tracking-[0.1em] text-ink-faint mb-5">Personal Details</p>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <Field label="Full Name" error={errors.name?.message}>
            <User className="absolute left-[18px] top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-ink-faint" />
            <input
              type="text"
              {...register('name')}
              className={`w-full bg-transparent border-none outline-none text-ink text-[15px] font-medium py-[14px] pl-[46px] pr-4 ${errors.name ? '' : ''}`}
              placeholder="Your full name"
            />
          </Field>
          <Field label="Email Address">
            <Mail className="absolute left-[18px] top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-ink-faint" />
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full bg-transparent border-none outline-none text-ink-faint text-[15px] font-medium py-[14px] pl-[46px] pr-4 cursor-not-allowed"
            />
          </Field>
          <p className="text-[11px] text-ink-faint font-mono -mt-2">Email cannot be changed.</p>
          <button
            type="submit"
            disabled={!isDirty || isSaving}
            className="mt-2 px-6 py-[13px] bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-[14px] text-sm font-semibold shadow-[0_8px_24px_-8px_rgba(99,102,241,0.5)] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-8px_rgba(99,102,241,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-2 mb-2 text-[11px] font-mono uppercase tracking-[0.1em] text-ink-dim">
        {label}
      </label>
      <div className={[
        'relative rounded-[14px] border-[1.5px] transition-all',
        'bg-white dark:bg-[#16142e]',
        error ? 'border-red-400' : 'border-line focus-within:border-transparent focus-within:shadow-[0_0_0_1.5px_theme(colors.indigo.500),0_0_0_5px_rgba(99,102,241,0.12)]',
      ].join(' ')}>
        {children}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>}
    </div>
  )
}
