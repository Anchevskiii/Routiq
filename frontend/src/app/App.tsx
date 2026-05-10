import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './Providers.tsx'
import { GoogleMapsProvider } from '@/components/providers/GoogleMapsProvider.tsx'
import { ErrorBoundary } from '@/components/layout/ErrorBoundary.tsx'
import { AppRouter } from './router.tsx'

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <GoogleMapsProvider>
            <AppRouter />
          </GoogleMapsProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
