import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/app/Providers'
import { ROUTES } from '@/constants/routes'
import { Avatar } from '@/components/ui/Avatar'
import { 
  ChevronDown, 
  Settings, 
  LogOut, 
  User as UserIcon 
} from 'lucide-react'

export const UserMenu: React.FC = () => {
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    setIsOpen(false)
  }

  if (!user) return null

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 text-sm rounded-md hover:bg-gray-100 p-2 transition-colors"
      >
        <Avatar
          src={user.avatarUrl}
          alt={user.name}
          size="sm"
        />
        <span className="font-medium text-gray-700">{user.name}</span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200">
            <div className="py-1">
              <Link
                to={ROUTES.PROFILE}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                <UserIcon className="mr-3 h-4 w-4" />
                Profile
              </Link>
              <Link
                to={ROUTES.PROFILE}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="mr-3 h-4 w-4" />
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <LogOut className="mr-3 h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
