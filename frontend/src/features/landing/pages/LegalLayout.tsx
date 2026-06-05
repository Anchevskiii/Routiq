import React from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'

interface LegalLayoutProps {
  title: string
  lastUpdated: string
  children: React.ReactNode
}

export const LegalLayout: React.FC<LegalLayoutProps> = ({ title, lastUpdated, children }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#08091a] text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <nav className="max-w-4xl mx-auto px-6 py-6 flex justify-between items-center border-b border-gray-200 dark:border-gray-800">
        <Link to={ROUTES.HOME} className="flex items-center gap-2 font-bold text-lg">
          <span className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white">R</span> Routiq
        </Link>
        <Link to={ROUTES.HOME} className="text-sm hover:text-primary transition-colors">
          Back to Home
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-extrabold mb-8 bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
          {title}
        </h1>
        <div className="space-y-6 text-gray-600 dark:text-gray-300 leading-relaxed">
          <p className="text-sm text-gray-400">Last updated: {lastUpdated}</p>
          {children}
        </div>
      </main>

      <footer className="max-w-4xl mx-auto px-6 py-8 text-center text-xs text-gray-500 border-t border-gray-200 dark:border-gray-800">
        &copy; 2026 Routiq. All rights reserved.
      </footer>
    </div>
  )
}
