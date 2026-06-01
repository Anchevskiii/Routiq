import { test, expect } from '@playwright/test'

test('reorders activities with drag and drop', async ({ page }) => {
  const itineraryId = 'it-456'
  const dayId = 'day-1'
  const itinerary = {
    id: itineraryId,
    userId: 'user-1',
    destination: 'Tokyo',
    startDate: '2024-05-10',
    endDate: '2024-05-11',
    travelType: 'CULTURAL',
    totalDays: 2,
    days: [
      {
        id: dayId,
        dayNumber: 1,
        date: '2024-05-10',
        activities: [
          {
            id: 'act-1',
            activityType: 'ATTRACTION',
            sortOrder: 1,
            title: 'Senso-ji',
            durationMinutes: 60,
            startTime: '09:00',
          },
          {
            id: 'act-2',
            activityType: 'ATTRACTION',
            sortOrder: 2,
            title: 'Shibuya Crossing',
            durationMinutes: 45,
            startTime: '11:00',
          },
        ],
      },
      {
        id: 'day-2',
        dayNumber: 2,
        date: '2024-05-11',
        activities: [],
      },
    ],
    createdAt: '2024-05-01T00:00:00Z',
    updatedAt: '2024-05-01T00:00:00Z',
  }

  const updatedItinerary = {
    ...itinerary,
    days: [
      {
        ...itinerary.days[0],
        activities: [itinerary.days[0].activities[1], itinerary.days[0].activities[0]],
      },
      itinerary.days[1],
    ],
  }

  let fetchCount = 0
  await page.route(`**/api/itinerary/${itineraryId}`, (route) => {
    fetchCount += 1
    const data = fetchCount === 1 ? itinerary : updatedItinerary
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data }),
    })
  })

  await page.route(`**/api/itinerary/${itineraryId}/days/${dayId}/activities/reorder`, (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '{}',
  }))

  await page.goto(`/itinerary/${itineraryId}`)

  await expect(page.getByText('Senso-ji')).toBeVisible()

  await page.getByText('Shibuya Crossing').hover()
  await page.getByText('Senso-ji').hover()

  const handles = page.getByTestId('activity-drag-handle')
  await expect(handles).toHaveCount(2)

  const requestPromise = page.waitForRequest((request) =>
    request.method() === 'PUT' &&
    request.url().includes(`/api/itinerary/${itineraryId}/days/${dayId}/activities/reorder`)
  )

  const source = handles.nth(1)
  const target = handles.nth(0)
  const sourceBox = await source.boundingBox()
  const targetBox = await target.boundingBox()
  if (!sourceBox || !targetBox) throw new Error('Drag handles not visible')

  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 12 })
  await page.mouse.up()

  const request = await requestPromise
  expect(request.postDataJSON()).toEqual({ activityIds: ['act-2', 'act-1'] })

  await expect(page.getByTestId('activity-title').first()).toHaveText('Shibuya Crossing')
  await expect(page.getByTestId('activity-title').nth(1)).toHaveText('Senso-ji')
})
