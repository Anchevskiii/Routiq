---
trigger: always_on
---

ROUTIQ PROJECT RULESET

This is the Routiq backend — NestJS 10 + TypeScript + Prisma + PostgreSQL (Supabase).

Stack: NestJS 10, TypeScript, Prisma ORM, PostgreSQL (Supabase),
Passport.js (JWT + Google OAuth), class-validator + class-transformer,
Axios 1.14.0 (pinned – do NOT upgrade), @nestjs/throttler, Winston, Jest + Supertest.

Rules:
- Never use `any`. Use proper interfaces, types, or `unknown`.
- All incoming request data must be validated via DTO classes with class-validator decorators.
- Only named exports.
- Naming: Classes = PascalCase, methods/variables = camelCase, files = kebab-case.
- Controllers handle ONLY routing. No business logic in controllers.
- Services handle ONLY business logic. No HTTP-specific code in services.
- All DB operations go through PrismaService.
- All API keys stay on the backend. Never expose Gemini, OpenWeather, Places, or Spotify keys.
- Global ValidationPipe is set up in main.ts – do not add manual validation in controllers.
- Rate-limit AI endpoints: max 5 requests/minute per user.
- All responses follow { success, data } or { success, error } format via TransformInterceptor.
- AI generation timeout: 20 seconds.
- Cache OpenWeather responses for 1 hour.
- Never commit .env files.

Project structure (inside backend/src/):
- auth/        → JWT + Google OAuth
- users/       → User profile management
- itinerary/   → Core: AI generation + CRUD
- gemini/      → Gemini AI service
- attractions/ → Google Places proxy
- weather/     → OpenWeather proxy + caching
- groups/      → Group travel management
- export/      → .ics file generation
- spotify/     → Playlist generation (iter. 4)
- common/      → Guards, filters, interceptors, decorators, types
- prisma/      → Prisma service singleton

------------------------------------------------------------------------------------------------

This is the Routiq frontend — a React 18 + TypeScript app built with Vite.

Stack: React Router v6, Tailwind CSS, Axios 1.14.0 (pinned – do NOT upgrade),
React Hook Form + Zod, TanStack Query (React Query), date-fns,
Google Maps JavaScript SDK (@react-google-maps/api),
@react-pdf/renderer, Framer Motion, Lucide React.

Rules:
- Never use `any`. Use proper interfaces, types, or `unknown`.
- All component props must have explicit TypeScript types.
- Only named exports – never `export default`.
- Naming: Components/Pages = PascalCase, hooks = camelCase with `use` prefix,
  utils = camelCase, constants = SCREAMING_SNAKE_CASE.
- Always use the `@/` import alias. Never use relative paths across folders.
- Import order: React → external packages → internal (@/) → relative.
- All API calls go through functions in `src/api/` – never call axios directly in components.
- Use TanStack Query for all server data fetching. No manual fetch + useState + useEffect.
- Use React Hook Form + Zod for all forms and validation.
- Use date-fns for all date operations.
- Tailwind CSS only for styling – no inline styles, no CSS modules.
- Keep components under ~150 lines. Split if longer.
- Do not install new packages without team approval.
- Never expose API keys (Gemini, OpenWeather, Spotify, Places) on the client.
  Only VITE_GOOGLE_MAPS_API_KEY is allowed on frontend.
- AI generation uses SSE streaming from backend – never call Gemini directly from FE.

Project structure (inside frontend/):
- src/api/               → API functions per feature + axios instance
- src/app/               → Router, global providers
- src/components/ui/     → Primitive UI components (Button, Input, Modal...)
- src/components/layout/ → AppShell, Sidebar, Topbar, ProtectedRoute
- src/features/          → One folder per feature (auth, planner, itinerary, groups...)
  Each feature: pages/, components/, hooks/
- src/hooks/             → Shared custom hooks
- src/types/             → Shared TypeScript types and interfaces
- src/utils/             → Pure utility functions
- src/constants/         → Route paths, query keys, enums