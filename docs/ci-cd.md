# CI/CD pipeline — Routiq

← [Nazaj na README](../README.md)

---

## Kazalo

1. [Pregled pipeline-a](#1-pregled-pipeline-a)
2. [GitHub Actions konfiguracija](#2-github-actions-konfiguracija)
3. [Backend validacija](#3-backend-validacija)
4. [Frontend validacija](#4-frontend-validacija)
5. [Deploy — Vercel (frontend)](#5-deploy--vercel-frontend)
6. [Deploy — Render (backend)](#6-deploy--rendером-backend)
7. [Okolja (environments)](#7-okolja-environments)

---

## 1. Pregled pipeline-a

```mermaid
graph LR
    Push["Push / PR\nna branch main"] --> CI

    subgraph CI["GitHub Actions (.github/workflows/ci.yml)"]
        direction TB
        subgraph BE["Backend Validation (paralelno)"]
            B1["npm ci"] --> B2["npx prisma generate"]
            B2 --> B3["Prettier check"]
            B3 --> B4["ESLint"]
        end

        subgraph FE["Frontend Validation (paralelno)"]
            F1["npm ci"] --> F2["Prettier check"]
            F2 --> F3["ESLint"]
            F3 --> F4["TypeScript type-check\n(tsc --noEmit)"]
            F4 --> F5["Production build\n(vite build)"]
        end
    end

    CI -->|"Oba joba zelena"| Deploy
    CI -->|"Kateri koli job rdeč"| Block["❌ Deploy blokiran"]

    Deploy --> Vercel["☁️ Vercel\n(frontend auto-deploy)"]
    Deploy --> Render["☁️ Render.com\n(backend auto-deploy)"]
```

Pipeline se sproži ob:
- `push` na branch `main`
- `pull_request` na branch `main`

---

## 2. GitHub Actions konfiguracija

Datoteka: `.github/workflows/ci.yml`

```yaml
name: Routiq CI Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  backend-checks:
    name: Backend Validation
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: ./backend/package-lock.json
      - run: npm ci
      - run: npx prisma generate
        env:
          DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/postgres"
      - run: npx prettier --check "src/**/*.ts" "test/**/*.ts"
      - run: npm run lint

  frontend-checks:
    name: Frontend Validation
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: ./frontend/package-lock.json
      - run: npm ci
      - run: npx prettier --check "src/**/*.{ts,tsx,js,jsx,json,css,md}"
      - run: npm run lint
      - run: npm run type-check
      - run: npm run build
```

Backend in frontend joba tečeta **vzporedno** — celoten CI se zaključi hitreje.

---

## 3. Backend validacija

| Korak | Ukaz | Kaj preverja |
|---|---|---|
| Namestitev | `npm ci` | Deterministična namestitev iz `package-lock.json` |
| Prisma generate | `npx prisma generate` | Shema je veljavna, TypeScript tipi se generirajo |
| Formatiranje | `prettier --check` | Vsa TypeScript koda sledi Prettier pravilom |
| Linting | `npm run lint` (ESLint) | Koda sledi ESLint pravilom (`no-any`, naming...) |

**Zakaj `npm ci` namesto `npm install`?**
`npm ci` je deterministično — vedno namesti točno verzije iz `package-lock.json`. `npm install` bi lahko posodobil `package-lock.json` in nenamerno povlekel novo (potencialno kompromitirano) verzijo paketa.

**Prisma generate brez prave baze:**
CI potrebuje samo generiranje TypeScript client-a, ne dejanske DB migracije. `DATABASE_URL` je nastavljen na dummy vrednost — Prisma generate ne vzpostavlja dejanske konekcije.

---

## 4. Frontend validacija

| Korak | Ukaz | Kaj preverja |
|---|---|---|
| Namestitev | `npm ci` | Deterministično |
| Formatiranje | `prettier --check` | Vsi `.ts`, `.tsx`, `.css`, `.json` fajli |
| Linting | `npm run lint` | ESLint pravila |
| TypeScript | `npm run type-check` (`tsc --noEmit`) | TypeScript napake brez generiranja outputa |
| Build | `npm run build` (`vite build`) | Produkcijski build (ujame manjkajoče importe, type napake) |

**Zakaj `vite build` v CI?**
Produkcijski build je strožji od development — ujame:
- Manjkajoče module (import typos)
- TypeScript napake ki jih `--noEmit` morda preskoči
- Tree-shaking napake
- Chunki ki so preveliki (Vite opozorila)

---

## 5. Deploy — Vercel (frontend)

Vercel je konfiguriran za **auto-deploy** ob vsakem push na `main`.

**Konfiguracija** (`frontend/vercel.json`):
```json
{
  "cleanUrls": true,
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

- `cleanUrls: true` — URL-ji brez `.html` končnice
- `rewrites` — SPA fallback: vse poti se preusmerijo na `index.html` (React Router prevzame routing)

**Zakaj je SPA rewrite potreben?**
React Router deluje na klientski strani. Ko uporabnik direktno odpre `https://routiq.app/itinerary/abc`, Vercel strežnik poskuša postreči `/itinerary/abc.html` ki ne obstaja — brez rewrite vrne 404. Z rewrite-om vedno vrne `index.html`, React Router pa potem navigira na pravo stran.

**Environment variables na Vercel:**
- `VITE_API_URL`
- `VITE_GOOGLE_MAPS_API_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 6. Deploy — Render (backend)

Render je konfiguriran za **auto-deploy** ob vsakem push na `main`.

**Tip servisa:** Web Service (container)

**Build command:**
```bash
cd backend && npm ci && npx prisma generate && npm run build
```

**Start command:**
```bash
cd backend && npm run start:prod
```

**Environment variables na Render:**
Vse iz `backend/.env.example` z dejanskimi vrednostmi (Supabase, Google APIs, Gemini, Resend...).

**Health check:**
Render periodično kliče `GET /api/health` — če endpoint ne odgovori, Render restart-a servis.

---

## 7. Okolja (environments)

| Okolje | Frontend | Backend | Baza |
|---|---|---|---|
| **Development** | `http://localhost:5173` | `http://localhost:3000` | Supabase dev projekt |
| **Production** | `https://routiq.vercel.app` | `https://routiq.onrender.com` | Supabase prod projekt |

**Branch strategija:**
- `develop` → development okolje (lokalno)
- `main` → produkcija (Vercel + Render auto-deploy)

Merge v `main` se naredi samo ob stabilni iteraciji — po pregledu in testu na `develop`.
