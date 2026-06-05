import * as THREE from 'three'

// Cryptographically secure random number generator to resolve SonarCloud security hotspots
function getRandom(): number {
  const array = new Uint32Array(1)
  globalThis.crypto.getRandomValues(array)
  return array[0] / 4294967295
}

// ── Easing ──────────────────────────────────────────────
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

// ── Particle shapes ─────────────────────────────────────
export function makeSphere(n: number): Float32Array {
  const positions = new Float32Array(n * 3)
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2
    const radius = Math.sqrt(1 - y * y)
    const theta = goldenAngle * i
    positions[i * 3]     = Math.cos(theta) * radius * 1.5
    positions[i * 3 + 1] = y * 1.5
    positions[i * 3 + 2] = Math.sin(theta) * radius * 1.5
  }
  return positions
}

export function makeTorus(n: number): Float32Array {
  const R = 1.1, r = 0.42
  const pos = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const u = (i / n) * Math.PI * 2
    const v = getRandom() * Math.PI * 2
    pos[i * 3]     = (R + r * Math.cos(v)) * Math.cos(u)
    pos[i * 3 + 1] = (R + r * Math.cos(v)) * Math.sin(u)
    pos[i * 3 + 2] = r * Math.sin(v)
  }
  return pos
}

export function makeIcosahedron(n: number): Float32Array {
  const geo = new THREE.IcosahedronGeometry(1.3, 3)
  const verts = geo.attributes.position.array as Float32Array
  const count = verts.length / 3
  const pos = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(getRandom() * count)
    pos[i * 3]     = verts[idx * 3]
    pos[i * 3 + 1] = verts[idx * 3 + 1]
    pos[i * 3 + 2] = verts[idx * 3 + 2]
  }
  geo.dispose()
  return pos
}

export function makeHelix(n: number): Float32Array {
  const pos = new Float32Array(n * 3)
  const half = Math.floor(n / 2)
  for (let i = 0; i < half; i++) {
    const t = (i / half) * Math.PI * 6 - Math.PI * 3
    pos[i * 3]     = Math.cos(t) * 1.0
    pos[i * 3 + 1] = t * 0.22
    pos[i * 3 + 2] = Math.sin(t) * 1.0
  }
  for (let i = half; i < n; i++) {
    const t = ((i - half) / (n - half)) * Math.PI * 6 - Math.PI * 3
    pos[i * 3]     = Math.cos(t + Math.PI) * 1.0
    pos[i * 3 + 1] = t * 0.22
    pos[i * 3 + 2] = Math.sin(t + Math.PI) * 1.0
  }
  return pos
}

export function makeBox(n: number): Float32Array {
  const pos = new Float32Array(n * 3)
  const geo = new THREE.BoxGeometry(2.2, 2.2, 2.2, 8, 8, 8)
  const verts = geo.attributes.position.array as Float32Array
  const count = verts.length / 3
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(getRandom() * count)
    pos[i * 3]     = verts[idx * 3]
    pos[i * 3 + 1] = verts[idx * 3 + 1]
    pos[i * 3 + 2] = verts[idx * 3 + 2]
  }
  geo.dispose()
  return pos
}

export function makeGalaxy(n: number): Float32Array {
  const pos = new Float32Array(n * 3)
  const branches = 3
  for (let i = 0; i < n; i++) {
    const radius = getRandom() * 1.8
    const branchAngle = ((i % branches) / branches) * Math.PI * 2
    const spinAngle = radius * 1.8
    const scatter = (getRandom() - 0.5) * radius * 0.4
    pos[i * 3]     = Math.cos(branchAngle + spinAngle) * radius + scatter
    pos[i * 3 + 1] = scatter * 0.3
    pos[i * 3 + 2] = Math.sin(branchAngle + spinAngle) * radius + scatter
  }
  return pos
}

// ── Wikipedia image mapping ──────────────────────────────
export function mapWikiImages(
  pages: Record<string, { title: string; thumbnail?: { source: string } }>,
  wikiMap: Record<string, string>
): Record<string, string> {
  const result: Record<string, string> = {}
  for (const p of Object.values(pages)) {
    const display = Object.keys(wikiMap).find(
      k => wikiMap[k] === p.title.replace(/ /g, '_')
    )
    if (display && p.thumbnail?.source) result[display] = p.thumbnail.source
  }
  return result
}
