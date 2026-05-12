import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, Eye, EyeOff } from 'lucide-react'

const passwordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export type PasswordFormValues = z.infer<typeof passwordSchema>

interface Props {
  isChanging: boolean
  onSubmit: (values: PasswordFormValues) => void
}

export const SecuritySection: React.FC<Props> = ({ isChanging, onSubmit }) => {
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  })

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
      <h3 className="text-xl font-bold text-gray-900 mb-2">Change Password</h3>
      <p className="text-gray-500 text-sm mb-6">Choose a strong password with at least 8 characters.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {([
          { key: 'newPassword' as const, label: 'New Password', show: showNew, toggle: () => setShowNew(p => !p) },
          { key: 'confirmPassword' as const, label: 'Confirm Password', show: showConfirm, toggle: () => setShowConfirm(p => !p) },
        ] as const).map(field => (
          <div key={field.key}>
            <label className="block text-sm font-bold text-gray-700 mb-2">{field.label}</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={field.show ? 'text' : 'password'}
                {...register(field.key)}
                className={`w-full pl-12 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all ${
                  errors[field.key] ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-gray-50/50'
                }`}
              />
              <button type="button" onClick={field.toggle} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                {field.show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors[field.key] && <p className="mt-1 text-xs text-red-600 font-bold">{errors[field.key]?.message}</p>}
          </div>
        ))}
        <button
          type="submit"
          disabled={isChanging}
          className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg"
        >
          {isChanging ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </div>
  )
}
