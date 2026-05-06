import { apiClient } from '@/api/axios'

export const exportApi = {
  async exportIcs(itineraryId: string): Promise<void> {
    const response = await apiClient.get(`/export/${itineraryId}/ics`, { 
      responseType: 'blob' 
    })
    
    // Trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `itinerary-${itineraryId}.ics`)
    document.body.appendChild(link)
    link.click()
    link.parentNode?.removeChild(link)
    window.URL.revokeObjectURL(url)
  }
}
