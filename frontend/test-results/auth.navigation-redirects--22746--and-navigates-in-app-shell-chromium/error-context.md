# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.navigation.spec.ts >> redirects authenticated user and navigates in app shell
- Location: e2e\auth.navigation.spec.ts:3:1

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /dashboard/
Received string:  "http://localhost:5173/login"
Timeout: 10000ms

Call log:
  - Expect "toHaveURL" with timeout 10000ms
    23 × unexpected value "http://localhost:5173/login"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | test('redirects authenticated user and navigates in app shell', async ({ page }) => {
  4  |   await page.route('**/api/itinerary**', (route) => route.fulfill({
  5  |     status: 200,
  6  |     contentType: 'application/json',
  7  |     body: JSON.stringify({ data: [], meta: { total: 0 } }),
  8  |   }))
  9  | 
  10 |   await page.route('**/api/groups**', (route) => route.fulfill({
  11 |     status: 200,
  12 |     contentType: 'application/json',
  13 |     body: JSON.stringify({ data: [] }),
  14 |   }))
  15 | 
  16 |   await page.goto('/login')
> 17 |   await expect(page).toHaveURL(/dashboard/)
     |                      ^ Error: expect(page).toHaveURL(expected) failed
  18 | 
  19 |   await page.getByRole('link', { name: 'AI Planner' }).click()
  20 |   await expect(page).toHaveURL(/planner/)
  21 | })
  22 | 
```