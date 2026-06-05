# Routiq Frontend

> **Stack:** React 18 + TypeScript + Vite
>
> **Team:** Jan Ančevski, Klemen Novak, Mojca Marin

This guide serves as the main documentation and team onboarding guide for developers working in the `frontend/` directory.

## Overview

The Routiq frontend is a single-page application built with React and Vite. It handles everything from user authentication to complex wizard-based travel planning, live AI generation streaming, and dynamic map rendering.

## Key Technologies

- **Routing**: React Router v6
- **Styling**: Tailwind CSS (Utility-first)
- **HTTP Client**: Axios `1.14.0` (Pinned for security - DO NOT UPGRADE)
- **Auth**: Supabase JS SDK (`@supabase/supabase-js`)
- **Forms**: React Hook Form + Zod validation
- **Server State**: TanStack Query (React Query)
- **Maps**: Google Maps JavaScript SDK
- **Export**: `@react-pdf/renderer` (Client-side PDF in `features/itinerary/pdf/`)

## Project Structure

The project strictly follows a **feature-based** directory structure:

```
frontend/
├── src/
│   ├── api/              # All API calls (Axios instance, Supabase client, feature endpoints)
│   ├── app/              # Router, AuthProvider (useAuth), global providers
│   ├── components/       # Shared UI primitives and Layouts
│   │   ├── layout/       # AppShell, Sidebar, Topbar, NotificationsDropdown, ErrorBoundary
│   │   └── ui/           # Buttons, Inputs, Modals, Spinners, etc.
│   ├── constants/        # Query keys, Routes, generic constants
│   ├── features/         # Feature modules (auth, landing, planner, itinerary, groups, help...)
│   │   └── <feature>/    # Each feature has its own pages/, components/, hooks/
│   ├── hooks/            # Global reusable React hooks (e.g., useDebounce, useStream)
│   ├── types/            # Shared TypeScript interfaces
│   └── utils/            # Pure functions (date, formatting, validation)
```

## First-Time Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Environment variables**:
   Copy `.env.example` to `.env` and configure:
   ```env
   VITE_API_URL=http://localhost:3000/api
   VITE_GOOGLE_MAPS_API_KEY=your_key_here
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_APP_NAME=Routiq
   VITE_APP_DESCRIPTION=Travel planning made simple
   ```
   > ⚠️ **IMPORTANT**: `VITE_GOOGLE_MAPS_API_KEY` is the ONLY third-party API key for maps display. Never expose Gemini, Google Weather, or Places keys here.

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

   On **Windows**, `npm run dev` first runs **`predev`**, which executes **`../scripts/free-port.ps1 -Port 5173`**. That finds processes **listening on 5173** (usually a leftover Vite/Node instance), logs **PID and name**, and stops them so Vite can bind to **5173** every time.

   Vite is configured with **`strictPort: true`**: if 5173 is still taken after cleanup, the command **fails** instead of switching to 5174+ (which avoids mismatched URLs and CORS). Run npm from **`frontend/`** so `../scripts/` resolves correctly.

## Development Commands

```bash
npm run dev        # Free port 5173 (Windows), then Vite dev server + HMR on :5173
npm run build      # Build the application for production
npm run preview    # Preview the production build locally
npm run lint       # Run ESLint to check for code issues
npm run test:unit:run  # Run Vitest unit tests once
npm run test:e2e   # Run Playwright E2E tests
```

## Architecture Principles & Rules

1. **TypeScript**: Never use `any`. Use proper interfaces, types, or `unknown`. All component props must have explicit types.
2. **API Layer**: Components must **never** call `axios` or `fetch` directly. Always import pre-defined functions from `src/api/`. Use `TanStack Query` for all data fetching.
3. **State Management**:
   - Server data: `TanStack Query`
   - Auth state: `AuthProvider` / `useAuth()` in `src/app/Providers.tsx`
   - Form state: `React Hook Form`
   - Local state: `useState`
4. **Imports**: Always use the `@/` import alias. Do not use complex relative paths (`../../../`).
5. **Styling**: Only use Tailwind CSS. No inline styles or CSS modules.
6. **Component Structure**:
   - Limit files to ~150 lines.
   - Use **Named Exports** exclusively (no `export default`).
   - If a component is used in ≥ 2 features, move it to `src/components/`. If it is specific to one feature, keep it inside `src/features/<feature>/components/`.

## Authentication Flow

1. User logs in via **Supabase Auth** (`signInWithPassword`, `signUp`, or `signInWithOAuth` for Google).
2. Session is stored in **sessionStorage** (Supabase client config) — not in `localStorage`.
3. `AuthProvider` fetches profile via `GET /users/profile` after login.
4. Axios interceptors attach the Bearer token from the Supabase session.
5. Token refresh is handled by Supabase SDK (`autoRefreshToken: true`), not a backend `/auth/refresh` endpoint.
6. For file downloads (`.ics`), a session cookie `sb-access-token` is synced for GET requests.

## Workflow & PR Checklist

- Branch names: `feature/<name>`, `fix/<name>`, `chore/<name>`
- Create small, focused pull requests targeting the `development` branch.
- **Before submitting a PR**:
  - Check that the UI is responsive (mobile & desktop).
  - Ensure all forms use Zod validation.
  - Verify that no sensitive API keys are exposed.
  - Verify `npm run lint` passes.

---
*For detailed guidelines, refer to `FRONTEND_ARCHITECTURE.md`.*
