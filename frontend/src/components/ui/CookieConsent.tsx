import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { motion, AnimatePresence } from 'framer-motion'

export const CookieConsent: React.FC = () => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('routiq_cookie_consent')
    if (!consent) {
      // Show consent banner after a short delay
      const timer = setTimeout(() => setVisible(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('routiq_cookie_consent', 'accepted')
    setVisible(false)
  }

  const handleDecline = () => {
    localStorage.setItem('routiq_cookie_consent', 'declined')
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="fixed bottom-6 right-6 left-6 md:left-auto md:max-w-md z-50"
        >
          <div className="bg-white/80 dark:bg-[#0d0f26]/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-6 flex flex-col gap-4 text-left">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 text-blue-500">
                🍪
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Cookie Consent</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  We use cookies to maintain your login session and enhance your experience. 
                  Read our{' '}
                  <Link to={ROUTES.PRIVACY} className="underline text-blue-500 hover:text-blue-600">
                    Privacy Policy
                  </Link>{' '}
                  for details.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end text-sm">
              <button
                onClick={handleDecline}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
              >
                Essential Only
              </button>
              <button
                onClick={handleAccept}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium shadow-md transition-colors"
              >
                Accept All
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
