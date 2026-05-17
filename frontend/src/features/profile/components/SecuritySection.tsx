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

  const fields = [
    { key: 'newPassword' as const,     label: 'New Password',     show: showNew,     toggle: () => setShowNew(p => !p) },
    { key: 'confirmPassword' as const, label: 'Confirm Password', show: showConfirm, toggle: () => setShowConfirm(p => !p) },
  ]

  return (
    <div className="bg-white dark:bg-[#1e1b38] border border-line rounded-[22px] shadow-card p-6">
      <p className="text-[11px] font-mono uppercase tracking-[0.1em] text-ink-faint mb-1">Change Password</p>
      <p className="text-sm text-ink-dim mb-5">Choose a strong password with at least 8 characters.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {fields.map(field => (
          <div key={field.key}>
            <label className="flex items-center gap-2 mb-2 text-[11px] font-mono uppercase tracking-[0.1em] text-ink-dim">
              {field.label}
            </label>
            <div className={[
              'relative rounded-[14px] border-[1.5px] transition-all bg-white dark:bg-[#16142e]',
              errors[field.key] ? 'border-red-400' : 'border-line focus-within:border-transparent focus-within:shadow-[0_0_0_1.5px_theme(colors.indigo.500),0_0_0_5px_rgba(99,102,241,0.12)]',
            ].join(' ')}>
              <Lock className="absolute left-[18px] top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-ink-faint" />
              <input
                type={field.show ? 'text' : 'password'}
                {...register(field.key)}
                className="w-full bg-transparent border-none outline-none text-ink text-[15px] font-medium py-[14px] pl-[46px] pr-12"
              />
              <button
                type="button"
                onClick={field.toggle}
                className="absolute right-[14px] top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink transition-colors"
              >
                {field.show ? <EyeOff className="w-[17px] h-[17px]" /> : <Eye className="w-[17px] h-[17px]" />}
              </button>
            </div>
            {errors[field.key] && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors[field.key]?.message}</p>}
          </div>
        ))}

        <button
          type="submit"
          disabled={isChanging}
          className="mt-2 px-6 py-[13px] bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-[14px] text-sm font-semibold shadow-[0_8px_24px_-8px_rgba(99,102,241,0.5)] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-8px_rgba(99,102,241,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isChanging ? 'Changing…' : 'Change Password'}
        </button>
      </form>
    </div>
  )
}
