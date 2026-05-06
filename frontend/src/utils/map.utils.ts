export const buildDirectionsUrl = (origin: string, destination: string): string => {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`
}
