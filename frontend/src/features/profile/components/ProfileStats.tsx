import React from 'react'
import { MapPin, Users } from 'lucide-react'

interface Props {
  itineraryCount: number
  groupCount: number
}

export const ProfileStats: React.FC<Props> = ({ itineraryCount, groupCount }) => (
  <div className="grid grid-cols-2 gap-4 mb-8">
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
        <MapPin className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-gray-900">{itineraryCount}</p>
        <p className="text-sm text-gray-500">Itineraries</p>
      </div>
    </div>
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
        <Users className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-gray-900">{groupCount}</p>
        <p className="text-sm text-gray-500">Groups</p>
      </div>
    </div>
  </div>
)
