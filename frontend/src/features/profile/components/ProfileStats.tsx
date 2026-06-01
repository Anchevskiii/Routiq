import React from 'react'
import { MapPin, Users } from 'lucide-react'

interface Props {
  itineraryCount: number
  groupCount: number
}

export const ProfileStats: React.FC<Props> = ({ itineraryCount, groupCount }) => (
  <div className="grid grid-cols-2 gap-4 mb-8">
    <div className="bg-white dark:bg-[#16142e] rounded-2xl border border-gray-100 dark:border-blue-600/10 shadow-sm p-5 flex items-center gap-4">
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600">
        <MapPin className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-gray-900 dark:text-blue-300">{itineraryCount}</p>
        <p className="text-sm text-gray-500 dark:text-slate-500">Itineraries</p>
      </div>
    </div>
    <div className="bg-white dark:bg-[#16142e] rounded-2xl border border-gray-100 dark:border-blue-600/10 shadow-sm p-5 flex items-center gap-4">
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-300">
        <Users className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-gray-900 dark:text-blue-300">{groupCount}</p>
        <p className="text-sm text-gray-500 dark:text-slate-500">Groups</p>
      </div>
    </div>
  </div>
)
