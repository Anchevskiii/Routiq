import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ROUTES } from '@/constants/routes'
import { fadeUp, stagger } from '../animations'
import { GroupCard } from './GroupCard'
import { ActivityFeed } from './ActivityFeed'
import { InspirationCard } from './InspirationCard'
import type { Group } from '@/types/group.types'
import type { Itinerary } from '@/types/itinerary.types'

interface Props {
  groups: Group[]
  itineraries: Itinerary[]
}

export const SidePanel: React.FC<Props> = ({ groups, itineraries }) => (
  <motion.div initial="hidden" animate="show" variants={stagger} className="flex flex-col gap-5">
    <motion.section variants={fadeUp} className="rounded-2xl p-4 bg-white dark:bg-[#16142e] shadow-sm">
      <div className="flex items-center justify-between mb-3.5">
        <h3 className="text-sm font-bold text-indigo-950 dark:text-indigo-100">Active groups</h3>
        <Link to={ROUTES.GROUPS} className="text-xs font-semibold text-indigo-500">View all</Link>
      </div>
      {groups.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-4">No groups yet.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {groups.slice(0, 3).map((g, i) => (
            <GroupCard key={g.id} group={g} index={i} />
          ))}
        </div>
      )}
    </motion.section>

    <motion.section variants={fadeUp} className="rounded-2xl p-4 bg-white dark:bg-[#16142e] shadow-sm">
      <h3 className="text-sm font-bold mb-3.5 text-indigo-950 dark:text-indigo-100">Activity</h3>
      <ActivityFeed itineraries={itineraries.slice(0, 4)} />
    </motion.section>

    <motion.section variants={fadeUp}>
      <div className="flex items-center justify-between mb-3.5">
        <h3 className="text-sm font-bold text-indigo-950 dark:text-indigo-100">Inspiration</h3>
        <button className="text-xs font-semibold text-indigo-500">More</button>
      </div>
      <InspirationCard />
    </motion.section>
  </motion.div>
)
