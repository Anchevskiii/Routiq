# Routiq — Vodnik za začetnike

> Ta dokument razloži celotno aplikacijo Routiq, kot da bi jo razlagali nekomu, ki prvič dela z
> web aplikacijami. Namenjen je tebi — lastniku in vodji projekta — da razumeš vsak del svoje
> aplikacije in ga lahko samostojno spreminjaš.

---

## Kazalo

1. [Kaj sploh je Routiq?](#1-kaj-sploh-je-routiq)
2. [Velika slika — arhitektura](#2-velika-slika--arhitektura)
3. [Zgradba mape (repozitorija)](#3-zgradba-mape-repozitorija)
4. [Frontend — kar uporabnik vidi](#4-frontend--kar-uporabnik-vidi)
5. [Backend — možgani aplikacije](#5-backend--možgani-aplikacije)
6. [Podatkovna baza](#6-podatkovna-baza)
7. [Kako podatki potujejo — celoten primer](#7-kako-podatki-potujejo--celoten-primer)
8. [Avtentikacija (prijava/registracija)](#8-avtentikacija-prijavaregistracija)
9. [AI generiranje itinerarja](#9-ai-generiranje-itinerarja)
10. [Skupinska potovanja](#10-skupinska-potovanja)
11. [Kako kaj spremenim?](#11-kako-kaj-spremenim)
12. [Pogosti izrazi (glosar)](#12-pogosti-izrazi-glosar)

---

## 1. Kaj sploh je Routiq?

Routiq je **spletna aplikacija za načrtovanje potovanj z umetno inteligenco**.

Uporabnik vpiše:
- kam želi potovati (npr. "Pariz")
- kdaj (datumi)
- kakšen tip potovanja (kulturno, avanturistično, gastronomsko...)

In aplikacija **sama generira celoten plan potovanja po dnevih** — z znamenitostmi,
restavracijami, vremensko napovedjo in optimizirano potjo na Google Maps.

Poleg tega lahko uporabnik:
- ureja plan (dodaja/briše aktivnosti, prevleče z miško)
- si ogleda vreme za vsak dan
- izvozi v PDF ali .ics (koledar)
- povabi prijatelje v **skupino**, glasuje za aktivnosti in komentira
- deli itinerar z drugimi prek povezave

---

## 2. Velika slika — arhitektura

Aplikacija je sestavljena iz **dveh ločenih programov**, ki komunicirata prek interneta:

```
┌─────────────────────────────────────────────────────────────┐
│                    UPORABNIKOV BRSCALNIK                     │
│  (Chrome, Firefox, Safari...)                                │
│                                                              │
│  Frontend: React aplikacija (Vite + TypeScript + Tailwind)   │
│             Teče na Vercel.com                                │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS (REST API klici)
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    BACKEND (strežnik)                        │
│  Teče na Railway.app                                         │
│                                                              │
│  NestJS + TypeScript + Prisma ORM                            │
│                                                              │
│  Glavni moduli:                                              │
│  Auth | Itinerary | Groups | Weather | Attractions | Export  │
└──┬──────────┬──────────┬──────────┬──────────┬──────────────┘
   │          │          │          │          │
   ▼          ▼          ▼          ▼          ▼
   Supabase   Google    Google    Google     Resend
  (PostgreSQL  Gemini    Places    Weather   (Email)
   + Auth)     AI        API       API
```

### Pomembno razumeš:

| Koncept | Razlaga |
|---|---|
| **Frontend** | Koda, ki teče v **uporabnikovem brskalniku**. To so vsi gumbi, obrazci, zemljevidi — kar uporabnik vidi in s čimer interagira. |
| **Backend** | Koda, ki teče na **strežniku** (oddaljen računalnik na Railway.app). Uporabnik je ne vidi. Tu se dogaja vsa logika: klici v Google API-je, branje/pisanje v bazo, AI generiranje. |
| **API** | Način, kako frontend in backend komunicirata. Frontend pošlje **HTTP zahtevo** (kot pismo) na določen **endpoint** (naslov), backend odgovori s podatki. |
| **Baza (PostgreSQL)** | Kjer so shranjeni vsi podatki — uporabniki, itinerarji, skupine, komentarji... Gostuje na Supabase. |

---

## 3. Zgradba mape (repozitorija)

```
routiq/                           ← koren projekta (monorepo — vse v enem repozitoriju)
│
├── frontend/                     ← React aplikacija (kar teče v brskalniku)
│   └── src/
│       ├── api/                  ← Vsi HTTP klici na backend (klici v axios)
│       ├── app/                  ← Bootstrap, router, globalni providerji
│       ├── components/
│       │   ├── ui/               ← Gumbi, inputi, modali — LEGO kocke
│       │   ├── layout/           ← Sidebar, Topbar, AppShell
│       │   └── providers/        ← GoogleMapsProvider
│       ├── features/             ← Vsaka večja funkcionalnost ima svojo mapo
│       │   ├── auth/             ← Prijava / registracija
│       │   ├── landing/          ← Javna domača stran
│       │   ├── planner/          ← Čarovnik za vnos potovalnih parametrov
│       │   ├── itinerary/        ← Prikaz in urejanje generiranega plana
│       │   ├── dashboard/        ← Pregled vseh shranjenih potovanj
│       │   ├── groups/           ← Skupinska potovanja
│       │   ├── profile/          ← Uporabniški profil
│       │   └── help/             ← FAQ
│       ├── hooks/                ← Deljena logika (tema, toast, paginacija...)
│       ├── types/                ← TypeScript tipi (blueprint-i za podatke)
│       └── utils/                ← Pomožne funkcije (formatiranje, validacija...)
│
├── backend/                      ← NestJS aplikacija (kar teče na strežniku)
│   ├── prisma/
│   │   └── schema.prisma         ← Definicija celotne podatkovne baze
│   └── src/
│       ├── main.ts               ← Vstopna točka (bootstrap strežnika)
│       ├── app.module.ts         ← Root modul — poveže vse ostale module
│       ├── itinerary/            ← Jedro: AI generiranje + CRUD itinerarjev
│       ├── gemini/               ← Povezava z Google Gemini AI
│       ├── attractions/          ← Povezava z Google Places API
│       ├── weather/              ← Povezava z Google Weather API + cache
│       ├── groups/               ← Skupinska potovanja
│       ├── users/                ← Profili uporabnikov
│       ├── notifications/        ← In-app obvestila
│       ├── export/               ← Izvoz v .ics format
│       ├── mail/                 ← Pošiljanje emailov (Resend)
│       ├── auth/                 ← Placeholder (avtentikacija je na frontendu prek Supabase)
│       ├── supabase/             ← Verifikacija JWT žetonov
│       ├── prisma/               ← Povezava z bazo (PrismaService)
│       └── common/               ← Skupne stvari (guard-i, decorator-ji, filter-i)
│
├── docs/                         ← Dokumentacija
└── .github/workflows/            ← CI/CD (avtomatski testi ob vsakem push-u)
```

### Struktura znotraj vsake feature mape:

**Frontend:**
```
features/<ime>/
  ├── pages/        ← Strani (kar router naloži)
  ├── components/   ← Komponente specifične za ta feature
  └── hooks/        ← React Query hook-i za data fetching
```

**Backend:**
```
<ime>/
  ├── <ime>.module.ts       ← NestJS modul (poveže controller + service)
  ├── <ime>.controller.ts   ← REST endpointi (receptionist)
  ├── <ime>.service.ts      ← Poslovna logika (delavec)
  └── dto/                  ← Validacijski razredi (kakšna je oblika podatkov)
```

---

## 4. Frontend — kar uporabnik vidi

### Tehnologije

| Tehnologija | Vloga |
|---|---|
| **React 18** | Knjižnica za gradnjo uporabniških vmesnikov. Vsak del ekrana je "komponenta". |
| **TypeScript** | JavaScript z dodatnimi tipi — preprečuje napake (npr. ne moreš dat stringa tja, kjer se pričakuje številka). |
| **Vite** | Orodje, ki poganja aplikacijo med razvojem (hitro osveževanje ob spremembah) in naredi končno zgradbo za objavo. |
| **Tailwind CSS** | Način pisanja stila (CSS) — namesto ločenih CSS datotek pišeš razrede kar v HTML/JSX, npr. `className="text-red-500 bg-blue-100"`. |
| **React Router** | Routing — glede na URL prikaže pravo stran. |
| **React Query** | Pametno nalaganje podatkov — avtomatsko cache-a, osvežuje in sledi loading/error stanjem. |
| **Axios** | Orodje za pošiljanje HTTP zahtev na backend. |
| **Zod** | Validacija — preveri, da so podatki v formi pravilni, preden se pošljejo. |

### Kako so komponente organizirane

Komponente so kot **LEGO kocke**. Manjše sestavljaš v večje.

```
Primer: PlannerPage (stran za načrtovanje)
┌─────────────────────────────────────────┐
│  PlannerPage                             │ ← stran (page)
│  ┌─────────────────────────────────────┐│
│  │  PlannerWizard                       ││ ← komponenta za čarovnika
│  │  ┌─────────┐ ┌─────────┐ ┌───────┐ ││
│  │  │ Step 1: │ │ Step 2: │ │ Step 3│ ││ ← vsak korak je svoja komponenta
│  │  │ Destina-│ │ Dates   │ │Travel │ ││
│  │  │ tion    │ │         │ │Type   │ ││
│  │  └─────────┘ └─────────┘ └───────┘ ││
│  │  ┌─────────────────────────────────┐ ││
│  │  │  Button (Generate)              │ ││ ← UI komponenta (gumb)
│  │  └─────────────────────────────────┘ ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

### Pomembne mape na frontendu:

#### `src/components/ui/` — LEGO kocke

Te komponente **nimajo poslovne logike**. Samo prejmejo parametre (props) in izgledajo lepo.

| Komponenta | Uporaba |
|---|---|
| `Button.tsx` | `<Button variant="primary" onClick={...}>Klikni me</Button>` |
| `Input.tsx` | `<Input label="Email" error="...obvezno"/>` |
| `Modal.tsx` | `<Modal isOpen={...} onClose={...}>...</Modal>` |
| `Card.tsx` | `<Card>...</Card>` — bel okvir s senco |
| `Spinner.tsx` | Vrteči se krog med nalaganjem |
| `Toast.tsx` | Oranžno/zeleno obvestilo, ki po nekaj sekundah izgine |
| `Avatar.tsx` | Profilna slika (če je ni, prikaže začetnice) |
| ...in še 15 drugih | |

#### `src/components/layout/` — Ogrodje strani

| Komponenta | Vloga |
|---|---|
| `AppShell.tsx` | **Glavni okvir** — ovije vsako zaščiteno stran. Vsebuje Sidebar + Topbar + prostor za vsebino. |
| `Sidebar.tsx` | Leva navigacija (Dashboard, Planner, Groups...) |
| `Topbar.tsx` | Zgornja vrstica (logo, uporabniški meni) |
| `ProtectedRoute.tsx` | Preveri, če je uporabnik prijavljen. Če ni, ga preusmeri na /login. |

#### `src/features/` — Funkcionalnosti (sobe)

Vsaka večja funkcionalnost ima svojo mapo s tremi podmapami:

- **`pages/`** — Strani. To so komponente, ki jih React Router naloži, ko greš na določen URL. Npr. `PlannerPage.tsx` se naloži, ko greš na `/planner`.
- **`components/`** — Komponente, ki so specifične za to funkcionalnost. Npr. `DayCard.tsx` se uporablja samo v itinerary feature-u.
- **`hooks/`** — React Query hook-i za nalaganje in pošiljanje podatkov.

#### `src/hooks/` — Orodja (uporabna v več funkcionalnostih)

| Hook | Kaj počne |
|---|---|
| `useToast()` | Pokaže obvestilo (npr. "Itinerar shranjen!") |
| `useTheme()` | Preklaplja med svetlim in temnim načinom |
| `useDebounce()` | Počaka, preden sproži iskanje (da ne pošilja zahteve ob vsaki črki) |
| `useMediaQuery()` | Preveri, če je ekran dovolj širok za namizni pogled |

### Kako izgleda ena komponenta (konkreten primer):

```tsx
// Poenostavljen Button.tsx
const Button = ({ children, onClick, variant = 'primary' }) => {
  return (
    <button
      onClick={onClick}
      className={variant === 'primary' ? 'bg-blue-600 text-white' : 'bg-gray-200'}
    >
      {children}
    </button>
  )
}
```

Ta komponenta:
- prejme **props** (parametre): `children` (besedilo na gumbu), `onClick` (kaj se zgodi ob kliku), `variant` (barvna varianta)
- vrne **JSX** (kar izgleda kot HTML, v resnici pa je JavaScript)
- uporabi **Tailwind** razrede za stil (`bg-blue-600` = modro ozadje)

---

## 5. Backend — možgani aplikacije

### Tehnologije

| Tehnologija | Vloga |
|---|---|
| **NestJS 10** | Strukturiran Node.js framework. Organizira kodo v module, controller-je in service-e. |
| **TypeScript** | Enak kot na frontendu — JavaScript s tipi. |
| **Prisma** | ORM — povezuje se s PostgreSQL bazo. Namesto pisanja SQL-ja pišeš `prisma.user.findMany()` (najdi vse uporabnike). |
| **PostgreSQL** | Relacijska podatkovna baza. Gostuje na Supabase. |

### NestJS organizacija

NestJS uporablja **MVC** (Model-View-Controller) arhitekturo:

```
Zahteva od frontenda
       │
       ▼
┌─────────────────┐
│   Controller    │ ← RECEPTIONIST: sprejme zahtevo, preveri parametre,
│                 │   pokliče service, vrne odgovor
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Service      │ ← DELAVEC: tu je vsa poslovna logika,
│                 │   klici v bazo, klici v zunanje API-je
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PrismaService │ ← BAZNIK: povezava s PostgreSQL
└─────────────────┘
```

### Vsak backend modul ima isto strukturo:

```
users/
  ├── users.module.ts        ← Poveže controller + service + morebitne odvisnosti
  ├── users.controller.ts    ← Endpointi: GET /users/profile, PATCH /users/profile...
  ├── users.service.ts       ← Logika: findById, updateProfile, changePassword...
  └── dto/
      └── update-profile.dto.ts  ← Kakšno obliko mora imeti payload
```

### Kako izgleda controller:

```typescript
@Controller('itinerary')           // vsi endpointi v tem controllerju so na /itinerary/*
export class ItineraryController {

  @Get(':id')                       // GET /itinerary/:id
  async getItineraryById(
    @Param('id') id: string,        // id iz URL-ja
    @CurrentUser() user: JwtPayload // kdo je prijavljen (iz JWT žetona)
  ) {
    return this.itineraryService.getItineraryById(id, user.sub)
  }
}
```

Ko frontend pošlje `GET /itinerary/abc123`, controller:
1. Vzame `abc123` iz URL-ja
2. Dobi podatke o uporabniku iz JWT žetona
3. Pokliče `itineraryService.getItineraryById("abc123", "user-id")`
4. Vrne rezultat nazaj frontendu (samodejno se pretvori v JSON)

---

## 6. Podatkovna baza

Baza je **PostgreSQL**, do nje dostopamo prek **Prisma ORM**.

Definicija vseh tabel je v `backend/prisma/schema.prisma`.

### Glavne tabele (poenostavljeno):

```
User ────hasMany──── Itinerary ────hasMany──── Day ────hasMany──── Activity
 │                        │
 │                        ├────hasMany──── GroupItinerary
 │                        │        │
 │                        │        └────belongsTo──── Group
 │                        │                  │
 │                        │                  ├────hasMany──┬── Member (User)
 │                        │                  │              └── Role (ADMIN/MEMBER)
 │                        │                  │
 │                        │                  └────hasMany──┬── Comment
 │                        │                                 └── (odgovori na komentarje)
 │                        │
 │                        ├────hasOne──── WeatherSnapshot (vreme za dan)
 │                        │
 │                        └────hasMany──── GeneralTip (splošni nasveti)
 │
 └────hasMany──── Notification (obvestila)
```

### Kako Prisma deluje v kodi:

```typescript
// Poizvedba v service-u:
const itinerary = await this.prisma.itinerary.findFirst({
  where: { id: 'abc123', deletedAt: null },
  include: {
    days: {
      include: {
        activities: true,     // priloži vse aktivnosti za vsak dan
        weather: true,        // priloži vreme za vsak dan
      },
    },
  },
})
```

To bi v SQL-ju bilo več JOIN-ov. Prisma to naredi veliko bolj berljivo.

---

## 7. Kako podatki potujejo — celoten primer

Sledimo poti podatka, ko uporabnik **odpre seznam svojih potovanj** (dashboard).

### 1. Uporabnik klikne "Dashboard" v sidebaru

### 2. React Router spremeni URL v `/dashboard`

V `router.tsx` je definirano:
```tsx
<Route path="/dashboard" element={<DashboardPage />} />
```
React Router naloži komponento `DashboardPage`.

### 3. DashboardPage uporabi React Query hook

```tsx
// features/dashboard/pages/DashboardPage.tsx (poenostavljeno)
const DashboardPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['itineraries'],
    queryFn: () => itineraryApi.listItineraries(),
  })

  if (isLoading) return <Spinner />
  return data.map(itinerary => <TripCard key={itinerary.id} itinerary={itinerary} />)
}
```

### 4. API klic (v `itinerary.api.ts`)

```typescript
async listItineraries() {
  const response = await apiClient.get('/itinerary')  // GET http://localhost:3000/api/itinerary
  return response.data
}
```

### 5. Axios doda JWT žeton

V `axios.ts` je **interceptor** (nekaj kar se izvede pred vsako zahtevo):
```typescript
apiClient.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${cachedToken}`   // priloži žeton
  return config
})
```

### 6. Backend controller sprejme zahtevo

```typescript
// backend/src/itinerary/itinerary.controller.ts
@Get()
async getUserItineraries(
  @CurrentUser() user: JwtPayload,   // prebere žeton, dobi user.id
  @Query('page') page?: string,
) {
  return this.itineraryService.getUserItineraries(user.sub, pageNum, limitNum)
}
```

### 7. Service pokliče bazo

```typescript
// backend/src/itinerary/itinerary.service.ts
async getUserItineraries(userId: string, page: number, limit: number) {
  const itineraries = await this.prisma.itinerary.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    // ... (samo določena polja, ne vlečemo celega itinerarja)
  })
  return { itineraries, pagination: { total, page, limit } }
}
```

### 8. Odgovor potuje nazaj

Podatki grejo nazaj po isti poti:
```
Prisma Service → Controller → HTTP odgovor → Axios → React Query cache → DashboardPage → TripCard komponenta → uporabnik vidi karte s potovanji
```

---

## 8. Avtentikacija (prijava/registracija)

Routiq uporablja **Supabase Auth** — to pomeni, da ne hranimo gesel sami. Supabase skrbi za varnost.

### Tok prijave:

1. Uporabnik vpiše email/geslo v `LoginForm.tsx`
2. Frontend pokliče `supabase.auth.signInWithPassword()`
3. Supabase preveri email/geslo in vrne **JWT žeton** (digitalni "passport")
4. Frontend shrani žeton v `sessionStorage`
5. Frontend pokliče backend `GET /users/profile` z žetonom v glavi (`Authorization: Bearer <token>`)
6. Backend preveri žeton pri Supabase (v `supabase.service.ts`) in vrne podatke o uporabniku
7. Aplikacija ve, kdo je uporabnik, in prikaže dashboard

### JWT žeton:

- Vsebuje: `{ sub: "user-id", email: "jan@example.com", iat: 123456789, exp: ... }`
- **Podpisan** — backend lahko preveri, da ni ponarejen
- Poteče po določenem času (takrat se uporabnik mora ponovno prijaviti)

### Zaščiteni endpointi:

Vsi endpointi razen login/register imajo `@UseGuards(JwtAuthGuard)` — to pomeni, da **zahtevajo veljaven JWT žeton**. Če ga ni, backend vrne napako 401 (Unauthorized).

---

## 9. AI generiranje itinerarja

To je **srce aplikacije**. Poglejmo, kaj se zgodi, ko uporabnik klikne "Generate":

### 1. Frontend pošlje podatke

```typescript
// itinerary.api.ts
async generateItinerary(payload) {
  return fetch('/api/itinerary/generate', {
    method: 'POST',
    body: JSON.stringify({
      destination: "Paris",
      startDate: "2026-08-15",
      days: 5,
      travelType: "CULTURAL"
    })
  })
}
```

### 2. Backend sprejme in začne streaming

Namesto da čaka na celoten odgovor, backend uporabi **SSE (Server-Sent Events)** — pošilja podatke sproti, ko so pripravljeni.

Controller nastavi glave:
```typescript
res.setHeader('Content-Type', 'text/event-stream')
res.setHeader('Cache-Control', 'no-cache')
res.setHeader('Connection', 'keep-alive')
```

### 3. Preparacija podatkov

`itinerary-generation.service.ts` (generacijski service) naredi tri stvari **sočasno**:

1. **Klic v Google Places API** → poišče znamenitosti v Parizu glede na tip potovanja
2. **Klic v Google Weather API** → dobi vremensko napoved za 5 dni
3. **Sestavi prompt** → navodilo za Gemini AI:

```
Ustvari 5-dnevni itinerar za Pariz (kulturni stil).
Vreme: 15-22°C, sončno.
Razpoložljive atrakcije: [Eiffelov stolp, Louvre, Musée d'Orsay...]
Vsak dan naj ima 4-6 aktivnosti z urami.
```

### 4. Streaming iz Gemini

`gemini.service.ts` pošlje prompt v **Google Gemini 2.5 Flash** in začne **brati odgovor sproti** (kot bi brali knjigo, še preden je napisana do konca).

Za vsak dan, ki ga Gemini "napiše", backend:
1. **Obogati** podatke (doda koordinate, vreme, povezave do Google Maps)
2. Pošlje dogodek (`{ type: 'day', data: { ... } }`) nazaj frontendu
3. Frontend takoj prikaže ta dan (uporabnik vidi, kako nastaja)

### 5. Shranjevanje

Ko Gemini konča, backend:
1. Shrani celoten itinerar v bazo (vse dneve, aktivnosti, vreme, nasvete)
2. Pošlje frontendu `{ type: 'complete', itineraryId: 'abc123' }`
3. Frontend preusmeri uporabnika na stran itinerarja

---

## 10. Skupinska potovanja

To je **socialni del** aplikacije.

### Tok:

1. **Uporabnik ustvari skupino** — doda ime, opis, emoji
2. **Povabi člane** — vpiše njihov email
3. **Backend pošlje email** prek Resend (brez gesla — samo povezavo do skupine)
4. **Člani dodajo itinerarje** v skupino (svoje obstoječe ali generirajo nove)
5. **Glasovanje** — člani lahko glasujejo za itinerarje (upvote/downvote)
6. **Komentarji** — pod vsakim itinerarjem je lahko debata
7. **Reakcije** — emoji na komentarje

### Kako glasovanje deluje:

```typescript
// groups.service.ts
async vote(groupId, itineraryId, userId, voteType: 'UPVOTE') {
  // Če že obstaja glas, ga update-a
  // Če ne obstaja, ga ustvari
  // Prešteje vse glasove za ta itinerar in vrne novo stanje
}
```

---

## 11. Kako kaj spremenim?

### Pravilo: Najdi vzorec in ga kopiraj

Vsaka funkcionalnost v Routiq-u sledi **istemu vzorcu**. Ko hočeš nekaj spremeniti ali dodati, poglej kako podobna stvar že deluje in naredi enako.

### Sprememba barve gumba

1. Odpri `frontend/src/components/ui/Button.tsx`
2. Poišči `variant === 'primary'` in spremeni `bg-blue-600` v `bg-red-600`
3. Shrani — Vite bo avtomatsko osvežil brskalnik

### Dodajanje novega polja v obrazec (npr. "proračun" v planner)

1. **Dodaj v tip** → `frontend/src/types/itinerary.types.ts` — dodaš `budget?: number`
2. **Dodaj v formo** → `frontend/src/features/planner/components/PlannerForm.tsx` — dodaš `<Input name="budget" />`
3. **Dodaj v DTO** → `backend/src/itinerary/dto/create-itinerary.dto.ts` — dodaš `budget`
4. **Dodaj v bazo** → `backend/prisma/schema.prisma` — dodaš `budget Int?`
5. **Poženi migracijo** → `cd backend && npx prisma migrate dev --name add-budget`
6. **Uporabi v storitvi** → `backend/src/itinerary/itinerary.service.ts` — shrani budget v bazo

### Dodajanje nove strani

1. Ustvari mapo `frontend/src/features/foo/pages/FooPage.tsx`
2. Napiši komponento (kopiraj iz `HelpPage.tsx` za začetek)
3. Dodaj route v `frontend/src/app/router.tsx`:
   ```tsx
   <Route path="/foo" element={<FooPage />} />
   ```
4. Dodaj povezavo v sidebar (če je treba): `frontend/src/components/layout/sidebar.data.ts`

### Dodajanje novega API endpointa

1. Ustvari nov modul na backendu: `backend/src/foo/`
   - `foo.module.ts`
   - `foo.controller.ts`
   - `foo.service.ts`
   - `dto/create-foo.dto.ts`
2. Dodaj modul v `app.module.ts`
3. Na frontendu dodaj API klic: `frontend/src/api/foo.api.ts`
4. Uporabi v komponenti prek React Query

---

## 12. Pogosti izrazi (glosar)

| Izraz | Pomen |
|---|---|
| **API** | Vmesnik med frontendom in backendom. Določa, katere zahteve lahko pošiljamo in kakšne odgovore dobimo. |
| **Endpoint** | Konkreten naslov API-ja, npr. `GET /itinerary/123`. |
| **HTTP** | Protokol za komunikacijo po internetu. Metode: GET (branje), POST (ustvarjanje), PATCH (urejanje), DELETE (brisanje). |
| **JWT** | JSON Web Token — digitalni "passport" za avtentikacijo. |
| **SSE** | Server-Sent Events — strežnik pošilja podatke sproti (uporabljeno pri AI generiranju). |
| **ORM** | Object-Relational Mapping — orodje (Prisma) za dostop do baze brez pisanja SQL. |
| **DTO** | Data Transfer Object — definicija, kakšno obliko morajo imeti podatki, ki pridejo na endpoint. |
| **Component** | Samostojen kos uporabniškega vmesnika (gumb, kartica, obrazec...). |
| **Props** | Parametri, ki jih komponenta prejme od starša (npr. `<Button variant="primary" />`). |
| **Hook** | Funkcija v Reactu, ki omogoča uporabo state-a ali drugih React funkcij znotraj komponente. |
| **Query** | React Query — nalaganje podatkov (GET). |
| **Mutation** | React Query — pošiljanje podatkov (POST, PATCH, DELETE). |
| **Cache** | Začasno shranjevanje podatkov, da ni treba vsakič klicati strežnika. |
| **Middleware** | Koda, ki se izvede med prejemom zahteve in odgovorom (npr. preverjanje žetona). |
| **Guard** | Varnostna pregrada na backendu — preveri, če ima uporabnik pravico dostopa. |
| **Interceptor** | Koda, ki se izvede pred ali po vsakem HTTP klicu (npr. dodajanje JWT žetona). |
| **Prisma Schema** | Definicija tabel v bazi v `schema.prisma`. Vsaka sprememba zahteva migracijo. |
| **Migracija** | Sinhronizacija Prisma sheme s pravo bazo (`prisma migrate dev`). |
| **Tailwind** | CSS framework — pišeš stile kar v JSX prek razrednih imen. |
| **Monorepo** | En repozitorij, ki vsebuje več projektov (tukaj frontend + backend). |

---

## Hitra navigacija po mapah

| Iščem... | Odprem... |
|---|---|
| Gumb, input, modal, katerikoli UI element | `frontend/src/components/ui/<ime>.tsx` |
| Strukturo strani (sidebar, topbar) | `frontend/src/components/layout/` |
| Definirane poti (URL-ji) | `frontend/src/constants/routes.ts` |
| React Query ključe za cache | `frontend/src/constants/queryKeys.ts` |
| API klice na backend | `frontend/src/api/<ime>.api.ts` |
| TypeScript tipe | `frontend/src/types/<ime>.types.ts` |
| Pomožne funkcije | `frontend/src/utils/<ime>.utils.ts` |
| Stran (page) | `frontend/src/features/<feature>/pages/<Ime>Page.tsx` |
| Komponento feature-a | `frontend/src/features/<feature>/components/<Ime>.tsx` |
| Data fetching hook | `frontend/src/features/<feature>/hooks/use<Ime>.ts` |
| Backend endpoint | `backend/src/<feature>/<feature>.controller.ts` |
| Poslovno logiko | `backend/src/<feature>/<feature>.service.ts` |
| Bazo (tabele) | `backend/prisma/schema.prisma` |
| Teste | `.spec.ts` ali `.test.ts` (zraven测试 datoteke) |
| CI/CD | `.github/workflows/ci.yml` |

---

*To je tvoja aplikacija. Vsaka vrstica kode v tem projektu je tvoja.  
Zdaj veš, kako deluje — in kako jo lahko spremeniš.*
