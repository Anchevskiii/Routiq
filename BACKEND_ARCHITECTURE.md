# Routiq – Backend Architecture

> **Stack:** NestJS + TypeScript + Prisma + PostgreSQL (Supabase)  
> **Ekipa:** Jan Ančevski, Klemen Novak, Mojca Marin  
> **Repo:** Monorepo – `routiq/` → `frontend/` + `backend/`

---

## Kazalo

1. [Tehnološki sklad](#1-tehnološki-sklad)
2. [Kako deluje NestJS](#2-kako-deluje-nestjs)
3. [Organizacija projekta](#3-organizacija-projekta)
4. [Moduli & endpointi](#4-moduli--endpointi)
5. [REST API konvencije](#5-rest-api-konvencije)
6. [Baza podatkov & Prisma](#6-baza-podatkov--prisma)
7. [Avtentikacija & varnost](#7-avtentikacija--varnost)
8. [AI integracija (Gemini)](#8-ai-integracija-gemini)
9. [Zunanje integracije](#9-zunanje-integracije)
10. [Varovanje API ključev](#10-varovanje-api-ključev)
11. [Error handling](#11-error-handling)
12. [Pravila pisanja kode](#12-pravila-pisanja-kode)
13. [AI Instructions preset](#13-ai-instructions-preset)
14. [Git workflow & commit konvencija](#14-git-workflow--commit-konvencija)
15. [Razdelitev dela po iteracijah](#15-razdelitev-dela-po-iteracijah)

---

## 1. Tehnološki sklad

| Kategorija | Tehnologija |
|---|---|
| Framework | NestJS 10 + TypeScript |
| Runtime | Node.js >= 20 LTS |
| ORM | Prisma |
| Baza | PostgreSQL (Supabase – hosted) |
| Avtentikacija | JWT + Passport.js |
| OAuth | Passport Google Strategy |
| Validacija | class-validator + class-transformer |
| AI | Google Gemini 2.5 Flash |
| Atrakcije | Google Places API |
| Vreme | Google Weather API |
| Navigacija | Google Maps Directions API |
| Playliste | Spotify Web API (opcijsko, iter. 4) |
| Izvoz | `ics` npm paket |
| HTTP client | Axios `1.14.0` (pinana!) |
| Rate limiting | @nestjs/throttler |
| Logging | Winston |
| Testing | Jest + Supertest |
| Deploy | Render (container) |

> ⚠️ **Axios opomba:** Verziji `1.14.1` in `0.30.4` sta bili marca 2026 kompromitirani v supply chain napadu. Pinamo `"axios": "1.14.0"` in ne updateamo brez preveritve.

---

## 2. Kako deluje NestJS

NestJS je Node.js framework ki te sili v modularno, konsistentno strukturo. Če z njim delaš prvič, je tukaj kratek pregled konceptov ki jih boš srečal povsod v kodi.

### Modul (`*.module.ts`)

Modul je osnovna enota NestJS aplikacije. Vsak feature (auth, itinerary, groups...) ima svoj modul, ki pove NestJS-u kateri controllerji in servisi spadajo skupaj in kaj je dostopno zunaj.

```typescript
@Module({
  controllers: [ItineraryController],
  providers: [ItineraryService],
  exports: [ItineraryService],  // Dostopno drugim modulom
})
export class ItineraryModule {}
```

### Controller (`*.controller.ts`)

Controller definira HTTP endpointe – katere URL poti obstajajo in katero metodo pokličejo. **Nikoli ne vsebuje poslovne logike** – samo sprejme request, pokliče service, vrne odgovor.

```typescript
@Controller('itinerary')
export class ItineraryController {
  constructor(private readonly itineraryService: ItineraryService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.itineraryService.findOne(id)  // Logika je v serviceu
  }
}
```

### Service (`*.service.ts`)

Service vsebuje vso poslovno logiko. Tukaj živijo operacije na bazi, klici na zunanje API-je, izračuni. Service ne ve nič o HTTP requestih in responsih – sprejme podatke, dela z njimi in vrne rezultat.

```typescript
@Injectable()
export class ItineraryService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    return this.prisma.itinerary.findUnique({ where: { id } })
  }
}
```

### DTO (`dto/*.dto.ts`)

DTO (Data Transfer Object) je razred ki opisuje obliko podatkov v request body. Z `class-validator` dekoratorji NestJS avtomatično validira vsak incoming request – če podatki ne ustrezajo DTO-ju, vrne 400 napako še preden pridemo do controllerja.

```typescript
export class CreateItineraryDto {
  @IsString()
  @MinLength(2)
  destination: string

  @IsInt()
  @Min(1)
  @Max(14)
  days: number
}
```

### Guard (`*.guard.ts`)

Guard odloči ali je request dovoljen ali ne, še preden pride do controllerja. Globalni `JwtAuthGuard` preveri pri vsakem requestu ali ima veljaven Bearer token. Za javne endpointe (login, register) dodamo `@Public()` dekorator ki guard preskoči.

### Interceptor (`*.interceptor.ts`)

Interceptor se izvede pri vsakem requestu/responseu. Uporabljamo ga za dve stvari: `TransformInterceptor` ovije vse odgovore v enoten `{ success, data }` format, `LoggingInterceptor` pa logira vsak request.

### Dependency Injection

NestJS sam skrbi za ustvarjanje instanc. Ko controller potrebuje service, ga samo deklariš v konstruktorju in NestJS ga "injektira" avtomatično:

```typescript
constructor(private readonly itineraryService: ItineraryService) {}
// NestJS sam ustvari ItineraryService in ga preda sem
```

### Struktura feature modula

Vsak feature je samostojna mapa z enako strukturo:

```
src/<feature>/
├── <feature>.module.ts       # Registrira controller in service
├── <feature>.controller.ts   # HTTP endpointi (routing)
├── <feature>.service.ts      # Poslovna logika + DB operacije
└── dto/
    ├── create-<feature>.dto.ts
    └── update-<feature>.dto.ts
```

> Morda si bil navajen da so vsi controllerji skupaj v eni mapi in vsi servisi skupaj v drugi. Tukaj je obratno – vse kar spada k enemu featureu je skupaj. Ko delaš na `groups`, greš v `src/groups/` in najdeš vse.

---

## 3. Organizacija projekta

```
backend/
├── prisma/
│   ├── schema.prisma         # Definicija celotne podatkovne sheme
│   └── migrations/           # Auto-generirane migration datoteke (ne editamo ročno)
│
├── src/
│   ├── main.ts               # Bootstrap: NestFactory, global pipes, CORS, Swagger
│   ├── app.module.ts         # Root modul – uvozi vse feature module
│   │
│   ├── config/               # Environment konfiguracija
│   ├── prisma/               # Prisma singleton service
│   │
│   ├── common/               # Deljene stvari med vsemi moduli
│   │   ├── decorators/       # @CurrentUser(), @Public()
│   │   ├── filters/          # Global exception filter
│   │   ├── guards/           # JwtAuthGuard, RolesGuard
│   │   ├── interceptors/     # TransformInterceptor, LoggingInterceptor
│   │   └── types/            # Skupni tipi (ApiResponse, JwtPayload...)
│   │
│   ├── auth/                 # JWT + OAuth
│   ├── users/                # User profil
│   ├── itinerary/            # AI generiranje + CRUD (core feature)
│   ├── gemini/               # Gemini AI service
│   ├── attractions/          # Google Places proxy
│   ├── weather/              # Google Weather API proxy + caching
│   ├── groups/               # Skupinska potovanja
│   ├── notifications/        # In-app obvestila (vote, invite, komentar)
│   ├── export/               # .ics izvoz
│   └── mail/                 # Resend e-pošta (povabila)
│
├── test/                     # E2E testi
├── .env                      # Nikoli v git!
├── .env.example              # Primer brez vrednosti – v git
└── package.json
```

---

## 4. Moduli & endpointi

### `auth/` – Avtentikacija

```
POST   /auth/register          → Registracija z email/password
POST   /auth/login             → Prijava, vrne accessToken
POST   /auth/refresh           → Nov accessToken prek httpOnly cookie
POST   /auth/logout            → Počisti refresh token
GET    /auth/google            → Redirect na Google OAuth
GET    /auth/google/callback   → Callback, vrne tokene
GET    /auth/me                → Vrne trenutno prijavljenega userja
```

### `users/` – Upravljanje uporabnikov

```
GET    /users/profile          → Moj profil
PATCH  /users/profile          → Posodobi profil
POST   /users/avatar           → Upload avatarja
PATCH  /users/password         → Sprememba gesla
DELETE /users/account          → Brisanje računa (GDPR)
```

### `itinerary/` – Jedro aplikacije

```
POST   /itinerary/generate     → Generiraj itinerar (SSE stream)
GET    /itinerary              → Moji itinerarji
GET    /itinerary/:id          → Posamezni itinerar
PATCH  /itinerary/:id          → Posodobi (ročno urejanje)
DELETE /itinerary/:id          → Briši
POST   /itinerary/:id/share    → Generiraj deljivi link
```

### `attractions/` – Atrakcije

```
GET    /attractions/search?destination=&type=   → Išči atrakcije
POST   /attractions/swap                        → Zamenjaj atrakcijo
POST   /itinerary/:id/day/:day/attractions      → Dodaj atrakcijo
DELETE /itinerary/:id/day/:day/attractions/:aid → Odstrani atrakcijo
```

### `weather/` – Vreme

```
GET    /weather?destination=&startDate=&days=   → Napoved za destinacijo
```

Napoved cachiramo za 1 uro – ne kličemo Google Weather API pri vsakem requestu.

### `groups/` – Skupinska potovanja

```
GET    /groups                               → Moje skupine
POST   /groups                               → Ustvari skupino
GET    /groups/:id                           → Detajl skupin
DELETE /groups/:id                           → Briši (samo admin)
POST   /groups/:id/invite                    → Povabi člana
DELETE /groups/:id/members/:uid              → Odstrani člana
POST   /groups/:id/itineraries               → Dodaj itinerar v skupino
POST   /groups/:id/itineraries/:iid/vote     → Glasuj za atrakcijo
POST   /groups/:id/itineraries/:iid/comments → Dodaj komentar
```

### `export/` – Izvoz

```
GET    /export/:id/ics          → Vrne .ics datoteko
```

> PDF generira frontend z `@react-pdf/renderer`. Backend generira samo `.ics`.

---

## 5. REST API konvencije

### URL struktura

- Vse poti so **lowercase in kebab-case**: `/itinerary/generate`, `/groups/:id/members`
- **Množina za resource kolekcije**: `/itineraries`, `/groups`
- **Singularna akcija**: `/auth/login`, `/itinerary/generate`

### HTTP metode

| Metoda | Namen |
|---|---|
| `GET` | Pridobi podatke |
| `POST` | Ustvari novo |
| `PATCH` | Delna posodobitev |
| `DELETE` | Briši |

### Response format

Vsi odgovori imajo enako obliko prek `TransformInterceptor`:

```typescript
// Uspeh
{ "success": true, "data": { ... } }

// Uspeh z metapodatki (paginirane liste)
{ "success": true, "data": [...], "meta": { "total": 42, "page": 1, "limit": 10 } }

// Napaka
{ "success": false, "error": { "code": "ITINERARY_NOT_FOUND", "message": "...", "statusCode": 404 } }
```

### HTTP status kode

| Koda | Situacija |
|---|---|
| `200` | Uspešen GET, PATCH, DELETE |
| `201` | Uspešen POST (kreiranje) |
| `400` | Napačni vhodni podatki (validacija) |
| `401` | Ni prijavljen / neveljaven token |
| `403` | Prijavljen, ampak nima dovoljenja |
| `404` | Resource ne obstaja |
| `429` | Rate limit prekoračen |
| `500` | Interna napaka strežnika |
| `503` | Zunanja storitev nedostopna |

---

## 6. Baza podatkov & Prisma

### Kaj je Prisma

Prisma je ORM (Object-Relational Mapper) – namesto da pišeš SQL stavke, pišeš TypeScript kodo in Prisma jo prevede v SQL. Hkrati ti generira TypeScript tipe iz sheme, tako da imaš type-safe dostop do baze povsod v kodi.

### Kako deluje schema.prisma

Celotna struktura baze je definirana v eni datoteki – `prisma/schema.prisma`. Tukaj definiraš modele (tabele) in njihove relacije. Ko spreminjaš shemo, Prisma zna ustvariti SQL migracijo sama.

### Prisma shema – modeli

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String      @id @default(cuid())
  email         String      @unique
  passwordHash  String?     // null če Google OAuth
  googleId      String?     @unique
  name          String
  avatarUrl     String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  itineraries   Itinerary[]
  groupMembers  GroupMember[]
  comments      Comment[]
  votes         Vote[]
  refreshTokens RefreshToken[]

  @@map("users")
}

model Itinerary {
  id            String      @id @default(cuid())
  userId        String
  destination   String
  startDate     DateTime
  endDate       DateTime
  travelType    TravelType
  weatherData   Json?
  days          Json        // Array of days z atrakcijami
  shareToken    String?     @unique
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  user             User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  groupItineraries GroupItinerary[]

  @@map("itineraries")
}

model Group {
  id          String      @id @default(cuid())
  name        String
  description String?
  createdAt   DateTime    @default(now())

  members     GroupMember[]
  itineraries GroupItinerary[]

  @@map("groups")
}

model GroupMember {
  id       String    @id @default(cuid())
  groupId  String
  userId   String
  role     GroupRole @default(MEMBER)
  joinedAt DateTime  @default(now())

  group    Group @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user     User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([groupId, userId])
  @@map("group_members")
}

model GroupItinerary {
  id          String    @id @default(cuid())
  groupId     String
  itineraryId String
  addedAt     DateTime  @default(now())

  group       Group     @relation(fields: [groupId], references: [id], onDelete: Cascade)
  itinerary   Itinerary @relation(fields: [itineraryId], references: [id], onDelete: Cascade)
  comments    Comment[]
  votes       Vote[]

  @@map("group_itineraries")
}

model Comment {
  id               String         @id @default(cuid())
  groupItineraryId String
  userId           String
  content          String
  createdAt        DateTime       @default(now())

  groupItinerary   GroupItinerary @relation(fields: [groupItineraryId], references: [id], onDelete: Cascade)
  user             User           @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("comments")
}

model Vote {
  id               String         @id @default(cuid())
  groupItineraryId String
  userId           String
  attractionId     String
  createdAt        DateTime       @default(now())

  groupItinerary   GroupItinerary @relation(fields: [groupItineraryId], references: [id], onDelete: Cascade)
  user             User           @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([groupItineraryId, userId, attractionId])
  @@map("votes")
}

model RefreshToken {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  user      User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("refresh_tokens")
}

enum TravelType {
  CULTURAL
  GASTRONOMIC
  NATURE
  ADVENTURE
}

enum GroupRole {
  ADMIN
  MEMBER
}
```

### Migracije – kako deluje

Ko spreminjaš shemo (dodajaš tabele, polja, relacije), ne editaš baze direktno. Urediš `schema.prisma` in ustvariš migracijo. Migracija je SQL datoteka ki opisuje spremembo – Prisma jo ustvari sama in jo aplicira na bazo.

**Workflow za vsako spremembo sheme:**

```bash
# 1. Uredi prisma/schema.prisma
# 2. Ustvari migracijo in jo apliciraj na Supabase
npx prisma migrate dev --name kratki-opis-spremembe

# 3. Prisma regenerira TypeScript client (tipe)
npx prisma generate

# 4. Commitaj skupaj
git add prisma/schema.prisma prisma/migrations/
git commit -m "chore: add share token to itinerary"
```

Migracije so del repota. Ko drug član naredi `git pull` in zažene `npx prisma migrate deploy`, dobi enako stanje baze. **Nikoli ne editamo migration SQL datotek ročno.**

**Koristni ukazi:**

```bash
npx prisma migrate dev          # Ustvari + apliciraj migracijo (development)
npx prisma migrate deploy       # Apliciraj obstoječe migracije (produkcija/CI)
npx prisma generate             # Regeneriraj TypeScript client iz sheme
npx prisma studio               # Vizualni brskalnik baze v brskalniku
npx prisma db seed              # Zaženi seed data (testni podatki)
```

### Prisma Service

Prisma Client je singleton – ena instanca za celoten NestJS app:

```typescript
// src/prisma/prisma.service.ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect()
  }
}
```

Vsak service ki potrebuje dostop do baze, prejme `PrismaService` prek dependency injection.

### Supabase nastavitev

1. Ustvari projekt na [supabase.com](https://supabase.com)
2. Kopiraj connection string: **Settings → Database → URI**
3. Nastavi v `.env`:

```bash
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

4. Apliciraj migracije: `npx prisma migrate deploy`

Vsi člani ekipe delajo nad istim Supabase projektom in vidijo iste podatke.

---

## 7. Avtentikacija & varnost

### JWT flow

```
1. Login/Register → backend izda accessToken (15 min) + refreshToken (7 dni)
2. accessToken → v JSON response body → FE ga shrani v memory (React context)
3. refreshToken → httpOnly cookie (ni dostopen JS kodi – varnejše)
4. Vsak API request: Authorization: Bearer <accessToken>
5. Ko 401 → FE samodejno pokliče POST /auth/refresh (cookie gre avtomatično)
6. Backend validira refreshToken → vrne nov accessToken
7. Logout → refreshToken izbrisan iz DB + počiščen cookie
```

> `accessToken` nikoli v `localStorage` – dostopen JS napadom. Shranjen samo v memory (React context).

### Guards – kako zaščitimo endpointe

`JwtAuthGuard` je globalen – velja za vse endpointe privzeto. Za javne endpointe dodamo `@Public()` dekorator:

```typescript
@Public()
@Post('login')
async login(@Body() dto: LoginDto) { ... }

// Zaščiten endpoint – ni potreben noben dekorator
@Get('profile')
async getProfile(@CurrentUser() user: User) { ... }
```

### Validacija z DTO-ji

`ValidationPipe` je globalen v `main.ts` – vsak incoming request se avtomatično validira glede na DTO razred. Ni potrebno ročno preverjati podatkov v controllerju:

```typescript
// main.ts
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
```

`whitelist: true` – vse lastnosti ki niso v DTO-ju se samodejno odstranijo iz requesta.

### CORS

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL,  // Samo FE domena
  credentials: true,                  // Potrebno za httpOnly cookie
})
```

### Rate limiting

AI generiranje je zaščiteno s strožjim limitom da preprečimo zlorabo Gemini kvote:

```typescript
// Globalno: 100 requestov/minuto na IP
// AI endpoint posebej: 5 requestov/minuto na userja
@Throttle({ default: { ttl: 60000, limit: 5 } })
@Post('generate')
async generate() { ... }
```

---

## 8. AI integracija (Gemini)

### Arhitektura

Frontend nikoli ne kliče Gemini direktno. Vse gre prek backend endpointa:

```
FE → POST /api/itinerary/generate { destination, days, travelType, startDate }
   ↓
BE → pridobi vremensko napoved (Google Weather API)
BE → pridobi atrakcije (Google Places)
BE → sestavi prompt za Gemini
BE → streama SSE chunke nazaj na FE          ←── FE prikazuje postopno
BE → ko stream konča → shrani v Prisma DB
BE → pošlje { itineraryId } v zadnjem SSE eventu ←── FE redirect na /itinerary/:id
```

### SSE (Server-Sent Events)

SSE je enosmerna povezava strežnik → klient, kjer strežnik pošilja podatke postopno. Idealno za AI generiranje kjer hočemo da se besedilo pojavi sproti, ne po 20 sekundah naenkrat.

### Prompt

Prompt je v ločeni datoteki `src/itinerary/prompts/generate-itinerary.prompt.ts`. Vključuje destinacijo, tip potovanja, vremensko napoved in seznam atrakcij iz Google Places, ter zahteva strukturiran JSON odgovor. Prompt se izboljšuje iterativno med razvojem.

### Timeout

AI generiranje ima 20 sekundni timeout:

```typescript
const result = await Promise.race([
  this.geminiService.generate(prompt),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Generation timeout')), 20_000)
  )
])
```

---

## 9. Zunanje integracije

Vse klice na zunanje API-je (Places, Google Weather, Spotify) dela **backend**. Frontend ne kliče nobene od teh storitev direktno – API ključi morajo ostati na strežniku.

**Google Places API** – pridobi atrakcije, muzeje, restavracije in parke za destinacijo. Rezultati se vključijo v Gemini prompt.

**Google Weather API** – pridobi vremensko napoved po dnevih. Napoved cachiramo za 1 uro.

**Google Maps Directions API** – optimizacija poti med atrakcijami (minimizacija potovanja znotraj dneva).

**Spotify Web API** (Iteracija 4) – generiranje playliste glede na skupno trajanje vožnje med atrakcijami.

---

## 10. Varovanje API ključev

**Kritično: API ključi nikoli ne zapustijo strežnika.**

```bash
# backend/.env – NIKOLI ne commitamo!
DATABASE_URL=...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
GEMINI_API_KEY=...
GOOGLE_PLACES_API_KEY=...
GOOGLE_MAPS_DIRECTIONS_API_KEY=...
GOOGLE_WEATHER_API_KEY=...
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
FRONTEND_URL=http://localhost:5173
```

```bash
# frontend/.env – edini ključ ki sme biti na FE
VITE_API_URL=http://localhost:3000/api
VITE_GOOGLE_MAPS_API_KEY=...  # Omejen samo na Maps JavaScript API Display
```

> `VITE_GOOGLE_MAPS_API_KEY` mora biti v Google Cloud konzoli omejen na HTTP referrers (vaša domena) in samo na Maps JavaScript API – ne na Places ali Directions.

`.gitignore` mora vsebovati:
```
.env
.env.local
.env.production
```

---

## 11. Error handling

### Global Exception Filter

En globalni filter ujame vse napake in jih vrne v enoten format:

```
{ "success": false, "error": { "code": "ITINERARY_NOT_FOUND", "message": "...", "statusCode": 404 } }
```

Vsaka napaka – ne glede na to kje nastane – vrne konzistenten odgovor.

### API kvote

Ko zunanja storitev vrne napako (npr. Gemini kvota), jo ujamemo in vrnemo razumljivo sporočilo – nikoli raw error:

```typescript
if (error.status === 429) {
  throw new ServiceUnavailableException(
    'AI generation limit reached. Please try again in a few minutes.'
  )
}
```

---

## 12. Pravila pisanja kode

### TypeScript

- **Nikoli `any`** – vedno `interface`, `type`, ali `unknown`.
- Vsi DTO-ji imajo `class-validator` dekoratorje za vsako polje.
- Prisma generirani tipi so single source of truth za DB modele.

### Imenovanje

| Stvar | Konvencija | Primer |
|---|---|---|
| Razredi | PascalCase | `ItineraryService`, `AuthModule` |
| Metode/spremenljivke | camelCase | `generateItinerary()`, `itineraryId` |
| Konstante | SCREAMING_SNAKE_CASE | `MAX_DAYS`, `JWT_EXPIRY` |
| DTO razredi | PascalCase + Dto | `CreateItineraryDto` |
| Datoteke | kebab-case | `itinerary.service.ts`, `create-itinerary.dto.ts` |

### Controller vs Service – kdaj kaj

| Gre v Controller | Gre v Service |
|---|---|
| HTTP routing (`@Get`, `@Post`...) | Poslovna logika |
| Branje params, query, body | DB operacije (Prisma) |
| Klic service metode | Klici na zunanje API-je |
| Return vrednosti | Validacija poslovnih pravil |

### Splošno

- Ena odgovornost na metodo – metode krajše od ~30 vrstic.
- Novih paketov ne dodajamo brez dogovora z ekipo.
- Vsi novi endpointi imajo DTO z validacijo.

---

## 13. AI Instructions preset

> Vsak doda spodnje navodilo v svojega AI asistenta.

```
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
- All API keys stay on the backend. Never expose Gemini, Google Weather, Places, or Spotify keys.
- Global ValidationPipe is set up in main.ts – do not add manual validation in controllers.
- Rate-limit AI endpoints: max 5 requests/minute per user.
- All responses follow { success, data } or { success, error } format via TransformInterceptor.
- AI generation timeout: 20 seconds.
- Cache Google Weather responses for 1 hour.
- Never commit .env files.

Project structure (inside backend/src/):
- auth/        → JWT + Google OAuth
- users/       → User profile management
- itinerary/   → Core: AI generation + CRUD
- gemini/      → Gemini AI service
- attractions/ → Google Places proxy
- weather/     → Google Weather API proxy + caching
- groups/      → Group travel management
- export/      → .ics file generation
- spotify/     → Playlist generation (iter. 4)
- common/      → Guards, filters, interceptors, decorators, types
- prisma/      → Prisma service singleton
```

---

## 14. Git workflow & commit konvencija

### Branch model

```
main          ← Produkcija. Samo stabilen, testiran kod.
develop       ← Aktivni razvoj. Sem gre vse.
  └── feature/auth-jwt
  └── feature/itinerary-generate
  └── feature/groups
  └── fix/weather-cache
  └── chore/prisma-setup
```

- Vsi delamo na feature branchih iz `develop`.
- `main` se merga samo ko je iteracija stabilna.
- Branch se briše po mergeu.

**Poimenovanje:** `feature/<kratki-opis>`, `fix/<kratki-opis>`, `chore/<kratki-opis>`

### Commit sporočila

Format: `<tip>: <kratki opis>` — kratko, jedrnato, v angleščini.

| Tip | Kdaj |
|---|---|
| `feat` | Nova funkcionalnost |
| `fix` | Bug fix |
| `refactor` | Prestrukturiranje |
| `chore` | Setup, dependencies, tooling |
| `docs` | Dokumentacija |
| `test` | Testi |

Primeri:
```
feat: add JWT auth with refresh token rotation
feat: add Gemini SSE streaming endpoint
feat: add weather forecast caching
fix: cascade delete for group members
chore: add votes table migration
test: add itinerary service unit tests
```

**Prisma migracije** commitamo skupaj s shemo:
```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "chore: add votes table"
```

### Pull Request pravila

1. PR odpreš ko je feature **funkcionalno končan**.
2. PR naslov sledi commit konvenciji.
3. PR opis vsebuje: **kaj** je narejeno + **kako preveriti** (Postman/Insomnia koraki).
4. Drugi član pregleda in aprovira pred mergem.
5. Avtor sam merga po approvu, samo v `develop`.

### PR predloga

```markdown
## Kaj je narejeno
Kratki opis.

## Endpointi
- POST /itinerary/generate

## Kako preveriti
1. Zaženi `npm run start:dev`
2. Pošlji request: POST /api/itinerary/generate z body { destination, days, travelType }
3. Preveri SSE stream v Postmanu ali browser DevTools → Network → EventStream

## Checklist
- [ ] Koda sledi pravilom iz BACKEND_ARCHITECTURE.md
- [ ] DTO validacija za vse endpointe
- [ ] Ni console.log ostankov
- [ ] TypeScript brez any
```

---

## 15. Razdelitev dela po iteracijah

### Iteracija 1 – Setup & Auth

| Dev | Naloge |
|---|---|
| **Jan** | NestJS projekt setup, Prisma konfiguracija, Supabase povezava, seed data, `.env.example` |
| **Klemen** | `auth/` modul: register, login, JWT access/refresh token, logout, `/auth/me` |
| **Mojca** | `itinerary/` modul osnova: DTO, Prisma model, basic CRUD brez AI. Gemini service setup. |

### Iteracija 2 – AI generiranje, Places, Weather

| Dev | Naloge |
|---|---|
| **Jan** | `/itinerary/generate` SSE endpoint s streaming odzivom. Prompt engineering. |
| **Klemen** | `attractions/` modul: Google Places proxy. Integracija v prompt. |
| **Mojca** | `weather/` modul: Google Weather API proxy + 1h caching. Google OAuth v auth. |

### Iteracija 3 – Export, urejanje, skupin

| Dev | Naloge |
|---|---|
| **Jan** | `export/` modul: .ics generiranje. Share token za itinerar. |
| **Klemen** | Urejanje itinerarja: swap/dodaj/odstrani atrakcijo endpointi. |
| **Mojca** | `groups/` modul: CRUD skupin, invite sistem, komentarji, glasovanje. |

### Iteracija 4 – Spotify, optimizacije

| Dev | Naloge |
|---|---|
| **Jan** | `spotify/` modul (opcijsko). Rate limiting fine-tuning. |
| **Klemen** | Performančne optimizacije: retry logika, timeout management. |
| **Mojca** | `users/` modul: avatar upload, sprememba gesla, brisanje računa (GDPR). |

### Iteracija 5 – Testi, dokumentacija, deploy

| Dev | Naloge |
|---|---|
| **Vsi** | Integration testi, E2E testi, Swagger API dokumentacija, deploy na Render, varnostni pregled. |

---

*Dokument posodabljamo sproti. Večje arhitekturne odločitve se dokumentirajo tukaj.*  
*Zadnja posodobitev: 2026*
