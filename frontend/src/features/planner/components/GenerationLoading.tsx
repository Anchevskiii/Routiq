import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useTheme } from '@/hooks/useTheme'
import type { FormattedPlace } from '@/types/attractions.types'
import type { StreamingDay } from '@/types/itinerary.types'

interface Props {
  progress: string
  attractions: FormattedPlace[]
  generatedDays: StreamingDay[]
  elapsedTime: number
  destination?: string
}

// ─── Fun facts ────────────────────────────────────────────────────────────────

const FACTS = [
  { emoji: '✈️', text: 'France is the most visited country in the world, with over 89 million tourists a year.' },
  { emoji: '🗺️', text: 'Japan has more than 6,800 islands — only about 430 are inhabited.' },
  { emoji: '🌊', text: 'More than 80% of the ocean floor remains unexplored by humans.' },
  { emoji: '🏔️', text: 'The world\'s highest airport sits at 4,411 m above sea level in Daocheng, China.' },
  { emoji: '🦟', text: 'Iceland is the only country in the world with no mosquitoes.' },
  { emoji: '🚂', text: 'Australia has so many beaches you could visit a new one every day for 27 years.' },
  { emoji: '🌍', text: 'The Great Wall of China stretches over 21,000 km — half the Earth\'s circumference.' },
  { emoji: '🛫', text: 'The longest commercial flight (New York → Singapore) takes over 18 hours.' },
  { emoji: '🗼', text: 'The Eiffel Tower can be 15 cm taller in summer due to heat expanding the iron.' },
  { emoji: '🌐', text: 'There are 195 countries in the world — only about 140 issue tourist visas on arrival.' },
]

// ─── Stage labels ─────────────────────────────────────────────────────────────

const STAGES = [
  { at: 0,  label: 'Analyzing your preferences…' },
  { at: 20, label: 'Finding best attractions and landmarks…' },
  { at: 45, label: 'Building your daily schedule…' },
  { at: 70, label: 'Adding restaurants and hidden gems…' },
  { at: 88, label: 'Optimizing routes and distances…' },
  { at: 97, label: 'Finalizing your plan…' },
]

// ─── Route header ─────────────────────────────────────────────────────────────

function RouteHeader({ progress, destination }: { progress: number; destination: string }) {
  const pathRef  = useRef<SVGPathElement>(null)
  const planeRef = useRef<SVGGElement>(null)

  useEffect(() => {
    const path  = pathRef.current
    const plane = planeRef.current
    if (!path || !plane) return
    const len    = path.getTotalLength()
    const clamped = Math.min(progress, 100) / 100
    const pt     = path.getPointAtLength(len * clamped)
    const ahead  = path.getPointAtLength(Math.min(len, len * clamped + 1))
    const ang    = Math.atan2(ahead.y - pt.y, ahead.x - pt.x) * 180 / Math.PI
    plane.setAttribute('transform', `translate(${pt.x},${pt.y}) rotate(${ang})`)
  }, [progress])

  const pins = [{ x: 70, y: 96, t: 0 }, { x: 200, y: 64, t: 30 }, { x: 330, y: 104, t: 60 }, { x: 470, y: 70, t: 90 }]

  return (
    <div style={{
      position: 'relative', height: 168, overflow: 'hidden',
      background: 'linear-gradient(160deg, #1e3a5f 0%, #1d4ed8 45%, #1e40af 100%)',
    }}>
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.6,
        backgroundImage: [
          'radial-gradient(1.5px 1.5px at 15% 40%, #fff, transparent)',
          'radial-gradient(1px 1px at 70% 25%, rgba(255,255,255,.8), transparent)',
          'radial-gradient(1.5px 1.5px at 45% 65%, rgba(255,255,255,.7), transparent)',
          'radial-gradient(1px 1px at 88% 60%, #fff, transparent)',
          'radial-gradient(1px 1px at 30% 80%, rgba(255,255,255,.6), transparent)',
        ].join(', '),
        animation: 'twinkle 4s ease-in-out infinite',
      }}/>
      <span style={{
        position: 'absolute', left: 22, top: 18, zIndex: 3,
        display: 'inline-flex', alignItems: 'center', gap: 8,
        fontSize: 11, fontWeight: 700, letterSpacing: '1.2px', color: '#93c5fd',
      }}>
        <span style={{ display: 'inline-flex', padding: 5, background: 'rgba(255,255,255,.14)', borderRadius: 7 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15l-7-2-3 5-2-1 1-4-5-2 1-2 5 1 3-5 2 1-1 5z"/>
          </svg>
        </span>
        AI PLANNER · CRAFTING YOUR TRIP
      </span>
      <svg viewBox="0 0 540 168" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <path d="M70 96 C 140 30, 170 30, 200 64 S 290 150, 330 104 S 420 30, 470 70"
              fill="none" stroke="rgba(255,255,255,.28)" strokeWidth="2.5" strokeDasharray="2 8" strokeLinecap="round"/>
        <path ref={pathRef}
              d="M70 96 C 140 30, 170 30, 200 64 S 290 150, 330 104 S 420 30, 470 70"
              fill="none" stroke="rgba(255,255,255,.9)" strokeWidth="2.5" strokeLinecap="round"
              pathLength={100} strokeDasharray="100"
              style={{ strokeDashoffset: 100 - progress, transition: 'stroke-dashoffset .5s cubic-bezier(.22,.61,.36,1)' }}/>
        {pins.map((p, i) => (
          <g key={i} style={{ opacity: progress >= p.t ? 1 : 0.25, transition: 'opacity .4s' }}>
            <circle cx={p.x} cy={p.y} r={progress >= p.t ? 6 : 4}
                    fill={progress >= p.t ? '#fbbf24' : 'rgba(255,255,255,.4)'}
                    style={{ transition: 'r .3s, fill .3s' }}/>
          </g>
        ))}
        <g ref={planeRef}>
          <g transform="translate(-9,-9)">
            <path d="M21 15l-7-2-3 5-2-1 1-4-5-2 1-2 5 1 3-5 2 1-1 5z"
                  fill="#fff" stroke="#3b82f6" strokeWidth="1" strokeLinejoin="round"/>
          </g>
        </g>
      </svg>
      <div style={{ position: 'absolute', right: 22, bottom: 16, zIndex: 3, textAlign: 'right' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)' }}>Generating →</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.4px', lineHeight: 1.1 }}>
          {destination || 'Your Trip'}
        </div>
      </div>
    </div>
  )
}

// ─── Rotating fact card ───────────────────────────────────────────────────────

function FactCard({ isDark, textSub }: { isDark: boolean; textSub: string }) {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * FACTS.length))
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIdx(i => (i + 1) % FACTS.length)
        setVisible(true)
      }, 400)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  const fact = FACTS[idx]

  return (
    <div style={{
      display: 'flex', gap: 14, padding: '16px 18px',
      background: isDark ? 'rgba(59,130,246,.06)' : 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)',
      border: `1px solid ${isDark ? 'rgba(59,130,246,.15)' : 'rgba(59,130,246,.2)'}`,
      borderRadius: 16,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(6px)',
      transition: 'opacity .4s ease, transform .4s ease',
    }}>
      <span style={{
        flexShrink: 0, width: 40, height: 40, borderRadius: 12, fontSize: 20,
        background: isDark ? 'rgba(59,130,246,.15)' : '#dbeafe',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(59,130,246,.15)',
      }}>
        {fact.emoji}
      </span>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#3b82f6', marginBottom: 4, letterSpacing: '.6px', textTransform: 'uppercase' }}>
          Did you know?
        </div>
        <div style={{ fontSize: 13.5, color: textSub, lineHeight: 1.5 }}>
          {fact.text}
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export const GenerationLoading: React.FC<Props> = ({
  progress: progressMsg,
  attractions: _attractions,
  generatedDays: _generatedDays,
  elapsedTime,
  destination,
}) => {
  const { isDark } = useTheme()

  const numericProgress = useMemo(() => {
    const t = Math.min(1, elapsedTime / 55)
    const eased = 1 - Math.pow(1 - t, 2.2)
    return Math.round(eased * 99)
  }, [elapsedTime])

  const stage = useMemo(() => {
    let s = STAGES[0]
    for (const st of STAGES) if (numericProgress >= st.at) s = st
    return s
  }, [numericProgress])

  const stageLabel = progressMsg || stage.label

  const bg         = isDark ? '#08091a'                   : '#f0f4ff'
  const cardBg     = isDark ? 'rgba(22,24,48,.97)'         : '#fff'
  const cardBorder = isDark ? 'rgba(255,255,255,.07)'      : 'rgba(15,23,42,.07)'
  const cardShadow = isDark ? '0 18px 50px rgba(0,0,0,.5), 0 4px 12px rgba(0,0,0,.3)' : '0 18px 50px rgba(59,130,246,.15), 0 4px 12px rgba(15,23,42,.06)'
  const textMain   = isDark ? '#f0eeff'                   : '#0f172a'
  const textSub    = isDark ? '#a3a1c8'                   : '#475569'
  const textDim    = isDark ? '#6e6c93'                   : '#94a3b8'
  const trackBg    = isDark ? 'rgba(255,255,255,.06)'      : '#e2e8f0'
  const glow1      = isDark ? 'rgba(59,130,246,.3)'        : '#bfdbfe'
  const glow2      = isDark ? 'rgba(96,165,250,.2)'        : '#dbeafe'

  return (
    <>
      <style>{`
        @keyframes twinkle   { 0%,100%{opacity:.7}50%{opacity:.3} }
        @keyframes shimmer   { to{background-position:200% 0} }
        @keyframes pulseDot  { 0%,100%{box-shadow:0 0 0 3px rgba(59,130,246,.16)}50%{box-shadow:0 0 0 6px rgba(59,130,246,0)} }
        @keyframes cardIn    { from{opacity:0;transform:translateY(18px) scale(.98)} }
        @keyframes floatBg   { 0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(40px,-30px) scale(1.08)} }
      `}</style>

      <div style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, overflow: 'hidden',
      }}>
        {/* Glows */}
        <div style={{ position: 'absolute', width: 520, height: 520, top: -160, left: -120, borderRadius: '50%', filter: 'blur(90px)', background: `radial-gradient(circle,${glow1},transparent 62%)`, opacity: 0.7, animation: 'floatBg 18s ease-in-out infinite', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', width: 460, height: 460, bottom: -180, right: -100, borderRadius: '50%', filter: 'blur(90px)', background: `radial-gradient(circle,${glow2},transparent 62%)`, opacity: 0.6, animation: 'floatBg 22s ease-in-out infinite', animationDelay: '-7s', pointerEvents: 'none' }}/>

        {/* Card */}
        <div style={{
          position: 'relative', zIndex: 1,
          width: '100%', maxWidth: 560, margin: '0 auto',
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: 28, boxShadow: cardShadow,
          overflow: 'hidden',
          animation: 'cardIn .6s cubic-bezier(.22,.61,.36,1)',
        }}>
          <RouteHeader progress={numericProgress} destination={destination || 'Your Trip'} />

          <div style={{ padding: '22px 26px 26px' }}>
            {/* Title */}
            <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', margin: '0 0 16px', color: textMain }}>
              Building your trip to <strong style={{ color: '#3b82f6' }}>{destination || 'your destination'}</strong>…
            </h1>

            {/* Progress */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <div style={{ flex: 1, height: 8, background: trackBg, borderRadius: 5, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 5, width: `${numericProgress}%`,
                  background: 'linear-gradient(90deg, #3b82f6, #60a5fa, #93c5fd)',
                  backgroundSize: '200% 100%',
                  boxShadow: '0 0 12px rgba(59,130,246,.4)',
                  transition: 'width .5s cubic-bezier(.22,.61,.36,1)',
                  animation: 'shimmer 2s linear infinite',
                }}/>
              </div>
              <span style={{ fontSize: 13, fontWeight: 800, minWidth: 42, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: textMain }}>
                {numericProgress}%
              </span>
            </div>

            {/* Stage */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: textDim, marginBottom: 22 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 0 3px rgba(59,130,246,.16)', animation: 'pulseDot 1.6s ease-in-out infinite', flexShrink: 0 }}/>
              {stageLabel}
            </div>

            {/* Rotating fun fact */}
            <FactCard isDark={isDark} textSub={textSub} />
          </div>
        </div>
      </div>
    </>
  )
}
