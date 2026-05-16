import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Calendar, Users, Heart } from 'lucide-react'
import { fadeUp, stagger } from '../animations'

const STATS = [
  { key: 'total',  label: 'Total trips', icon: TrendingUp, cls: 'bg-indigo-50 dark:bg-indigo-900/30  text-indigo-500'  },
  { key: 'recent', label: 'Recent',      icon: Calendar,   cls: 'bg-violet-50 dark:bg-violet-900/30  text-violet-500'  },
  { key: 'groups', label: 'Groups',      icon: Users,      cls: 'bg-sky-50    dark:bg-sky-900/30     text-sky-500'     },
  { key: 'shared', label: 'Shared',      icon: Heart,      cls: 'bg-pink-50   dark:bg-pink-900/30    text-pink-500'    },
]

interface Props {
  total: number
  recent: number
  groups: number
  shared: number
}

export const StatRow: React.FC<Props> = ({ total, recent, groups, shared }) => {
  const values: Record<string, number> = { total, recent, groups, shared }

  return (
    <motion.div variants={stagger} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {STATS.map(({ key, label, icon: Icon, cls }) => (
        <motion.div
          key={key}
          variants={fadeUp}
          whileHover={{ y: -3, scale: 1.03 }}
          className="rounded-2xl p-4 flex flex-col gap-2 bg-white dark:bg-[#16142e] shadow-sm"
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${cls}`}>
            <Icon className="w-[15px] h-[15px]" />
          </div>
          <div className="text-2xl font-bold leading-none text-indigo-950 dark:text-indigo-100">{values[key]}</div>
          <div className="text-xs font-medium text-slate-400 dark:text-slate-500">{label}</div>
        </motion.div>
      ))}
    </motion.div>
  )
}
