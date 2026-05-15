import React from 'react'
import { Compass, Wallet, Printer } from 'lucide-react'
import { Itinerary } from '@/types/itinerary.types'

interface TripIntelligenceSidebarProps {
  itinerary: Itinerary
}

export const TripIntelligenceSidebar: React.FC<TripIntelligenceSidebarProps> = ({ itinerary }) => {
  return (
    <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
      <h3 className="text-xl font-black text-gray-900 mb-8 tracking-tight">Trip Intelligence</h3>
      
      <div className="space-y-8">
        <div className="flex items-start gap-5">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center flex-shrink-0">
            <Compass className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Best Season</div>
            <div className="text-sm font-bold text-gray-900 leading-snug">{itinerary.bestSeason || 'Spring / Autumn'}</div>
          </div>
        </div>
        
        <div className="flex items-start gap-5">
          <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center flex-shrink-0">
            <Wallet className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Budget Logic</div>
            <div className="text-sm font-bold text-gray-900 leading-snug">{itinerary.estimatedBudget || 'Moderate Expenditure'}</div>
          </div>
        </div>
      </div>

      <div className="mt-10 pt-10 border-t border-gray-100">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">Expert Guidelines</h4>
        <div className="space-y-2">
          {itinerary.generalTips?.map((tip, i) => (
            <div key={tip.id || i} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 transition-colors group">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-sm font-bold text-gray-600 group-hover:text-gray-900">{tip.content}</span>
            </div>
          ))}
        </div>
      </div>

      <button className="w-full mt-10 flex items-center justify-center gap-3 py-4 rounded-2xl bg-gray-50 text-gray-900 font-bold hover:bg-gray-100 transition-colors border border-gray-100">
        <Printer className="w-5 h-5" />
        Download PDF Itinerary
      </button>
    </div>
  )
}
