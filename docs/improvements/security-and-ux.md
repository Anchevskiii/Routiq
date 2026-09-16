# Security, UX & Code Quality Improvements

**Priority:** P1/P2 — Medium  
**Effort:** Low/Medium (3-5 days)

---

## Security

### 1. JWT Token — sessionStorage Duration on Tab Close

**Current:** Access token stored in `sessionStorage` — lost when tab closes. User must re-login.

**Problem:** Accidental tab close = forced re-login. Refresh token is also in sessionStorage, so `autoRefreshToken` can't recover.

**Solution:** Dual storage strategy.

```typescript
// api/supabase.ts
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: {
      getItem: (key: string) => {
        // Try sessionStorage first, fallback to memory
        return sessionStorage.getItem(key) ?? memoryStorage.getItem(key);
      },
      setItem: (key: string, value: string) => {
        if (key === 'supabase.auth.token') {
          // Store refresh token in memory only (more secure)
          memoryStorage.setItem(key, value);
          // Store access token in sessionStorage (for API calls)
          const parsed = JSON.parse(value);
          sessionStorage.setItem('sb-access-token', parsed.access_token);
        }
        sessionStorage.setItem(key, value);
      },
      removeItem: (key: string) => {
        sessionStorage.removeItem(key);
        memoryStorage.removeItem(key);
      },
    },
    autoRefreshToken: true,
    persistSession: true,
  },
});
```

**Alternative (recommended for production):** Use httpOnly cookies for refresh token, managed by backend. But this requires backend auth endpoints instead of direct Supabase calls, which is a larger refactor.

**Quick fix for now:** Sync refresh token to a cookie with `Expires` set to 7 days (Supabase refresh token default). Use `document.cookie` with `SameSite=Strict; Secure` for the refresh token only.

---

### 2. Input Sanitization on Comments

**Current:** Comments stored as-is, rendered with React (which is XSS-safe by default for text content). But mobile/email notifications may render raw.

**Solution:**

Add `sanitize-html` or `DOMPurify` on the backend:

```typescript
// In groups.service.ts, before creating comment
import sanitizeHtml from 'sanitize-html';

const sanitized = sanitizeHtml(dto.content, {
  allowedTags: [],    // No HTML tags allowed in comments
  allowedAttributes: {},
});
```

Also add character limit:
```typescript
@MaxLength(2000, { message: 'Comment must not exceed 2000 characters' })
```

**Frontend:** Strip HTML before displaying in push/email notifications.

---

### 3. Geocoding API Key Exposure

**Current:** `AttractionsService` uses the same Google API key for Places API and Geocoding API.

**Risk:** If a place name from Gemini is not found, `geocodeAddress()` is called with the full API key. Error responses may leak the key in stack traces.

**Solution:**

- Ensure `ServiceUnavailableException` never includes the key in error messages
- Use `process.env.PLACES_API_KEY` (already done correctly)
- Verify key has restricted HTTP referrers in Google Cloud Console (set to Railway domain)
- Add API key validation check on service start — fail fast if not configured

---

### 4. File Upload Size Limit

**Current:** No explicit size limit on avatar upload endpoint.

**Solution:**

In backend `main.ts`:
```typescript
import { json, urlencoded } from 'express';

app.use(json({ limit: '10mb' }));
app.use(urlencoded({ extended: true, limit: '10mb' }));
```

In `users.controller.ts`, add file validator:
```typescript
// Add to file.validator.ts
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const validateAvatarFile = (file: Express.Multer.File) => {
  if (!file) throw new BadRequestException('No file uploaded');
  if (file.size > MAX_AVATAR_SIZE) throw new BadRequestException('File too large (max 5MB)');
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) throw new BadRequestException('Invalid file type');
};
```

Also add `file-validation.middleware.ts` for global file upload security.

---

### 5. CSP report-uri

**Current:** Helmet sets CSP headers but has no `report-uri` or `report-to` directive.

**Solution:**

```typescript
// main.ts
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...defaultDirectives,
      'report-uri': ['https://routiq.report-uri.com/r/d/csp/enforce'],
      'report-to': ['csp-endpoint'],
    },
  },
  reportOnly: false,
}));
```

Or use a free service like `report-uri.com` (free tier available) or self-host a reporting endpoint.

**Even better:** Start with `reportOnly: true` to observe violations without breaking functionality, then switch to enforce.

---

## UX / Usability

### Priority Fixes

| Issue | Current Behavior | Proposed Fix |
|-------|-----------------|--------------|
| **Loading skeletons** | Spinner only on itinerary page | Add skeleton placeholders for trips list, group pages, profile |
| **Undo delete activity** | Activity deleted immediately | Show toast "Deleted {title} [Undo]" with 5s timer → soft-delete rollback |
| **Shared itinerary nav** | No links for non-logged-in users | Add "Sign in to save" and "Back to homepage" links at top |
| **Forgot password** | No UI → dead end | Add ForgotPassword + ResetPassword pages |
| **Empty states** | Nothing or broken layout | Dedicated empty-state components for trips, groups, notifications, search |
| **Group invite link** | Email-only invites | Generate invite link (`/groups/join/:token`) — shareable outside email |
| **Trip reminders** | `TRIP_REMINDER` type exists but unused | Cron job checks upcoming trips → sends notification 24h before |
| **Search/filter trips** | No search — user scrolls through all | Add text search by destination + date filter |

### Nice-to-Have

| Issue | Fix |
|-------|-----|
| **Activity "quick edit"** | Inline title editing on AttractionCard (click title → edit) |
| **Map markers "pulse" on activity hover** | Cross-highlight between DayCard activity and map marker |
| **Drag preview thumbnail** | Show activity photo in drag preview ghost |
| **Keyboard shortcuts** | `n` new trip, `g` groups, `d` dashboard |
| **Notification sounds** | Optional sound on new notification (desktop notification API) |
| **Itinerary comparison** | Side-by-side view of 2 itineraries in group voting |

---

## Code Quality

### Technical Debt Items

| # | Issue | File(s) | Fix |
|---|-------|---------|-----|
| 1 | **`withRetry` ignores non-HTTP errors** | `retry.util.ts` | Should log and re-throw network errors, not silently return |
| 2 | **Magic numbers** | `attractions.service.ts` (30m, 150m, 3.2 rating, 3 ratings), `itinerary-generation.service.ts` (2.5 min/km) | Extract to config or constants file |
| 3 | **Gemini JSON parsing — 3 fallback paths** | `itinerary.service.ts:1065-1095`, `gemini.service.ts:291-323` | Consolidate into a single `parseGeminiResponse()` utility with clear error chaining |
| 4 | **`generateDescription` produces poor English** | `attractions.service.ts:500-503` | Use a template with actual data instead of "is a establishment" |
| 5 | **Migration naming inconsistency** | `prisma/migrations/` | Document conventions: `YYYYMMDDHHMMSS_short_description` |
| 6 | **`FormattedPlace.photos` always `[]`** | `attractions.service.ts:497` | Will be fixed by photo solution (Wikimedia) |
| 7 | **No Prisma soft-delete middleware in code** | `prisma.service.ts` | Document that soft-delete is manual (not middleware-based) |
| 8 | **`getUserItineraries` joins groups unnecessarily** | `itinerary.service.ts:102-111` | Add `select.groupItineraries` removal for non-group views |
| 9 | **TypeScript strict mode not enabled** | `tsconfig.json` both projects | Enable `strict: true` and fix resulting errors |
| 10 | **No integration test for geocoding fallback** | `itinerary-generation.service.spec.ts` | Add test covering the Gemini-to-geocoding chain |

### Recommended Cleanup Order

1. Extract magic numbers to constants
2. Consolidate Gemini response parsing
3. Remove unused code (especially after photo fix)
4. Enable `strict: true` in tsconfig
5. Add missing integration tests
