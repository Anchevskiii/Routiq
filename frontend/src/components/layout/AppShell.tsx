import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { FloatingNav } from './FloatingNav'
import { DashboardTopbar } from '@/features/dashboard/components/DashboardTopbar'

export const AppShell: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-100 via-indigo-50 to-sky-50 dark:from-[#0c0b1a] dark:via-[#0f0e22] dark:to-[#0c0b1a]">
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>
      <div className="flex-1 min-w-0 pb-20 lg:pb-0 flex flex-col overflow-y-auto">
        <DashboardTopbar />
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
      <div className="lg:hidden">
        <FloatingNav />
      </div>
    </div>
  )
}
