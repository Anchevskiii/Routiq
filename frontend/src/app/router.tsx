import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './Providers'
import { ROUTES } from '@/constants/routes'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

// Public pages (lazy loaded)
const LoginPage = lazy(() =>
  import('@/features/auth/pages/LoginPage').then(m => ({ default: m.LoginPage }))
)
const RegisterPage = lazy(() =>
  import('@/features/auth/pages/RegisterPage').then(m => ({ default: m.RegisterPage }))
)

// Protected pages (lazy loaded)
const DashboardPage = lazy(() =>
  import('@/features/dashboard/pages/DashboardPage').then(m => ({ default: m.DashboardPage }))
)
const PlannerPage = lazy(() =>
  import('@/features/planner/pages/PlannerPage').then(m => ({ default: m.PlannerPage }))
)
const ItineraryPage = lazy(() =>
  import('@/features/itinerary/pages/ItineraryPage').then(m => ({ default: m.ItineraryPage }))
)
const ItineraryEditPage = lazy(() =>
  import('@/features/itinerary/pages/ItineraryEditPage').then(m => ({ default: m.ItineraryEditPage }))
)
const TripsPage = lazy(() =>
  import('@/features/itinerary/pages/TripsPage').then(m => ({ default: m.TripsPage }))
)
const GroupsPage = lazy(() =>
  import('@/features/groups/pages/GroupsPage').then(m => ({ default: m.GroupsPage }))
)
const GroupDetailPage = lazy(() =>
  import('@/features/groups/pages/GroupDetailPage').then(m => ({ default: m.GroupDetailPage }))
)
const NotificationsPage = lazy(() =>
  import('@/features/groups/pages/NotificationsPage').then(m => ({ default: m.NotificationsPage }))
)
const ProfilePage = lazy(() =>
  import('@/features/profile/pages/ProfilePage').then(m => ({ default: m.ProfilePage }))
)

// Layout components
import { AppShell } from '@/components/layout/AppShell'

// 404 page (lazy loaded)
const NotFoundPage = lazy(() =>
  import('@/components/ui/NotFoundPage').then(m => ({ default: m.NotFoundPage }))
)

const PageFallback: React.FC = () => (
  <div className="h-full min-h-[60vh] flex items-center justify-center">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
  </div>
)

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
    <Suspense fallback={<PageFallback />}>
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
          <Route path={ROUTES.TRIPS} element={<TripsPage />} />
          <Route path={ROUTES.ITINERARY(':id')} element={<ItineraryPage />} />
          <Route path={ROUTES.ITINERARY_EDIT(':id')} element={<ItineraryEditPage />} />
          <Route path={ROUTES.GROUPS} element={<GroupsPage />} />
          <Route path={ROUTES.GROUP_DETAIL(':id')} element={<GroupDetailPage />} />
          <Route path={ROUTES.NOTIFICATIONS} element={<NotificationsPage />} />
          <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
        </Route>

        {/* Shared itinerary route */}
        <Route path="/shared/:shareToken" element={<ItineraryPage />} />

        {/* 404 route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
