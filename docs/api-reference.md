# REST API referenca — Routiq

← [Nazaj na README](../README.md)

Swagger dokumentacija (development): `http://localhost:3000/api/docs`

Vsi endpointi so dosegljivi na `/api/` prefiksu. Vsi odgovori imajo enotni format:

```json
// Uspeh
{ "success": true, "data": { ... } }

// Uspeh z metapodatki (paginirane liste)
{ "success": true, "data": [...], "meta": { "total": 42, "page": 1, "limit": 10 } }

// Napaka
{ "success": false, "error": { "code": "NOT_FOUND", "message": "...", "statusCode": 404 } }
```

**Auth:** Razen označenih z `🔓 Javno`, vsi endpointi zahtevajo `Authorization: Bearer <token>` header.

---

## Kazalo

- [Avtentikacija `/auth`](#avtentikacija-auth)
- [Uporabniki `/users`](#uporabniki-users)
- [Itinerarji `/itinerary`](#itinerarji-itinerary)
- [Atrakcije `/attractions`](#atrakcije-attractions)
- [Vreme `/weather`](#vreme-weather)
- [Skupinska potovanja `/groups`](#skupinska-potovanja-groups)
- [Obvestila `/notifications`](#obvestila-notifications)
- [Izvoz `/export`](#izvoz-export)
- [Health check `/health`](#health-check-health)
- [HTTP status kode](#http-status-kode)

---

## Avtentikacija `/auth`

> Avtentikacija poteka prek **Supabase Auth** na frontend strani. Backend `/auth` endpointi so pomožni za pridobivanje user podatkov.

| Metoda | Pot | Opis | Auth |
|---|---|---|---|
| GET | `/auth/me` | Vrne podatke prijavljenega userja | Da |

**GET `/auth/me`** — vrne user profil iz Supabase JWT + lokalno sinhroniziranega zapisa.

```json
// Response
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Ime Priimek",
    "avatarUrl": "https://...",
    "lastLoginAt": "2026-06-01T10:00:00Z"
  }
}
```

---

## Uporabniki `/users`

| Metoda | Pot | Opis |
|---|---|---|
| GET | `/users/profile` | Pridobi moj profil |
| PATCH | `/users/profile` | Posodobi profil (ime, email) |
| POST | `/users/avatar` | Upload profilne slike |
| PATCH | `/users/password` | Sprememba gesla |
| GET | `/users/settings` | Pridobi nastavitve (tema, jezik...) |
| PATCH | `/users/settings` | Posodobi nastavitve |
| DELETE | `/users/account` | Brisanje računa (GDPR — soft delete) |

**PATCH `/users/profile`**

```json
// Request body
{ "name": "Novo ime", "email": "novi@email.com" }
```

**POST `/users/avatar`** — `multipart/form-data` z `file` poljem (JPEG/PNG, max 5MB).

**PATCH `/users/settings`**

```json
// Request body
{
  "theme": "dark",
  "language": "sl",
  "notifications": { "email": true, "push": false }
}
```

---

## Itinerarji `/itinerary`

| Metoda | Pot | Opis | Auth |
|---|---|---|---|
| POST | `/itinerary/generate` | Generiraj itinerar (SSE stream) | Da |
| GET | `/itinerary` | Moji itinerarji (paginirano) | Da |
| GET | `/itinerary/:id` | Posamezni itinerar | Da |
| PATCH | `/itinerary/:id` | Posodobi itinerar | Da |
| DELETE | `/itinerary/:id` | Soft delete itinerarja | Da |
| POST | `/itinerary/:id/share` | Generiraj deljivi link | Da |
| GET | `/itinerary/shared/:token` | Javni ogled brez prijave | 🔓 Javno |
| POST | `/itinerary/:id/days/:dayId/activities` | Dodaj aktivnost | Da |
| PATCH | `/itinerary/:id/days/:dayId/activities/:aid` | Uredi aktivnost | Da |
| DELETE | `/itinerary/:id/days/:dayId/activities/:aid` | Briši aktivnost | Da |

### POST `/itinerary/generate` — SSE stream

Odpre SSE konekcijo. Odgovor je `text/event-stream`.

```json
// Request body
{
  "destination": "Rim, Italija",
  "startDate": "2026-07-15",
  "days": 5,
  "travelType": "CULTURAL",
  "groupId": "uuid"   // opcijsko — za skupinsko generiranje
}
```

SSE eventi:
```
data: {"type":"status","message":"Pripravljam podatke..."}
data: {"type":"attractions","data":[...]}
data: {"type":"day","data":{"dayNumber":1,"activities":[...],"weather":{...}}}
data: {"type":"day","data":{"dayNumber":2,...}}
data: {"type":"complete","itineraryId":"uuid"}
```

**Rate limit:** 5 requestov/minuto na userja.

### GET `/itinerary?page=1&limit=10`

```json
// Response
{
  "success": true,
  "data": [...],
  "meta": { "total": 23, "page": 1, "limit": 10, "totalPages": 3 }
}
```

### POST `/itinerary/:id/share`

```json
// Response
{
  "success": true,
  "data": { "shareToken": "abc123", "shareUrl": "https://routiq.app/shared/abc123" }
}
```

### POST `/itinerary/:id/days/:dayId/activities`

```json
// Request body
{
  "title": "Kolosej",
  "activityType": "ATTRACTION",
  "startTime": "09:00",
  "durationMinutes": 120,
  "description": "Obisk rimskega amfiteatra",
  "location": "Piazza del Colosseo, Roma",
  "latitude": 41.8902,
  "longitude": 12.4922,
  "placeId": "ChIJrRMgU7ZhLxMRIAKX_aUZCAQ",
  "cost": "18€",
  "sortOrder": 1
}
```

---

## Atrakcije `/attractions`

| Metoda | Pot | Opis |
|---|---|---|
| GET | `/attractions/search` | Išči atrakcije po destinaciji in tipu |
| GET | `/attractions/alternatives` | Alternativne atrakcije za zamenjavo |

**GET `/attractions/search?destination=Rim&travelType=CULTURAL`**

```json
// Response
{
  "success": true,
  "data": [
    {
      "placeId": "ChIJ...",
      "name": "Kolosej",
      "address": "Piazza del Colosseo",
      "latitude": 41.8902,
      "longitude": 12.4922,
      "rating": 4.7,
      "photoUrl": "https://..."
    }
  ]
}
```

**GET `/attractions/alternatives?placeId=ChIJ...&travelType=CULTURAL`** — vrne alternativne atrakcije istega tipa v okolici.

---

## Vreme `/weather`

| Metoda | Pot | Opis |
|---|---|---|
| GET | `/weather` | Vremenska napoved za destinacijo |

**GET `/weather?destination=Rim&startDate=2026-07-15&days=5`**

```json
// Response
{
  "success": true,
  "data": [
    {
      "date": "2026-07-15",
      "condition": "Sunny",
      "tempMin": 22,
      "tempMax": 34,
      "humidity": 45,
      "windSpeed": 12,
      "iconCode": "sunny",
      "recommendation": "Idealno za obisk Vatikana zjutraj pred vročino."
    }
  ]
}
```

**Cache:** Odgovori se cachirajo v memory za **1 uro** — enaka destinacija + datumi ne sproži ponovnega klica na Google Weather API.

---

## Skupinska potovanja `/groups`

| Metoda | Pot | Opis |
|---|---|---|
| GET | `/groups` | Moje skupin (kjer sem ACCEPTED) |
| POST | `/groups` | Ustvari novo skupino |
| GET | `/groups/invitations` | Moja čakajoča povabila (status=PENDING) |
| GET | `/groups/:id` | Detajl skupin (samo za člane) |
| DELETE | `/groups/:id` | Briši skupino (samo OWNER) |
| POST | `/groups/:id/invite` | Povabi člana (OWNER ali ADMIN) |
| POST | `/groups/:id/accept` | Sprejmi povabilo |
| POST | `/groups/:id/decline` | Zavrni povabilo |
| DELETE | `/groups/:id/members/:uid` | Odstrani člana |
| PATCH | `/groups/:id/members/:uid/role` | Posodobi vlogo člana |
| GET | `/groups/:id/itineraries` | Itinerarji skupin |
| POST | `/groups/:id/itineraries` | Dodaj itinerar v skupino |
| GET | `/groups/:gid/itineraries/:giid/votes` | Glasovi za itinerar |
| POST | `/groups/:gid/itineraries/:giid/vote` | Glasuj za itinerar (UPVOTE/DOWNVOTE) |
| DELETE | `/groups/:gid/itineraries/:giid/vote` | Odstrani glas |
| GET | `/groups/:id/comments` | Komentarji skupin |
| POST | `/groups/:id/comments` | Dodaj komentar / odgovor |
| GET | `/groups/:id/activity` | Activity log skupin |

### POST `/groups`

```json
// Request body
{
  "name": "Julijske Alpe 2026",
  "description": "Planinarjenje z ekipo",
  "themeColor": "#3B82F6",
  "imageUrl": "https://..."
}
```

### POST `/groups/:id/invite`

```json
// Request body
{ "email": "kolega@example.com" }

// Možne napake
// 403 — kličoči nima OWNER/ADMIN vloge
// 404 — email nima računa na Routiq
// 400 — že je aktiven član
// 400 — povabilo že čaka
```

### POST `/groups/:gid/itineraries/:giid/vote`

```json
// Request body
{ "voteType": "UPVOTE" }  // ali "DOWNVOTE"

// Response — vrne glas objekt
{ "success": true, "data": { "id": "uuid", "voteType": "UPVOTE", "userId": "...", ... } }
```

**Score logika:** `score = število UPVOTE glasov` — downvoti se ne odštevajo. Vsak user ima lahko en glas na itinerar (upsert — novi glas zamenja starega).

### DELETE `/groups/:gid/itineraries/:giid/vote`

Odstrani glas kličočega userja (soft delete). Vrne `{ "success": true }`.

**Kdaj se pošlje obvestilo:** Ko nekdo glasuje za itinerar ki mu ne pripada, lastnik itinerarja prejme in-app obvestilo tipa `VOTE`.

### POST `/groups/:id/comments`

```json
// Request body
{
  "content": "Lepa ideja za drugi dan!",
  "parentId": "uuid"   // opcijsko — za odgovor na obstoječi komentar
}
```

### GET `/groups/:id/activity?limit=50`

```json
// Response
{
  "success": true,
  "data": [
    {
      "action": "MEMBER_INVITED",
      "user": { "name": "Jan", "avatarUrl": "..." },
      "details": { "invitedEmail": "novo@example.com" },
      "createdAt": "2026-06-01T10:00:00Z"
    }
  ]
}
```

---

## Obvestila `/notifications`

| Metoda | Pot | Opis |
|---|---|---|
| GET | `/notifications` | Moja obvestila (paginirano, najnovejša najprej) |
| GET | `/notifications/unread-count` | Število neprebranih obvestil |
| PATCH | `/notifications/:id/read` | Označi obvestilo kot prebrano |
| POST | `/notifications/read-all` | Označi vsa obvestila kot prebrana |

**GET `/notifications?page=1&limit=20`**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "VOTE",
      "title": "Jan je glasoval za tvoj 'Rim, Italija' itinerar",
      "body": "👍 Upvote v skupini",
      "data": { "groupId": "...", "itineraryId": "...", "groupItineraryId": "..." },
      "readAt": null,
      "createdAt": "2026-06-04T10:00:00Z"
    }
  ]
}
```

**GET `/notifications/unread-count`**

```json
{ "success": true, "data": { "count": 3 } }
```

---

## Izvoz `/export`

| Metoda | Pot | Opis |
|---|---|---|
| GET | `/export/:id/ics` | Prenesi .ics datoteko za itinerar |

**GET `/export/:id/ics`** — vrne `application/octet-stream` z `.ics` vsebino (iCalendar format). En `VEVENT` na aktivnost.

> PDF generira **frontend** z `@react-pdf/renderer` — backend ne generira PDF.

---

## Health check `/health`

| Metoda | Pot | Opis | Auth |
|---|---|---|---|
| GET | `/health` | Status aplikacije za Render monitoring | 🔓 Javno |

```json
// Response
{ "status": "ok", "timestamp": "2026-06-01T10:00:00Z" }
```

---

## HTTP status kode

| Koda | Situacija |
|---|---|
| `200` | Uspešen GET, PATCH, DELETE |
| `201` | Uspešen POST (kreiranje) |
| `400` | Napačni vhodni podatki (validacija DTO, business logic) |
| `401` | Ni prijavljen ali neveljaven token |
| `403` | Prijavljen, a nima dovoljenja (vloga, lastništvo) |
| `404` | Resource ne obstaja ali ni dostopen |
| `409` | Konflikt (duplikat) |
| `429` | Rate limit prekoračen |
| `500` | Interna napaka strežnika |
| `503` | Zunanja storitev nedostopna (Gemini, Weather...) |
