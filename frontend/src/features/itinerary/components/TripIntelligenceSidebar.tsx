import React from 'react'
import { Compass, Wallet, Printer, Sparkles, ShoppingBag } from 'lucide-react'
import { Itinerary } from '@/types/itinerary.types'

interface TripIntelligenceSidebarProps {
  itinerary: Itinerary
}

<<<<<<< HEAD
function TIItem({ icon, label, value, darkColorClass, lightColorClass }: {
  icon: React.ReactNode; label: string; value: string
  darkColorClass: string; lightColorClass: string
}) {
  return (
    <div className="flex items-start gap-3 px-2 py-2.5 rounded-[11px] cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
      <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 ${lightColorClass} dark:hidden`}>
        {icon}
      </div>
      <div className={`w-9 h-9 rounded-[10px] items-center justify-center flex-shrink-0 ${darkColorClass} hidden dark:flex`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="text-[9.5px] font-mono font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-[#6e6c93] mb-1.5">
          {label}
        </div>
        <div className="text-[13px] font-medium text-gray-700 dark:text-[#d8d4ff] leading-snug">
=======
function TIItem({ icon, label, value, colorClass }: { icon: React.ReactNode; label: string; value: string; colorClass: string }) {
  return (
    <div className="flex items-start gap-3 px-2 py-2.5 rounded-[11px] cursor-pointer hover:bg-white/[0.03] transition-colors">
      <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 ${colorClass}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="text-[9.5px] font-mono font-semibold uppercase tracking-[0.12em] text-[#6e6c93] mb-1.5">
          {label}
        </div>
        <div className="text-[13px] font-medium text-[#d8d4ff] leading-snug">
>>>>>>> fix/group-itinerary-access
          {value}
        </div>
      </div>
    </div>
  )
}

export const TripIntelligenceSidebar: React.FC<TripIntelligenceSidebarProps> = ({ itinerary }) => {
  return (
<<<<<<< HEAD
    <div className="bg-white dark:bg-[rgba(22,24,48,0.6)] dark:backdrop-blur-xl border border-gray-200 dark:border-white/[0.07] rounded-[18px] overflow-hidden shadow-sm dark:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_10px_32px_-12px_rgba(0,0,0,0.6)]">
      <div className="flex items-center gap-2.5 px-4 py-3.5">
        <div className="w-7 h-7 rounded-[9px] bg-sky-50 dark:bg-sky-400/10 grid place-items-center flex-shrink-0 text-sky-500 dark:text-[#22d3ee]">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <span className="text-[14px] font-semibold text-gray-900 dark:text-[#f0eeff]" style={{ letterSpacing: '-0.005em' }}>
=======
    <div className="bg-[rgba(22,24,48,0.6)] backdrop-blur-xl border border-white/[0.07] rounded-[18px] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.4),0_10px_32px_-12px_rgba(0,0,0,0.6)]">
      <div className="flex items-center gap-2.5 px-4 py-3.5">
        <div className="w-7 h-7 rounded-[9px] bg-sky-400/10 grid place-items-center flex-shrink-0 text-[#22d3ee]">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <span className="text-[14px] font-semibold text-[#f0eeff]" style={{ letterSpacing: '-0.005em' }}>
>>>>>>> fix/group-itinerary-access
          Trip Intelligence
        </span>
      </div>

<<<<<<< HEAD
      <div className="border-t border-gray-100 dark:border-white/[0.07] px-3 py-2 flex flex-col gap-1">
=======
      <div className="border-t border-white/[0.07] px-3 py-2 flex flex-col gap-1">
>>>>>>> fix/group-itinerary-access
        <TIItem
          icon={<Compass className="w-4 h-4" />}
          label="Best season"
          value={itinerary.bestSeason || 'Spring / Autumn'}
<<<<<<< HEAD
          lightColorClass="bg-amber-50 text-amber-500"
          darkColorClass="bg-amber-400/10 text-amber-400"
=======
          colorClass="bg-amber-400/10 text-amber-400"
>>>>>>> fix/group-itinerary-access
        />
        <TIItem
          icon={<Wallet className="w-4 h-4" />}
          label="Budget logic"
          value={itinerary.estimatedBudget || 'Moderate expenditure'}
<<<<<<< HEAD
          lightColorClass="bg-green-50 text-green-600"
          darkColorClass="bg-green-400/10 text-green-400"
=======
          colorClass="bg-green-400/10 text-green-400"
>>>>>>> fix/group-itinerary-access
        />
        {itinerary.generalTips && itinerary.generalTips.length > 0 && (
          <TIItem
            icon={<Sparkles className="w-4 h-4" />}
            label="Local tip"
            value={itinerary.generalTips[0].content}
<<<<<<< HEAD
            lightColorClass="bg-violet-50 text-violet-600"
            darkColorClass="bg-violet-400/10 text-violet-400"
=======
            colorClass="bg-violet-400/10 text-violet-400"
>>>>>>> fix/group-itinerary-access
          />
        )}
        <TIItem
          icon={<ShoppingBag className="w-4 h-4" />}
          label="Pack for"
          value="Check weather forecasts before departure"
<<<<<<< HEAD
          lightColorClass="bg-sky-50 text-sky-500"
          darkColorClass="bg-sky-400/10 text-sky-400"
=======
          colorClass="bg-sky-400/10 text-sky-400"
>>>>>>> fix/group-itinerary-access
        />
      </div>

      {itinerary.generalTips && itinerary.generalTips.length > 1 && (
        <>
<<<<<<< HEAD
          <div className="h-px bg-gray-100 dark:bg-white/[0.07] mx-4" />
          <div className="px-4 py-3">
            <div className="text-[10px] font-mono font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-[#6e6c93] mb-2">
=======
          <div className="h-px bg-white/[0.07] mx-4" />
          <div className="px-4 py-3">
            <div className="text-[10px] font-mono font-semibold uppercase tracking-[0.12em] text-[#6e6c93] mb-2">
>>>>>>> fix/group-itinerary-access
              Expert guidelines
            </div>
            <div className="flex flex-col gap-1">
              {itinerary.generalTips.slice(1).map((tip, i) => (
                <div
                  key={tip.id || i}
<<<<<<< HEAD
                  className="flex items-start gap-2.5 px-2 py-2 rounded-[9px] hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                  <span className="text-[12px] font-medium text-gray-500 dark:text-[#a3a1c8] leading-snug">{tip.content}</span>
=======
                  className="flex items-start gap-2.5 px-2 py-2 rounded-[9px] hover:bg-white/[0.03] transition-colors cursor-pointer"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                  <span className="text-[12px] font-medium text-[#a3a1c8] leading-snug">{tip.content}</span>
>>>>>>> fix/group-itinerary-access
                </div>
              ))}
            </div>
          </div>
        </>
      )}

<<<<<<< HEAD
      <div className="h-px bg-gray-100 dark:bg-white/[0.07] mx-4" />

      <div className="mx-3.5 my-3.5 p-3.5 rounded-[12px] bg-sky-50 dark:bg-sky-400/[0.04] border border-sky-200 dark:border-sky-400/15">
        <h4 className="text-[13px] font-semibold text-gray-900 dark:text-[#f0eeff] mb-1.5">Export your itinerary</h4>
        <p className="text-[12px] text-gray-500 dark:text-[#a3a1c8] leading-snug mb-2.5">
=======
      <div className="h-px bg-white/[0.07] mx-4" />

      <div className="mx-3.5 my-3.5 p-3.5 rounded-[12px] bg-sky-400/[0.04] border border-sky-400/15">
        <h4 className="text-[13px] font-semibold text-[#f0eeff] mb-1.5">Export your itinerary</h4>
        <p className="text-[12px] text-[#a3a1c8] leading-snug mb-2.5">
>>>>>>> fix/group-itinerary-access
          Download a print-ready PDF with maps and activity details.
        </p>
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[11px] bg-gradient-to-b from-blue-500 to-blue-600 text-white text-[13px] font-semibold shadow-[0_6px_16px_-8px_rgba(37,99,235,0.6),inset_0_1px_0_rgba(255,255,255,0.2)] hover:-translate-y-px transition-transform">
          <Printer className="w-3.5 h-3.5" /> Download PDF
        </button>
      </div>
    </div>
  )
}
