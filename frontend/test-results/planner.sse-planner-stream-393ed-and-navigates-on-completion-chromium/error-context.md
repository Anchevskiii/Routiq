# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: planner.sse.spec.ts >> planner streams itinerary and navigates on completion
- Location: e2e\planner.sse.spec.ts:3:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Crafting Your Adventure')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText('Crafting Your Adventure')

```

```yaml
- complementary:
  - img
  - text: Routiq
  - button "Collapse sidebar":
    - img
  - link "New trip":
    - /url: /planner
    - button "New trip":
      - img
      - text: New trip
  - text: MENU
  - navigation:
    - link "Home":
      - /url: /dashboard
      - img
      - text: Home
    - link "Trips":
      - /url: /trips
      - img
      - text: Trips
    - link "Groups":
      - /url: /groups
      - img
      - text: Groups
    - link "AI Planner":
      - /url: /planner
      - img
      - text: AI Planner
    - link "Saved":
      - /url: /trips
      - img
      - text: Saved
  - text: OTHER
  - navigation:
    - link "Settings":
      - /url: /profile
      - img
      - text: Settings
    - link "Help":
      - /url: /dashboard
      - img
      - text: Help
  - link "EU E2E User e2e@routiq.test":
    - /url: /profile
- banner:
  - img
  - textbox "Search destinations, trips, groups…"
  - text: ⌘K
  - button:
    - img
  - link:
    - /url: /notifications
    - img
  - link "EU":
    - /url: /profile
- navigation:
  - link "Routiq":
    - /url: /dashboard
  - text: /
  - link "Trips":
    - /url: /dashboard
  - text: / Rome
- img "Rome"
- img
- text: Cultural Adventure Rome
- button "Share":
  - img
  - text: Share
- button "PDF":
  - img
  - text: PDF
- heading "Rome" [level=1]
- button:
  - img
- img
- text: When May 10 – May 12, 2024
- img
- text: Length 3 days
- button "Itinerary 3"
- button "Map"
- heading "Daily Route" [level=2]:
  - img
  - text: Daily Route
- button:
  - img
- text: Day 1
- heading "Day 1" [level=3]
- text: Friday, May 10
- img
- text: 1 stops
- img
- img
- strong: "1"
- text: stops
- img
- strong: ~1h
- text: active
- button "09:00"
- text: 60 min
- img
- text: Colosseum Tour sight
- img
- text: 60 min
- button:
  - img
- button "Delete activity":
  - img
- status
- button "Add activity to day 1":
  - img
  - text: Add activity to day 1
- button:
  - img
- text: Day 2
- heading "Day 2" [level=3]
- text: Saturday, May 11
- img
- img
- strong: "0"
- text: stops
- paragraph: No activities planned for this day.
- button "Add activity to day 2":
  - img
  - text: Add activity to day 2
- button:
  - img
- text: Day 3
- heading "Day 3" [level=3]
- text: Sunday, May 12
- img
- img
- strong: "0"
- text: stops
- paragraph: No activities planned for this day.
- button "Add activity to day 3":
  - img
  - text: Add activity to day 3
- status
- complementary:
  - img
  - text: Map
  - img
  - text: Trip Intelligence
  - img
  - text: Best season Spring / Autumn
  - img
  - text: Budget logic Moderate expenditure
  - img
  - text: Pack for Check weather forecasts before departure
  - heading "Export your itinerary" [level=4]
  - paragraph: Download a print-ready PDF or add to your calendar.
  - button "Download PDF":
    - img
    - text: Download PDF
  - button "Add to Calendar":
    - img
    - text: Add to Calendar
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | 
  3   | test('planner streams itinerary and navigates on completion', async ({ page }) => {
  4   |   await page.addInitScript(({ now }) => {
  5   |     const RealDate = Date
  6   |     class MockDate extends RealDate {
  7   |       constructor(...args: ConstructorParameters<typeof Date>) {
  8   |         if (args.length === 0) {
  9   |           return new RealDate(now)
  10  |         }
  11  |         return new RealDate(...args)
  12  |       }
  13  |       static now() {
  14  |         return now
  15  |       }
  16  |     }
  17  |     // @ts-ignore
  18  |     window.Date = MockDate
  19  |   }, { now: new Date('2024-05-10T12:00:00Z').valueOf() })
  20  | 
  21  |   const itineraryId = 'it-123'
  22  |   const itinerary = {
  23  |     id: itineraryId,
  24  |     userId: 'user-1',
  25  |     destination: 'Rome',
  26  |     startDate: '2024-05-10',
  27  |     endDate: '2024-05-12',
  28  |     travelType: 'CULTURAL',
  29  |     totalDays: 3,
  30  |     days: [
  31  |       {
  32  |         id: 'day-1',
  33  |         dayNumber: 1,
  34  |         date: '2024-05-10',
  35  |         activities: [
  36  |           {
  37  |             id: 'act-1',
  38  |             activityType: 'ATTRACTION',
  39  |             sortOrder: 1,
  40  |             title: 'Colosseum Tour',
  41  |             durationMinutes: 60,
  42  |             startTime: '09:00',
  43  |           },
  44  |         ],
  45  |       },
  46  |       {
  47  |         id: 'day-2',
  48  |         dayNumber: 2,
  49  |         date: '2024-05-11',
  50  |         activities: [],
  51  |       },
  52  |       {
  53  |         id: 'day-3',
  54  |         dayNumber: 3,
  55  |         date: '2024-05-12',
  56  |         activities: [],
  57  |       },
  58  |     ],
  59  |     createdAt: '2024-05-01T00:00:00Z',
  60  |     updatedAt: '2024-05-01T00:00:00Z',
  61  |   }
  62  | 
  63  |   const sseBody = [
  64  |     'data: {"type":"status","message":"Starting"}',
  65  |     'data: {"type":"attractions","data":[{"id":"p1","name":"Colosseum","address":"Rome"}]}',
  66  |     'data: {"type":"day","data":{"dayNumber":1,"theme":"Arrival","activities":{"create":[{"title":"Colosseum Tour","startTime":"09:00"}]}}}',
  67  |     `data: {"type":"complete","itineraryId":"${itineraryId}"}`,
  68  |     '',
  69  |   ].join('\n')
  70  | 
  71  |   await page.route('**/api/itinerary/generate', (route) => route.fulfill({
  72  |     status: 200,
  73  |     headers: { 'Content-Type': 'text/event-stream' },
  74  |     body: sseBody,
  75  |   }))
  76  | 
  77  |   await page.route(`**/api/itinerary/${itineraryId}`, (route) => route.fulfill({
  78  |     status: 200,
  79  |     contentType: 'application/json',
  80  |     body: JSON.stringify({ data: itinerary }),
  81  |   }))
  82  | 
  83  |   await page.goto('/planner')
  84  | 
  85  |   await page.locator('input[placeholder^="e.g. Tokyo"]').fill('Rome')
  86  | 
  87  |     await page.getByText('Departure').click()
  88  |   await page.locator('[data-cal]').getByRole('button', { name: 'Today' }).click()
  89  | 
  90  |     await page.getByText('Return').click()
  91  |   await page.locator('[data-cal]').getByRole('button', { name: '12' }).click()
  92  | 
  93  |   await page.getByRole('button', { name: /cultural/i }).click()
  94  |   await expect(page.getByRole('button', { name: /generate itinerary/i })).toBeEnabled()
  95  |   await page.getByRole('button', { name: /generate itinerary/i }).click()
  96  | 
  97  |   const loadingHeading = page.getByText('Crafting Your Adventure')
  98  |   await expect(loadingHeading).toBeVisible()
  99  |   await expect(page.getByText('Colosseum')).toBeVisible()
> 100 |   await expect(loadingHeading).toBeVisible()
      |                                ^ Error: expect(locator).toBeVisible() failed
  101 | 
  102 |   await expect(page).toHaveURL(new RegExp(`/itinerary/${itineraryId}$`))
  103 |   await expect(page.getByRole('heading', { name: 'Rome' })).toBeVisible()
  104 | })
  105 | 
```