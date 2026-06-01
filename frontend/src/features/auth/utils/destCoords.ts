const COORDS: Record<string, [number, number]> = {
  // Western Europe
  'lisbon':    [18, 54], 'porto':      [17, 50], 'madrid':   [27, 50],
  'barcelona': [34, 56], 'seville':    [22, 60], 'valencia': [31, 58],
  'paris':     [47, 38], 'lyon':       [48, 44], 'nice':     [50, 50],
  'london':    [29, 24], 'edinburgh':  [26, 14], 'dublin':   [20, 18],
  'amsterdam': [42, 24], 'brussels':   [43, 28], 'antwerp':  [43, 26],
  'berlin':    [54, 22], 'munich':     [53, 30], 'hamburg':  [50, 18],
  'cologne':   [48, 26], 'frankfurt':  [50, 28], 'vienna':   [60, 28],
  'zurich':    [50, 34], 'geneva':     [47, 36], 'bern':     [48, 34],
  'rome':      [57, 64], 'milan':      [52, 44], 'venice':   [57, 46],
  'florence':  [55, 58], 'naples':     [58, 66], 'sicily':   [58, 70],
  // Central & Eastern
  'prague':    [56, 24], 'bratislava': [60, 26], 'budapest': [63, 30],
  'warsaw':    [62, 18], 'krakow':     [63, 22], 'wroclaw':  [58, 22],
  'bucharest': [70, 34], 'sofia':      [67, 40], 'belgrade': [65, 38],
  'zagreb':    [60, 36], 'ljubljana':  [57, 36], 'sarajevo': [63, 42],
  'athens':    [71, 62], 'thessaloniki': [68, 54], 'santorini': [72, 66],
  'istanbul':  [82, 48], 'ankara':     [84, 44],
  // North
  'stockholm': [56, 10], 'gothenburg': [50, 14], 'oslo':     [50, 8],
  'bergen':    [46, 10], 'copenhagen': [50, 14], 'helsinki': [64, 8],
  'tallinn':   [66, 10], 'riga':       [65, 14], 'vilnius':  [66, 18],
  'reykjavik': [16, 8],
  // Mediterranean islands
  'malta':     [55, 70], 'ibiza':      [33, 60], 'mallorca': [35, 60],
  'corfu':     [64, 56], 'crete':      [71, 68], 'cyprus':   [86, 56],
  'dubrovnik': [63, 52], 'split':      [61, 50],
  // Outside Europe — still shown but mapped roughly
  'new york':  [5,  40], 'los angeles': [2, 48], 'miami':    [6, 54],
  'tokyo':     [93, 32], 'kyoto':      [92, 34], 'osaka':    [92, 36],
  'beijing':   [88, 26], 'shanghai':   [90, 36], 'seoul':    [92, 28],
  'dubai':     [88, 52], 'abu dhabi':  [87, 54],
  'bangkok':   [88, 52], 'singapore':  [89, 58], 'bali':     [91, 62],
  'sydney':    [93, 66], 'melbourne':  [91, 68],
  'cairo':     [80, 56], 'marrakech':  [22, 68], 'casablanca': [18, 64],
  'cape town': [60, 74], 'nairobi':    [76, 66],
  'mexico':    [5,  52], 'cancun':     [8,  54],
  'rio':       [28, 70], 'buenos aires': [22, 72],
}

export interface MapPin {
  x: number
  y: number
  label: string
}

export function destToPin(destination: string): MapPin {
  const lower = destination.toLowerCase()
  const key   = Object.keys(COORDS).find(k =>
    lower.includes(k) || k.includes(lower.split(',')[0].trim())
  )
  const [x, y] = key ? COORDS[key] : [50, 40]
  return { x, y, label: destination.split(',')[0].trim() }
}
