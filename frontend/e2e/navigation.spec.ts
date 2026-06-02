import { test, expect } from '@playwright/test'

test('navigates through main authenticated routes and layouts', async ({ page }) => {
  // 1. Mock endpoints needed for listing itineraries and groups
  await page.route('**/api/itinerary*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [],
        meta: { total: 0, page: 1, limit: 100, totalPages: 0 }
      })
    })
  })

  await page.route('**/api/groups*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: []
      })
    })
  })

  // 2. Visit dashboard directly (auth bypassed)
  await page.goto('/dashboard')
  await expect(page).toHaveURL('/dashboard')

  // 3. Navigate to Trips page
  await page.goto('/trips')
  await expect(page).toHaveURL('/trips')

  // 4. Navigate to Groups page
  await page.goto('/groups')
  await expect(page).toHaveURL('/groups')

  // 5. Navigate to Profile page
  await page.goto('/profile')
  await expect(page).toHaveURL('/profile')
})
