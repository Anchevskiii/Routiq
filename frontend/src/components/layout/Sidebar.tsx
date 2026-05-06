import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/utils/cn'
import { ROUTES } from '@/constants/routes'
import { 
  MapPin, 
  Calendar, 
  Users, 
  User, 
  Home 
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: Home },
  { name: 'Planner', href: ROUTES.PLANNER, icon: Calendar },
  { name: 'Groups', href: ROUTES.GROUPS, icon: Users },
  { name: 'Profile', href: ROUTES.PROFILE, icon: User },
]

export const Sidebar: React.FC = () => {
  const location = useLocation()

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <Link to={ROUTES.DASHBOARD} className="flex items-center space-x-2">
          <MapPin className="h-8 w-8 text-primary" />
          <span className="text-xl font-semibold text-gray-900">Routiq</span>
        </Link>
      </div>
      
      <nav className="mt-6 px-3">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0',
                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'
                  )}
                />
                {item.name}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
