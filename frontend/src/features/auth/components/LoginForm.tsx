import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/app/Providers'
import { ROUTES } from '@/constants/routes'
import { LoginFormValues, loginSchema } from '@/features/auth/schemas/authSchemas'

interface Props {
  onSuccess: (name: string) => void
}

export const LoginForm: React.FC<Props> = ({ onSuccess }) => {
  const { login, loginWithGoogle, setLoginAnimating } = useAuth()
  const [showPw, setShowPw] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setLoginAnimating(true)
      await login(values)
      onSuccess(values.email.split('@')[0])
    } catch {
      setLoginAnimating(false)
      toast.error('Sign in failed. Please check your credentials.')
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-sm rounded-lg sm:rounded-2xl bg-white/95 dark:bg-[#1e1b38] backdrop-blur p-6 sm:p-8 shadow-xl ring-1 ring-sky-200 dark:ring-[rgba(139,92,246,0.3)] mx-4 sm:mx-0"
    >
      <p className="text-xs font-mono uppercase tracking-[0.14em] text-indigo-400">Routiq</p>
      <h2 className="mt-1 text-2xl sm:text-3xl font-semibold text-ink">Welcome</h2>
      <p className="mt-2 text-sm text-ink-dim">Sign in to start planning.</p>

      <label className="mt-6 block text-sm font-medium text-ink-dim">Email</label>
      <div className={[
        'relative mt-2 rounded-[12px] border-[1.5px] bg-white dark:bg-[#16142e] transition-all',
        errors.email ? 'border-red-400' : 'border-sky-200 dark:border-[rgba(139,92,246,0.25)] focus-within:border-indigo-400 dark:focus-within:border-violet-500 focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]',
      ].join(' ')}>
        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400" />
        <input type="email" autoComplete="email" {...register('email')}
          className="w-full bg-transparent border-none outline-none text-ink text-sm py-3 pl-11 pr-4"
          placeholder="you@example.com" />
      </div>
      {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}

      <label className="mt-4 block text-sm font-medium text-ink-dim">Password</label>
      <div className={[
        'relative mt-2 rounded-[12px] border-[1.5px] bg-white dark:bg-[#16142e] transition-all',
        errors.password ? 'border-red-400' : 'border-sky-200 dark:border-[rgba(139,92,246,0.25)] focus-within:border-indigo-400 dark:focus-within:border-violet-500 focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]',
      ].join(' ')}>
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400" />
        <input type={showPw ? 'text' : 'password'} autoComplete="current-password"
          {...register('password')}
          className="w-full bg-transparent border-none outline-none text-ink text-sm py-3 pl-11 pr-11"
          placeholder="••••••••" />
        <button type="button" onClick={() => setShowPw(p => !p)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-sky-400 hover:text-ink transition-colors">
          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}

      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
        type="submit" disabled={isSubmitting}
        className="mt-6 w-full rounded-[14px] bg-gradient-to-r from-blue-500 to-blue-600 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(59,130,246,0.4)] disabled:opacity-60">
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </motion.button>

      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px bg-sky-100 dark:bg-[rgba(139,92,246,0.2)]" />
        <span className="text-[11px] font-mono text-sky-400 uppercase tracking-wider">or</span>
        <div className="flex-1 h-px bg-sky-100 dark:bg-[rgba(139,92,246,0.2)]" />
      </div>

      <button type="button"
        onClick={() => { sessionStorage.setItem('routiq_google_login', '1'); loginWithGoogle() }}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[14px] border border-sky-200 dark:border-[rgba(139,92,246,0.3)] bg-white dark:bg-[#16142e] text-sm font-medium text-ink hover:bg-sky-50 dark:hover:bg-[#1e1b38] transition-colors">
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      <p className="mt-5 text-center text-xs text-ink-faint">
        No account?{' '}
        <Link to={ROUTES.REGISTER} className="text-indigo-500 hover:text-indigo-700 font-medium">
          Create one
        </Link>
      </p>
    </form>
  )
}
