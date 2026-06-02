# Podatkovni tokovi — Routiq

← [Nazaj na README](../README.md)

Dokument opisuje ključne podatkovne tokove v sistemu z sequence in activity diagrami.

---

## Kazalo

1. [Avtentikacija — JWT tok](#1-avtentikacija--jwt-tok)
2. [Google OAuth tok](#2-google-oauth-tok)
3. [AI generiranje itinerarja (SSE streaming)](#3-ai-generiranje-itinerarja-sse-streaming)
4. [Urejanje aktivnosti v itinerariju](#4-urejanje-aktivnosti-v-itinerariju)
5. [Ustvari skupino](#5-ustvari-skupino)
6. [Povabi člana v skupino](#6-povabi-člana-v-skupino)
7. [Sprejmi / zavrni povabilo](#7-sprejmi--zavrni-povabilo)
8. [Dodaj itinerar v skupino + glasovanje](#8-dodaj-itinerar-v-skupino--glasovanje)
9. [Izvoz itinerarja](#9-izvoz-itinerarja)

---

## 1. Avtentikacija — JWT tok

Avtentikacija temelji na **Supabase Auth** — Supabase skrbi za JWT izdajanje in verifikacijo. Backend samo validira token prek Supabase Admin SDK.

```mermaid
sequenceDiagram
    participant U as Uporabnik
    participant FE as Frontend (React)
    participant BE as Backend (NestJS)
    participant SB as Supabase Auth
    participant DB as Database

    U->>FE: Vnese email + geslo
    FE->>SB: supabase.auth.signInWithPassword()
    Note over FE,SB: Direkten klic na Supabase (brez backenda)
    SB-->>FE: session { access_token, user }
    FE->>FE: Shrani access_token v sessionStorage (XSS zaščita)
    FE->>FE: Nastavi sejni piškotek sb-access-token (SameSite=Lax, Secure)
    FE->>BE: GET /api/users/profile (Authorization: Bearer access_token)
    BE->>SB: supabase.auth.getUser(token)
    SB-->>BE: user data (id, email, name...)
    BE->>DB: upsertUser (sinhronizacija lokalne kopije)
    BE-->>FE: { success: true, data: user }
    FE->>FE: Shrani user v AuthContext
    FE-->>U: Predvajaj map animacijo -> Redirect na /dashboard

    rect rgb(230, 240, 255)
        Note over U,DB: Vsak standardni API klic
        FE->>BE: Request + Authorization: Bearer token
        BE->>SB: supabase.auth.getUser(token)
        SB-->>BE: user
        BE->>DB: upsertUser (posodobi lastLoginAt)
        BE-->>FE: Response
    end

    rect rgb(230, 255, 230)
        Note over U,DB: Prenos datotek / GET zahtevki (npr. .ics izvoz)
        FE->>BE: GET /api/export/:id/ics + sb-access-token piškotek (avtomatsko)
        Note over BE: Guard preveri piškotek (dovoljeno samo za GET/HEAD)
        BE->>SB: supabase.auth.getUser(token_iz_piskotka)
        SB-->>BE: user
        BE-->>FE: Stream koledarske datoteke (.ics)
    end
```

**Ključne varnostne odločitve:**
1. **sessionStorage**: Žetoni se namesto v `localStorage` shranjujejo v `sessionStorage`, kar preprečuje permanentno krajo žetonov (seja se uniči takoj ob zaprtju zavihka brskalnika).
2. **SameSite=Lax Sejni piškotek**: Sinhroniziran piškotek `sb-access-token` deluje kot varnostni fallback za zaščitene `GET` prenose. Nima nastavljenega roka trajanja (Expires), tako da ga brskalnik izbriše ob zaprtju seje.
3. **CSRF zaščita na backendu**: `JwtAuthGuard` prebere token iz piškotka **izključno pri varnih metodah (`GET`, `HEAD`, `OPTIONS`)**. Za vse ostale (POST, PUT, DELETE, PATCH) zahteva eksplicitno Bearer záhlavje, kar onemogoča CSRF napade.

---

## 2. Google OAuth tok

```mermaid
sequenceDiagram
    participant U as Uporabnik
    participant FE as Frontend
    participant SB as Supabase Auth
    participant G as Google OAuth

    U->>FE: Klikne "Prijavi se z Google"
    FE->>SB: supabase.auth.signInWithOAuth({ provider: 'google' })
    SB->>G: Redirect na Google consent screen
    U->>G: Odobri dostop
    G->>SB: OAuth callback z authorization code
    SB->>SB: Izmenjava code za user profil
    SB-->>FE: Redirect na /auth/callback?session=...
    FE->>FE: supabase.auth.getSession() — pridobi session
    FE->>FE: Shrani user v AuthContext
    FE-->>U: Redirect na /dashboard
```

---

## 3. AI generiranje itinerarja (SSE streaming)

Generiranje poteka v treh fazah: **vzporedna priprava podatkov**, **Gemini SSE streaming** (vsak dan posebej), **Prisma transakcija** (shranjevanje).

![Sequence diagram — AI generiranje](diagrams/seq-ai-generation.png)

```mermaid
sequenceDiagram
    participant U as Uporabnik
    participant FE as Frontend
    participant BE as Backend
    participant WEATHER as Google Weather
    participant PLACES as Google Places
    participant GEMINI as Gemini 2.5 Flash
    participant DB as Database

    U->>FE: Izpolni planner form (destinacija, datumi, tip)
    FE->>FE: Zod validacija vnosov
    FE->>BE: POST /api/itinerary/generate (SSE konekcija)
    BE-->>FE: SSE: { type: 'status', message: 'Pripravljam podatke...' }

    par Vzporedna priprava
        BE->>WEATHER: getWeatherForecast(destination, startDate, days)
        WEATHER-->>BE: Napoved po dnevih (temp, pogoji, ikone)
    and
        BE->>PLACES: searchAttractions(destination, travelType)
        PLACES-->>BE: Seznam atrakcij z koordinatami
    end

    BE-->>FE: SSE: { type: 'attractions', data: [...] }
    BE->>BE: buildItineraryPrompt(destination, travelType, weather, attractions)

    BE->>GEMINI: Streaming prompt
    Note over BE,GEMINI: Model: gemini-2.5-flash\nTimeout: 20s\nRetry: withRetry() exponential backoff

    loop Vsak dan posebej
        GEMINI-->>BE: JSON chunk (en dan: aktivnosti, restavracije, prevoz)
        BE-->>FE: SSE: { type: 'day', data: DayData }
        FE->>FE: Prikaže dan v GenerationLoading UI
    end

    GEMINI-->>BE: stream konča
    BE->>DB: Prisma transakcija:\n• CREATE Itinerary\n• CREATE ItineraryDays (za vsak dan)\n• CREATE ItineraryActivities (za vsako aktivnost)\n• CREATE WeatherSnapshot (za vsak dan)\n• CREATE ItineraryTips

    DB-->>BE: { itineraryId }
    BE-->>FE: SSE: { type: 'complete', itineraryId }
    FE->>FE: navigate('/itinerary/' + itineraryId)
```

### Aktivnostni diagram generiranja

![Aktivnostni diagram — AI generiranje](diagrams/activity-ai-generation.png)

```mermaid
flowchart TD
    Start([Začetek]) --> OpenForm["Odpri planner form"]
    OpenForm --> FillForm["Vnesi destinacijo, datume in tip potovanja"]
    FillForm --> ClickGenerate["Klikni 'Generiraj'"]
    ClickGenerate --> ZodValidate{"Zod validacija\n(client-side)"}

    ZodValidate -->|Neveljaven| ShowClientError["Prikaži napako pri vnosu"]
    ShowClientError --> FillForm
    ZodValidate -->|Veljaven| OpenSSE["Odpri SSE konekcijo\nPOST /itinerary/generate"]

    OpenSSE --> DTOValidate{"DTO validacija\n(server-side)"}
    DTOValidate -->|Neveljaven| Return400["SSE: { type: error }"]
    Return400 --> ShowError["Prikaži napako"]
    ShowError --> End1([Konec])

    DTOValidate -->|Veljaven| FetchParallel["Vzporedno pridobi:\nWeather + Attractions"]
    FetchParallel --> BuildPrompt["Sestavi Gemini prompt"]
    BuildPrompt --> CallGemini["Pošlji prompt Gemini Flash"]

    CallGemini --> GeminiOK{"Gemini odgovor\nveljavna JSON?"}
    GeminiOK -->|Ne| RetryLogic{"withRetry()\nše poizkusov?"}
    RetryLogic -->|Da| CallGemini
    RetryLogic -->|Ne| StreamError["SSE: { type: error }"]
    StreamError --> ShowError2["Prikaži napako"]
    ShowError2 --> End2([Konec])

    GeminiOK -->|Da| StreamDays["SSE stream dnevov\n(1 chunk = 1 dan)"]
    StreamDays --> ShowInUI["FE prikazuje dneve sproti"]
    ShowInUI --> AllDone{"Vsi dnevi\nprejeti?"}
    AllDone -->|Ne| StreamDays
    AllDone -->|Da| SaveToDB["Prisma transakcija:\nshrani vse v DB"]
    SaveToDB --> SSEComplete["SSE: { type: complete, itineraryId }"]
    SSEComplete --> Navigate["FE navigate na /itinerary/:id"]
    Navigate --> End3([Konec ✓])
```

### Promptni inženiering

Prompt (`backend/src/itinerary/prompts/generate-itinerary.prompt.ts`) vsebuje:
- Destinacijo in tip potovanja
- Vremensko napoved za vsak dan (temperature, razmere)
- Seznam atrakcij iz Google Places (z ocenami, koordinatami)
- Navodilo za strukturiran JSON odgovor (specifična shema)
- Navodilo za vnos trajanja aktivnosti (za `durationMinutes`)

---

## 4. Urejanje aktivnosti v itinerariju

```mermaid
sequenceDiagram
    participant U as Uporabnik
    participant FE as Frontend
    participant BE as Backend
    participant DB as Database

    rect rgb(220, 235, 255)
        Note over U,DB: Dodaj aktivnost
        U->>FE: Klikne "Dodaj aktivnost" → izpolni AddActivityModal
        FE->>BE: POST /itinerary/:id/days/:dayId/activities { title, type, startTime, ... }
        BE->>DB: Preveri lastništvo (itinerary.userId == user.id)
        BE->>DB: CREATE ItineraryActivity (sortOrder = max + 1)
        DB-->>BE: Nova aktivnost
        BE-->>FE: { success: true, data: activity }
        FE->>FE: Posodobi TanStack Query cache
    end

    rect rgb(220, 255, 235)
        Note over U,DB: Drag & drop razporejanje
        U->>FE: Potegne aktivnost na novo mesto (@dnd-kit)
        FE->>FE: Optimistično posodobi vrstni red v UI
        FE->>BE: PATCH /itinerary/:id/days/:dayId/activities/:aid { sortOrder: newOrder }
        BE->>DB: UPDATE sortOrder za vse prizadete aktivnosti
        DB-->>BE: OK
        BE-->>FE: Potrjeno
    end

    rect rgb(255, 235, 220)
        Note over U,DB: Brisanje aktivnosti
        U->>FE: Klikne "Odstrani" → ConfirmModal
        FE->>BE: DELETE /itinerary/:id/days/:dayId/activities/:aid
        BE->>DB: Soft delete (deletedAt = now)
        DB-->>BE: OK
        BE-->>FE: { success: true }
        FE->>FE: Odstrani iz TanStack Query cache
    end
```

---

## 5. Ustvari skupino

![Sequence diagram — Ustvari skupino](diagrams/seq-group-create.png)

```mermaid
sequenceDiagram
    participant U as Uporabnik
    participant FE as Frontend (React)
    participant BE as Backend (REST API)
    participant DB as Database (Supabase)

    U->>FE: Odpre CreateGroupModal (wizard)\nIzpolni: ime, opis, barva, slika, povabljenci
    FE->>BE: POST /groups { name, description, themeColor, imageUrl }
    BE->>DB: CREATE Group
    BE->>DB: CREATE GroupMember\n(userId=me, role=OWNER, status=ACCEPTED)
    BE->>DB: CREATE ActivityLog (action: GROUP_CREATED)
    DB-->>BE: { group z id }
    BE-->>FE: { success: true, data: group }
    FE->>FE: navigate('/groups/' + group.id)
    FE-->>U: Prikaže novo skupino
```

---

## 6. Povabi člana v skupino

![Sequence diagram — Povabi člana](diagrams/seq-invite-member.png)

```mermaid
sequenceDiagram
    participant A as Admin/Owner
    participant FE as Frontend
    participant BE as Backend
    participant DB as Database
    participant MAIL as Resend (Mail)
    participant B as Povabljeni uporabnik

    A->>FE: Vnese e-mail + klikne "Povabi"
    FE->>BE: POST /groups/:id/invite { email }

    BE->>DB: Preveri vlogo kličočega (mora biti OWNER ali ADMIN)

    alt Nezadostna vloga
        BE-->>FE: 403 ForbiddenException
    end

    BE->>DB: Lookup user by email
    DB-->>BE: Rezultat

    alt Uporabnik ne obstaja
        BE-->>FE: 404 "Uporabnik nima računa na Routiq"
        FE-->>A: Toast napaka
    else Že aktiven član
        BE-->>FE: 400 "Uporabnik je že član"
        FE-->>A: Toast napaka
    else Povabilo že PENDING
        BE-->>FE: 400 "Povabilo že poslano"
        FE-->>A: Toast napaka
    else Prej DECLINED (re-invite)
        BE->>DB: UPDATE GroupMember\n(status=PENDING, deletedAt=null, invitedAt=now)
        DB-->>BE: OK
        BE->>MAIL: sendInvitation(email, inviterName, groupName)
        MAIL-->>B: E-pošta z invite linkom
        BE-->>FE: { success: true }
        FE-->>A: Toast "Povabilo poslano"
    else Uspešno (novo povabilo)
        BE->>DB: CREATE GroupMember\n(role=MEMBER, status=PENDING, invitedById=me)
        DB-->>BE: OK
        BE->>MAIL: sendInvitation(email, inviterName, groupName)
        MAIL-->>B: E-pošta "Pridruži se skupini {ime}"
        BE-->>FE: { success: true }
        FE-->>A: Toast "Povabilo poslano"
    end
```

---

## 7. Sprejmi / zavrni povabilo

![Sequence diagram — Sprejmi/zavrni povabilo](diagrams/seq-accept-decline.png)

```mermaid
sequenceDiagram
    participant U as Povabljeni uporabnik
    participant FE as Frontend
    participant BE as Backend
    participant DB as Database

    U->>FE: Odpre /groups stran
    FE->>BE: GET /groups/invitations
    BE->>DB: SELECT GroupMembers WHERE userId=me AND status=PENDING
    DB-->>BE: Seznam povabil
    BE-->>FE: { data: invitations[] }
    FE-->>U: Prikaže čakajoča povabila

    alt Sprejmi
        U->>FE: Klikne "Sprejmi"
        FE->>BE: POST /groups/:id/accept
        BE->>DB: UPDATE GroupMember\n(status=ACCEPTED, joinedAt=now, respondedAt=now)
        DB-->>BE: OK
        BE-->>FE: Posodobljeno članstvo
        FE-->>U: Toast "Povabilo sprejeto"\nSkupina se pojavi v seznamu
    else Zavrni
        U->>FE: Klikne "Zavrni"
        FE->>BE: POST /groups/:id/decline
        BE->>DB: UPDATE GroupMember\n(status=DECLINED, respondedAt=now)
        DB-->>BE: OK
        BE-->>FE: OK
        FE-->>U: Toast "Povabilo zavrnjeno"\nOdstrani iz seznama
    end
```

---

## 8. Dodaj itinerar v skupino + glasovanje

![Sequence diagram — Dodaj itinerar + glasovanje](diagrams/seq-add-vote.png)

```mermaid
sequenceDiagram
    participant U as Uporabnik
    participant FE as Frontend
    participant BE as Backend
    participant DB as Database

    rect rgb(215, 232, 255)
        Note over U,DB: Dodaj itinerar v skupino
        U->>FE: Klikne "Dodaj itinerar"
        FE->>BE: GET /itineraries
        BE->>DB: SELECT itineraries WHERE userId=me AND deletedAt IS NULL
        DB-->>BE: Moji itinerarji
        BE-->>FE: Seznam itinerarjev
        FE-->>U: Modal z itinerarji

        U->>FE: Izbere itinerar + klikne "Dodaj"
        FE->>BE: POST /groups/:id/itineraries { itineraryId }
        BE->>DB: Preveri: član z ACCEPTED status?
        BE->>DB: Preveri: itinerar ni že dodan?
        BE->>DB: CREATE GroupItinerary\n(groupId, itineraryId, addedById=me)
        BE->>DB: CREATE ActivityLog (action: ITINERARY_ADDED)
        DB-->>BE: GroupItinerary
        BE-->>FE: { success: true, data: groupItinerary }
        FE-->>U: Toast "Itinerar dodan"
    end

    rect rgb(255, 240, 215)
        Note over U,DB: Glasovanje
        U->>FE: Klikne ▲ UPVOTE ali ▼ DOWNVOTE
        FE->>BE: POST /groups/:gid/itineraries/:giid/vote\n{ voteType: 'UPVOTE' | 'DOWNVOTE' }
        BE->>DB: Preveri članstvo (status=ACCEPTED)
        BE->>DB: UPSERT Vote\n(en glas na userja — zamenja prejšnji)
        DB-->>BE: Posodobljeni glas + skupno število
        BE-->>FE: { upvotes: N, downvotes: M, userVote: 'UPVOTE' }
        FE->>FE: Posodobi VoteWidget + sortira itinerarje po glasovih
    end
```

---

## 9. Izvoz itinerarja

### PDF izvoz (klient)

```mermaid
sequenceDiagram
    participant U as Uporabnik
    participant FE as Frontend

    U->>FE: Klikne "Izvozi PDF"
    FE->>FE: pdf(<ItineraryDocument itinerary={...} />).toBlob()
    Note over FE: @react-pdf/renderer generira PDF\nv brskalniku (brez strežniškega klica)
    FE->>FE: saveAs(blob, 'routiq-{destination}.pdf')
    FE-->>U: Browser sproži download
```

### ICS izvoz (strežnik)

```mermaid
sequenceDiagram
    participant U as Uporabnik
    participant FE as Frontend
    participant BE as Backend
    participant DB as Database

    U->>FE: Klikne "Dodaj v koledar (.ics)"
    FE->>BE: GET /export/:id/ics
    BE->>DB: SELECT itinerary z vsemi dnevi in aktivnostmi
    DB-->>BE: Celoten itinerar
    BE->>BE: Generiraj .ics vsebino\n(ics npm paket)\nEn VEVENT na aktivnost
    BE->>DB: CREATE CalendarExport (format=ICS, exportedAt=now)
    BE-->>FE: application/octet-stream (.ics datoteka)
    FE->>FE: Trigger browser download
    FE-->>U: "routiq-{destination}.ics" se prenese
```
