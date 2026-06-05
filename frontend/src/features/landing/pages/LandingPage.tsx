import React, { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import './LandingPage.css'

/* ── Wikipedia image fetch ───────────────────────────── */
const WIKI_PAGES: Record<string, string> = {
  'Eiffel Tower':    'Eiffel_Tower',
  'Colosseum':       'Colosseum',
  'Sagrada Família': 'Sagrada_Família',
  'Santorini':       'Santorini',
}

function useWikiImages(titles: string[]) {
  const [urls, setUrls] = useState<Record<string, string>>({})
  useEffect(() => {
    const query = titles.map(t => WIKI_PAGES[t]).join('|')
    fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(query)}&prop=pageimages&format=json&pithumbsize=500&origin=*`
    )
      .then(r => r.json())
      .then(data => {
        const pages: Record<string, { title: string; thumbnail?: { source: string } }> = data?.query?.pages ?? {}
        const map: Record<string, string> = {}
        for (const p of Object.values(pages)) {
          const display = Object.keys(WIKI_PAGES).find(k => WIKI_PAGES[k] === p.title.replace(/ /g, '_'))
          if (display && p.thumbnail?.source) map[display] = p.thumbnail.source
        }
        setUrls(map)
      })
      .catch(() => {/* silently fail — fallbacks render */})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return urls
}

/* ── Section nav ─────────────────────────────────────── */
const SECTIONS = [
  { id: 'lp-top',          label: 'Home' },
  { id: 'lp-map',          label: 'Interactive Maps' },
  { id: 'lp-integrations', label: 'Integrations' },
  { id: 'lp-places',       label: 'Real Places' },
  { id: 'lp-how',          label: 'How it works' },
  { id: 'lp-cta',          label: 'Get started' },
]

/* ── Full-page scroll hook ───────────────────────────── */
function smoothScrollTo(container: HTMLElement, targetY: number, duration = 750) {
  const start = container.scrollTop
  const delta = targetY - start
  const startTime = performance.now()
  function step(now: number) {
    const t = Math.min((now - startTime) / duration, 1)
    const ease = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2
    container.scrollTop = start + delta * ease
    if (t < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

function useFullPageScroll(sectionIds: string[]) {
  const currentRef = useRef(0)
  const scrollingRef = useRef(false)

  useEffect(() => {
    const container = document.querySelector('.lp') as HTMLElement | null
    if (!container) return

    const goTo = (index: number) => {
      const el = document.getElementById(sectionIds[index])
      if (!el) return
      smoothScrollTo(container, el.offsetTop, 750)
      currentRef.current = index
    }

    const handleWheel = (e: WheelEvent) => {
      if (window.innerWidth <= 768) return
      e.preventDefault()
      if (scrollingRef.current) return
      scrollingRef.current = true
      const dir = e.deltaY > 0 ? 1 : -1
      const next = Math.max(0, Math.min(sectionIds.length - 1, currentRef.current + dir))
      goTo(next)
      setTimeout(() => { scrollingRef.current = false }, 850)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (window.innerWidth <= 768) return
      if (!['ArrowDown','ArrowUp','PageDown','PageUp'].includes(e.key)) return
      e.preventDefault()
      if (scrollingRef.current) return
      scrollingRef.current = true
      const dir = (e.key === 'ArrowDown' || e.key === 'PageDown') ? 1 : -1
      const next = Math.max(0, Math.min(sectionIds.length - 1, currentRef.current + dir))
      goTo(next)
      setTimeout(() => { scrollingRef.current = false }, 850)
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      if (container) container.removeEventListener('wheel', handleWheel)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [sectionIds])
}

/* ── Three.js particle shape generators ─────────────── */
function makeSphere(n: number): Float32Array {
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

function makeTorus(n: number): Float32Array {
  const R = 1.1, r = 0.42
  const pos = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const u = (i / n) * Math.PI * 2
    const v = Math.random() * Math.PI * 2
    pos[i * 3]     = (R + r * Math.cos(v)) * Math.cos(u)
    pos[i * 3 + 1] = (R + r * Math.cos(v)) * Math.sin(u)
    pos[i * 3 + 2] = r * Math.sin(v)
  }
  return pos
}

function makeIcosahedron(n: number): Float32Array {
  const geo = new THREE.IcosahedronGeometry(1.3, 3)
  const verts = geo.attributes.position.array as Float32Array
  const count = verts.length / 3
  const pos = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * count)
    pos[i * 3]     = verts[idx * 3]
    pos[i * 3 + 1] = verts[idx * 3 + 1]
    pos[i * 3 + 2] = verts[idx * 3 + 2]
  }
  geo.dispose()
  return pos
}

function makeHelix(n: number): Float32Array {
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

function makeBox(n: number): Float32Array {
  const pos = new Float32Array(n * 3)
  const geo = new THREE.BoxGeometry(2.2, 2.2, 2.2, 8, 8, 8)
  const verts = geo.attributes.position.array as Float32Array
  const count = verts.length / 3
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * count)
    pos[i * 3]     = verts[idx * 3]
    pos[i * 3 + 1] = verts[idx * 3 + 1]
    pos[i * 3 + 2] = verts[idx * 3 + 2]
  }
  geo.dispose()
  return pos
}

function makeGalaxy(n: number): Float32Array {
  const pos = new Float32Array(n * 3)
  const branches = 3
  for (let i = 0; i < n; i++) {
    const radius = Math.random() * 1.8
    const branchAngle = ((i % branches) / branches) * Math.PI * 2
    const spinAngle = radius * 1.8
    const scatter = (Math.random() - 0.5) * radius * 0.4
    pos[i * 3]     = Math.cos(branchAngle + spinAngle) * radius + scatter
    pos[i * 3 + 1] = scatter * 0.3
    pos[i * 3 + 2] = Math.sin(branchAngle + spinAngle) * radius + scatter
  }
  return pos
}

/* ── ParticleScene ───────────────────────────────────── */
const ParticleScene: React.FC<{ section: number }> = ({ section }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    points: THREE.Points
    currentPositions: Float32Array
    targetPositions: Float32Array
    fromPositions: Float32Array
    transitionStart: number
    transitionDuration: number
    animId: number
    shapes: Float32Array[]
  } | null>(null)

  // Initialize Three.js on mount
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setClearColor(0x000000, 0)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 100)
    camera.position.z = 4

    const N = 3000
    const shapes = [makeSphere(N), makeTorus(N), makeIcosahedron(N), makeHelix(N), makeBox(N), makeGalaxy(N)]

    const geometry = new THREE.BufferGeometry()
    const initial = shapes[0].slice()
    geometry.setAttribute('position', new THREE.BufferAttribute(initial.slice(), 3))

    const material = new THREE.PointsMaterial({ size: 0.025, sizeAttenuation: true, transparent: true, opacity: 0.85 })
    const points = new THREE.Points(geometry, material)
    scene.add(points)

    const resize = () => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const state = {
      renderer, scene, camera, points,
      currentPositions: initial.slice(),
      targetPositions: shapes[0].slice(),
      fromPositions: shapes[0].slice(),
      transitionStart: -1,
      transitionDuration: 1200,
      animId: 0,
      shapes,
    }
    stateRef.current = state

    let time = 0
    function animate() {
      state.animId = requestAnimationFrame(animate)
      time += 0.016

      // color from dark mode
      const isDark = document.documentElement.classList.contains('dark')
      ;(points.material as THREE.PointsMaterial).color.setHex(isDark ? 0x818cf8 : 0x3b82f6)

      // transition
      const positions = geometry.attributes.position.array as Float32Array
      if (state.transitionStart >= 0) {
        const elapsed = performance.now() - state.transitionStart
        const t = Math.min(elapsed / state.transitionDuration, 1)
        const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 // easeInOutCubic
        for (let i = 0; i < positions.length; i++) {
          positions[i] = state.fromPositions[i] + (state.targetPositions[i] - state.fromPositions[i]) * e
        }
        if (t >= 1) state.transitionStart = -1
      } else {
        // idle drift
        for (let i = 0; i < positions.length / 3; i++) {
          positions[i * 3]     = state.targetPositions[i * 3]     + Math.sin(time * 0.5 + i * 0.1) * 0.008
          positions[i * 3 + 1] = state.targetPositions[i * 3 + 1] + Math.cos(time * 0.4 + i * 0.13) * 0.008
          positions[i * 3 + 2] = state.targetPositions[i * 3 + 2] + Math.sin(time * 0.6 + i * 0.07) * 0.008
        }
      }
      geometry.attributes.position.needsUpdate = true

      points.rotation.y += 0.003
      points.rotation.x += 0.0008

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(state.animId)
      ro.disconnect()
      renderer.dispose()
    }
  }, [])

  // On section change → trigger transition
  useEffect(() => {
    const st = stateRef.current
    if (!st) return
    const geo = st.points.geometry
    const cur = geo.attributes.position.array as Float32Array
    st.fromPositions = cur.slice()
    st.targetPositions = st.shapes[section].slice()
    st.transitionStart = performance.now()
  }, [section])

  return (
    <canvas
      ref={canvasRef}
      className="lp-particle-canvas"
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  )
}

/* ── ParticleNav ─────────────────────────────────────── */
const ParticleNav: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const observers: IntersectionObserver[] = []
    SECTIONS.forEach(({ id }, idx) => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveIndex(idx) },
        { threshold: 0.4 }
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach(o => o.disconnect())
  }, [])

  const isLastSection = activeIndex === SECTIONS.length - 1

  return (
    <div className="lp-3d-panel" style={{ opacity: isLastSection ? 0 : 1, transition: 'opacity .5s' }}>
      <ParticleScene section={activeIndex} />
      {/* Section dots overlay on the canvas */}
      <div className="lp-3d-dots">
        {SECTIONS.map((s, i) => (
          <button
            key={s.id}
            className={`lp-3d-dot${activeIndex === i ? ' active' : ''}`}
            onClick={() => {
              const container = document.querySelector('.lp') as HTMLElement
              const el = document.getElementById(s.id)
              if (container && el) smoothScrollTo(container, el.offsetTop)
            }}
            title={s.label}
          />
        ))}
      </div>
    </div>
  )
}

/* ── Map mockup (interactive day filter) ────────────── */
const DAY_PINS: Record<number, number[]> = { 1: [1,2], 2: [3,4], 3: [5] }
const PIN_COLORS = ['#3b82f6','#8b5cf6','#ec4899','#f59e0b','#22c55e']
const PIN_POSITIONS = [
  { top: '22%', left: '18%' },
  { top: '38%', left: '52%' },
  { top: '58%', left: '30%' },
  { top: '45%', left: '70%' },
  { top: '68%', left: '62%' },
]

const MapMockup: React.FC = () => {
  const [activeDay, setActiveDay] = useState(1)
  const visiblePins = DAY_PINS[activeDay] ?? []

  return (
    <div className="lp-map-mockup">
      <div className="lp-map-bg" />
      <div className="lp-map-grid" />
      <svg className="lp-map-line" viewBox="0 0 400 300" preserveAspectRatio="none">
        <polyline
          points="88,70 216,118 132,178 292,138 256,208"
          fill="none" stroke="rgba(99,102,241,.3)" strokeWidth="1.5" strokeDasharray="6 4"
        />
      </svg>
      {PIN_POSITIONS.map((pos, i) => {
        const num = i + 1
        const visible = visiblePins.includes(num)
        return (
          <div
            key={num}
            className="lp-map-pin"
            style={{
              top: pos.top, left: pos.left,
              background: PIN_COLORS[i],
              opacity: visible ? 1 : 0.18,
              transform: visible ? 'rotate(-45deg) scale(1)' : 'rotate(-45deg) scale(0.75)',
              transition: 'opacity .3s, transform .3s',
            }}
          >
            <span>{num}</span>
          </div>
        )
      })}
      <div className="lp-map-day-bar">
        {[1,2,3].map(d => (
          <button
            key={d}
            className={`lp-map-day-pill${activeDay === d ? ' lp-active' : ''}`}
            onClick={() => setActiveDay(d)}
          >
            Day {d}
          </button>
        ))}
      </div>
      <div className="lp-map-label">
        <span className="lp-map-label-dot" />
        {visiblePins.length} stops · Day {activeDay}
      </div>
    </div>
  )
}

/* ── Integrations ────────────────────────────────────── */
const INTEGRATIONS = [
  {
    abbr: 'GEM', color: '#1a6bff', bg: 'rgba(26,107,255,.12)',
    name: 'Gemini 2.5 Flash', service: 'Google Gemini',
    desc: 'Generates your complete day-by-day itinerary based on destination, travel style and duration.',
    tag: 'AI',
  },
  {
    abbr: 'MAP', color: '#34a853', bg: 'rgba(52,168,83,.12)',
    name: 'Maps JavaScript API', service: 'Google Maps',
    desc: 'Powers the interactive route map with numbered pins and real-time pan and zoom.',
    tag: 'MAPS',
  },
  {
    abbr: 'PLC', color: '#ea4335', bg: 'rgba(234,67,53,.12)',
    name: 'Places API', service: 'Google Places',
    desc: 'Supplies verified attraction data, categories, ratings and opening hours.',
    tag: 'DATA',
  },
  {
    abbr: 'WTH', color: '#fbbc04', bg: 'rgba(251,188,4,.12)',
    name: 'Weather API', service: 'Google Weather',
    desc: 'Fetches a daily forecast for your destination so you can plan around the weather.',
    tag: 'DATA',
  },
  {
    abbr: 'WKP', color: '#94a3b8', bg: 'rgba(148,163,184,.1)',
    name: 'Wikipedia API', service: 'Wikimedia',
    desc: 'Provides high-quality photo thumbnails for every activity and attraction.',
    tag: 'MEDIA',
  },
  {
    abbr: 'SUP', color: '#3ecf8e', bg: 'rgba(62,207,142,.12)',
    name: 'Supabase Auth & DB', service: 'Supabase',
    desc: 'Handles user authentication, session management and persistent trip storage.',
    tag: 'AUTH',
  },
]

/* ── Places ──────────────────────────────────────────── */
const PLACES = [
  { name: 'Eiffel Tower',    loc: 'Paris, France',    cat: 'SIGHT',   catClass: 'lp-badge-sight',   rating: 5, desc: 'Iconic iron lattice tower standing 330 m tall, symbol of Paris since 1889.' },
  { name: 'Colosseum',       loc: 'Rome, Italy',      cat: 'CULTURE', catClass: 'lp-badge-culture', rating: 5, desc: 'Ancient Roman amphitheater built in 70 AD — one of the world\'s greatest works of architecture.' },
  { name: 'Sagrada Família', loc: 'Barcelona, Spain', cat: 'SIGHT',   catClass: 'lp-badge-sight',   rating: 5, desc: "Antoni Gaudí's unfinished basilica, under continuous construction since 1882." },
  { name: 'Santorini',       loc: 'Cyclades, Greece', cat: 'NATURE',  catClass: 'lp-badge-nature',  rating: 5, desc: 'Volcanic island famous for its whitewashed clifftop villages and caldera sunsets.' },
]

function Stars({ n }: { n: number }) {
  return (
    <div className="lp-place-stars">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < n ? 'lp-star' : 'lp-star-dim'}>★</span>
      ))}
    </div>
  )
}

/* ── Tech stack ──────────────────────────────────────── */
const TECH = [
  { name: 'React',        color: '#61dafb', bg: 'rgba(97,218,251,.1)' },
  { name: 'NestJS',       color: '#e0234e', bg: 'rgba(224,35,78,.1)'  },
  { name: 'Prisma',       color: '#5a67d8', bg: 'rgba(90,103,216,.1)' },
  { name: 'PostgreSQL',   color: '#336791', bg: 'rgba(51,103,145,.1)' },
  { name: 'Supabase',     color: '#3ecf8e', bg: 'rgba(62,207,142,.1)' },
  { name: 'Vercel',       color: '#64748b', bg: 'rgba(100,116,139,.08)' },
  { name: 'Render',       color: '#46e3b7', bg: 'rgba(70,227,183,.1)' },
  { name: 'Gemini',       color: '#1a6bff', bg: 'rgba(26,107,255,.1)' },
  { name: 'Google Maps',  color: '#34a853', bg: 'rgba(52,168,83,.1)'  },
]

/* ── Page ────────────────────────────────────────────── */
export const LandingPage: React.FC = () => {
  const wikiImages = useWikiImages(PLACES.map(p => p.name))
  useFullPageScroll(SECTIONS.map(s => s.id))

  return (
    <div className="lp">
      <ParticleNav />
      {/* Nav */}
      <nav className="lp-nav">
        <div className="lp-nav-brand">
          <span className="lp-nav-logo">
            <svg viewBox="0 0 28 28" width="18" height="18" fill="none">
              <path d="M14 4c-3.3 0-6 2.6-6 5.9 0 4 6 11.1 6 11.1s6-7.1 6-11.1C20 6.6 17.3 4 14 4z" fill="#fff"/>
              <circle cx="14" cy="9.8" r="2.3" fill="#8b5cf6"/>
            </svg>
          </span>
          Routiq
        </div>
        <div className="lp-nav-links">
          <button className="lp-nav-link" onClick={() => { const c = document.querySelector('.lp') as HTMLElement; const el = document.getElementById('lp-map'); if(c&&el) smoothScrollTo(c, el.offsetTop) }}>Maps</button>
          <button className="lp-nav-link" onClick={() => { const c = document.querySelector('.lp') as HTMLElement; const el = document.getElementById('lp-integrations'); if(c&&el) smoothScrollTo(c, el.offsetTop) }}>Integrations</button>
          <button className="lp-nav-link" onClick={() => { const c = document.querySelector('.lp') as HTMLElement; const el = document.getElementById('lp-how'); if(c&&el) smoothScrollTo(c, el.offsetTop) }}>How it works</button>
          <Link to={ROUTES.LOGIN}    className="lp-nav-link">Sign in</Link>
          <Link to={ROUTES.REGISTER} className="lp-nav-btn">Get started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="lp-hero lp-fp-section" id="lp-top">
        <div className="lp-hero-inner">
          <div className="lp-hero-badge">
            <span className="lp-hero-badge-dot" />
            POWERED BY THE BEST
          </div>
          <h1 className="lp-hero-title">
            Built on<br />
            <span className="lp-grad">world-class</span><br />
            technology
          </h1>
          <p className="lp-hero-sub">
            Routiq combines Google Maps, AI, and real-world data to plan your perfect trip — automatically.
          </p>
          <div className="lp-hero-actions">
            <Link to={ROUTES.PLANNER} className="lp-btn-primary">
              Start planning free
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </Link>
            <button className="lp-btn-ghost" onClick={() => { const c = document.querySelector('.lp') as HTMLElement; const el = document.getElementById('lp-how'); if(c&&el) smoothScrollTo(c, el.offsetTop) }}>
              See how it works
            </button>
          </div>
          <p className="lp-hero-note">
            No credit card required<span>·</span>AI-powered<span>·</span>Export to any calendar
          </p>
        </div>
      </section>

      {/* Section 1 — Map */}
      <section id="lp-map" className="lp-fp-section">
        <div className="lp-section">
          <div className="lp-map-layout">
            <div>
              <span className="lp-kicker">INTERACTIVE MAPS</span>
              <h2 className="lp-section-title">Your route,<br />visualized</h2>
              <p className="lp-section-desc" style={{ marginBottom: 36 }}>
                Every stop pinned on a live map, filterable by day. One tap opens Google Maps navigation.
              </p>
              <div className="lp-map-bullets">
                {[
                  { title: 'Real-time pin centering', desc: 'Click any activity and the map flies to that location instantly.' },
                  { title: 'Day-by-day filter',       desc: 'Show only the pins for the selected travel day.' },
                  { title: 'Fullscreen map view',     desc: 'Expand the map to fill the screen at any time.' },
                  { title: 'Google Maps navigation',  desc: 'Open any pin directly in Google Maps for turn-by-turn directions.' },
                ].map(b => (
                  <div key={b.title} className="lp-map-bullet">
                    <div className="lp-map-bullet-check">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                    </div>
                    <div>
                      <div className="lp-map-bullet-title">{b.title}</div>
                      <div className="lp-map-bullet-desc">{b.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <MapMockup />
          </div>
        </div>
      </section>

      {/* Section 2 — Integrations */}
      <div className="lp-section-alt lp-fp-section" id="lp-integrations">
        <div className="lp-section-alt-inner">
          <div style={{ marginBottom: 44 }}>
            <span className="lp-kicker">UNDER THE HOOD</span>
            <h2 className="lp-section-title">Every feature backed<br />by a best-in-class API</h2>
            <p className="lp-section-desc">No generic wrappers. Each integration is purpose-built for its role in your trip.</p>
          </div>
          <div className="lp-integrations-grid">
            {INTEGRATIONS.map(i => (
              <div key={i.name} className="lp-integration-card">
                <div className="lp-int-header">
                  <div className="lp-int-icon" style={{ color: i.color, background: i.bg }}>
                    {i.abbr}
                  </div>
                  <span className="lp-int-tag" style={{ color: i.color, background: i.bg }}>{i.tag}</span>
                </div>
                <div className="lp-int-name">{i.name}</div>
                <div className="lp-int-service">{i.service}</div>
                <div className="lp-int-desc">{i.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 3 — Places */}
      <section id="lp-places" className="lp-fp-section">
        <div className="lp-section">
          <span className="lp-kicker">REAL PLACES</span>
          <h2 className="lp-section-title">Discover real places</h2>
          <p className="lp-section-desc">Every attraction is pulled from Google Places — photos sourced directly from Wikipedia.</p>
          <div className="lp-places-grid">
            {PLACES.map(p => (
              <div key={p.name} className="lp-place-card">
                <div className="lp-place-img-wrap">
                  {wikiImages[p.name] ? (
                    <img src={wikiImages[p.name]} alt={p.name} className="lp-place-img" />
                  ) : (
                    <div className="lp-place-img-fallback">
                      <div className="lp-place-img-shimmer" />
                      <span className="lp-place-img-initial">{p.name[0]}</span>
                    </div>
                  )}
                </div>
                <div className="lp-place-body">
                  <div className="lp-place-top">
                    <div className="lp-place-name">{p.name}</div>
                    <span className={`lp-place-badge ${p.catClass}`}>{p.cat}</span>
                  </div>
                  <div className="lp-place-loc">{p.loc}</div>
                  <Stars n={p.rating} />
                  <div className="lp-place-desc">{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4 — How it works */}
      <div className="lp-section-alt lp-fp-section" id="lp-how">
        <div className="lp-section-alt-inner" style={{ textAlign: 'center' }}>
          <span className="lp-kicker">HOW IT WORKS</span>
          <h2 className="lp-section-title">From idea to itinerary<br />in 60 seconds</h2>
          <div className="lp-steps">
            {[
              {
                num: '01', title: 'Tell us your trip',
                desc: 'Destination, dates, and travel style. A few inputs — that\'s all it takes to get started.',
                grad: 'linear-gradient(135deg,#3b82f6,#2563eb)',
                icon: <><circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.3 2.7-6 6-6 1.3 0 2.6.4 3.6 1.1"/><path d="M17 11v6M14 14h6"/></>,
              },
              {
                num: '02', title: 'AI builds your plan',
                desc: 'Gemini generates a complete day-by-day itinerary with real attractions, estimated times and smart routing.',
                grad: 'linear-gradient(135deg,#8b5cf6,#6d28d9)',
                icon: <><path d="M12 3v4M12 17v4M5 12H3M21 12h-2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4"/><circle cx="12" cy="12" r="3"/></>,
              },
              {
                num: '03', title: 'Explore and export',
                desc: 'Edit activities with drag & drop, share with your group, then export to PDF or add directly to Google Calendar.',
                grad: 'linear-gradient(135deg,#ec4899,#db2777)',
                icon: <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></>,
              },
            ].map((s, i) => (
              <div key={s.num} className="lp-step-card">
                <div className="lp-step-num-badge">{s.num}</div>
                <div className="lp-step-icon-wrap" style={{ background: s.grad }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{s.icon}</svg>
                </div>
                <div className="lp-step-title">{s.title}</div>
                <div className="lp-step-desc">{s.desc}</div>
                {i < 2 && (
                  <div className="lp-step-connector">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA + tech + footer — vse skupaj v eni 100vh sekciji */}
      <section id="lp-cta" className="lp-fp-section lp-cta-section">
        {/* Tech strip */}
        <div className="lp-tech-strip">
          <div className="lp-tech-inner">
            <span className="lp-tech-label">BUILT WITH</span>
            <div className="lp-tech-row">
              {TECH.map(t => (
                <div key={t.name} className="lp-tech-item" style={{ '--tc': t.color, '--tb': t.bg } as React.CSSProperties}>
                  <span className="lp-tech-dot" style={{ background: t.color }} />
                  {t.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA card — centered */}
        <div className="lp-cta-wrap">
          <div className="lp-cta">
            <div className="lp-cta-inner">
              <h2 className="lp-cta-title">Start planning<br />for free</h2>
              <p className="lp-cta-sub">
                Join travelers using Routiq to turn trip ideas into perfect itineraries — powered by AI.
              </p>
              <Link to={ROUTES.PLANNER} className="lp-btn-primary" style={{ fontSize: 16, padding: '16px 32px' }}>
                Open AI Planner
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </Link>
              <p className="lp-cta-note">
                No credit card required<span>·</span>AI-powered<span>·</span>Export to any calendar
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="lp-footer">
          <div className="lp-footer-brand">
            <span className="lp-footer-logo" />
            Routiq
          </div>
          <div>© 2026 Routiq</div>
          <div style={{ display: 'flex', gap: 20 }}>
            <Link to={ROUTES.LOGIN}>Sign in</Link>
            <Link to={ROUTES.REGISTER}>Register</Link>
            <Link to="/help">Help</Link>
          </div>
        </footer>
      </section>
    </div>
  )
}
