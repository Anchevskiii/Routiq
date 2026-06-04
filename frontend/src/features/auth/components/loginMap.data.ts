export interface City {
  name: string
  country: string
  pos: { x: number; y: number }
  lm: { w: number; h: number }
  svg: string
}

export const CITY_POOL: City[] = [
  {
    name: 'Paris', country: 'France · 48.85° N', pos: { x: 720, y: 360 }, lm: { w: 80, h: 120 },
    svg: `<svg style="width:100%;height:100%" viewBox="0 0 140 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="eiffel-shade-ID" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stop-color="#5a5570"/><stop offset="50%" stop-color="#3a3550"/><stop offset="100%" stop-color="#28253c"/></linearGradient>
        <linearGradient id="eiffel-light-ID" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stop-color="#7a7595"/><stop offset="100%" stop-color="#48425e"/></linearGradient>
      </defs>
      <path d="M 20 195 L 35 130 L 50 130 L 56 195 Z" fill="url(#eiffel-shade-ID)"/>
      <path d="M 120 195 L 105 130 L 90 130 L 84 195 Z" fill="url(#eiffel-shade-ID)" opacity="0.85"/>
      <path d="M 20 195 Q 70 175 120 195 L 120 200 L 20 200 Z" fill="#1f1c30"/>
      <rect x="32" y="125" width="76" height="6" fill="url(#eiffel-light-ID)"/>
      <rect x="36" y="121" width="68" height="4" fill="#2a2640"/>
      <path d="M 42 121 L 50 80 L 90 80 L 98 121 Z" fill="url(#eiffel-shade-ID)"/>
      <path d="M 50 80 L 56 50 L 84 50 L 90 80 Z" fill="url(#eiffel-light-ID)"/>
      <rect x="48" y="76" width="44" height="4" fill="#2a2640"/>
      <path d="M 56 50 L 60 25 L 80 25 L 84 50 Z" fill="url(#eiffel-light-ID)"/>
      <rect x="58" y="22" width="24" height="3" fill="#2a2640"/>
      <path d="M 60 22 L 64 8 L 76 8 L 80 22 Z" fill="url(#eiffel-shade-ID)"/>
      <path d="M 66 8 L 70 0 L 74 8 Z" fill="#28253c"/>
    </svg>`,
  },
  {
    name: 'Rome', country: 'Italy · 41.90° N', pos: { x: 870, y: 500 }, lm: { w: 70, h: 55 },
    svg: `<svg style="width:100%;height:100%" viewBox="0 0 110 90" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="col-shade-ID" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#bda893"/><stop offset="100%" stop-color="#7d6a55"/></linearGradient>
        <linearGradient id="col-side-ID" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#8a7560"/><stop offset="100%" stop-color="#5b4a3a"/></linearGradient>
      </defs>
      <ellipse cx="55" cy="84" rx="48" ry="5" fill="#3a3325" opacity="0.4"/>
      <path d="M 7 60 A 48 28 0 0 1 103 60 L 103 80 A 48 14 0 0 1 7 80 Z" fill="url(#col-shade-ID)"/>
      <g fill="#3a3325"><path d="M 16 80 L 16 65 Q 19 60 22 65 L 22 80 Z"/><path d="M 28 80 L 28 62 Q 31 56 34 62 L 34 80 Z"/><path d="M 40 80 L 40 60 Q 43 54 46 60 L 46 80 Z"/><path d="M 52 80 L 52 59 Q 55 53 58 59 L 58 80 Z"/><path d="M 64 80 L 64 60 Q 67 54 70 60 L 70 80 Z"/><path d="M 76 80 L 76 62 Q 79 56 82 62 L 82 80 Z"/><path d="M 88 80 L 88 65 Q 91 60 94 65 L 94 80 Z"/></g>
      <path d="M 80 35 L 85 30 L 92 32 L 98 40 L 103 60 L 103 50 L 100 38 L 92 30 L 84 28 Z" fill="url(#col-side-ID)"/>
      <path d="M 7 60 L 7 52 A 48 28 0 0 1 80 35 L 80 50 A 40 22 0 0 0 12 55 Z" fill="url(#col-side-ID)" opacity="0.85"/>
    </svg>`,
  },
  {
    name: 'London', country: 'UK · 51.50° N', pos: { x: 660, y: 260 }, lm: { w: 56, h: 110 },
    svg: `<svg style="width:100%;height:100%" viewBox="0 0 90 180" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bb-shade-ID" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stop-color="#a89280"/><stop offset="50%" stop-color="#857060"/><stop offset="100%" stop-color="#5b4a3a"/></linearGradient>
        <linearGradient id="bb-roof-ID" x1="0" x2="1" y1="0" y2="0"><stop offset="0%" stop-color="#3d4a5e"/><stop offset="100%" stop-color="#202833"/></linearGradient>
      </defs>
      <rect x="30" y="160" width="30" height="18" fill="#5b4a3a"/>
      <rect x="28" y="158" width="34" height="4" fill="#3d342a"/>
      <rect x="32" y="80" width="26" height="80" fill="url(#bb-shade-ID)"/>
      <g fill="#3d342a"><rect x="36" y="90" width="4" height="14"/><rect x="44" y="90" width="4" height="14"/><rect x="52" y="90" width="4" height="14"/><rect x="36" y="115" width="4" height="14"/><rect x="44" y="115" width="4" height="14"/><rect x="52" y="115" width="4" height="14"/><rect x="36" y="140" width="4" height="14"/><rect x="44" y="140" width="4" height="14"/><rect x="52" y="140" width="4" height="14"/></g>
      <rect x="30" y="78" width="30" height="4" fill="#3d342a"/>
      <rect x="28" y="50" width="34" height="28" fill="url(#bb-shade-ID)"/>
      <circle cx="45" cy="64" r="9" fill="#f5f1e8" stroke="#3d342a" stroke-width="0.8"/>
      <line x1="45" y1="64" x2="45" y2="58" stroke="#1c1610" stroke-width="1.2" stroke-linecap="round"/>
      <line x1="45" y1="64" x2="49" y2="65" stroke="#1c1610" stroke-width="1" stroke-linecap="round"/>
      <circle cx="45" cy="64" r="1" fill="#1c1610"/>
      <rect x="26" y="46" width="38" height="4" fill="#3d342a"/>
      <path d="M 36 30 L 45 4 L 54 30 Z" fill="url(#bb-roof-ID)"/>
      <line x1="45" y1="4" x2="45" y2="0" stroke="#3d342a" stroke-width="1"/>
      <circle cx="45" cy="0" r="1.2" fill="#3d342a"/>
    </svg>`,
  },
  {
    name: 'New York', country: 'USA · 40.71° N', pos: { x: 320, y: 360 }, lm: { w: 50, h: 110 },
    svg: `<svg style="width:100%;height:100%" viewBox="0 0 50 110" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="lib-g-ID" x1="0" x2="1"><stop offset="0" stop-color="#7eb29e"/><stop offset="1" stop-color="#487a66"/></linearGradient></defs>
      <rect x="10" y="92" width="30" height="14" fill="#7a6957"/>
      <rect x="8" y="88" width="34" height="6" fill="#4d433a"/>
      <path d="M 18 56 L 14 92 L 36 92 L 32 56 Q 30 53 25 53 Q 20 53 18 56 Z" fill="url(#lib-g-ID)"/>
      <rect x="11" y="58" width="3" height="16" fill="#487a66"/>
      <rect x="6" y="68" width="6" height="8" fill="#9c8f76"/>
      <rect x="33" y="32" width="3" height="28" fill="#487a66"/>
      <path d="M 31 28 Q 34 18 37 28 Q 34 32 31 28 Z" fill="#ffb84d"/>
      <circle cx="34" cy="30" r="1" fill="#ff8c00"/>
      <circle cx="25" cy="46" r="5.5" fill="url(#lib-g-ID)"/>
      <path d="M 19 42 L 20 36 L 22 41 L 24 35 L 26 41 L 28 35 L 30 41 L 31 42" stroke="#487a66" stroke-width="1.5" fill="none"/>
    </svg>`,
  },
  {
    name: 'Tokyo', country: 'Japan · 35.68° N', pos: { x: 1380, y: 380 }, lm: { w: 70, h: 95 },
    svg: `<svg style="width:100%;height:100%" viewBox="0 0 70 95" xmlns="http://www.w3.org/2000/svg">
      <line x1="35" y1="0" x2="35" y2="8" stroke="#5b4a3a" stroke-width="1.5"/>
      <circle cx="35" cy="3" r="1.5" fill="#5b4a3a"/>
      <path d="M 26 14 L 44 14 L 48 20 L 22 20 Z" fill="#a73c2d"/>
      <rect x="29" y="20" width="12" height="10" fill="#d4a574"/>
      <path d="M 22 30 L 48 30 L 52 36 L 18 36 Z" fill="#a73c2d"/>
      <rect x="26" y="36" width="18" height="12" fill="#d4a574"/>
      <path d="M 18 48 L 52 48 L 56 54 L 14 54 Z" fill="#a73c2d"/>
      <rect x="22" y="54" width="26" height="22" fill="#d4a574"/>
      <path d="M 32 76 L 32 64 Q 35 60 38 64 L 38 76 Z" fill="#3a2d20"/>
      <rect x="14" y="76" width="42" height="9" fill="#7a6957"/>
      <rect x="12" y="85" width="46" height="4" fill="#5b4a3a"/>
    </svg>`,
  },
  {
    name: 'Sydney', country: 'Australia · 33.87° S', pos: { x: 1430, y: 690 }, lm: { w: 85, h: 55 },
    svg: `<svg style="width:100%;height:100%" viewBox="0 0 85 55" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="opera-shell-ID" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7f5f9"/><stop offset="1" stop-color="#d5d2db"/></linearGradient></defs>
      <rect x="2" y="44" width="81" height="6" fill="#8a8aa0"/>
      <path d="M 8 44 Q 8 10 30 44 Z" fill="url(#opera-shell-ID)"/>
      <path d="M 20 44 Q 22 18 40 44 Z" fill="#dfdce5"/>
      <path d="M 35 44 Q 35 8 58 44 Z" fill="url(#opera-shell-ID)"/>
      <path d="M 48 44 Q 50 20 70 44 Z" fill="#dfdce5"/>
    </svg>`,
  },
  {
    name: 'Cairo', country: 'Egypt · 30.05° N', pos: { x: 820, y: 555 }, lm: { w: 80, h: 50 },
    svg: `<svg style="width:100%;height:100%" viewBox="0 0 90 55" xmlns="http://www.w3.org/2000/svg">
      <circle cx="68" cy="14" r="7" fill="#fcb045" opacity="0.45"/>
      <path d="M 28 52 L 50 8 L 72 52 Z" fill="#e6b87a"/>
      <path d="M 50 8 L 50 52 L 72 52 Z" fill="#9c7a4f"/>
      <path d="M 4 52 L 22 18 L 42 52 Z" fill="#edc88a"/>
      <path d="M 22 18 L 22 52 L 42 52 Z" fill="#b89263"/>
      <path d="M 70 52 L 80 32 L 88 52 Z" fill="#d9aa6f"/>
      <path d="M 80 32 L 80 52 L 88 52 Z" fill="#9c7a4f"/>
      <rect x="0" y="52" width="90" height="3" fill="#c0a98c"/>
    </svg>`,
  },
]

export const PIN_SVG = `<svg style="width:100%;height:100%" viewBox="0 0 32 44" xmlns="http://www.w3.org/2000/svg">
  <defs><radialGradient id="pin-grad" cx="0.35" cy="0.3"><stop offset="0%" stop-color="#ff8585"/><stop offset="60%" stop-color="#ef4444"/><stop offset="100%" stop-color="#b91c1c"/></radialGradient></defs>
  <path d="M 16 0 C 7 0 0 7 0 16 C 0 26 16 44 16 44 C 16 44 32 26 32 16 C 32 7 25 0 16 0 Z" fill="url(#pin-grad)"/>
  <circle cx="16" cy="16" r="6" fill="#7f1d1d"/>
  <circle cx="14" cy="14" r="2.5" fill="rgba(255,255,255,0.5)"/>
</svg>`

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const array = new Uint32Array(1)
    window.crypto.getRandomValues(array)
    const j = Math.floor((array[0] / 0xffffffff) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function arcPath(
  a: { x: number; y: number },
  b: { x: number; y: number },
  bow: number,
): string {
  return `M ${a.x} ${a.y} Q ${(a.x + b.x) / 2} ${(a.y + b.y) / 2 - bow} ${b.x} ${b.y}`
}
