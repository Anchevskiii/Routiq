# Standardi pisanja kode — Routiq

← [Nazaj na README](../README.md)

Dokument opisuje obvezna pravila pisanja kode za frontend in backend. Namen je zagotoviti konsistentnost med člani ekipe in zmanjšati napake.

---

## Kazalo

1. [TypeScript pravila](#1-typescript-pravila)
2. [Imenovanje](#2-imenovanje)
3. [Frontend strukturna pravila](#3-frontend-strukturna-pravila)
4. [Backend strukturna pravila](#4-backend-strukturna-pravila)
5. [Skupna pravila](#5-skupna-pravila)
6. [Linting in formatiranje](#6-linting-in-formatiranje)

---

## 1. TypeScript pravila

### Nikoli `any`

```typescript
// ❌ Prepovedano
const data: any = response.data
function process(input: any) { ... }

// ✓ Pravilno — konkreten tip
const data: ItineraryResponse = response.data

// ✓ Pravilno — neznani tip
function process(input: unknown) {
  if (typeof input === 'string') { ... }
}

// ✓ Pravilno — za casting v testih
(service as unknown as { privateMethod: () => string }).privateMethod()
```

### Eksplicitni tipi za vse

```typescript
// ❌ Implicitni any parameter
const handler = (e) => console.log(e.target.value)

// ✓ Eksplicitni tip
const handler = (e: React.ChangeEvent<HTMLInputElement>) =>
  console.log(e.target.value)
```

### Zod za runtime validacijo

Na frontendu se za validacijo form podatkov vedno uporablja Zod:

```typescript
// schemas/plannerSchema.ts
const plannerSchema = z.object({
  destination: z.string().min(2, 'Vnesi destinacijo'),
  days: z.number().min(1).max(14),
  travelType: z.enum(['CULTURAL', 'GASTRONOMIC', 'NATURE', 'ADVENTURE', 'RELAX']),
  startDate: z.string().datetime(),
})

type PlannerFormValues = z.infer<typeof plannerSchema>
```

### class-validator na vseh DTO-jih

Na backendu mora vsako polje DTO razreda imeti vsaj en dekorator:

```typescript
export class CreateGroupDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string

  @IsHexColor()
  @IsOptional()
  themeColor?: string
}
```

---

## 2. Imenovanje

### Frontend

| Stvar | Konvencija | Primer |
|---|---|---|
| React komponente | PascalCase | `ItineraryCard`, `PlannerPage` |
| Hook-i | camelCase + `use` prefix | `useItinerary`, `useStream` |
| Utility funkcije | camelCase | `formatDate`, `buildPrompt` |
| TypeScript tipi/interfejsi | PascalCase | `Itinerary`, `CreateItineraryDto` |
| Konstante | SCREAMING_SNAKE_CASE | `MAX_DAYS`, `DEFAULT_RADIUS_KM` |
| Datoteke komponent | PascalCase | `ItineraryCard.tsx` |
| Datoteke utility/hook | camelCase | `date.utils.ts`, `useAuth.ts` |
| API datoteke | camelCase + `.api` | `itinerary.api.ts` |

### Backend

| Stvar | Konvencija | Primer |
|---|---|---|
| Razredi (service, controller...) | PascalCase | `ItineraryService`, `GroupsModule` |
| Metode in spremenljivke | camelCase | `generateStream()`, `itineraryId` |
| Konstante | SCREAMING_SNAKE_CASE | `MAX_DAYS`, `JWT_EXPIRY` |
| DTO razredi | PascalCase + `Dto` | `CreateItineraryDto`, `InviteMemberDto` |
| Datoteke | kebab-case | `itinerary.service.ts`, `create-group.dto.ts` |

### Baza podatkov (Prisma)

| Stvar | Konvencija | Primer |
|---|---|---|
| Model ime | PascalCase | `User`, `GroupItinerary` |
| `@@map()` tabele | snake_case | `group_members`, `itinerary_days` |
| Polja | camelCase | `userId`, `createdAt`, `shareToken` |

---

## 3. Frontend strukturna pravila

### Samo named exporti

```typescript
// ❌ Prepovedano
export default function ItineraryCard() { ... }

// ✓ Pravilno
export function ItineraryCard() { ... }
// ali
export const ItineraryCard: React.FC<Props> = () => { ... }
```

**Zakaj?** Named exporti omogočajo boljši tree-shaking in jasnejše refactoring (rename v IDE deluje zanesljivo).

### Import alias

```typescript
// ❌ Relativne poti čez mape
import { Button } from '../../../components/ui/Button'

// ✓ @/ alias
import { Button } from '@/components/ui/Button'
```

### Vrstni red importov

```typescript
// 1. React
import React, { useState, useEffect } from 'react'

// 2. Zunanje knjižnice
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'

// 3. Interni (@/)
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/app/Providers'

// 4. Relativni (samo znotraj iste mape)
import { plannerSchema } from './schemas/plannerSchema'
```

### Komponente pod 150 vrstic

Komponenta ki presega ~150 vrstic se razdeli na manjše. Znaki da je čas za razdelitev:
- Vsebuje neodvisne vizualne sekcije
- Ima lokalni state ki ni povezan z renderirano vsebino
- Vsebuje kompleksno logiko ki bi šla v custom hook

### Samo Tailwind za styling

```typescript
// ❌ Prepovedano
<div style={{ backgroundColor: '#3b82f6', padding: '1rem' }}>

// ❌ Prepovedano
<div className={styles.container}>

// ✓ Pravilno
<div className="bg-blue-500 p-4">
```

Barvna paleta je definirana v `tailwind.config.ts` — ne hardcodiramo hex barv v className.

### API klici samo v `src/api/`

```typescript
// ❌ Prepovedano — direkten axios klic v komponenti
const GroupDetail = () => {
  useEffect(() => {
    axios.get(`/api/groups/${id}`).then(...)
  }, [])
}

// ✓ Pravilno — prek api/ funkcije + TanStack Query
import { groupsApi } from '@/api/groups.api'

const { data } = useQuery({
  queryKey: QUERY_KEYS.group(id),
  queryFn: () => groupsApi.getGroup(id),
})
```

---

## 4. Backend strukturna pravila

### Controller ne vsebuje poslovne logike

```typescript
// ❌ Napačno — logika v controllerju
@Get(':id')
async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
  const itinerary = await this.prisma.itinerary.findUnique({ where: { id } })
  if (!itinerary || itinerary.userId !== user.sub) {
    throw new NotFoundException()
  }
  return itinerary
}

// ✓ Pravilno — controller samo delegira
@Get(':id')
async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
  return this.itineraryService.getItineraryById(id, user.sub)
}
```

### Service ne ve nič o HTTP

```typescript
// ❌ Napačno — HTTP specifika v serviceu
async getItineraryById(id: string, userId: string, res: Response) {
  const item = await this.prisma.itinerary.findUnique(...)
  res.json(item)  // ← ne!
}

// ✓ Pravilno — service vrne podatke, controller skrbi za HTTP
async getItineraryById(id: string, userId: string): Promise<Itinerary> {
  const item = await this.prisma.itinerary.findUnique(...)
  if (!item) throw new NotFoundException()
  return item
}
```

### Vsi DB klici prek PrismaService

```typescript
// ❌ Prepovedano — direkten import PrismaClient
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// ✓ Pravilno — dependency injection
constructor(private readonly prisma: PrismaService) {}
```

### Preverjanje lastništva pred operacijo

```typescript
// Vsakič ko delamo z user-specifičnimi podatki
const itinerary = await this.prisma.itinerary.findFirst({
  where: {
    id,
    userId,           // Lastništvo preverjamo v query-ju
    deletedAt: null,
  }
})
if (!itinerary) throw new NotFoundException()
```

---

## 5. Skupna pravila

### Brez komentarjev za trivialno kodo

```typescript
// ❌ Unnecessary comment
// Get the user by id
const user = await this.prisma.user.findUnique({ where: { id } })

// ✓ Komentar samo za neočitno logiko
// Jitter prepreči thundering herd po padcu storitve
const jitter = Math.random() * 200
await sleep(delay + jitter)
```

### Brez `console.log` v kodi

```typescript
// ❌ Prepovedano v produkcijski kodi
console.log('Generating itinerary for:', destination)

// ✓ Pravilno — NestJS Logger ali Winston
this.logger.log(`Generating itinerary for: ${destination}`)
this.logger.error(`Gemini timeout after 20s`, error.stack)
```

### Env spremenljivke prek ConfigService

```typescript
// ❌ Prepovedano
const apiKey = process.env.GEMINI_API_KEY

// ✓ Pravilno
constructor(private readonly config: AppConfigService) {}
const apiKey = this.config.getGeminiApiKey()
```

### Brez `any` v testih

```typescript
// ❌ Prepovedano
(service as any).privateMethod()

// ✓ Type-safe casting
(service as unknown as { privateMethod: () => void }).privateMethod()
```

---

## 6. Linting in formatiranje

### Konfiguracije

```
frontend/.eslintrc.cjs    # ESLint za React + TypeScript
frontend/.prettierrc      # Prettier za formatiranje
backend/.eslintrc.cjs     # ESLint za NestJS + TypeScript
backend/.prettierrc       # Prettier za formatiranje
```

### Ključna ESLint pravila

- `@typescript-eslint/no-explicit-any` — prepoveduje `any`
- `@typescript-eslint/no-unused-vars` — prepoveduje nerabljene spremenljivke
- `react-hooks/exhaustive-deps` — zagotavlja pravilne dependency array-e v hooks
- `no-console` — prepoveduje `console.log`

### Zagon

```bash
# Frontend
npm run lint          # Preveri
npm run lint:fix      # Avtomatski popravek
npm run format        # Prettier format

# Backend
npm run lint          # Preveri
npm run format        # Prettier format
```

### VS Code nastavitve (priporočene)

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```
