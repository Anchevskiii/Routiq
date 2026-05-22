import React from 'react'
import { Calendar, Compass, Printer, Wallet } from 'lucide-react'
import toast from 'react-hot-toast'
import { pdf } from '@react-pdf/renderer'
import { saveAs } from 'file-saver'

import { exportApi } from '@/api/export.api'
import { Itinerary } from '@/types/itinerary.types'
import { ItineraryPdfDocument } from '../pdf/ItineraryPdfDocument'

interface TripIntelligenceSidebarProps {
  itinerary: Itinerary
}

export const TripIntelligenceSidebar: React.FC<TripIntelligenceSidebarProps> = ({ itinerary }) => {
  const handleDownloadPdf = async () => {
    try {
      const pdfDocument = <ItineraryPdfDocument itinerary={itinerary} />
      const pdfBlob = await pdf(pdfDocument).toBlob()
      saveAs(pdfBlob, `itinerary-${itinerary.id}.pdf`)
    } catch {
      toast.error('Failed to generate PDF itinerary')
    }
  }

  const handleDownloadIcs = async () => {
    try {
      await exportApi.exportIcs(itinerary.id)
    } catch {
      toast.error('Failed to download ICS file')
    }
  }

  return (
    <div className="bg-white dark:bg-[#16142e] rounded-[2rem] shadow-xl shadow-gray-200/50 dark:shadow-black/20 border border-gray-100 dark:border-indigo-500/10 p-8 sticky top-8">
      <h3 className="text-xl font-black text-gray-900 dark:text-indigo-100 mb-8 tracking-tight">Trip Intelligence</h3>

      <div className="space-y-8">
        <div className="flex items-start gap-5">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0">
            <Compass className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">Best Season</div>
            <div className="text-sm font-bold text-gray-900 dark:text-indigo-100 leading-snug">{itinerary.bestSeason || 'Spring / Autumn'}</div>
          </div>
        </div>

        <div className="flex items-start gap-5">
          <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
            <Wallet className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">Budget Logic</div>
            <div className="text-sm font-bold text-gray-900 dark:text-indigo-100 leading-snug">{itinerary.estimatedBudget || 'Moderate Expenditure'}</div>
          </div>
        </div>
      </div>

      <div className="mt-10 pt-10 border-t border-gray-100 dark:border-indigo-500/10">
        <h4 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-6">Expert Guidelines</h4>
        <div className="space-y-2">
          {itinerary.generalTips?.map((tip, i) => (
            <div key={tip.id || i} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-sm font-bold text-gray-600 dark:text-slate-400 group-hover:text-gray-900 dark:group-hover:text-indigo-100">{tip.content}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 pt-10 border-t border-gray-100 dark:border-indigo-500/10 space-y-3">
        <button
          type="button"
          onClick={handleDownloadPdf}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 text-gray-900 dark:text-indigo-100 font-bold hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors border border-gray-100 dark:border-slate-700"
        >
          <Printer className="w-5 h-5" />
          Download PDF Itinerary
        </button>
        <button
          type="button"
          onClick={handleDownloadIcs}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-white dark:bg-slate-900/50 text-gray-900 dark:text-indigo-100 font-bold hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors border border-gray-100 dark:border-slate-700"
        >
          <Calendar className="w-5 h-5" />
          Add to Calendar
        </button>
      </div>
    </div>
  )
}
