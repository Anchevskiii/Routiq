export interface DestEntry {
  name: string
  country: string
  flag: string
  code: string
  temp: string
  pop: string
}

export const DEST_DB: DestEntry[] = [
  { name: 'Tokyo',     country: 'Japan',    flag: '🗾', code: 'TYO', temp: '22°', pop: '13.9M' },
  { name: 'Lisbon',    country: 'Portugal', flag: '🏰', code: 'LIS', temp: '18°', pop: '2.9M'  },
  { name: 'Reykjavík', country: 'Iceland',  flag: '❄️', code: 'REK', temp: '6°',  pop: '0.13M' },
  { name: 'Marrakesh', country: 'Morocco',  flag: '🕌', code: 'RAK', temp: '26°', pop: '0.93M' },
  { name: 'Paris',     country: 'France',   flag: '🗼', code: 'PAR', temp: '14°', pop: '2.16M' },
  { name: 'Kyoto',     country: 'Japan',    flag: '⛩️', code: 'UKY', temp: '21°', pop: '1.46M' },
  { name: 'Barcelona', country: 'Spain',    flag: '🌊', code: 'BCN', temp: '23°', pop: '1.6M'  },
]
