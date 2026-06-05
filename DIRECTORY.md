# Routiq – Directory Structure

> Celoten pregled vseh datotek in map monorepa z opisi.  
> Frontend + Backend sta v istem repotu (monorepo).  
> Vsaka datoteka ima kratek opis kaj vsebuje.

> **Opomba (junij 2026):** Ta dokument opisuje **dejansko stanje** repota. Ključne točke:
> - **Auth:** Supabase Auth na frontendu (`src/api/supabase.ts`, `AuthProvider` v `src/app/Providers.tsx`). Backend `auth/` je placeholder brez HTTP route-ov.
> - **PDF izvoz:** `features/itinerary/pdf/` (ne ločen `features/export/`).
> - **Spotify:** ni implementiran (samo env placeholderji).
> - **Dodatne strani:** `landing/`, `help/`, `TripsPage`, `NotificationsPage` (`/trips`, `/help`, `/notifications`).
> - **Git branch za razvoj:** `development` (ne `develop`).

---

```
routiq/                                             # Koren monorepa
│
├── frontend/                                       # React 18 + TypeScript + Vite
│   │
│   ├── public/
│   │   └── favicon.ico
│   │
│   ├── src/
│   │   │
│   │   ├── app/                                    # Bootstrap & globalna konfiguracija
│   │   │   ├── App.tsx                             # Root komponenta, ovija router in providerje
│   │   │   ├── Providers.tsx                       # Zbira vse globalne providerje (QueryClient, AuthContext, GoogleMapsProvider...)
│   │   │   └── router.tsx                          # Definicija vseh route-ov z React Router v6
│   │   │
│   │   ├── api/                                    # Vsi HTTP klici na backend – nikoli kliči axios direktno v komponenti
│   │   │   ├── axios.ts                            # Axios instanca: Bearer token iz Supabase seje + sb-access-token piškotek za GET
│   │   │   ├── auth.api.ts                         # login(), register(), logout(), getMe() → GET /users/profile, loginWithGoogle() (Supabase OAuth)
│   │   │   ├── supabase.ts                         # Supabase client (sessionStorage, autoRefreshToken)
│   │   │   ├── itinerary.api.ts                    # generateItinerary(), getItinerary(), listItineraries(), updateItinerary(), deleteItinerary(), shareItinerary()
│   │   │   ├── attractions.api.ts                  # searchAttractions(), swapAttraction(), addAttraction(), removeAttraction()
│   │   │   ├── weather.api.ts                      # getWeatherForecast()
│   │   │   ├── groups.api.ts                       # getGroups(), createGroup(), getGroup(), inviteMember(), removeMember(), vote(), removeVote(), addComment()
│   │   │   ├── notifications.api.ts                # getNotifications(), getUnreadCount(), markRead(), markAllRead()
│   │   │   ├── profile.api.ts                      # getProfile(), updateProfile(), uploadAvatar(), changePassword(), deleteAccount()
│   │   │   └── export.api.ts                       # exportIcs() → download .ics iz backend
│   │   │
│   │   ├── components/                             # Globalne, reusable komponente
│   │   │   │
│   │   │   ├── ui/                                 # Primitivi – brez poslovne logike, samo props → UI
│   │   │   │   ├── Button.tsx                      # Gumb: variant (primary, secondary, ghost, danger), size, isLoading, disabled
│   │   │   │   ├── Input.tsx                       # Text input z label, error state, helperText, icon slot
│   │   │   │   ├── Textarea.tsx                    # Večvrstični input z label in error state
│   │   │   │   ├── Select.tsx                      # Dropdown z opcijami, label, error state
│   │   │   │   ├── Checkbox.tsx                    # Checkbox z labelom
│   │   │   │   ├── Modal.tsx                       # Dialog z overlay, title, footer sloti, onClose handler
│   │   │   │   ├── ConfirmModal.tsx                # Modal za destruktivne akcije (brisanje) z confirm/cancel gumboma
│   │   │   │   ├── Badge.tsx                       # Oznaka za statuse: variant (success, warning, error, info, neutral)
│   │   │   │   ├── Avatar.tsx                      # Profilna slika z fallback inicialkami in size prop
│   │   │   │   ├── Spinner.tsx                     # Loading spinner: size (sm, md, lg)
│   │   │   │   ├── Tooltip.tsx                     # Hover tooltip z content prop in placement
│   │   │   │   ├── Tabs.tsx                        # Tab navigacija z vsebino
│   │   │   │   ├── Dropdown.tsx                    # Kontekstni meni z items array
│   │   │   │   ├── Toast.tsx                       # Obvestilo: variant (success, error, info, warning), auto-dismiss
│   │   │   │   ├── EmptyState.tsx                  # Placeholder ko ni podatkov: icon, title, description, action gumb
│   │   │   │   ├── Card.tsx                        # Splošna kartica z opcijskim headerjem, footerjem, padding
│   │   │   │   ├── Skeleton.tsx                    # Loading placeholder za karte in liste
│   │   │   │   ├── ProgressBar.tsx                 # Napredek za wizard korake in AI generiranje
│   │   │   │   └── StepIndicator.tsx               # Indikator korakov (1/3, 2/3...) za planner wizard
│   │   │   │
│   │   │   ├── layout/                             # Strukturni komponenti aplikacije
│   │   │   │   ├── AppShell.tsx                    # Glavni wrapper: Sidebar + Topbar + page vsebina
│   │   │   │   ├── Sidebar.tsx                     # Leva navigacija: dashboard, planner, groups, profil
│   │   │   │   ├── Topbar.tsx                      # Zgornja vrstica: logo, user menu
│   │   │   │   ├── UserMenu.tsx                    # Dropdown meni: profil, logout
│   │   │   │   ├── ProtectedRoute.tsx              # Auth guard: preusmeri na /login s redirect parametrom
│   │   │   │   ├── PageHeader.tsx                  # Naslov strani z opcijskim action gumbom
│   │   │   │   └── ErrorBoundary.tsx               # Lovi runtime napake, prikaže fallback UI
│   │   │   │
│   │   │   └── providers/                          # Globalni React providerji
│   │   │       └── GoogleMapsProvider.tsx          # LoadScript wrapper za Google Maps JS SDK (enkratna inicializacija)
│   │   │
│   │   ├── features/                               # Feature moduli – ena mapa na večji del aplikacije
│   │   │   │
│   │   │   ├── auth/                               # Avtentikacija
│   │   │   │   ├── pages/
│   │   │   │   │   ├── LoginPage.tsx               # Stran za prijavo z email/password in Google Sign-In
│   │   │   │   │   └── RegisterPage.tsx            # Stran za registracijo
│   │   │   │   ├── components/
│   │   │   │   │   ├── LoginForm.tsx               # Form z email/password, Zod validacija
│   │   │   │   │   ├── RegisterForm.tsx            # Form za registracijo z validacijo
│   │   │   │   │   └── GoogleSignInButton.tsx      # Gumb za Google OAuth (Supabase signInWithOAuth)
│   │   │   │   └── hooks/                          # (useAuth je v app/Providers.tsx)
│   │   │   │
│   │   │   ├── planner/                            # Večstopenjski wizard za vnos potovalnih parametrov
│   │   │   │   ├── pages/
│   │   │   │   │   └── PlannerPage.tsx             # Stran z wizard formom
│   │   │   │   ├── components/
│   │   │   │   │   ├── PlannerWizard.tsx           # Wrapper wizard: koordinira korake in state
│   │   │   │   │   ├── StepDestination.tsx         # Korak 1: vnos destinacije (Google Places autocomplete)
│   │   │   │   │   ├── StepDates.tsx               # Korak 2: izbira datumov in števila dni
│   │   │   │   │   ├── StepTravelType.tsx          # Korak 3: tip potovanja (kulturno, gastronomsko, naravno, avanturistično)
│   │   │   │   │   └── GeneratingOverlay.tsx       # Full-screen overlay med AI generiranjem z ProgressBar in streaming besedilom
│   │   │   │   └── hooks/
│   │   │   │       ├── usePlannerWizard.ts         # State in navigacija med koraki wizarda
│   │   │   │       └── useGenerateItinerary.ts     # SSE stream hook: kliče /itinerary/generate, bere chunke, vrne streamedText in isStreaming
│   │   │   │
│   │   │   ├── itinerary/                          # Prikaz in urejanje generiranega itinerarja
│   │   │   │   ├── pages/
│   │   │   │   │   ├── ItineraryPage.tsx           # Stran z generiranim itinerarjem po dnevih + zemljevid
│   │   │   │   │   └── ItineraryEditPage.tsx       # Stran za ročno urejanje: dodaj/zamenjaj/odstrani atrakcije
│   │   │   │   ├── components/
│   │   │   │   │   ├── ItineraryHeader.tsx         # Naslov itinerarja: destinacija, datumi, gumbi (PDF, ICS, Share)
│   │   │   │   │   ├── DayCard.tsx                 # Kartica enega dne z atrakcijami
│   │   │   │   │   ├── AttractionCard.tsx          # Posamezna atrakcija: ura, ime, tip, opis, tip, Google Maps link
│   │   │   │   │   ├── ItineraryMap.tsx            # Google Maps z označenimi postanki in optimizirano potjo
│   │   │   │   │   ├── AttractionMarker.tsx        # Marker na karti za posamezno atrakcijo
│   │   │   │   │   ├── WeatherBadge.tsx            # Vremenska napoved za dan (ikona + temperatura)
│   │   │   │   │   ├── AttractionSwapModal.tsx     # Modal za zamenjavo atrakcije z alternativami
│   │   │   │   │   └── ShareModal.tsx              # Modal z deljenim linkom in možnostjo kopiranja
│   │   │   │   └── hooks/
│   │   │   │       ├── useItinerary.ts             # Fetch posameznega itinerarja (React Query)
│   │   │   │       ├── useUpdateItinerary.ts       # Mutation za ročno urejanje (swap/add/remove)
│   │   │   │       └── useShareItinerary.ts        # Generiranje in kopiranje deljenega linka
│   │   │   │
│   │   │   ├── dashboard/                          # Pregled vseh shranjenih potovanj
│   │   │   │   ├── pages/
│   │   │   │   │   └── DashboardPage.tsx           # Lista preteklih in prihodnjih itinerarjev
│   │   │   │   ├── components/
│   │   │   │   │   ├── ItinerarySummaryCard.tsx    # Kartica shranjenih potovanj: destinacija, datumi, thumbnail
│   │   │   │   │   └── EmptyDashboard.tsx          # Placeholder za prazni dashboard z CTA na /planner
│   │   │   │   └── hooks/
│   │   │   │       └── useItineraries.ts           # Fetch vse itinerarje userja (React Query, paginirano)
│   │   │   │
│   │   │   ├── groups/                             # Skupinska potovanja
│   │   │   │   ├── pages/
│   │   │   │   │   ├── GroupsPage.tsx              # Seznam vseh skupin userja
│   │   │   │   │   └── GroupDetailPage.tsx         # Detajl skupin: itinerarji, člani, komentarji, glasovanje
│   │   │   │   ├── components/
│   │   │   │   │   ├── GroupCard.tsx               # Kartica skupin v seznamu
│   │   │   │   │   ├── GroupForm.tsx               # Modal za kreiranje skupin
│   │   │   │   │   ├── MemberList.tsx              # Seznam članov skupin z vlogami
│   │   │   │   │   ├── MemberCard.tsx              # Posamezni član: avatar, ime, vloga, akcije (odstrani)
│   │   │   │   │   ├── InviteMemberForm.tsx        # Forma za povabilo: email, pošlje POST /groups/:id/invite
│   │   │   │   │   ├── GroupItineraryList.tsx      # Lista itinerarjev v skupini
│   │   │   │   │   ├── VoteButton.tsx              # Gumb za glasovanje za atrakcijo
│   │   │   │   │   └── CommentSection.tsx          # Sekcija komentarjev za skupinski itinerar
│   │   │   │   └── hooks/
│   │   │   │       ├── useGroups.ts                # Fetch vseh skupin (React Query)
│   │   │   │       ├── useGroup.ts                 # Fetch posamezne skupin
│   │   │   │       ├── useCreateGroup.ts           # Mutation za kreiranje skupin
│   │   │   │       └── useGroupVote.ts             # Mutation za glasovanje za atrakcijo
│   │   │   │
│   │   │   │   # PDF: features/itinerary/pdf/ (ItineraryPdfDocument, pdf-generator)
│   │   │   │   # ICS: api/export.api.ts → GET /export/:id/ics
│   │   │   │
│   │   │   ├── profile/                            # Uporabniški profil
│   │   │   │   ├── pages/
│   │   │   │   │   └── ProfilePage.tsx             # Stran s profilom in nastavitvami
│   │   │   │   ├── components/
│   │   │   │   │   ├── ProfileForm.tsx             # Forma za urejanje profila (ime, email)
│   │   │   │   │   ├── AvatarUpload.tsx            # Upload profilne slike, preview, POST /users/avatar
│   │   │   │   │   ├── ChangePasswordForm.tsx      # Forma za spremembo gesla z Zod validacijo
│   │   │   │   │   └── DeleteAccountSection.tsx    # Brisanje računa (GDPR) z ConfirmModal
│   │   │   │   └── hooks/
│   │   │   │       ├── useProfile.ts               # Fetch profila (React Query)
│   │   │   │       └── useUpdateProfile.ts         # Mutation za posodabljanje profila
│   │   │   │
│   │   │   ├── landing/                            # Javna landing stran (/)
│   │   │   │   └── pages/LandingPage.tsx
│   │   │   └── help/                               # Pomoč in FAQ (/help)
│   │   │       └── pages/HelpPage.tsx
│   │   │   # Spotify — NI implementiran (samo backend env placeholderji)
│   │   │
│   │   ├── hooks/                                  # Shared custom hooks (več featurov jih uporablja)
│   │   │   ├── useDebounce.ts                      # Zakasnitev vrednosti za search input
│   │   │   ├── useLocalStorage.ts                  # Branje/pisanje localStorage z TypeScript tipi
│   │   │   ├── useMediaQuery.ts                    # Odzivnost – preveri CSS breakpoint
│   │   │   ├── useOnClickOutside.ts                # Zazna klik izven elementa (zapiranje dropdownov)
│   │   │   ├── useToast.ts                         # Programatično prikazovanje Toast obvestil
│   │   │   └── usePagination.ts                    # Stanje paginacije (page, limit, total)
│   │   │
│   │   ├── app/Providers.tsx                       # AuthProvider + useAuth() — user, login, logout, register
│   │   │
│   │   ├── types/                                  # Skupni TypeScript tipi
│   │   │   ├── api.types.ts                        # Generični API tipi: ApiResponse<T>, PaginatedResponse<T>, ApiError
│   │   │   ├── auth.types.ts                       # User, LoginDto, RegisterDto, TokenResponse
│   │   │   ├── itinerary.types.ts                  # Itinerary, Day, Attraction, TravelType, CreateItineraryDto
│   │   │   ├── group.types.ts                      # Group, GroupMember, GroupRole, Vote, Comment
│   │   │   ├── weather.types.ts                    # WeatherData, WeatherCondition
│   │   │   └── profile.types.ts                    # Profile, UpdateProfileDto
│   │   │
│   │   ├── utils/                                  # Pure utility funkcije brez side effectov
│   │   │   ├── date.utils.ts                       # Formatiranje datumov z date-fns (formatDate, parseDate, getDaysBetween...)
│   │   │   ├── format.utils.ts                     # Formatiranje stringov, imen, trajanja (npr. "2h 30min")
│   │   │   ├── map.utils.ts                        # Pomožne funkcije za Google Maps (buildDirectionsUrl, getCenter...)
│   │   │   └── validation.utils.ts                 # Skupne Zod sheme za ponovljivo validacijo
│   │   │
│   │   └── constants/                              # Aplikacijske konstante
│   │       ├── routes.ts                           # Vse route poti kot string konstante (ROUTES.PLANNER, ROUTES.ITINERARY(id))
│   │       ├── queryKeys.ts                        # React Query ključi za cache (preprečuje typo napake)
│   │       └── travelTypes.ts                      # TravelType enum + labels + ikone za UI
│   │
│   ├── .env.example                                # Primer env spremenljivk (brez vrednosti) – v git
│   ├── .eslintrc.cjs                               # ESLint pravila
│   ├── .prettierrc                                 # Prettier konfiguracija
│   ├── .gitignore                                  # node_modules, .env, dist
│   ├── index.html                                  # Vstopna točka Vite
│   ├── package.json
│   ├── tailwind.config.ts                          # Tailwind: Routiq barvna paleta, fonti, breakpointi
│   ├── tsconfig.json                               # TypeScript konfiguracija z @/ path aliasom
│   └── vite.config.ts                              # Vite konfiguracija z @/ path aliasom
│
├── backend/                                        # NestJS + Prisma + PostgreSQL
│   │
│   ├── prisma/
│   │   ├── schema.prisma                           # Definicija celotne podatkovne sheme (User, Itinerary, Group...)
│   │   ├── migrations/                             # Auto-generirane Prisma migration datoteke – ne editamo ročno
│   │   │   └── 20260101_init/
│   │   │       └── migration.sql
│   │   └── seed.ts                                 # Seed data za development (testni userji, itinerarji)
│   │
│   ├── src/
│   │   ├── main.ts                                 # Bootstrap: NestFactory, global pipes, CORS, rate limit, Swagger
│   │   ├── app.module.ts                           # Root NestJS modul – uvozi vse feature module
│   │   │
│   │   ├── config/
│   │   │   ├── config.module.ts                    # @nestjs/config setup z validacijo env spremenljivk
│   │   │   └── config.service.ts                   # Type-safe wrapper za dostop do env (get('GEMINI_API_KEY'))
│   │   │
│   │   ├── prisma/
│   │   │   ├── prisma.module.ts                    # Globalni Prisma modul – exporta PrismaService
│   │   │   └── prisma.service.ts                   # PrismaClient singleton z onModuleInit connect
│   │   │
│   │   ├── common/                                 # Deljene stvari med vsemi moduli
│   │   │   ├── decorators/
│   │   │   │   ├── current-user.decorator.ts       # @CurrentUser() – pridobi user iz JWT payload-a
│   │   │   │   └── public.decorator.ts             # @Public() – označi endpoint kot javen (bypass auth guard)
│   │   │   ├── filters/
│   │   │   │   └── all-exceptions.filter.ts        # Global exception filter: ujame vse napake, vrne { success, error } format
│   │   │   ├── guards/
│   │   │   │   ├── jwt-auth.guard.ts               # Globalni JWT guard – zahteva veljaven Bearer token
│   │   │   │   └── roles.guard.ts                  # Guard za group vloge (ADMIN, MEMBER)
│   │   │   ├── interceptors/
│   │   │   │   ├── transform.interceptor.ts        # Ovije vse response-e v { success: true, data: ... } format
│   │   │   │   └── logging.interceptor.ts          # Logira vse requeste: metoda, pot, trajanje, status
│   │   │   └── types/
│   │   │       ├── api-response.type.ts            # ApiResponse<T>, PaginatedResponse<T> tipi
│   │   │       └── jwt-payload.type.ts             # JwtPayload interface (sub, email, iat, exp)
│   │   │
│   │   ├── auth/                                   # Placeholder modul (brez controllerjev — auth prek Supabase na FE)
│   │   │   └── auth.module.ts
│   │   ├── supabase/                               # SupabaseService — supabase.auth.getUser() za JwtAuthGuard
│   │   │   ├── supabase.module.ts
│   │   │   └── supabase.service.ts
│   │   │
│   │   ├── users/                                  # Upravljanje uporabnikov
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts                 # Endpointi: /users/profile (GET, PATCH), /users/avatar, /users/password, /users/account
│   │   │   ├── users.service.ts                    # Logika: findById, updateProfile, uploadAvatar, changePassword, deleteUser
│   │   │   └── dto/
│   │   │       └── update-profile.dto.ts           # { name?, avatarUrl? }
│   │   │
│   │   ├── itinerary/                              # Jedro aplikacije – AI generiranje in CRUD
│   │   │   ├── itinerary.module.ts                 # Uvozi GeminiModule, AttractionsModule, WeatherModule
│   │   │   ├── itinerary.controller.ts             # Endpointi: generate (SSE), CRUD, share
│   │   │   ├── itinerary.service.ts                # Logika: orchestrira Weather + Places + Gemini, shrani rezultat
│   │   │   ├── prompts/
│   │   │   │   └── generate-itinerary.prompt.ts    # buildItineraryPrompt() – sestavlja prompt iz parametrov, vremena in atrakcij
│   │   │   └── dto/
│   │   │       ├── create-itinerary.dto.ts         # { destination, startDate, days, travelType } z validacijo
│   │   │       └── update-itinerary.dto.ts         # Partial update – zamenjava/dodajanje/odstranjevanje atrakcij
│   │   │
│   │   ├── gemini/                                 # Google Gemini 2.5 Flash integracija
│   │   │   ├── gemini.module.ts                    # Globalni modul – exporta GeminiService
│   │   │   └── gemini.service.ts                   # streamGenerate(): SSE streaming iz Gemini API, timeout handling
│   │   │
│   │   ├── attractions/                            # Google Places API proxy
│   │   │   ├── attractions.module.ts
│   │   │   ├── attractions.controller.ts           # Endpointi: /attractions/search, /attractions/swap
│   │   │   ├── attractions.service.ts              # Logika: getPlaces() prek Places API, mapiranje tipov po TravelType
│   │   │   └── dto/
│   │   │       └── search-attractions.dto.ts       # { destination, travelType }
│   │   │
│   │   ├── weather/                                # Google Weather API proxy + caching
│   │   │   ├── weather.module.ts
│   │   │   ├── weather.controller.ts               # Endpoint: /weather?destination=&startDate=&days=
│   │   │   └── weather.service.ts                  # getForecast(): kliče Google Weather API, cache 1h v memory
│   │   │
│   │   ├── groups/                                 # Skupinska potovanja
│   │   │   ├── groups.module.ts
│   │   │   ├── groups.controller.ts                # Endpointi: CRUD skupin, invite, members, itinerarji, vote, removeVote, comments
│   │   │   ├── groups.service.ts                   # Logika: upravljanje skupin, preverjanje vlog (ADMIN vs MEMBER)
│   │   │   └── dto/
│   │   │       ├── create-group.dto.ts             # { name, description? }
│   │   │       ├── invite-member.dto.ts            # { email }
│   │   │       ├── vote-itinerary.dto.ts           # { voteType: UPVOTE | DOWNVOTE }
│   │   │       └── add-comment.dto.ts              # { content }
│   │   │
│   │   ├── notifications/                          # In-app obvestila
│   │   │   ├── notifications.module.ts
│   │   │   ├── notifications.controller.ts         # GET /notifications, unread-count, PATCH read, POST read-all
│   │   │   └── notifications.service.ts            # createNotification(), getUserNotifications(), markRead()
│   │   │
│   │   ├── export/                                 # Izvoz itinerarjev
│   │   │   ├── export.module.ts
│   │   │   ├── export.controller.ts                # Endpoint: GET /export/:id/ics
│   │   │   └── export.service.ts                   # Generiranje .ics datoteke iz Prisma itinerarja (ics npm)
│   │   │
│   │   └── mail/                                   # Transakcijska e-pošta
│   │       ├── mail.module.ts
│   │       └── mail.service.ts                     # sendInvitation() prek Resend SDK
│   │
│   ├── test/
│   │   ├── integration/                            # Integration testi (prava PostgreSQL)
│   │   ├── auth.e2e-spec.ts                        # E2E: Supabase JWT + /users/profile
│   │   ├── groups-social.e2e-spec.ts
│   │   ├── export.e2e-spec.ts
│   │   └── jest-e2e.json
│   │
│   ├── .env                                        # NIKOLI v git! Realni API ključi.
│   ├── .env.example                                # Primer brez vrednosti – v git
│   ├── .eslintrc.cjs
│   ├── .prettierrc
│   ├── .gitignore                                  # node_modules, .env, dist
│   ├── nest-cli.json                               # NestJS CLI konfiguracija
│   ├── package.json
│   ├── tsconfig.json
│   └── tsconfig.build.json
│
├── .github/
│   └── workflows/
│       ├── ci.yml                                  # CI pipeline: lint, testi, build (main + development)
│       └── sonarcloud.yml                          # SonarCloud analiza pokritosti kode
├── sonar-project.properties                        # Konfiguracija SonarCloud projekta
├── FRONTEND_ARCHITECTURE.md                        # FE arhitekturni plan, pravila, razdelitev dela
├── BACKEND_ARCHITECTURE.md                         # BE arhitekturni plan, pravila, razdelitev dela
├── DIRECTORY.md                                    # Ta dokument
└── README.md                                       # Hiter začetek za nove člane ekipe
```

---

## Opombe

### Prioriteta razvoja

| Iteracija | Frontend | Backend |
|---|---|---|
| **1** | Setup, auth feature, UI primitivi, layout | NestJS setup, Prisma/Supabase, auth modul |
| **2** | Planner wizard, AI streaming prikaz, Google Maps | Gemini generiranje, Places API, Weather API |
| **3** | Itinerary prikaz/urejanje, PDF export | ICS generiranje, urejanje atrakcij, groups modul |
| **4** | Groups feature, dashboard, profil | Glasovanje, komentarji, Spotify (opcijsko) |
| **5** | E2E testi, polish, deploy Vercel | Integration testi, deploy Render, varnost |

### Mape ki se ustvarijo sproti

**Spotify** ni implementiran (samo env placeholderji v `backend/.env.example`). Struktura v tem dokumentu prikazuje **dejansko stanje** repota z opombami kjer se razlikuje od zgodnjih načrtov.

### Feature mapa – vedno enaka struktura

**Frontend:**
```
features/<ime>/
  ├── pages/        ← strani (komponente ki jih router direktno naloži)
  ├── components/   ← komponente specifične za ta feature
  └── hooks/        ← custom hooks za data fetching in logiko
```

**Backend:**
```
<ime>/
  ├── <ime>.module.ts       ← NestJS modul
  ├── <ime>.controller.ts   ← REST endpointi
  ├── <ime>.service.ts      ← Poslovna logika
  └── dto/                  ← Validacijski DTO razredi
```

### Ključno: Kje kaj živi

| Stvar | Lokacija |
|---|---|
| UI komponenta (gumb, input...) | `frontend/src/components/ui/` |
| Layout (sidebar, topbar...) | `frontend/src/components/layout/` |
| Feature stran | `frontend/src/features/<feature>/pages/` |
| API klic (axios) | `frontend/src/api/<feature>.api.ts` |
| React Query hook | `frontend/src/features/<feature>/hooks/` |
| TypeScript tip | `frontend/src/types/` |
| Utility funkcija | `frontend/src/utils/` |
| Backend endpoint | `backend/src/<feature>/<feature>.controller.ts` |
| Poslovna logika | `backend/src/<feature>/<feature>.service.ts` |
| DB model | `backend/prisma/schema.prisma` |
| DB query | `backend/src/<feature>/<feature>.service.ts` prek `PrismaService` |
| API ključi | `backend/.env` (NIKOLI frontend, razen VITE_GOOGLE_MAPS_API_KEY) |
