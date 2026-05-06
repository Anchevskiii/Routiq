import React from 'react'
import { UserMenu } from './UserMenu'

export const Topbar: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {/* Breadcrumb or page title can go here */}
            <h1 className="text-lg font-semibold text-gray-900">
              Welcome back!
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Notifications, search, etc. can go here */}
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  )
}
