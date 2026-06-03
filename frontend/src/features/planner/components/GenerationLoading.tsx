import React, { useState, useEffect, useRef, useMemo } from 'react'
import type { FormattedPlace } from '@/types/attractions.types'
import type { StreamingDay } from '@/types/itinerary.types'

interface Props {
  progress: string
  attractions: FormattedPlace[]
  generatedDays: StreamingDay[]
  elapsedTime: number
  destination?: string
}

// ─── Quiz data ────────────────────────────────────────────────────────────────

const QUIZ = [
  {
    q: 'Which country receives the most international tourists per year?',
    opts: ['Spain', 'France', 'USA'],
    correct: 1,
    fact: 'France consistently tops the charts with over 89 million visitors annually — the Eiffel Tower alone draws 7 million.',
  },
  {
    q: 'What is the world\'s longest commercial flight route?',
    opts: ['London → Sydney', 'New York → Singapore', 'Dallas → Sydney'],
    correct: 1,
    fact: 'Singapore Airlines SQ22 from New York JFK to Singapore covers ~18,000 km and takes over 18 hours.',
  },
  {
    q: 'Which currency is used in the most countries?',
    opts: ['US Dollar', 'Euro', 'British Pound'],
    correct: 0,
    fact: 'The US Dollar is used as official or de facto currency in over 65 countries and territories worldwide.',
  },
  {
    q: 'What percentage of the Earth\'s surface is ocean?',
    opts: ['51%', '61%', '71%'],
    correct: 2,
    fact: 'Oceans cover about 71% of Earth\'s surface — yet more than 80% of the ocean floor remains unexplored.',
  },
  {
    q: 'Which country has the most natural UNESCO World Heritage Sites?',
    opts: ['China', 'Australia', 'Brazil'],
    correct: 0,
    fact: 'China leads with 57 UNESCO sites total (as of 2024), including the Great Wall and Karst landscapes.',
  },
  {
    q: 'What is the highest airport in the world?',
    opts: ['Lhasa Gonggar (Tibet)', 'Daocheng Yading (China)', 'Juancho Yrausquin (Saba)'],
    correct: 1,
    fact: 'Daocheng Yading Airport sits at 4,411 m above sea level — passengers sometimes need supplemental oxygen.',
  },
]

// ─── Icons ────────────────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12l5 5L20 6"/>
    </svg>
  )
}
function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 5l7 7-7 7"/>
    </svg>
  )
}
function BulbIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6M10 21h4M12 3a6 6 0 00-4 10.5c.7.7 1 1.2 1 2.5h6c0-1.3.3-1.8 1-2.5A6 6 0 0012 3z"/>
    </svg>
  )
}

// ─── Flight route header ───────────────────────────────────────────────────────

function RouteHeader({ progress, destination }: { progress: number; destination: string }) {
  const pathRef = useRef<SVGPathElement>(null)
  const planeRef = useRef<SVGGElement>(null)

  useEffect(() => {
    const path = pathRef.current
    const plane = planeRef.current
    if (!path || !plane) return
    const len = path.getTotalLength()
    const clamped = Math.min(progress, 100) / 100
    const pt = path.getPointAtLength(len * clamped)
    const ahead = path.getPointAtLength(Math.min(len, len * clamped + 1))
    const ang = Math.atan2(ahead.y - pt.y, ahead.x - pt.x) * 180 / Math.PI
    plane.setAttribute('transform', `translate(${pt.x},${pt.y}) rotate(${ang})`)
  }, [progress])

  const pins = [
    { x: 70,  y: 96, t: 0 },
    { x: 200, y: 64, t: 30 },
    { x: 330, y: 104, t: 60 },
    { x: 470, y: 70, t: 90 },
  ]

  return (
    <div style={{
      position: 'relative', height: 168, overflow: 'hidden',
      background: 'linear-gradient(160deg, #1e3a5f 0%, #1d4ed8 45%, #1e40af 100%)',
    }}>
      {/* Stars */}
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

      {/* Label */}
      <span style={{
        position: 'absolute', left: 22, top: 18, zIndex: 3,
        display: 'inline-flex', alignItems: 'center', gap: 8,
        fontSize: 11, fontWeight: 700, letterSpacing: '1.2px', color: '#93c5fd',
      }}>
        <span style={{ display: 'inline-flex', padding: 5, background: 'rgba(255,255,255,.14)', borderRadius: 7 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v4M12 17v4M5 12H3M21 12h-2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </span>
        AI PLANNER · CRAFTING YOUR TRIP
      </span>

      {/* SVG flight path */}
      <svg viewBox="0 0 540 168" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {/* Dashed track */}
        <path d="M70 96 C 140 30, 170 30, 200 64 S 290 150, 330 104 S 420 30, 470 70"
              fill="none" stroke="rgba(255,255,255,.28)" strokeWidth="2.5" strokeDasharray="2 8" strokeLinecap="round"/>
        {/* Animated progress line */}
        <path ref={pathRef}
              d="M70 96 C 140 30, 170 30, 200 64 S 290 150, 330 104 S 420 30, 470 70"
              fill="none" stroke="rgba(255,255,255,.9)" strokeWidth="2.5" strokeLinecap="round"
              pathLength={100} strokeDasharray="100"
              style={{ strokeDashoffset: 100 - progress, transition: 'stroke-dashoffset .5s cubic-bezier(.22,.61,.36,1)' }}/>
        {/* Pins */}
        {pins.map((p, i) => (
          <g key={i} style={{ opacity: progress >= p.t ? 1 : 0.25, transition: 'opacity .4s' }}>
            <circle cx={p.x} cy={p.y} r={progress >= p.t ? 6 : 4}
                    fill={progress >= p.t ? '#fbbf24' : 'rgba(255,255,255,.4)'}
                    style={{ transition: 'r .3s, fill .3s' }}/>
            {progress >= p.t && progress < p.t + 12 && (
              <circle cx={p.x} cy={p.y} r="6" fill="none" stroke="#fbbf24" strokeWidth="2" style={{ opacity: 0.6 }}>
                <animate attributeName="r" values="6;14" dur="1.2s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values=".6;0" dur="1.2s" repeatCount="indefinite"/>
              </circle>
            )}
          </g>
        ))}
        {/* Plane */}
        <g ref={planeRef} fill="#fff">
          <g transform="translate(-9,-9)">
            <path d="M21 15l-7-2-3 5-2-1 1-4-5-2 1-2 5 1 3-5 2 1-1 5z"
                  fill="#fff" stroke="#3b82f6" strokeWidth="1" strokeLinejoin="round"/>
          </g>
        </g>
      </svg>

      {/* Destination label */}
      <div style={{ position: 'absolute', right: 22, bottom: 16, zIndex: 3, textAlign: 'right' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)' }}>Generating →</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.4px', lineHeight: 1.1 }}>
          {destination || 'Your Trip'}
        </div>
      </div>
    </div>
  )
}

// ─── Quiz component ───────────────────────────────────────────────────────────

function Quiz() {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const q = QUIZ[idx % QUIZ.length]
  const answered = picked !== null

  const pick = (i: number) => {
    if (answered) return
    setPicked(i)
    if (i === q.correct) setCorrectCount(c => c + 1)
  }
  const next = () => { setPicked(null); setIdx(i => i + 1) }

  return (
    <div key={idx} style={{ animation: 'fadeUp .45s cubic-bezier(.22,.61,.36,1)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 12 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          fontSize: 11, fontWeight: 700, letterSpacing: '.6px', color: '#3b82f6',
          background: 'rgba(59,130,246,.1)', padding: '5px 11px', borderRadius: 999,
        }}>
          <BulbIcon /> DID YOU KNOW?
        </span>
        <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
          {(idx % QUIZ.length) + 1} / {QUIZ.length}
        </span>
      </div>

      {/* Question */}
      <p style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.2px', margin: '0 0 14px', lineHeight: 1.35 }}>
        {q.q}
      </p>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {q.opts.map((o, i) => {
          const isCorrect = answered && i === q.correct
          const isWrong   = answered && i === picked && i !== q.correct
          const isDim     = answered && i !== q.correct && i !== picked
          return (
            <button key={i} disabled={answered} onClick={() => pick(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '13px 15px',
                background: isCorrect ? 'rgba(34,197,94,.08)' : isWrong ? 'rgba(239,68,68,.06)' : '#fff',
                border: `1.5px solid ${isCorrect ? '#22c55e' : isWrong ? '#ef4444' : 'rgba(15,23,42,.12)'}`,
                borderRadius: 13, font: 'inherit', fontSize: 14, fontWeight: 600,
                color: isDim ? '#94a3b8' : 'inherit',
                textAlign: 'left', cursor: answered ? 'default' : 'pointer',
                transition: 'transform .14s, border-color .14s, background .14s',
                opacity: isDim ? 0.5 : 1,
                animation: isCorrect ? 'popAnim .4s cubic-bezier(.22,1.2,.36,1)' : isWrong ? 'shakeAnim .4s' : 'none',
              }}>
              <span style={{
                width: 26, height: 26, flexShrink: 0, borderRadius: 8,
                background: isCorrect ? '#22c55e' : isWrong ? '#ef4444' : '#f1f5f9',
                color: (isCorrect || isWrong) ? '#fff' : '#475569',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800,
              }}>
                {['A','B','C','D'][i]}
              </span>
              <span style={{ flex: 1 }}>{o}</span>
              {isCorrect && <span style={{ color: '#22c55e', display: 'flex' }}><CheckIcon /></span>}
              {isWrong   && <span style={{ color: '#ef4444', fontWeight: 800 }}>✕</span>}
            </button>
          )
        })}
      </div>

      {/* Fact */}
      {answered && (
        <div style={{
          marginTop: 13, display: 'flex', gap: 11, padding: '13px 15px',
          background: 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)',
          border: '1px solid rgba(59,130,246,.2)', borderRadius: 13,
          animation: 'fadeUp .4s cubic-bezier(.22,.61,.36,1)',
        }}>
          <span style={{
            flexShrink: 0, width: 30, height: 30, borderRadius: 9,
            background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(59,130,246,.3)',
          }}>
            <BulbIcon />
          </span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#3b82f6', marginBottom: 2 }}>
              {picked === q.correct ? 'Correct! 🎉' : 'Close!'}
            </div>
            <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.45 }}>{q.fact}</div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b', fontWeight: 600 }}>
          Correct: <strong style={{ color: '#0f172a' }}>{correctCount}</strong>
          <span style={{ display: 'flex', gap: 3 }}>
            {QUIZ.map((_, i) => (
              <svg key={i} width="16" height="16" viewBox="0 0 24 24"
                   fill={i < correctCount ? '#ec4899' : 'none'} stroke="#ec4899" strokeWidth="2">
                <path d="M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z"/>
              </svg>
            ))}
          </span>
        </span>
        <button disabled={!answered} onClick={next} style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '10px 18px',
          background: answered ? 'linear-gradient(135deg, #3b82f6, #60a5fa)' : 'transparent',
          color: answered ? '#fff' : 'transparent',
          border: 'none', borderRadius: 11,
          font: 'inherit', fontSize: 13, fontWeight: 700,
          cursor: answered ? 'pointer' : 'default',
          boxShadow: answered ? '0 6px 18px rgba(59,130,246,.34)' : 'none',
          transition: 'all .2s',
          pointerEvents: answered ? 'auto' : 'none',
        }}>
          Next <ArrowIcon />
        </button>
      </div>
    </div>
  )
}

// ─── Stage labels ─────────────────────────────────────────────────────────────

const STAGES = [
  { at: 0,  label: 'Analyzing your preferences…' },
  { at: 20, label: 'Finding best attractions and landmarks…' },
  { at: 45, label: 'Building your daily schedule…' },
  { at: 70, label: 'Adding restaurants and hidden gems…' },
  { at: 88, label: 'Optimizing routes and distances…' },
  { at: 97, label: 'Finalizing your plan…' },
]

// ─── Main component ───────────────────────────────────────────────────────────

export const GenerationLoading: React.FC<Props> = ({
  progress: progressMsg,
  attractions: _attractions,
  generatedDays: _generatedDays,
  elapsedTime,
  destination,
}) => {
  // Derive numeric progress from elapsedTime (max ~60s = 100%)
  const numericProgress = useMemo(() => {
    const t = Math.min(1, elapsedTime / 55)
    const eased = 1 - Math.pow(1 - t, 2.2)
    return Math.round(eased * 99) // caps at 99 until complete
  }, [elapsedTime])

  const stage = useMemo(() => {
    let s = STAGES[0]
    for (const st of STAGES) if (numericProgress >= st.at) s = st
    return s
  }, [numericProgress])

  // Override stage label with live SSE message if available
  const stageLabel = progressMsg || stage.label

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } }
        @keyframes twinkle { 0%,100% { opacity: .7; } 50% { opacity: .3; } }
        @keyframes shimmer { to { background-position: 200% 0; } }
        @keyframes pulseDot { 0%,100% { box-shadow: 0 0 0 3px rgba(59,130,246,.16); } 50% { box-shadow: 0 0 0 6px rgba(59,130,246,0); } }
        @keyframes popAnim { 0% { transform: scale(.97); } 55% { transform: scale(1.02); } 100% { transform: scale(1); } }
        @keyframes shakeAnim { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-6px); } 40% { transform: translateX(5px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(3px); } }
        @keyframes cardIn { from { opacity: 0; transform: translateY(18px) scale(.98); } }
        @keyframes floatBg { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(40px,-30px) scale(1.08); } }
      `}</style>

      {/* Full-screen wrapper */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: '#f0f4ff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, overflow: 'hidden',
      }}>
        {/* Background glows */}
        <div style={{ position: 'absolute', width: 520, height: 520, top: -160, left: -120, borderRadius: '50%', filter: 'blur(90px)', background: 'radial-gradient(circle, #bfdbfe, transparent 62%)', opacity: 0.7, animation: 'floatBg 18s ease-in-out infinite', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', width: 460, height: 460, bottom: -180, right: -100, borderRadius: '50%', filter: 'blur(90px)', background: 'radial-gradient(circle, #dbeafe, transparent 62%)', opacity: 0.6, animation: 'floatBg 22s ease-in-out infinite', animationDelay: '-7s', pointerEvents: 'none' }}/>

        {/* Card */}
        <div style={{
          position: 'relative', zIndex: 1, width: 'min(560px, 100%)',
          background: '#fff', border: '1px solid rgba(15,23,42,.07)',
          borderRadius: 28, boxShadow: '0 18px 50px rgba(59,130,246,.15), 0 4px 12px rgba(15,23,42,.06)',
          overflow: 'hidden',
          animation: 'cardIn .6s cubic-bezier(.22,.61,.36,1)',
        }}>
          {/* Flight route header */}
          <RouteHeader progress={numericProgress} destination={destination || 'Your Trip'} />

          {/* Body */}
          <div style={{ padding: '22px 26px 24px' }}>
            <h1 style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.5px', margin: '0 0 4px' }}>
              Preparing your itinerary
              <span style={{ display: 'inline-block', animation: 'dots 1.6s steps(4,end) infinite' }}>…</span>
            </h1>
            <p style={{ fontSize: 13.5, color: '#475569', margin: '0 0 16px' }}>
              Routiq is building your perfect trip to <strong>{destination || 'your destination'}</strong>. Answer a quiz while you wait 🌍
            </p>

            {/* Progress bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <div style={{ flex: 1, height: 8, background: '#e2e8f0', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 5, width: `${numericProgress}%`,
                  background: 'linear-gradient(90deg, #3b82f6, #60a5fa, #93c5fd)',
                  backgroundSize: '200% 100%',
                  boxShadow: '0 0 12px rgba(59,130,246,.4)',
                  transition: 'width .5s cubic-bezier(.22,.61,.36,1)',
                  animation: 'shimmer 2s linear infinite',
                }}/>
              </div>
              <span style={{ fontSize: 13, fontWeight: 800, minWidth: 42, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {numericProgress}%
              </span>
            </div>

            {/* Stage */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#94a3b8', marginBottom: 22 }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', background: '#3b82f6',
                boxShadow: '0 0 0 3px rgba(59,130,246,.16)',
                animation: 'pulseDot 1.6s ease-in-out infinite',
                flexShrink: 0,
              }}/>
              {stageLabel}
            </div>

            {/* Quiz */}
            <Quiz />
          </div>
        </div>
      </div>
    </>
  )
}
