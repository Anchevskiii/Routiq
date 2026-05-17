import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { differenceInDays } from 'date-fns'
import { QUERY_KEYS } from '@/constants/queryKeys'
import { itineraryApi } from '@/api/itinerary.api'
import { groupsApi } from '@/api/groups.api'
import { useAuth } from '@/app/Providers'
import { stagger, fadeUp } from '../animations'
import { DashboardGreeting } from '../components/DashboardGreeting'
import { HeroCard, HeroCta } from '../components/HeroCard'
import { StatRow } from '../components/StatRow'
import { TripGrid } from '../components/TripGrid'
import { SidePanel } from '../components/SidePanel'

export const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const today = new Date()

  const { data: itinData, isLoading } = useQuery({
    queryKey: QUERY_KEYS.itineraries,
    queryFn: () => itineraryApi.listItineraries({ limit: 10 }),
  })
  const { data: groupData } = useQuery({
    queryKey: QUERY_KEYS.groups,
    queryFn: () => groupsApi.getGroups(),
  })

  const itineraries = itinData?.data ?? []
  const groups = groupData?.data ?? []
  const firstName = user?.name?.split(' ')[0] ?? 'Traveler'

  const nextTrip = itineraries
    .filter(it => new Date(it.startDate) > today)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0]

  const daysUntil = nextTrip ? differenceInDays(new Date(nextTrip.startDate), today) : null

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 px-6 py-6">
        <DashboardGreeting firstName={firstName} nextTrip={nextTrip} daysUntil={daysUntil} />

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5">
          <motion.div initial="hidden" animate="show" variants={stagger} className="flex flex-col gap-5">
            <motion.div variants={fadeUp}>
              {nextTrip ? <HeroCard trip={nextTrip} daysUntil={daysUntil!} /> : <HeroCta />}
            </motion.div>

            <StatRow
              total={itinData?.meta?.total ?? 0}
              recent={itineraries.length}
              groups={groups.length}
              shared={0}
            />

            <motion.div variants={fadeUp}>
              <TripGrid itineraries={itineraries} isLoading={isLoading} />
            </motion.div>
          </motion.div>

          <SidePanel groups={groups} itineraries={itineraries} />
        </div>
      </div>
    </div>
  )
}
