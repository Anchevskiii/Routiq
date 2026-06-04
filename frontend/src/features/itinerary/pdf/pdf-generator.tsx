import { pdf } from '@react-pdf/renderer'
import { saveAs } from 'file-saver'
import { ItineraryPdfDocument } from './ItineraryPdfDocument'
import { Itinerary } from '@/types/itinerary.types'

export async function downloadItineraryPdf(itinerary: Itinerary): Promise<void> {
  const blob = await pdf(<ItineraryPdfDocument itinerary={itinerary} />).toBlob()
  saveAs(blob, `routiq-${itinerary.destination.replace(/\s+/g, '-').toLowerCase()}.pdf`)
}
