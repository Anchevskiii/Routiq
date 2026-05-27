export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PLANNER: '/planner',
  ITINERARY: (id: string) => `/itinerary/${id}`,
  ITINERARY_EDIT: (id: string) => `/itinerary/${id}/edit`,
  SHARED_ITINERARY: (shareToken: string) => `/shared/${shareToken}`,
  GROUPS: '/groups',
  GROUP_DETAIL: (id: string) => `/groups/${id}`,
  NOTIFICATIONS: '/notifications',
  PROFILE: '/profile',
  TRIPS: '/trips',
} as const

export type RouteKey = keyof typeof ROUTES
