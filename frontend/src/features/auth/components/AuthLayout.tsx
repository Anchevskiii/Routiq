import React from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  highlightedTitle: string
  subtitle: string
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  highlightedTitle,
  subtitle,
}) => (
  <main className="relative min-h-screen overflow-hidden bg-[#f0f9ff] dark:bg-[#0c0b1a]">
    <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
      <Link to={ROUTES.HOME} className="flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl gradient-aurora shadow-md">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C7 2 4 5.5 4 10c0 6 8 12 8 12s8-6 8-12c0-4.5-3-8-8-8z" fill="white"/>
            <circle cx="12" cy="10" r="3" fill="#6366f1"/>
          </svg>
        </div>
        <span className="text-xl font-semibold tracking-tight text-ink">Routiq</span>
      </Link>
      <Link
        to={ROUTES.HOME}
        className="flex items-center gap-1.5 text-sm font-medium text-ink-dim hover:text-ink transition-colors"
        title="Back to Home"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        <span>Back to Home</span>
      </Link>
    </header>

    <section className="relative mx-auto max-w-6xl px-4 sm:px-6 pb-20">
      <div className="relative w-full overflow-visible sm:overflow-hidden rounded-[1rem] sm:rounded-[2rem] border border-gray-200 dark:border-transparent shadow-[0_30px_80px_-20px_rgba(0,0,0,0.12)] dark:shadow-none min-h-[420px] sm:aspect-[16/10]">
        {children}
      </div>

      <div className="mt-6 text-center px-2 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
          {title}
          <br className="sm:hidden" />
          <em className="font-serif italic font-normal gradient-aurora-text"> {highlightedTitle}</em>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-ink-dim text-sm sm:text-base">
          {subtitle}
        </p>
      </div>
    </section>
  </main>
)
