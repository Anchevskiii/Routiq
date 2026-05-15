import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

const CARDS = [
  { city: 'Santorini', tag: 'Romantično', palette: ['#f59e0b', '#ec4899'], price: 'od 450 €' },
  { city: 'Dubrovnik', tag: 'Obala',      palette: ['#0ea5e9', '#6366f1'], price: 'od 280 €' },
  { city: 'Praga',     tag: 'Kulturno',   palette: ['#10b981', '#0ea5e9'], price: 'od 190 €' },
]

export const InspirationCard: React.FC = () => {
  const card = CARDS[Math.floor(Date.now() / 86400000) % CARDS.length]

  return (
    <motion.div
      className="relative rounded-2xl overflow-hidden cursor-pointer min-h-[120px]"
      style={{ background: `linear-gradient(135deg, ${card.palette[0]}, ${card.palette[1]})` }}
      whileHover={{ y: -3, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
    >
      <div className="relative z-10 p-4 flex flex-col min-h-[120px]">
        <span className="self-start text-xs font-semibold px-2.5 py-0.5 rounded-full mb-auto bg-white/20 text-white">
          {card.tag}
        </span>
        <div className="flex items-end justify-between mt-3">
          <div>
            <div className="text-lg font-bold text-white">{card.city}</div>
            <div className="text-xs text-white/75">{card.price}</div>
          </div>
          <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white">
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
