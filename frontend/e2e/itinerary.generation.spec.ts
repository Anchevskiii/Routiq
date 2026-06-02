import { test, expect } from '@playwright/test'

test('completes the AI generation flow with SSE streaming and rendering', async ({ page }) => {
  const itineraryId = 'it-123'

  // 1. Intercept the SSE generation request and stream back simulated progress + completion events
  await page.route('**/api/itinerary/generate', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      headers: {
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
      body: `data: {"type": "status", "message": "Drafting itinerary..."}\n\ndata: {"type": "complete", "itineraryId": "${itineraryId}"}\n\n`
    })
  })

  // 2. Intercept the subsequent itinerary detail load once redirected
  await page.route(`**/api/itinerary/${itineraryId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          id: itineraryId,
          userId: 'e2e-user',
          destination: 'Rome',
          startDate: '2026-06-02',
          endDate: '2026-06-02',
          travelType: 'CULTURAL',
          totalDays: 1,
          days: [
            {
              id: 'day-1',
              dayNumber: 1,
              date: '2026-06-02',
              activities: [
                {
                  id: 'act-1',
                  activityType: 'ATTRACTION',
                  sortOrder: 1,
                  title: 'Colosseum',
                  durationMinutes: 120,
                  startTime: '09:00',
                }
              ]
            }
          ]
        }
      })
    })
  })

  // 3. Navigate to /planner (auth bypassed by setup)
  await page.goto('/planner')

  // 4. Fill in destination
  const destInput = page.getByPlaceholder('e.g. Tokyo, Lisbon, Reykjavík…')
  await destInput.fill('Rome')

  // 5. Pick start and end dates (Today)
  await page.getByText('Departure').click()
  await page.getByRole('button', { name: 'Today' }).click()

  await page.getByText('Return').click()
  await page.getByRole('button', { name: 'Today' }).click()

  // 6. Select Experience type
  await page.getByRole('button', { name: 'Cultural' }).click()

  // 7. Trigger AI Generation
  const generateBtn = page.getByRole('button', { name: 'Generate itinerary' })
  await expect(generateBtn).toBeEnabled()
  await generateBtn.click()

  // 8. Assert that the URL transitions to the loaded itinerary page
  await expect(page).toHaveURL(new RegExp(`/itinerary/${itineraryId}`))

  // 9. Assert calendar details rendered dynamically
  await expect(page.getByText('Colosseum')).toBeVisible()
})
