import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './Providers'
import { ROUTES } from '@/constants/routes'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

// Public pages
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'

// Protected pages
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { PlannerPage } from '@/features/planner/pages/PlannerPage'
import { ItineraryPage } from '@/features/itinerary/pages/ItineraryPage'
import { ItineraryEditPage } from '@/features/itinerary/pages/ItineraryEditPage'
import { GroupsPage } from '@/features/groups/pages/GroupsPage'
import { GroupDetailPage } from '@/features/groups/pages/GroupDetailPage'
import { ProfilePage } from '@/features/profile/pages/ProfilePage'

// Layout components
import { AppShell } from '@/components/layout/AppShell'

// 404 page
import { NotFoundPage } from '@/components/ui/NotFoundPage'

export const AppRouter: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path={ROUTES.LOGIN}
        element={
          isAuthenticated ? (
            <Navigate to={ROUTES.DASHBOARD} replace />
          ) : (
            <LoginPage />
          )
        }
      />
      <Route
        path={ROUTES.REGISTER}
        element={
          isAuthenticated ? (
            <Navigate to={ROUTES.DASHBOARD} replace />
          ) : (
            <RegisterPage />
          )
        }
      />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
        <Route path={ROUTES.PLANNER} element={<PlannerPage />} />
        <Route path={ROUTES.ITINERARY(':id')} element={<ItineraryPage />} />
        <Route path={ROUTES.ITINERARY_EDIT(':id')} element={<ItineraryEditPage />} />
        <Route path={ROUTES.GROUPS} element={<GroupsPage />} />
        <Route path={ROUTES.GROUP_DETAIL(':id')} element={<GroupDetailPage />} />
        <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
      </Route>

      {/* Shared itinerary route */}
      <Route path="/shared/:shareToken" element={<ItineraryPage />} />

      {/* 404 route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
