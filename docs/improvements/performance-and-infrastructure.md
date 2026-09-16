# Performance & Infrastructure Improvements

**Priority:** P0/P1 — High  
**Effort:** Medium/High (1-2 weeks)

---

## 1. Pagination for Itinerary List

**Current:** Backend supports `page`/`limit` params but frontend trips page (`TripsPage.tsx`) only shows first page. Users with 50+ itineraries see only 10.

**Solution:**

| Layer | Change |
|-------|--------|
| API | Already done — `getUserItineraries` returns `{ data, meta: { total, page, limit, totalPages, sharedCount } }` |
| Frontend `trips.api.ts` | Pass `page` and `limit` params to API |
| Frontend `TripsPage.tsx` | Add "Load More" button or numbered pagination at bottom |
| Frontend | Show "Showing X of Y trips" text |
| React Query | Use `queryKey: ['itineraries', page]` — invalidate on mutation |

**Edge cases:** Empty state when page > totalPages, URL query param persistence for `/trips?page=2`.

---

## 2. Weather Cache Persistence

**Current:** In-memory `Map` cache in `WeatherService` — lost on server restart. 1h TTL.

**Solution:** Move cache to database.

```prisma
model WeatherCache {
  id           String   @id @default(uuid())
  destination  String
  startDate    DateTime @db.Date
  days         Int
  response     Json
  fetchedAt    DateTime @default(now())
  expiresAt    DateTime
  
  @@index([destination, startDate, days])
  @@map("weather_cache")
}
```

**Flow:**
1. Request comes in → check DB for `destination + startDate + days`
2. If found and `expiresAt > now` → return cached
3. If not → fetch from Google Weather → store in DB → return
4. Background job (or on read) cleans expired entries

**Alternatively:** Use Redis (adds infra complexity). DB cache is simpler for current scale.

**Migration:** Existing in-memory cache can remain, but add DB as persistent layer — check DB first, then memory.

---

## 3. Database Indexing

**Current:** Missing covering indexes for common query patterns.

| Table | Current Index | Missing Index | Why |
|-------|--------------|---------------|-----|
| `itinerary_activities` | `[dayId]`, `[activityType]`, `[placeId]` | `[dayId, sortOrder]` | Every query for activities orders by sortOrder |
| `itinerary_days` | `[itineraryId]`, `unique(itineraryId, dayNumber)` | — | ✅ Already covered |
| `users` | `[email]`, `[createdAt]` | `[id, deletedAt]` | Every auth check queries by id + soft-delete filter |
| `notifications` | `[userId]`, `[userId, readAt]`, `[createdAt]` | — | ✅ Already good |
| `group_members` | `[groupId]`, `[userId]`, `[status]` | `[groupId, status]` | Every group page queries active members by status |

**Implementation:** Add in Prisma schema, run `prisma migrate dev --name add_indexes`.

---

## 4. Image Caching Strategy

**Current:** No caching — Wikipedia API called on every AttractionCard mount (every re-render).

**Solution (part of photo overhaul):**

| Layer | Strategy | TTL |
|-------|----------|-----|
| DB (`activity.photoUrl`) | Persistent cache — written once, read many | Until regenerated |
| CDN (Vercel Edge) | Cache photo URLs via `Cache-Control: public, max-age=31536000` | 1 year |
| Frontend (`<img>`) | Browser HTTP cache via proper response headers | 1 year |
| Frontend (React) | Memoize image component — no re-fetch on re-render | Component lifetime |

**Note:** Since Wikimedia URLs are direct file URLs, they already have good caching by default. The DB column is the main cache.

---

## 5. Rate Limit Headers

**Current:** `@nestjs/throttler` enforces limits but returns no standard rate limit headers.

**Solution:** Add custom throttler response headers.

In `app-throttler.guard.ts`:

```typescript
// After throttle check, set response headers:
response.header('X-RateLimit-Limit', limit.toString());
response.header('X-RateLimit-Remaining', remaining.toString());
response.header('X-RateLimit-Reset', resetTime.toString());
response.header('Retry-After', retryAfter.toString());  // When limited
```

**Standards:** Follow `RFC 6585` — use `Retry-After` with seconds.

---

## 6. Health Checks

**Current:** Simple `GET /health` that returns `{ status: 'ok' }`. Railway uses this.

**Solution:** Expand to include external dependency checks.

```typescript
@Get('health')
async healthCheck() {
  const checks = await Promise.allSettled([
    this.checkDatabase(),      // prisma.$queryRaw`SELECT 1`
    this.checkGemini(),         // lightweight ping
    this.checkGooglePlaces(),   // lightweight ping
  ]);
  
  return {
    status: checks.every(c => c.status === 'fulfilled') ? 'ok' : 'degraded',
    checks: {
      database: checks[0],
      gemini: checks[1],
      places: checks[2],
    },
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };
}
```

**Also useful:** Add `GET /health/ready` (readiness — DB connected) and `GET /health/live` (liveness — process alive).

---

## 7. DDoS / Abuse Protection

**Current:** Only NestJS throttler (5 req/min on generate, 100 req/min global).

**Production additions:**

| Layer | Tool | Setup |
|-------|------|-------|
| Edge | Cloudflare (Free plan) | Proxy DNS through Cloudflare — built-in DDoS protection, WAF, rate limiting |
| Backend | @nestjs/throttler | Already configured — adjust limits for production |
| Backend | Request size limits | Already has `body-parser` defaults — verify |
| Backend | IP-based rate limiting | Add IP tracking to throttler (store by IP + user combo) |

**Recommended:** Put Cloudflare in front of Railway. Free tier includes DDoS protection, WAF rules, rate limiting, and SSL.

---

## 8. Database Connection Pool Limits

**Current:** Prisma connects with default pool settings. Supabase Free tier allows 15 connections.

**Solution in `PrismaService`:**

```typescript
const poolMax = this.configService.isProduction ? 10 : 5;

this.prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
      connectionLimit: poolMax,
      poolTimeout: 30,
    },
  },
});
```

**Also:** Add connection monitoring — log warning when pool utilization > 80%.

---

## 9. CSRF Tokens

**Current:** Relies on `SameSite=Lax` cookie and Bearer token requirement for mutating requests. Cookie is only read for GET/HEAD.

**Production hardening:**

Add `csrf-csrf` (or similar) NestJS middleware:

```typescript
// In main.ts
app.use(csurf({ cookie: { sameSite: 'strict', secure: true } }));
```

**Frontend:** Read CSRF token from cookie and add `X-CSRF-Token` header to all mutating requests in Axios interceptor.

However — since all mutating requests already require Bearer token (not just cookie), CSRF is already mitigated. This is a defense-in-depth addition, not a blocker.

---

## 10. Log Monitoring

**Current:** Winston logger — logs to console only.

**Production additions:**

| Tool | Purpose | Setup |
|------|---------|-------|
| Winston transports | Log to file + console | Add `winston-daily-rotate-file` for file logs |
| Sentry | Error tracking + performance monitoring | `@sentry/node` — capture exceptions + transactions |
| Railway logs | Built-in log streaming | Already available in Railway dashboard |

**Structured logging:** Use JSON format for machine readability:

```typescript
const logger = winston.createLogger({
  format: winston.format.json(),
  defaultMeta: { service: 'routiq-backend' },
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
  ],
});
```

**Sentry:** Add to `main.ts` and `AllExceptionsFilter` for automatic error capture.

---

## 11. Database Backup Strategy

**Current:** No documented backup strategy. Supabase Free tier includes basic backups but no guarantees.

**Solution:**

| Frequency | Type | Tool |
|-----------|------|------|
| Daily | Full database dump | `pg_dump` via cron job or Supabase CLI |
| Continuous | WAL archiving | Supabase (built-in for Pro plan) |
| Weekly | Off-site backup | Upload to S3-compatible storage (Backblaze B2, ~$1/month) |

**Backup script suggestion:**

```bash
# In CI or cron (GitHub Actions scheduled workflow)
pg_dump "$DATABASE_URL" --no-owner --compress=9 > routiq-$(date +%Y-%m-%d).sql.gz
# Upload to Backblaze B2 or S3
```

**Also:** Document restore procedure in `docs/operations/disaster-recovery.md`.

---

## 12. robots.txt & Sitemaps

**robots.txt (`frontend/public/robots.txt`):**

```
User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /planner/
Disallow: /itinerary/
Disallow: /trips/
Disallow: /groups/
Disallow: /profile/
Disallow: /notifications/
Allow: /shared/

Sitemap: https://routiq.app/sitemap.xml
```

**Sitemap:** Generate static sitemap.xml for public pages (landing, /privacy, /terms, /help, /shared/* if public itineraries exist). Update Vercel config to handle `/sitemap.xml`.

---

## 13. PWA Support

**Current:** No service worker, no manifest, no offline support.

**Files to create:**

| File | Content |
|------|---------|
| `frontend/public/manifest.json` | App name, icons, theme color, start URL |
| `frontend/public/icon-192x192.png` | Generate from app logo |
| `frontend/public/icon-512x512.png` | Generate from app logo |
| `frontend/src/sw.ts` | Service worker — cache shell + API responses |

**Vite plugin:** Add `vite-plugin-pwa` for automatic service worker generation with Workbox.

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Routiq',
        short_name: 'Routiq',
        description: 'AI-powered travel itinerary planner',
        theme_color: '#1e3a5f',
        icons: [...]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ]
});
```

---

## 14. Password Recovery

**Current:** Supabase Auth supports password reset via `supabase.auth.resetPasswordForEmail()` but there's no frontend page for it.

**Frontend additions:**

| Route | Component | Purpose |
|-------|-----------|---------|
| `/forgot-password` | `ForgotPasswordPage.tsx` | Email input → calls Supabase reset |
| `/reset-password` | `ResetPasswordPage.tsx` | New password form (reached via email link) |

**Flow:**
1. User clicks "Forgot password" on login page
2. Enters email → `supabase.auth.resetPasswordForEmail(email, { redirectTo: 'https://routiq.app/reset-password' })`
3. Supabase sends email with reset link
4. User clicks link → lands on `/reset-password?code=xxx`
5. `supabase.auth.exchangeCodeForSession(code)` → show new password form
6. `supabase.auth.updateUser({ password: newPassword })`

**Note:** Supabase handles the email, we just need the frontend pages. Add routes to `router.tsx` and links to login form.
