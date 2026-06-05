import { describe, it, expect, vi, beforeEach } from 'vitest'
import { itineraryApi } from './itinerary.api'
import { apiClient } from './axios'
import { supabase } from './supabase'

vi.mock('./axios', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}))

describe('itineraryApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock global fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })
  })

  it('generateItinerary calls fetch with correct URL and headers', async () => {
    const mockSession = { access_token: 'mock-token' }
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as any)

    const payload = { title: 'Trip', destination: 'Paris', startDate: '2026-06-05', endDate: '2026-06-10' }
    await itineraryApi.generateItinerary(payload as any)

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/itinerary/generate'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-token',
        }),
        body: JSON.stringify(payload),
      })
    )
  })

  it('getItinerary calls apiClient.get and returns data', async () => {
    const mockItinerary = { id: 'itinerary-1', title: 'Trip to Paris' }
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { data: mockItinerary },
    })

    const result = await itineraryApi.getItinerary('itinerary-1')
    expect(apiClient.get).toHaveBeenCalledWith('/itinerary/itinerary-1')
    expect(result).toEqual(mockItinerary)
  })

  it('listItineraries calls apiClient.get with params', async () => {
    const mockResponse = { data: [], total: 0 }
    vi.mocked(apiClient.get).mockResolvedValue({
      data: mockResponse,
    })

    const params = { page: 1 }
    const result = await itineraryApi.listItineraries(params)
    expect(apiClient.get).toHaveBeenCalledWith('/itinerary', { params })
    expect(result).toEqual(mockResponse)
  })

  it('updateItinerary calls apiClient.patch and returns updated itinerary', async () => {
    const mockItinerary = { id: 'itinerary-1', title: 'Updated' }
    vi.mocked(apiClient.patch).mockResolvedValue({
      data: { data: mockItinerary },
    })

    const result = await itineraryApi.updateItinerary('itinerary-1', { title: 'Updated' })
    expect(apiClient.patch).toHaveBeenCalledWith('/itinerary/itinerary-1', { title: 'Updated' })
    expect(result).toEqual(mockItinerary)
  })

  it('deleteItinerary calls apiClient.delete', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({})
    await itineraryApi.deleteItinerary('itinerary-1')
    expect(apiClient.delete).toHaveBeenCalledWith('/itinerary/itinerary-1')
  })

  it('shareItinerary calls apiClient.post and returns share link', async () => {
    const mockData = { shareLink: 'http://link' }
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { data: mockData },
    })

    const result = await itineraryApi.shareItinerary('itinerary-1')
    expect(apiClient.post).toHaveBeenCalledWith('/itinerary/itinerary-1/share')
    expect(result).toEqual(mockData)
  })

  it('reorderDays calls apiClient.put and returns updated itinerary', async () => {
    const mockItinerary = { id: 'itinerary-1', days: [] }
    vi.mocked(apiClient.put).mockResolvedValue({
      data: { data: mockItinerary },
    })

    const result = await itineraryApi.reorderDays('itinerary-1', ['day-1'])
    expect(apiClient.put).toHaveBeenCalledWith('/itinerary/itinerary-1/days/reorder', { dayIds: ['day-1'] })
    expect(result).toEqual(mockItinerary)
  })

  it('reorderActivities calls apiClient.put', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({})
    await itineraryApi.reorderActivities('itinerary-1', 'day-1', ['act-1'])
    expect(apiClient.put).toHaveBeenCalledWith('/itinerary/itinerary-1/days/day-1/activities/reorder', { activityIds: ['act-1'] })
  })

  it('updateActivity calls apiClient.patch and returns activity', async () => {
    const mockActivity = { id: 'act-1', title: 'Sightseeing' }
    vi.mocked(apiClient.patch).mockResolvedValue({
      data: { data: mockActivity },
    })

    const result = await itineraryApi.updateActivity('itinerary-1', 'act-1', { startTime: '10:00' })
    expect(apiClient.patch).toHaveBeenCalledWith('/itinerary/itinerary-1/activities/act-1', { startTime: '10:00' })
    expect(result).toEqual(mockActivity)
  })

  it('addActivity calls apiClient.post and returns response', async () => {
    const mockResponse = { activity: { id: 'act-1' } }
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { data: mockResponse },
    })

    const result = await itineraryApi.addActivity('itinerary-1', 'day-1', { title: 'New Act' })
    expect(apiClient.post).toHaveBeenCalledWith('/itinerary/itinerary-1/days/day-1/activities', { title: 'New Act' })
    expect(result).toEqual(mockResponse)
  })

  it('deleteActivity calls apiClient.delete', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({})
    await itineraryApi.deleteActivity('itinerary-1', 'act-1')
    expect(apiClient.delete).toHaveBeenCalledWith('/itinerary/itinerary-1/activities/act-1')
  })
})
