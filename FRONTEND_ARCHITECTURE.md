# Routiq – Frontend Architecture

> **Stack:** React 18 + TypeScript + Vite  
> **Ekipa:** Jan Ančevski, Klemen Novak, Mojca Marin  
> **Repo:** Monorepo – `routiq/` → `frontend/` + `backend/`

---

## Kazalo

1. [Tehnološki sklad](#1-tehnološki-sklad)
2. [Organizacija projekta](#2-organizacija-projekta)
3. [Strani & routing](#3-strani--routing)
4. [Komponente](#4-komponente)
5. [API sloj](#5-api-sloj)
6. [Avtentikacija](#6-avtentikacija)
7. [State management](#7-state-management)
8. [Integracije (AI, Karte, Vreme)](#8-integracije-ai-karte-vreme)
9. [Pravila pisanja kode](#9-pravila-pisanja-kode)
10. [AI Instructions preset](#10-ai-instructions-preset)
11. [Git workflow & commit konvencija](#11-git-workflow--commit-konvencija)
12. [Razdelitev dela po iteracijah](#12-razdelitev-dela-po-iteracijah)

---

## 1. Tehnološki sklad

| Kategorija | Tehnologija | Razlog izbire |
|---|---|---|
| Framework | React 18 + TypeScript | Stabilnost, ekosistem, JSX |
| Build tool | Vite | Hiter dev server, HMR |
| Routing | React Router v6 | Standard za React SPA |
| Styling | Tailwind CSS | Utility-first, konsistentno |
| HTTP client | Axios `1.14.0` (pinana!) | Interceptorji, instance |
| Forme | React Hook Form + Zod | Performančno, type-safe validacija |
| Server data | TanStack Query (React Query) | Cache, loading, refetch |
| Datum/čas | date-fns | Tree-shakeable, immutable |
| Karte | Google Maps JavaScript SDK | Interaktivni zemljevid, Places |
| AI prikaz | Streaming text (SSE) | Stream odgovor iz backend AI endpointa |
| Icons | Lucide React | Konsistentna ikona knjižnica |
| PDF izvoz | @react-pdf/renderer | PDF generiranje na klientu |
| Animacije | Framer Motion | Itinerar prehodi, loading stanja |

> ⚠️ **Axios opomba:** Verziji `1.14.1` in `0.30.4` sta bili marca 2026 kompromitirani v supply chain napadu (skupina UNC1069). Vedno pinamo `"axios": "1.14.0"` v `package.json`. **Ne updateamo Axios brez preveritve.**

> ℹ️ **Nove knjižnice:** Ne dodajamo novih paketov brez dogovora z ekipo.

---

## 2. Organizacija projekta

Frontend živi v mapi `frontend/` znotraj monorepa. Projekt je organiziran po dveh ključnih principih:

**Feature-based struktura** – vsak večji del aplikacije (`planner`, `itinerary`, `map`, `groups`...) ima svojo mapo v `features/`. Znotraj nje so strani, komponente in hook-i, ki sodijo samo k temu featureu.

**Shared sloj** – stvari ki se reusajo na več mestih živijo v `components/`. API klici so v `api/`. Tipi so v `types/`. Utility funkcije so v `utils/`.

Celoten pregled strukture je v `DIRECTORY.md` v korenu repota.

---

## 3. Strani & routing

### Planirane strani

| Pot | Stran | Auth potreben |
|---|---|---|
| `/` | Landing / Home | Ne |
| `/login` | Prijava | Ne |
| `/register` | Registracija | Ne |
| `/dashboard` | Pregled shranjenih potovanj | Da |
| `/planner` | Večstopenjski wizard za vnos parametrov | Da |
| `/itinerary/:id` | Generirani itinerar z zemljevidom | Da |
| `/itinerary/:id/edit` | Urejanje atrakcij v itinerarju | Da |
| `/groups` | Seznam potovalnih skupin | Da |
| `/groups/:id` | Detajl skupin + itinerarji + člani | Da |
| `/profile` | Profil & nastavitve | Da |
| `*` | 404 stran | Ne |

### Kako deluje routing

Router je definiran v `src/app/router.tsx`. Vse poti so konstante v `src/constants/routes.ts` – nikoli ne pišemo path stringov direktno v komponente.

```typescript
// src/constants/routes.ts
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PLANNER: '/planner',
  ITINERARY: (id: string) => `/itinerary/${id}`,
  ITINERARY_EDIT: (id: string) => `/itinerary/${id}/edit`,
  GROUPS: '/groups',
  GROUP_DETAIL: (id: string) => `/groups/${id}`,
  PROFILE: '/profile',
} as const
```

Strani ki zahtevajo prijavo so zavite v `<ProtectedRoute>`. Če user ni prijavljen, ga preusmeri na `/login` z `redirect` query parametrom, da se po prijavi vrne na pravo stran.

---

## 4. Komponente

Komponente delimo v tri nivoje:

### `components/ui/` – Primitivi
Osnovni gradniki brez kakršnekoli poslovne logike. Sprejemajo samo props in izrisujejo UI. Ne vedo nič o aplikaciji.

| Komponenta | Opis |
|---|---|
| `Button` | Gumb z variantami: `primary`, `secondary`, `ghost`, `danger`; podpira `isLoading` |
| `Input` | Text input z `label`, `error` state, `helperText` |
| `Textarea` | Večvrstični input |
| `Select` | Dropdown z opcijami |
| `Checkbox` | Checkbox z labelom |
| `Modal` | Dialog z overlay, `title`, `footer` sloti |
| `ConfirmModal` | Modal za destruktivne akcije (brisanje) |
| `Badge` | Oznaka za statuse |
| `Avatar` | Profilna slika z fallback inicialkami |
| `Spinner` | Loading spinner (sm, md, lg) |
| `Tooltip` | Hover tooltip |
| `Tabs` | Tab navigacija |
| `Dropdown` | Kontekstni meni |
| `Toast` | Obvestilo (success, error, info, warning) |
| `EmptyState` | Placeholder ko ni podatkov |
| `ProgressBar` | Napredek za wizard korake in loading AI |
| `StepIndicator` | Indikator korakov v plannerju |
| `Card` | Splošna kartica z opcijskim headerjem in footerjem |
| `Skeleton` | Loading placeholder za karte in liste |

### `components/layout/` – Strukturni
Sestavljajo osnovno lupino aplikacije.

| Komponenta | Opis |
|---|---|
| `AppShell` | Glavni wrapper: Sidebar + Topbar + vsebina |
| `Sidebar` | Leva navigacija (dashboard, planner, groups) |
| `Topbar` | Zgornja vrstica: logo, user menu |
| `UserMenu` | Dropdown: profil, logout |
| `ProtectedRoute` | Auth guard: preusmeri na `/login` če ni prijavljen |
| `PageHeader` | Naslov strani z opcijskim action gumbom |
| `ErrorBoundary` | Lovi runtime napake, prikaže fallback UI |

### `features/*/components/` – Feature-specifični
Komponente specifične za posamezen feature. **Se ne reusajo izven svojega featura.**

### Pravilo reusability

> Če komponento uporabiš na **dveh ali več** mestih → gre v `components/`. Če jo uporablja samo en feature → ostane znotraj `features/<feature>/components/`.

---

## 5. API sloj

Vse klice na backend pišemo v `src/api/`. **Komponente nikoli ne kličejo Axios direktno.**

### Axios instanca

`src/api/axios.ts` vsebuje:
- Base URL iz `.env` (`VITE_API_URL`)
- Request interceptor: avtomatično doda Bearer token iz memory/context
- Response interceptor: ujame 401 → poskusi token refresh → ob neuspehu logout

```typescript
// src/api/axios.ts – primer strukture
import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000, // 30s – AI generiranje je počasnejše
})

// Request interceptor – token
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken() // iz auth context/memory
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor – 401 handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Poskusi refresh, ob neuspehu → logout
    }
    return Promise.reject(error)
  }
)
```

### API datoteke po featurih

```
src/api/
├── axios.ts              # Axios instanca + interceptorji
├── auth.api.ts           # login(), register(), logout(), refreshToken(), getMe()
├── itinerary.api.ts      # generateItinerary(), getItinerary(), updateItinerary(), deleteItinerary(), listItineraries()
├── attractions.api.ts    # getAttractions(), swapAttraction(), addAttraction(), removeAttraction()
├── weather.api.ts        # getWeatherForecast() – proxy prek backend
├── groups.api.ts         # getGroups(), createGroup(), getGroupItineraries(), inviteMember(), vote()
├── profile.api.ts        # getProfile(), updateProfile(), uploadAvatar()
└── export.api.ts         # exportPdf(), exportIcs()
```

### Environment spremenljivke

```bash
# frontend/.env.example
VITE_API_URL=http://localhost:3000/api
VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

> ⚠️ `VITE_GOOGLE_MAPS_API_KEY` je edini API ključ ki gre na frontend (Maps JS SDK zahteva client-side ključ). Vse ostale ključe (Gemini, Google Weather, Places, Spotify) **nikoli** ne izpostavljamo na klientu – gredo izključno na backend.

---

## 6. Avtentikacija

### Tok avtentikacije

1. User se prijavi → backend vrne `accessToken` + nastavi `httpOnly` cookie z `refreshToken`
2. `accessToken` se shrani **izključno v memory** (React context/ref) – **nikoli v localStorage**
3. Vsak API request dobi token prek Axios interceptorja
4. Ko `accessToken` poteče (401), interceptor pokliče `/auth/refresh` → dobi nov token
5. Ob logout se token počisti, kliče se `/auth/logout`, user preusmeri na `/login`

### Auth state

```typescript
// Dostopen prek useAuth() v celotni aplikaciji
interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginDto) => Promise<void>
  logout: () => void
  register: (data: RegisterDto) => Promise<void>
}
```

### Google Sign-In (OAuth)

Backend skrbi za OAuth flow. Frontend samo odpre redirect URL, backend vrne tokene:

```typescript
// auth.api.ts
export const authApi = {
  loginWithGoogle: () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`
  }
}
```

---

## 7. State management

| Vrsta stanja | Orodje | Primer |
|---|---|---|
| Podatki s serverja | TanStack Query | Itinerarji, atrakcije, profil |
| Globalni UI state | React Context | Auth user, tema |
| Lokalni state | `useState` | Modal open/close, wizard korak |
| Forme | React Hook Form + Zod | Vsi formularji |
| AI streaming | `useState` + SSE/fetch stream | Besedilo ki se generira |

### React Query – ključi

Vse query ključe pišemo v `src/constants/queryKeys.ts`:

```typescript
export const QUERY_KEYS = {
  itineraries: ['itineraries'] as const,
  itinerary: (id: string) => ['itineraries', id] as const,
  groups: ['groups'] as const,
  group: (id: string) => ['groups', id] as const,
  profile: ['profile'] as const,
  weather: (destination: string, dates: string) => ['weather', destination, dates] as const,
} as const
```

### AI streaming state

Ker generiranje itinerarja poteka prek SSE streama, upravljamo stanje lokalno:

```typescript
// Primer v useGenerateItinerary.ts
const [streamedText, setStreamedText] = useState('')
const [isStreaming, setIsStreaming] = useState(false)

const startGeneration = async (params: PlannerParams) => {
  setIsStreaming(true)
  const response = await fetch(`${VITE_API_URL}/itinerary/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(params),
  })
  const reader = response.body!.getReader()
  // Procesiranje chunkov...
}
```

---

## 8. Integracije (AI, Karte, Vreme)

### Google Maps JavaScript SDK

Karte inicializiramo enkrat prek `GoogleMapsProvider` komponente:

```typescript
// src/components/providers/GoogleMapsProvider.tsx
import { LoadScript } from '@react-google-maps/api'

const LIBRARIES: Libraries = ['places', 'geometry']

export const GoogleMapsProvider = ({ children }: PropsWithChildren) => (
  <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} libraries={LIBRARIES}>
    {children}
  </LoadScript>
)
```

Komponente ki uporabljajo karte (`ItineraryMap`, `AttractionMarker`) importajo hooks iz `@react-google-maps/api`.

### AI generiranje – prikaz na FE

Frontend ne kliče Gemini direktno. Backend endpoint `/api/itinerary/generate` streama odgovor. FE bere stream in postopno prikazuje itinerar:

```
FE → POST /api/itinerary/generate (params)
   ← SSE stream chunkov JSON
   ← Ko stream konča → itinerar je shranjen v DB, FE dobi `itineraryId`
   ← FE redirect na /itinerary/:id
```

### PDF izvoz

PDF generiramo na klientu z `@react-pdf/renderer`. Backend ne generira PDF-ov:

```typescript
// features/export/components/PdfExportButton.tsx
import { pdf } from '@react-pdf/renderer'
import { ItineraryDocument } from './ItineraryDocument'

const handleExport = async () => {
  const blob = await pdf(<ItineraryDocument itinerary={itinerary} />).toBlob()
  saveAs(blob, `routiq-${itinerary.destination}.pdf`)
}
```

### .ics izvoz

Backend generira `.ics` datoteko, FE jo samo prenese:

```typescript
export const exportApi = {
  exportIcs: async (itineraryId: string) => {
    const response = await apiClient.get(`/export/${itineraryId}/ics`, { responseType: 'blob' })
    // trigger browser download
  }
}
```

---

## 9. Pravila pisanja kode

### TypeScript

- **Nikoli ne uporabi `any`.** Vedno `interface`, `type`, ali `unknown`.
- Vsi component props morajo imeti eksplicitne TypeScript tipe.
- API response tipi sodijo v `src/types/` in se reusajo povsod.
- Zod sheme se pišejo skupaj z React Hook Form za validacijo.

### Imenovanje

| Stvar | Konvencija | Primer |
|---|---|---|
| Komponente & strani | PascalCase | `ItineraryCard`, `PlannerPage` |
| Hook-i | camelCase z `use` | `useItinerary`, `useAuth` |
| Utility funkcije | camelCase | `formatDate`, `buildPrompt` |
| Tipi & interfacei | PascalCase | `Itinerary`, `CreateItineraryDto` |
| Konstante | SCREAMING_SNAKE_CASE | `MAX_DAYS`, `DEFAULT_RADIUS_KM` |
| Datoteke komponent | PascalCase | `ItineraryCard.tsx` |
| Datoteke utility | camelCase | `date.utils.ts` |
| API datoteke | camelCase z `.api` | `itinerary.api.ts` |

### Struktura & importi

- Ena komponenta = ena datoteka.
- **Samo named exporti** – nikoli `export default`.
- Importi vedno z `@/` aliasom, nikoli relativni čez več nivojev.
- Vrstni red importov: React → zunanje knjižnice → interni (`@/`) → relativni.
- Komponente **krajše od ~150 vrstic**. Če je daljša, jo razdeli.

### Styling

- **Samo Tailwind CSS** – brez inline stilov, brez CSS modulov.
- Barvno paleto Routiq definiramo v `tailwind.config.ts` in jo reusamo prek utility razredov.
- Responsivnost je **obvezna** – testiramo na mobile in desktop.

### Splošno

- Ne komentiraj *kaj* koda dela – piši self-explanatory kodo.
- Komentiraj samo *zakaj*, kadar razlog ni očiten.
- Novih knjižnic ne dodajaj brez dogovora z ekipo.
- Vsi formularji imajo Zod validacijo – ni surovih `if (!value)` preverjanj.

---

## 10. AI Instructions preset

> Vsak doda spodnje navodilo v svojega AI asistenta (Cursor rules, GitHub Copilot instructions...).

```
This is the Routiq frontend — a React 18 + TypeScript app built with Vite.

Stack: React Router v6, Tailwind CSS, Axios 1.14.0 (pinned – do NOT upgrade),
React Hook Form + Zod, TanStack Query (React Query), date-fns,
Google Maps JavaScript SDK (@react-google-maps/api),
@react-pdf/renderer, Framer Motion, Lucide React.

Rules:
- Never use `any`. Use proper interfaces, types, or `unknown`.
- All component props must have explicit TypeScript types.
- Only named exports – never `export default`.
- Naming: Components/Pages = PascalCase, hooks = camelCase with `use` prefix,
  utils = camelCase, constants = SCREAMING_SNAKE_CASE.
- Always use the `@/` import alias. Never use relative paths across folders.
- Import order: React → external packages → internal (@/) → relative.
- All API calls go through functions in `src/api/` – never call axios directly in components.
- Use TanStack Query for all server data fetching. No manual fetch + useState + useEffect.
- Use React Hook Form + Zod for all forms and validation.
- Use date-fns for all date operations.
- Tailwind CSS only for styling – no inline styles, no CSS modules.
- Keep components under ~150 lines. Split if longer.
- Do not install new packages without team approval.
- Never expose API keys (Gemini, Google Weather, Spotify, Places) on the client.
  Only VITE_GOOGLE_MAPS_API_KEY is allowed on frontend.
- AI generation uses SSE streaming from backend – never call Gemini directly from FE.

Project structure (inside frontend/):
- src/api/               → API functions per feature + axios instance
- src/app/               → Router, global providers
- src/components/ui/     → Primitive UI components (Button, Input, Modal...)
- src/components/layout/ → AppShell, Sidebar, Topbar, ProtectedRoute
- src/features/          → One folder per feature (auth, planner, itinerary, groups...)
  Each feature: pages/, components/, hooks/
- src/hooks/             → Shared custom hooks
- src/types/             → Shared TypeScript types and interfaces
- src/utils/             → Pure utility functions
- src/constants/         → Route paths, query keys, enums
```

---

## 11. Git workflow & commit konvencija

### Branch model

```
main          ← Produkcija. Merga se samo testirano, delujoče.
develop       ← Aktivni razvoj. Sem gre vse.
  └── feature/planner-wizard
  └── feature/itinerary-map
  └── feature/auth-google-oauth
  └── fix/map-marker-overlap
  └── chore/setup-react-query
```

- Vsi delamo na feature branchih, ki izhajajo iz `develop`.
- `main` se merga samo ko je iteracija stabilna in testirana.
- Branch se briše po mergeu.

**Poimenovanje:** `feature/<kratki-opis>`, `fix/<kratki-opis>`, `chore/<kratki-opis>`, `docs/<kratki-opis>`

### Commit sporočila

Format: `<tip>: <kratki opis>` — kratko, jedrnato, v angleščini.

| Tip | Kdaj |
|---|---|
| `feat` | Nova funkcionalnost |
| `fix` | Bug fix |
| `style` | Samo styling / CSS spremembe |
| `refactor` | Prestrukturiranje brez spremembe funkcionalnosti |
| `chore` | Setup, dependencies, tooling |
| `docs` | Dokumentacija |
| `test` | Testi |

Primeri:
```
feat: add planner wizard form
feat: add AI generation streaming
fix: map markers overlapping on zoom
style: update button colors
refactor: extract token refresh logic
chore: pin axios to 1.14.0
```

### Pull Request pravila

1. PR odpreš ko je feature **funkcionalno končan**.
2. PR naslov sledi commit konvenciji.
3. PR opis vsebuje: **kaj** je narejeno, **kako preveriti** da deluje, **screenshots** za UI spremembe.
4. Drugi član ekipe pregleda in **aprovira** pred mergem.
5. Avtor sam merga po approvu.
6. Merga se **samo v `develop`** (nikoli direktno v `main`).

### PR predloga

```markdown
## Kaj je narejeno
Kratki opis feature-a ali fixa.

## Kako preveriti
1. Pojdi na /planner
2. Vnesi destinacijo in klikni "Generiraj"
3. Preveri da se AI tekst streama postopno

## Screenshots
[priloži screenshot]

## Checklist
- [ ] Koda sledi pravilom iz FRONTEND_ARCHITECTURE.md
- [ ] Testirano na mobilni in desktop velikosti
- [ ] Ni console.log ostankov
- [ ] TypeScript brez any
```

---

## 12. Razdelitev dela po iteracijah

### Iteracija 1 – Setup & Auth & Planner osnova

| Dev | Naloge |
|---|---|
| **Jan** | Vite setup, TS config, Tailwind, ESLint/Prettier, path aliasi, `.env`. Axios instanca. Osnovna mapa struktura. Router setup z vsemi rutami. |
| **Klemen** | UI primitivi: Button, Input, Select, Modal, Spinner, Badge, Card, Skeleton. Layout: AppShell, Sidebar, Topbar. |
| **Mojca** | Auth feature: LoginPage, RegisterPage, Google Sign-In gumb, auth context, ProtectedRoute, forme z Zod validacijo. |

### Iteracija 2 – Planner wizard & AI generiranje

| Dev | Naloge |
|---|---|
| **Jan** | Planner wizard (večstopenjski form): destinacija, dni, datumi, tip potovanja. Zod validacija. AI streaming prikaz z ProgressBar. |
| **Klemen** | Google Maps integracija: GoogleMapsProvider, ItineraryMap komponenta, AttractionMarker. |
| **Mojca** | Itinerary stran: prikaz generiranega plana po dnevih, DayCard, AttractionCard komponente. |

### Iteracija 3 – Export, urejanje, skupin

| Dev | Naloge |
|---|---|
| **Jan** | PDF izvoz z @react-pdf/renderer, .ics izvoz (klic na backend). |
| **Klemen** | Urejanje itinerarja: swap/dodaj/odstrani atrakcijo, drag & drop vrstni red. |
| **Mojca** | Groups feature: GroupsPage, GroupDetailPage, GroupCard, InviteMemberForm, glasovanje za atrakcije. |

### Iteracija 4 – Spotify, i18n, optimizacije

| Dev | Naloge |
|---|---|
| **Jan** | Spotify playlist prikaz (opcijsko), i18n osnova z react-i18next. |
| **Klemen** | Performančne optimizacije: lazy loading strani, Skeleton loaderji, error boundaryji. |
| **Mojca** | Dashboard (seznam shranjenih potovanj), Profile stran, UX polish. |

### Iteracija 5 – Testi, dokumentacija, deploy

| Dev | Naloge |
|---|---|
| **Vsi** | E2E testi (Playwright): vnos → generiranje → prikaz → izvoz. Cross-browser testiranje. Dostopnostne izboljšave. Deploy na Vercel. |

---

*Dokument posodabljamo sproti. Večje arhitekturne odločitve se dokumentirajo tukaj.*  
*Zadnja posodobitev: 2026*
