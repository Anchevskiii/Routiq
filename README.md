# Routiq — AI platforma za načrtovanje potovanj

## English Summary
Routiq is a state-of-the-art web application for AI-powered travel itinerary planning. Users provide a destination, travel dates, and travel style, and the system automatically generates a personalized day-by-day itinerary complete with curated attractions, weather forecasts, and an optimized route on Google Maps. The backend is built with NestJS 10, TypeScript, Prisma, and PostgreSQL (hosted on Supabase), while the frontend is built with React 18, Vite, and Tailwind CSS.

**Ekipa:** Jan Ančevski · Klemen Novak · Mojca Marin

---

## Kazalo dokumentacije

| Dokument | Vsebina |
|---|---|
| [Arhitektura sistema](docs/architecture.md) | Deployment diagram, tech stack, FE/BE arhitektura, komponentni pregled |
| [Podatkovni model](docs/data-model.md) | ER diagram, vse tabele z opisi, enumeracije, indeksi |
| [Podatkovni tokovi](docs/data-flows.md) | Sequence diagrami: avtentikacija, AI generiranje, skupinska potovanja |
| [REST API referenca](docs/api-reference.md) | Vsi endpointi z metodami, parametri in opisi |
| [Varnostna arhitektura](docs/security.md) | JWT tok, shranjevanje tokenov, API ključi, rate limiting, Helmet |
| [Testiranje](docs/testing.md) | Testna strategija, pokritost, spec datoteke, kako zagnati |
| [CI/CD pipeline](docs/ci-cd.md) | GitHub Actions, deploy na Vercel in Railway |
| [Vodenje projekta](docs/project-management.md) | Git workflow, iteracije, commit konvencija, PR pravila |
| [Izzivi in rešitve](docs/challenges.md) | Konkretni problemi ki so se pojavili med razvojem |
| [Standardi pisanja kode](docs/coding-standards.md) | TypeScript pravila, imenovanje, strukturna pravila |

---

## Arhitektura

```
┌─────────────────────────────────────────────────────────────────┐
│                    Uporabnikov brskalnik                        │
│  React SPA (Vite + TypeScript)  │  Google Maps JS SDK          │
└──────────────────┬──────────────────────────────────────────────┘
                   │ HTTPS / REST (Axios)
┌──────────────────▼──────────────────────────────────────────────┐
│                  Railway.app — NestJS REST API                  │
│  Auth │ Itinerary │ Groups │ Weather │ Attractions │ Export     │
└──┬────┴────┬───────┴────────┴────────┴─────────────┴─────┬──────┘
   │         │                                              │
   ▼         ▼                                              ▼
Supabase  Google Cloud                                   Resend
(PostgreSQL  (Gemini AI, Places, Weather, OAuth)         (E-pošta)
 + Auth)
```

Podroben deployment diagram → [Arhitektura sistema](docs/architecture.md#deployment-diagram)

---

## Ključne funkcionalnosti

| Sklop | Opis |
|---|---|
| **AI generiranje** | Google Gemini 2.5 Flash generira itinerar prek SSE streaming — podatki o napredku se uporabijo za animacijo in časovno oceno nalaganja, končni itinerar pa se ob koncu shrani v bazo in prikaže celostno. |
| **Interaktivni zemljevid** | Google Maps z atrakcijami, optimizirano potjo in vremensko napovedjo |
| **Urejanje itinerarja** | Drag & drop razporejanje aktivnosti, dodajanje in brisanje |
| **Skupinska potovanja** | Kreiranje skupin, e-mail povabila (Resend), glasovanje za itinerarje (score = upvoti) |
| **In-app obvestila** | Obvestila za glasovanje, komentarje in skupinska povabila z unread badge |
| **Klepet** | Komentarji s threading (podrejenimi odgovori) in emoji reakcijami |
| **Izvoz** | PDF (klient, @react-pdf/renderer) in .ics (strežnik) |
| **Avtentikacija** | E-mail/geslo + Google OAuth, JWT prek Supabase Auth |
| **Teme** | Svetli in temni način (light/dark mode) |

---

## Tech Stack

| Plast | Tehnologija |
|---|---|
| **Frontend** | React 18 + TypeScript + Vite + Tailwind CSS |
| **Backend** | NestJS 10 + TypeScript |
| **ORM** | Prisma |
| **Baza** | PostgreSQL (Supabase — hosted) |
| **Avtentikacija** | Supabase Auth + Google OAuth |
| **AI** | Google Gemini 2.5 Flash |
| **Karte** | Google Maps JavaScript SDK + Places API + Directions API |
| **Vreme** | Google Weather API |
| **E-pošta** | Resend (transakcijska e-pošta) |
| **Deploy FE** | Vercel |
| **Deploy BE** | Railway.app |
| **Kakovost kode** | SonarCloud |

> ⚠️ **Axios 1.14.0 je pinana** — verziji 1.14.1 in 0.30.4 sta bili marca 2026 kompromitirani v supply chain napadu. Ne posodabljaj brez preveritve. Podrobnosti: [Izzivi in rešitve](docs/challenges.md#supply-chain-napad-na-axios).

---

## Hiter začetek

### Predpogoji

- Node.js >= 20 LTS
- PostgreSQL baza (Supabase priporočen)
- API ključi: Google Cloud Console, Gemini AI Studio, Resend

### Namestitev

```bash
# 1. Kloniraj repozitorij
git clone <repository-url>
cd routiq

# 2. Namesti odvisnosti
cd backend && npm install
cd ../frontend && npm install

# 3. Nastavi okolje
cd backend && cp .env.example .env    # Uredi z API ključi
cd ../frontend && cp .env.example .env

# 4. Pripravi bazo
cd backend
npm run prisma:generate
npm run prisma:migrate dev
npm run prisma:seed    # opcijsko

# 5. Zaženi
# Terminal 1
cd backend && npm run start:dev    # → http://localhost:3000

# Terminal 2
cd frontend && npm run dev         # → http://localhost:5173
```

Swagger API dokumentacija: `http://localhost:3000/api/docs` (samo v development)

### Potrebne environment spremenljivke

```env
# backend/.env
DATABASE_URL=postgresql://...           # Supabase connection pooler (pgbouncer)
DIRECT_URL=postgresql://...             # Direktna konekcija za Prisma migracije
SUPABASE_URL=https://...supabase.co     # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=...           # Service role key (backend JWT verifikacija)
SUPABASE_JWT_SECRET=...                 # JWT secret iz Supabase dashboard
CORS_ORIGIN=http://localhost:5173       # Dovoljeni frontend origin(i)
BACKEND_URL=http://localhost:3000       # Backend URL (OAuth redirecti, share linki)
GEMINI_API_KEY=...
GOOGLE_PLACES_API_KEY=...
GOOGLE_MAPS_DIRECTIONS_API_KEY=...
GOOGLE_WEATHER_API_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
MAIL_HOST=smtp.resend.com               # Resend SMTP
MAIL_PORT=465
MAIL_USER=resend
MAIL_PASS=...                           # Resend API key
MAIL_FROM=onboarding@resend.dev
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
PORT=3000

# frontend/.env
VITE_API_URL=http://localhost:3000/api
VITE_GOOGLE_MAPS_API_KEY=...
VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_ANON_KEY=...
```

---

## Struktura repozitorija

```
routiq/                         # Monorepo koren
├── frontend/                   # React 18 + TypeScript + Vite
│   └── src/
│       ├── api/                # Vsi HTTP klici (Axios)
│       ├── app/                # Router, globalni providerji
│       ├── components/         # UI primitivi + layout
│       ├── features/           # Feature moduli (auth, planner, itinerary, groups...)
│       ├── hooks/              # Deljeni custom hooks
│       ├── types/              # TypeScript tipi
│       └── utils/              # Utility funkcije
├── backend/                    # NestJS + Prisma
│   ├── prisma/
│   │   └── schema.prisma       # Celotna podatkovna shema
│   └── src/
│       ├── auth/               # Placeholder modul (auth prek Supabase na FE)
│       ├── supabase/           # Supabase client za JWT verifikacijo
│       ├── users/              # Profil, nastavitve, avatar
│       ├── itinerary/          # AI generiranje + CRUD (jedro)
│       ├── gemini/             # Gemini SSE streaming service
│       ├── attractions/        # Google Places proxy
│       ├── weather/            # Google Weather proxy + cache
│       ├── groups/             # Skupinska potovanja
│       ├── notifications/      # In-app obvestila (vote, invite, komentar)
│       ├── export/             # .ics generiranje
│       ├── mail/               # Resend e-pošta
│       └── common/             # Guards, filters, interceptors, utils
├── .github/workflows/
│   ├── ci.yml                  # GitHub Actions CI pipeline (backend + frontend)
│   └── sonarcloud.yml          # SonarCloud analiza pokritosti kode
└── docs/                       # Detajlna dokumentacija (→ kazalo zgoraj)
```

Popoln pregled vseh datotek: [DIRECTORY.md](DIRECTORY.md)

---

## Testi

```bash
# Backend (Jest)
cd backend
npx jest                    # Vsi unit testi
npx jest --coverage         # Z LCOV poročilom pokritosti
npx jest --watch            # Watch mode
npm run test:integration    # Integration testi (zahteva PostgreSQL)

# Frontend (Vitest)
cd frontend
npm run test:unit:run       # Enkratni tek
npm run test:unit           # Watch mode
npx vitest run --coverage   # Z LCOV pokritostjo
```

Podrobna dokumentacija testov: [Testiranje](docs/testing.md)

---

## Deploy

| Okolje | Storitev | Branch |
|---|---|---|
| Frontend | Vercel | `main` |
| Backend | Railway.app | `main` |
| CI teki | GitHub Actions | `main`, `development` |

CI/CD pipeline se sproži ob vsakem PR/push na `main`. Podrobnosti: [CI/CD pipeline](docs/ci-cd.md)

---

*Projekt razvit v okviru predmeta pri UM FERI, 2026.*  
*Ekipa: Jan Ančevski · Klemen Novak · Mojca Marin*
