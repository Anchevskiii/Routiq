import React from 'react'
import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'

interface Destination {
  name: string
  country: string
  flag: string
  code: string
  temp: string
  pop: string
}

interface Props {
  destination: string
  matched?: Destination
  season: string | null
}

export const TripPreviewHero: React.FC<Props> = ({ destination, matched, season }) => (
  <div className="relative h-[280px] rounded-t-[22px] overflow-hidden trip-hero-bg">
    <div className="absolute top-4 left-4 right-4 flex gap-2 items-center">
      <span className="px-2.5 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-[0.08em] flex items-center gap-1.5 bg-white/[0.22] text-white/95 border border-white/30 backdrop-blur-sm">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_8px_currentColor] animate-pulse" />
        live preview
      </span>
      <span className="ml-auto" />
      {matched && (
        <span className="px-2.5 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-[0.08em] text-white/85 bg-white/15 border border-white/25 backdrop-blur-md">
          {matched.code}
        </span>
      )}
      {season && (
        <span className="px-2.5 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-[0.08em] text-white/85 bg-white/15 border border-white/25 backdrop-blur-md">
          {season}
        </span>
      )}
    </div>

    {/* Framer Motion rings — x/y are Framer transform props, cannot be Tailwind */}
    {[0, 1.3, 2.6].map((delay, i) => (
      <motion.span
        key={i}
        style={{ position: 'absolute', left: '50%', top: '42%', x: '-50%', y: '-50%', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.55)', display: 'block' }}
        animate={{ width: [60, 480], height: [60, 480], opacity: [0.75, 0] }}
        initial={{ width: 60, height: 60, opacity: 0.75 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeOut', delay }}
      />
    ))}

    {/* Framer Motion center pin — x/y are Framer transform props */}
    <motion.div
      style={{ position: 'absolute', left: '50%', top: '42%', x: '-50%', y: '-50%', width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.20)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.40)', display: 'grid', placeItems: 'center', color: 'white', boxShadow: '0 12px 30px rgba(0,0,0,0.2)', zIndex: 10 }}
      animate={{ scale: [1, 1.08, 1] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
    >
      {matched ? <span className="text-3xl">{matched.flag}</span> : <MapPin className="w-7 h-7" />}
    </motion.div>

    <div className="absolute left-1/2 bottom-7 -translate-x-1/2 text-center text-white z-20">
      <div className="text-[11px] font-mono uppercase tracking-[0.14em] mb-2 drop-shadow-[0_1px_6px_rgba(0,0,0,0.25)]">Where to</div>
      <div className="text-4xl leading-none tracking-tight font-semibold drop-shadow-[0_4px_24px_rgba(0,0,0,0.15)]">
        {destination
          ? <>{destination}<em className="font-serif italic font-normal">.</em></>
          : <em className="font-serif italic font-normal">untitled trip</em>}
      </div>
      <div className="text-[13px] font-mono tracking-wider opacity-75 mt-1">
        {matched ? matched.country.toUpperCase() : 'AWAITING DESTINATION'}
      </div>
    </div>
  </div>
)
