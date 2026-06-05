# Routiq Backend

> **Stack:** NestJS 10 + TypeScript + Prisma 7 + PostgreSQL (Supabase)
>
> **Team:** Jan Ančevski, Klemen Novak, Mojca Marin

This guide serves as the main documentation and team onboarding guide for developers working in the `backend/` directory.

## Overview

The Routiq backend is a RESTful API built with NestJS, providing travel planning functionality including AI-powered itinerary generation, group travel management, and third-party integrations.

## Features

- **Authentication**: Supabase Auth on the frontend; backend verifies JWT via `supabase.auth.getUser()` (`JwtAuthGuard`)
- **AI Itinerary Generation**: Gemini-powered travel planning with real-time SSE streaming
- **Travel Management**: CRUD operations for itineraries, groups, and user profiles
- **External Integrations**: Google Places, Google Weather API
- **Notifications**: In-app notifications for votes, invites, and comments
- **Export**: ICS calendar file generation

## Project Structure & Ownership

```
backend/
├── prisma/
│   ├── schema.prisma         # Database schema definition
│   ├── seed.ts               # Development seed data
│   └── migrations/           # Auto-generated migrations (committed to git)
│
├── src/
│   ├── main.ts               # App bootstrap and global middleware/pipes/filters/interceptors
│   ├── app.module.ts         # Root module and feature imports
│   │
│   ├── config/               # Custom config service wrapper and config module
│   ├── prisma/               # Prisma client service + soft-delete extensions
│   ├── supabase/             # Supabase client for JWT verification
│   │
│   ├── common/               # Cross-cutting concerns (decorators, guards, interceptors, filters, shared types)
│   │
│   ├── auth/                 # Placeholder module (no HTTP routes — auth is Supabase-side)
│   ├── users/                # Profile, avatar, settings, account endpoints
│   ├── itinerary/            # Itinerary generation/list/get/update/delete/share + activities
│   ├── gemini/               # Google Gemini AI service
│   ├── attractions/          # Google Places search/details/alternatives
│   ├── weather/              # Weather forecast retrieval and cache
│   ├── groups/               # Collaboration groups (members, comments, votes, itinerary linking)
│   ├── notifications/        # In-app notification endpoints
│   ├── export/               # ICS export endpoints
│   ├── mail/                 # Resend email (internal service)
│   └── health/               # Public health endpoint
│
├── test/                     # Integration and E2E tests
├── .env                      # Environment variables (gitignored)
└── .env.example              # Example environment file
```

## Getting Started

### Prerequisites

- Node.js >= 20 LTS
- PostgreSQL database (local or Supabase)
- API keys for external services

### First-Time Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Set up environment variables**:
   Copy `.env.example` to `.env` and set the minimum required variables:
   - `DATABASE_URL` and `DIRECT_URL`
   - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_JWT_SECRET`
   - `GEMINI_API_KEY`, Google API keys
   - `FRONTEND_URL`, `CORS_ORIGIN`
3. **Generate Prisma client**:
   ```bash
   npm run prisma:generate
   ```
4. **Run database migrations**:
   ```bash
   npm run prisma:migrate dev
   ```
5. **Seed database (optional)**:
   ```bash
   npm run prisma:seed
   ```
6. **Start development server**:
   ```bash
   npm run start:dev
   ```

The API will be available at `http://localhost:3000/api`
Swagger documentation: `http://localhost:3000/api/docs`

### Port 3000 on Windows (automatic cleanup)

Before several npm scripts run, **`prestart` / `prestart:dev` / `prestart:debug` / `preprisma:generate`** execute **`../scripts/free-port.ps1 -Port 3000`**. That script lists processes **listening on TCP 3000** and **force-stops** them so Nest can always bind to the default port.

- Run npm commands from the **`backend/`** directory so `../scripts/` resolves to the repo root.
- If something else you care about is using 3000, stop it manually or avoid running these hooks.

## Available Scripts

```bash
# Development
npm run start:dev        # Frees port 3000, then start with hot reload
npm run start:debug      # Frees port 3000, then start with debugger + watch
npm start                # Frees port 3000, then one-shot nest start (no watch)

# Production
npm run build           # Build application (strict compile check)
npm run start:prod      # Start production server

# Database
npm run prisma:generate  # Frees port 3000, then generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Inspect DB records
npm run prisma:seed      # Run seed script

# Testing
npm run test             # Unit tests
npm run test:integration # Integration tests (requires PostgreSQL)
npm run test:e2e         # E2E tests (requires reachable DB)
npm run test:cov         # Coverage report

# Code quality
npm run lint             # Lint + autofix pass
npm run format           # Prettier format
```

## How Request Flow Works

For normal routes:

1. Request enters a controller method.
2. DTO validation runs globally.
3. Global auth guard (`JwtAuthGuard`) verifies Supabase JWT unless `@Public()`.
4. Controller delegates to service.
5. Service performs business logic and DB/API calls.
6. `TransformInterceptor` wraps success response to: `{ success: true, data: ... }` (optionally `meta`).
7. `AllExceptionsFilter` normalizes errors to: `{ success: false, error: { code, message, statusCode } }`.

## API Endpoints Overview

See [docs/api-reference.md](../docs/api-reference.md) for the full list. Summary:

- **Users**: `/api/users/profile`, `/settings`, `/avatar`, `/account`
- **Itineraries**: `/api/itinerary/generate` (SSE), CRUD, share, activity management
- **Attractions**: `/api/attractions/search`, `/:id`, `/:id/alternatives`
- **Weather**: `/api/weather`
- **Groups**: `/api/groups`, invitations, members, votes, comments, reactions
- **Notifications**: `/api/notifications`
- **Export**: `/api/export/:id/ics`, `/api/export/shared/:id/ics`
- **Health**: `/api/health`

> There are **no** `/api/auth/*` routes. Login/register/OAuth happen on the frontend via Supabase.

## Authentication Flow

1. **Login/Register/OAuth**: Handled by Supabase Auth on the frontend
2. **API Requests**: Frontend sends `Authorization: Bearer <supabase_access_token>`
3. **Backend verification**: `JwtAuthGuard` calls `supabase.auth.getUser(token)` and syncs user via `upsertUser()`
4. **Token refresh**: Supabase SDK on the client (`autoRefreshToken: true`)
5. **Global Guard**: All routes protected unless `@Public()` is applied

## Data Layer Notes

- `PrismaService` uses Prisma Client Extensions for soft-delete on selected models.
- Delete actions become soft-delete (`deletedAt`).
- Many reads automatically filter out soft-deleted rows.

## Architecture Principles & Conventions

- **Modular Design**: Each feature is a self-contained module in `src/<feature>/`.
- **Thin Controllers**: Controllers handle HTTP only (routing/DTO extraction). Keep business logic in services.
- **DTO Validation**: Add DTO classes with class-validator decorators for all incoming payloads.
- **Type Safety**: Strict TypeScript, no `any` types.
- **Prisma**: Reuse `PrismaService` for DB writes/reads. Export Prisma enums for use in DTOs.
- **Shared code**: Prefer shared helpers/types in `src/common/` when reused by multiple modules.

## Safe Feature Delivery Checklist

Before opening a PR:
- `npm run build` passes
- `npm run lint` passes
- Migration included if schema changed
- DTO validation exists for all new request inputs
- No secrets committed
- Endpoint behavior documented in PR description

## Team Workflow

- Branch names: `feature/<short-name>`, `fix/<short-name>`, `chore/<short-name>`
- Target branch for PRs: `development` (CI runs on `main` and `development`)
- Keep PRs small and feature-scoped.
- If Prisma schema changes: include migration + regenerated client changes as needed.

## Deployment & Troubleshooting

**Deployment**:
1. Set environment variables on hosting platform.
2. Run migrations: `npx prisma migrate deploy`
3. Start production server: `npm run start:prod`
*(Recommended platforms: Railway)*

**Troubleshooting**:
- **Prisma client errors**: Run `npx prisma generate`
- **Database connection issues**: Check `DATABASE_URL` format
- **Auth failures**: Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- **E2E Test Failures**: `npm run test:e2e` requires a reachable DB.

---
*License: UNLICENSED - Academic project for FERI*
