import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './Providers.tsx'
import { GoogleMapsProvider } from '@/components/providers/GoogleMapsProvider.tsx'
import { ErrorBoundary } from '@/components/layout/ErrorBoundary.tsx'
import { AppRouter } from './router.tsx'
import { CookieConsent } from '@/components/ui/CookieConsent.tsx'

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <GoogleMapsProvider>
            <AppRouter />
            <CookieConsent />
          </GoogleMapsProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
