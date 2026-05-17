import React, { useState, useEffect, useRef } from 'react'
import { Outlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { FloatingNav } from './FloatingNav'
import { DashboardTopbar } from '@/features/dashboard/components/DashboardTopbar'
import { LoginMapAnimation } from '@/features/auth/components/LoginMapAnimation'
import { useAuth } from '@/app/Providers'

export const AppShell: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  // Read sessionStorage synchronously so overlay renders before first paint
  const isInitialAnim = useRef(sessionStorage.getItem('routiq_google_login') === '1')
  const [showAnim, setShowAnim] = useState(isInitialAnim.current)
  const { user } = useAuth()

  useEffect(() => {
    if (!isInitialAnim.current) return
    sessionStorage.removeItem('routiq_google_login')
  }, [])

  return (
    <div className="h-screen overflow-hidden flex bg-gradient-to-br from-slate-100 via-indigo-50 to-sky-50 dark:from-[#0c0b1a] dark:via-[#0f0e22] dark:to-[#0c0b1a]">
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>
      <div className="flex-1 min-w-0 pb-20 lg:pb-0 flex flex-col overflow-y-auto">
        <DashboardTopbar />
        <div className="flex-1 min-h-0">
          <Outlet />
        </div>
      </div>
      <div className="lg:hidden">
        <FloatingNav />
      </div>

      {/* Google OAuth post-login animation overlay */}
      <AnimatePresence>
        {showAnim && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 overflow-hidden"
          >
            <LoginMapAnimation
              name={user?.name?.split(' ')[0] ?? 'Traveler'}
              onEnd={() => setShowAnim(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
