# Routiq Backend – Unit Test Documentation

## Overview

This document describes what is tested, why, and how to run the tests.
All tests are **unit tests** — no database, no network, no Supabase calls.
Every external dependency is replaced with a Jest mock.

---

## Running the tests

```bash
# Run all tests once (from the backend/ directory)
npx jest

# Run a single spec file
npx jest jwt-auth.guard.spec
npx jest itinerary.service.spec
npx jest itinerary.controller.spec
npx jest auth-decorators.spec

# Run in watch mode while developing (re-runs on every file save)
npx jest --watch

# Show a coverage report
npx jest --coverage
```

> Tests are **not wired to git push**. They only run when you invoke them manually.
> If you later add CI (GitHub Actions, etc.), add `npx jest` to the workflow file at that point.

---

## Test files

```
src/
├── common/
│   ├── guards/
│   │   └── jwt-auth.guard.spec.ts        ← Guard behaviour
│   └── decorators/
│       └── auth-decorators.spec.ts       ← @Public() and @CurrentUser()
└── itinerary/
    ├── itinerary.controller.spec.ts      ← HTTP routing layer
    └── itinerary.service.spec.ts         ← Business logic layer
└── users/
    └── users.service.spec.ts             ← User profile + settings + avatar flows
```

---

## `jwt-auth.guard.spec.ts`

**What it covers:** The `JwtAuthGuard`, which runs on every non-public HTTP request.
Its job is to extract a Bearer token, verify it with Supabase, sync the user to the
local database, and attach a `JwtPayload` to `request.user`.

**How the mock works:** `passport-jwt` is mocked at the top of the file with
`jest.mock('passport-jwt', ...)` *before* the guard is imported. This is required
because the guard calls `ExtractJwt.fromAuthHeaderAsBearerToken()` at runtime —
if we didn't mock it at module load time, the real implementation would try to parse
Express headers from our plain mock objects and silently return `null`, causing
every test to resolve `true` instead of throwing.

| Group | What is asserted |
|---|---|
| **Public routes** | Routes decorated with `@Public()` return `true` immediately; Supabase is never called. The guard reads metadata from both the handler and the class. |
| **Missing token** | When `ExtractJwt` returns `null` or `""`, the guard throws `UnauthorizedException('Missing bearer token')`. |
| **Supabase unavailable** | When `getClient()` returns `null`, the guard throws `UnauthorizedException('Authentication service unavailable')` and never calls `getUser`. |
| **Invalid / expired token** | Supabase `getUser` returning an error throws `UnauthorizedException` with the error's message, or a fallback message if the error object has no `message` field. A `null` user with a `null` error also throws. |
| **Valid token** | Returns `true`, attaches `{ sub, email, role, user_metadata, app_metadata }` to `request.user`, calls `upsertUser` with the correct data, and passes the extracted token string to Supabase. |
| **Anonymous users** | When Supabase returns a user with no email (phone-only or anonymous), the email is set to `<user.id>@anonymous.routiq.local`. `upsertUser` receives `name: undefined` and `avatarUrl: undefined`. |
| **upsertUser failure** | If the local DB sync throws, the guard still returns `true` and still attaches `request.user`. The error is swallowed (logged as a warning in production). |

---

## `auth-decorators.spec.ts`

**What it covers:** The two shared auth decorators.

### `@Public()`

| Test | What is asserted |
|---|---|
| Decorated handler | `Reflect.getMetadata('isPublic', handler)` returns `true` |
| Undecorated handler | `Reflect.getMetadata('isPublic', handler)` returns `undefined` |
| Key value | `IS_PUBLIC_KEY` is the string `"isPublic"` — must match what the guard reads |

### `@CurrentUser()`

The decorator's factory is a single line: `return data ? user[data] : user`.
Tests call that logic directly rather than going through NestJS's full
parameter resolution pipeline.

| Test | What is asserted |
|---|---|
| No argument | Returns the entire `JwtPayload` object |
| Field argument (`'sub'`, `'email'`, `'role'`) | Returns only that field |
| Unknown field | Returns `undefined` without throwing |
| `request.user` is undefined | Returns `undefined` without throwing (guard didn't run) |

---

## `itinerary.controller.spec.ts`

**What it covers:** The `ItineraryController` routing layer.
The `ItineraryService` is fully mocked — controller tests only verify
that the controller calls the right service method with the right arguments
and shapes the response correctly.

| Endpoint | Tests |
|---|---|
| `POST /itinerary/generate` | Each SSE emission is wrapped in `{ data: ... }`; stream errors propagate to the subscriber |
| `GET /itinerary` | Defaults to page 1, limit 10 when query params are absent; parses string query params to integers; always uses the authenticated user's id |
| `GET /itinerary/:id` | Passes `id` and `user.sub` to the service; surfaces `NotFoundException` |
| `PATCH /itinerary/:id` | Passes `id`, `user.sub`, and the DTO to the service; surfaces `NotFoundException` |
| `DELETE /itinerary/:id` | Returns the success message; surfaces `NotFoundException` |
| `POST /itinerary/:id/share` | Returns the share token; calling twice still only calls the service once |
| `GET /itinerary/shared/:shareToken` | Calls `getItineraryByShareToken` with only the token (no user id); surfaces `NotFoundException` |

---

## `itinerary.service.spec.ts`

**What it covers:** The `ItineraryService` business logic.
Prisma, GeminiService, AttractionsService, and WeatherService are all mocked.

### `getUserItineraries`

Verifies pagination math: `skip = (page - 1) * limit`, `totalPages = ceil(total / limit)`.
Verifies the query is scoped to the requesting user's `userId`.

### `getItineraryById`

Verifies the happy path, `NotFoundException` on a missing record,
and the special case where `userId` is falsy (used by the share-token path)
— in that case the `userId` key must be absent from the Prisma `where` clause entirely.

### `getItineraryByShareToken`

Verifies lookup by `shareToken` and `NotFoundException` for an unknown token.

### `updateItinerary`

Verifies ownership check before update, `NotFoundException` when the record
doesn't belong to the user, and a documented limitation: even if `travelType`
is passed in the DTO it is not written to the database (the service's `update`
call only spreads `destination`, `startDate`, `endDate`).

### `deleteItinerary`

Verifies the ownership check, the `delete` call, the success message,
and that `delete` is never called when the record is not found.

### `generateShareToken`

Verifies that a new random token is generated and persisted when none exists,
that the existing token is returned as-is without calling `update` again,
and `NotFoundException` for unowned records.

### `generateStream`

This is the most complex method — it chains weather fetch → attractions fetch →
Gemini SSE stream → Prisma transaction.

**How the mock works for event ordering:** The Gemini observable is mocked with
`concat(of(progressEvent).pipe(delay(0)), of(completeEvent).pipe(delay(1)))`.
The `delay` is needed because `switchMap` cancels the outer observable when a new
inner observable arrives — without the delay, the progress event would be dropped.

| Test | What is asserted |
|---|---|
| Event ordering | Progress events appear before the complete event |
| Complete payload | The `complete` event contains the persisted `itineraryId` |
| Weather call | `WeatherService.getForecast` is called with the correct destination and ISO date string |
| Tip persistence | `itineraryTip.create` is called once per tip in `generalTips` |
| Weather failure | If weather fetch rejects, the stream emits `{ type: 'error', error: message }` instead of throwing to the subscriber |
| Gemini failure | If the Gemini observable errors, same — emits an error event, does not throw |

### Private helpers

These are accessed directly via `(service as any).methodName()`.

| Helper | Tests |
|---|---|
| `generateRandomToken` | Returns a non-empty string; two successive calls return different values |
| `hashString` | Same input always produces the same hash; different inputs produce different hashes; always returns a string |

## `users.service.spec.ts`

**What it covers:** The `UsersService` profile, settings, avatar, and account lifecycle logic.

**How it works:** Prisma and Supabase are mocked; uploads and auth deletes are simulated.
No real Supabase calls are made.

| Test group | What is asserted |
|---|---|
| `upsertUser` | Creates/updates users with default name/avatar and updates `lastLoginAt`. |
| `updateProfile` | Throws on missing user; throws on email conflict; updates profile on success. |
| `getSettings`/`updateSettings` | Merges defaults with stored metadata and persists updates. |
| `uploadAvatarFile` | Handles missing storage, upload errors, and persists public avatar URL. |
| `deleteAccount` | Soft-deletes and (when available) calls Supabase admin delete. |