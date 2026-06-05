import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LoginForm }         from '@/features/auth/components/LoginForm'
import { LoginMapAnimation } from '@/features/auth/components/LoginMapAnimation'
import { useAuth } from '@/app/Providers'
import { AuthLayout } from '@/features/auth/components/AuthLayout'

type Stage = 'login' | 'map'

export const LoginPage: React.FC = () => {
  const { setLoginAnimating } = useAuth()
  const [stage, setStage] = useState<Stage>('login')
  const [name, setName]   = useState('Traveler')

  return (
    <AuthLayout
      title="Plan your next trip,"
      highlightedTitle="one pin at a time."
      subtitle="Sign in to drop pins, draw routes, and watch your itinerary come to life."
    >
      <AnimatePresence mode="wait">
        {stage === 'login' && (
          <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="relative sm:absolute sm:inset-0 grid place-items-center bg-white/60 dark:bg-transparent">
            <LoginForm onSuccess={(n) => { setName(n); setStage('map') }} />
          </motion.div>
        )}
        {stage === 'map' && (
          <div key="map" className="absolute inset-0">
            <LoginMapAnimation name={name} onEnd={() => setLoginAnimating(false)} />
          </div>
        )}
      </AnimatePresence>
    </AuthLayout>
  )
}
