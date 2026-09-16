# Photos: Alternative Image Solution

**Priority:** P0 — Critical  
**Effort:** Medium (2-3 days)  
**Status:** ⏳ Draft

---

## Problem

Google Places Photos API is cost-prohibitive at scale. Current Wikipedia opensearch hack is unreliable — inconsistent results, no caching, poor coverage, English-only, re-fetches on every mount.

## Recommended Solution: Wikimedia Commons API

**Why:** Free, structured, same ecosystem as current Wikipedia approach, vastly more reliable, supports coordinate-based search (use lat/lng of attractions).

### Architecture

```
[Activity created]
       │
       ▼
Backend WikimediaService.searchImage(name, lat, lng)
       │
       ├── 1. Search by name + destination → Wikimedia Commons API
       ├── 2. Fallback: search by coordinates (lat/lng radius)
       ├── 3. Fallback: search by name only
       │
       ▼
Store best image URL → activity.photoUrl (DB)
       │
       ▼
Frontend reads activity.photoUrl → renders <img>
       │
       ▼
Fallback: category-based gradient icon if null
```

### Implementation Steps

#### 1. Add `photoUrl` to `ItineraryActivity` schema

```prisma
model ItineraryActivity {
  // ... existing fields
  photoUrl    String?
}
```

Run migration.

#### 2. Create `WikimediaService`

New module: `backend/src/wikimedia/wikimedia.service.ts`

- `searchImage(name: string, lat?: number, lng?: number): Promise<string | null>`
- Uses `https://commons.wikimedia.org/w/api.php` with `action=query`, `list=search`, `srnamespace=6`
- Then fetches `https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url`
- Coordinate fallback: `https://commons.wikimedia.org/w/api.php?action=query&list=geosearch&gscoord=lat|lng&gsradius=1000`

#### 3. Add image caching layer

- In-memory LRU cache (keyed by `name:lat:lng`, TTL 7 days)
- DB cache column `photoUrl` on `ItineraryActivity` — serves as persistent cache
- Refresh stale entries via background job (optional)

#### 4. Backend pipeline changes

In `itinerary-generation.service.ts:mapSingleDay()`:

```typescript
// After matching attraction, fetch photo
const photoUrl = matchedAttraction?.id
  ? await this.wikimediaService.searchImage(
      matchedAttraction.name,
      matchedAttraction.location.lat,
      matchedAttraction.location.lng,
    )
  : null;
```

In `persistGeneratedItinerary()` — or do this async after creation to not block response.

#### 5. Frontend: Remove Wikipedia hack

- Delete `useAttractionPhoto` hook from `AttractionCard.tsx`
- Delete `cleanWikipediaTitle`, `stripVenueType`, `trySearch` functions
- Use `activity.photoUrl` directly (with icon fallback)

#### 6. Add photo to PDF export

In `ItineraryPdfDocument.tsx`, add `<Image>` tag when `activity.photoUrl` exists.

### Wikimedia Commons API Details

**Name search:**
```
GET https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={name} {destination}&srnamespace=6&format=json&origin=*
```

**Get image URL from title:**
```
GET https://commons.wikimedia.org/w/api.php?action=query&titles={title}&prop=imageinfo&iiprop=url&format=json&origin=*
```

**Coordinate search (geosearch):**
```
GET https://commons.wikimedia.org/w/api.php?action=query&list=geosearch&gscoord={lat}|{lng}&gsradius=1000&gslimit=5&format=json&origin=*
```

### Trade-offs

| Approach | Cost | Reliability | Implementation |
|----------|------|-------------|----------------|
| Google Places Photos | 💰 Expensive | ✅ Best | Trivial |
| **Wikimedia Commons (recommended)** | ✅ Free | ✅ Good | Medium |
| Unsplash API | ✅ Free tier | ⚠️ No specific attractions | Easy |
| Pexels/Pixabay | ✅ Free | ⚠️ Generic only | Easy |
| Bing Image Search | 💵 Cheap | ✅ Good | Medium |
| Google Custom Search | 💵 Cheap (100 free/day) | ✅ Good | Medium |

### Acceptance Criteria

- [ ] WikimediaService returns correct image for known attractions
- [ ] Coordinate fallback returns relevant images
- [ ] Image URL is cached in `photoUrl` DB column
- [ ] Activity creation in generation pipeline includes photoUrl
- [ ] Existing activities have `photoUrl` populated (backfill via migration script)
- [ ] Frontend uses `activity.photoUrl` directly
- [ ] No Wikipedia API calls remain in frontend
- [ ] PDF export includes images
