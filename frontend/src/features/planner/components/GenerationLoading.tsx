import React, { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useTheme } from '@/hooks/useTheme'
import type { FormattedPlace } from '@/types/attractions.types'
import type { StreamingDay } from '@/types/itinerary.types'

interface Props {
  readonly progress: string
  readonly attractions: readonly FormattedPlace[]
  readonly generatedDays: readonly StreamingDay[]
  readonly elapsedTime: number
  readonly destination?: string
  readonly totalDays?: number
  readonly isComplete?: boolean
}

// ─── Fun facts ────────────────────────────────────────────────────────────────

const FACT_DUR = 3000

const ALL_FACTS = [
  { emoji: '🗺️', cat: 'GEOGRAPHY',   text: 'France is the most visited country with 89 million tourists per year — more than its own population.' },
  { emoji: '✈️', cat: 'TRAVEL',      text: 'The longest commercial flight (New York → Singapore) covers 18,000 km and takes over 18 hours.' },
  { emoji: '🗼', cat: 'FUN FACT',    text: 'The Eiffel Tower can be 15 cm taller in summer — heat causes the iron to expand.' },
  { emoji: '🦟', cat: 'NATURE',      text: 'Iceland is the only country in the world with absolutely no mosquitoes.' },
  { emoji: '🏔️', cat: 'EXTREMES',   text: 'The world\'s highest airport in Daocheng, China sits at 4,411 m — passengers sometimes need oxygen.' },
  { emoji: '🌊', cat: 'OCEANS',      text: 'More than 80% of Earth\'s ocean floor has never been explored by humans.' },
  { emoji: '🏖️', cat: 'AUSTRALIA',  text: 'Australia has so many beaches you could visit a new one every day for 27 years.' },
  { emoji: '🌍', cat: 'GEOGRAPHY',   text: 'There are 195 countries in the world, but only about 100 have been visited by the average traveller in their lifetime.' },
  { emoji: '🚂', cat: 'TRANSPORT',   text: 'Japan\'s bullet trains have an average delay of just 18 seconds — and that includes natural disasters.' },
  { emoji: '🏙️', cat: 'CITIES',     text: 'Tokyo is the world\'s most populous metropolitan area with over 37 million people.' },
  { emoji: '🌐', cat: 'LANGUAGES',   text: 'Papua New Guinea has 840+ languages — more than any other country on Earth.' },
  { emoji: '🛂', cat: 'PASSPORTS',   text: 'Singapore has the world\'s most powerful passport, granting visa-free access to 193 destinations.' },
  { emoji: '🍜', cat: 'FOOD',        text: 'Italy has over 350 distinct pasta shapes, each designed to pair with specific sauces.' },
  { emoji: '🏛️', cat: 'HISTORY',    text: 'Rome has more ancient obelisks than Egypt — 13 vs. 9. Romans looted most of them.' },
  { emoji: '💶', cat: 'MONEY',       text: 'The Euro is used by 20 countries, making it one of the most widely used currencies in the world.' },
  { emoji: '🦁', cat: 'WILDLIFE',    text: 'Kenya\'s Maasai Mara hosts the Great Migration — 1.5 million wildebeest crossing in one spectacle.' },
  { emoji: '🌋', cat: 'GEOLOGY',     text: 'Indonesia has more active volcanoes than any other country — over 130.' },
  { emoji: '🏊', cat: 'FUN FACT',    text: 'The Dead Sea is so salty you literally can\'t sink — the salt concentration is 10x that of the ocean.' },
  { emoji: '🗽', cat: 'LANDMARKS',   text: 'The Statue of Liberty was originally intended for Egypt before France proposed gifting it to the USA.' },
  { emoji: '🌅', cat: 'NATURE',      text: 'Norway\'s midnight sun means the sun doesn\'t set for 76 consecutive days in summer above the Arctic Circle.' },
  { emoji: '🚁', cat: 'TRANSPORT',   text: 'São Paulo has more private helicopters per capita than any other city — traffic is so bad, the rich fly.' },
  { emoji: '🏯', cat: 'HISTORY',     text: 'Japan has more castles than any other country — over 100 remain intact after centuries.' },
  { emoji: '🍷', cat: 'FOOD',        text: 'France produces over 8 billion bottles of wine per year — about 100 bottles for every French person.' },
  { emoji: '🧊', cat: 'EXTREMES',    text: 'Greenland is 80% covered in ice, yet it\'s classified as a country, not a continent.' },
  { emoji: '🗺️', cat: 'FUN FACT',    text: 'Alaska is both the westernmost and easternmost state in the USA — it crosses the 180th meridian.' },
  { emoji: '🐧', cat: 'WILDLIFE',    text: 'Antarctica has no permanent human residents but hosts around 5 million penguins.' },
  { emoji: '🌉', cat: 'ENGINEERING', text: 'The Golden Gate Bridge was painted 11 times in its first 27 years — the fog and salt air constantly corrode it.' },
  { emoji: '🎭', cat: 'CULTURE',     text: 'Venice has no roads — it has 150 canals and 400 bridges connecting its 118 islands.' },
]

// Cryptographically secure shuffle to avoid Math.random security hotspots
function secureShuffle<T>(array: readonly T[]): T[] {
  const result = [...array]
  if (typeof window === 'undefined' && typeof globalThis === 'undefined') {
    return result
  }
  const cryptoObj = (typeof window !== 'undefined' ? window.crypto : globalThis.crypto)
  if (!cryptoObj || !cryptoObj.getRandomValues) {
    // Fallback if crypto is not supported
    return result
  }
  const randomValues = new Uint32Array(result.length)
  cryptoObj.getRandomValues(randomValues)
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomValues[i] % (i + 1)
    const temp = result[i]
    result[i] = result[j]
    result[j] = temp
  }
  return result
}

// Shuffle once per session
const FACTS = secureShuffle(ALL_FACTS)

// ─── Stage labels ─────────────────────────────────────────────────────────────

const STAGES = [
  { at: 0,  label: 'Analyzing your preferences…' },
  { at: 10, label: 'Finding attractions and landmarks…' },
  { at: 30, label: 'Building your daily schedule…' },
  { at: 60, label: 'Adding restaurants and hidden gems…' },
  { at: 80, label: 'Optimizing routes and distances…' },
  { at: 95, label: 'Finalizing your itinerary…' },
]

// ─── Route header ─────────────────────────────────────────────────────────────

function RouteHeader({ progress, destination }: Readonly<{ progress: number; destination: string }>) {
  const pathRef  = useRef<SVGPathElement>(null)
  const planeRef = useRef<SVGGElement>(null)

  useEffect(() => {
    const path  = pathRef.current
    const plane = planeRef.current
    if (!path || !plane) return
    const len     = path.getTotalLength()
    const clamped = Math.min(progress, 100) / 100
    const pt      = path.getPointAtLength(len * clamped)
    const ahead   = path.getPointAtLength(Math.min(len, len * clamped + 1))
    const ang     = Math.atan2(ahead.y - pt.y, ahead.x - pt.x) * 180 / Math.PI
    plane.setAttribute('transform', `translate(${pt.x},${pt.y}) rotate(${ang})`)
  }, [progress])

  const pins = [
    { id: 'pin-0', x: 70,  y: 96, t: 0  },
    { id: 'pin-1', x: 200, y: 64, t: 30 },
    { id: 'pin-2', x: 330, y: 104, t: 60 },
    { id: 'pin-3', x: 470, y: 70, t: 90 },
  ]

  return (
    <div style={{
      position: 'relative', height: 176, overflow: 'hidden',
      background: 'linear-gradient(160deg, #1e3a5f 0%, #1d4ed8 50%, #1e40af 100%)',
    }}>
      {/* Stars */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.65,
        backgroundImage: [
          'radial-gradient(1.5px 1.5px at 15% 40%, #fff, transparent)',
          'radial-gradient(1px 1px at 70% 25%, rgba(255,255,255,.8), transparent)',
          'radial-gradient(1.5px 1.5px at 45% 65%, rgba(255,255,255,.7), transparent)',
          'radial-gradient(1px 1px at 88% 60%, #fff, transparent)',
          'radial-gradient(1px 1px at 30% 80%, rgba(255,255,255,.6), transparent)',
        ].join(', '),
        animation: 'twinkleGL 4s ease-in-out infinite',
      }}/>

      {/* Label */}
      <span style={{
        position: 'absolute', left: 22, top: 18, zIndex: 3,
        display: 'inline-flex', alignItems: 'center', gap: 8,
        fontSize: 11, fontWeight: 700, letterSpacing: '1.2px', color: '#93c5fd',
      }}>
        <span style={{
          display: 'inline-flex', padding: 5,
          background: 'rgba(255,255,255,.14)', borderRadius: 7,
          animation: 'spinGL 7s linear infinite',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v4M12 17v4M5 12H3M21 12h-2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </span>
        <span>AI PLANNER · CRAFTING YOUR TRIP</span>
      </span>

      {/* Flight path SVG */}
      <svg viewBox="0 0 540 176" preserveAspectRatio="xMidYMid slice"
           style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {/* Dashed track */}
        <path d="M70 96 C 140 30, 170 30, 200 64 S 290 150, 330 104 S 420 30, 470 70"
              fill="none" stroke="rgba(255,255,255,.28)" strokeWidth="2.5"
              strokeDasharray="2 8" strokeLinecap="round"/>
        {/* Animated progress */}
        <path ref={pathRef}
              d="M70 96 C 140 30, 170 30, 200 64 S 290 150, 330 104 S 420 30, 470 70"
              fill="none" stroke="rgba(255,255,255,.9)" strokeWidth="2.5" strokeLinecap="round"
              pathLength={100} strokeDasharray="100"
              style={{ strokeDashoffset: 100 - progress, transition: 'stroke-dashoffset .5s cubic-bezier(.22,.61,.36,1)' }}/>
        {/* Pins */}
        {pins.map((p) => (
          <g key={p.id} style={{ opacity: progress >= p.t ? 1 : 0.25, transition: 'opacity .4s' }}>
            <circle cx={p.x} cy={p.y}
                    r={progress >= p.t ? 6 : 4}
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
        <g ref={planeRef}>
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

// ─── Fun facts card ───────────────────────────────────────────────────────────

function FunFacts({ isDark }: Readonly<{ isDark: boolean }>) {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setIdx(i => i + 1), FACT_DUR)
    return () => clearInterval(id)
  }, [])

  const f   = FACTS[idx % FACTS.length]
  const pos = idx % FACTS.length

  const wrapBg     = isDark
    ? 'linear-gradient(135deg, rgba(59,130,246,.07) 0%, rgba(96,165,250,.04) 100%)'
    : 'linear-gradient(135deg, #f0f7ff 0%, #f8faff 100%)'
  const wrapBorder = 'rgba(59,130,246,.18)'
  const catColor   = isDark ? '#60a5fa'               : '#2563eb'
  const catBg      = isDark ? 'rgba(59,130,246,.12)'  : 'rgba(59,130,246,.1)'
  const textColor  = isDark ? '#f0eeff'               : '#0f172a'
  const dotDone    = isDark ? 'rgba(59,130,246,.45)'  : 'rgba(59,130,246,.35)'
  const dotEmpty   = isDark ? 'rgba(255,255,255,.08)' : 'rgba(59,130,246,.12)'
  const eyebrowC   = isDark ? '#60a5fa'               : '#3b82f6'
  const emojiShadow= isDark
    ? '0 8px 22px rgba(59,130,246,.3), inset 0 0 0 1px rgba(96,165,250,.15)'
    : '0 8px 22px rgba(59,130,246,.18), inset 0 0 0 1px rgba(59,130,246,.1)'
  const emojiBg    = isDark ? 'rgba(22,24,48,.8)' : '#fff'

  return (
    <div style={{
      position: 'relative', borderRadius: 20,
      padding: '20px 20px 16px',
      background: wrapBg,
      border: `1px solid ${wrapBorder}`,
      overflow: 'hidden',
      minHeight: 160,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Eyebrow */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
        fontSize: 11, fontWeight: 800, letterSpacing: '1.2px', color: eyebrowC,
      }}>
        <span>DID YOU KNOW?</span>
        <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${eyebrowC}55, transparent)` }}/>
      </div>

      {/* Fact */}
      <div key={idx} style={{ flex: 1, display: 'flex', gap: 16, alignItems: 'flex-start', animation: 'factInGL .55s cubic-bezier(.22,.61,.36,1) both' }}>
        <div style={{
          flexShrink: 0, width: 56, height: 56, borderRadius: 17,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, background: emojiBg, boxShadow: emojiShadow,
          animation: 'emojiInGL .65s cubic-bezier(.22,1.25,.36,1) both',
        }}>
          {f.emoji}
        </div>
        <div style={{ flex: 1, paddingTop: 2 }}>
          <span style={{
            display: 'inline-block',
            fontSize: 10.5, fontWeight: 800, letterSpacing: '.8px',
            color: catColor, background: catBg,
            padding: '3px 9px', borderRadius: 6, marginBottom: 8,
          }}>
            {f.cat}
          </span>
          <p style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.5, color: textColor, margin: 0 }}>
            {f.text}
          </p>
        </div>
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 5, marginTop: 16 }}>
        {FACTS.map((fact) => (
          <div key={fact.text} style={{
            height: 4, borderRadius: 3, flex: 1, overflow: 'hidden', position: 'relative',
            background: FACTS.indexOf(fact) < pos ? dotDone : dotEmpty,
          }}>
            {FACTS.indexOf(fact) === pos && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                borderRadius: 3, transformOrigin: 'left',
                animation: `dotFillGL ${FACT_DUR}ms linear forwards`,
              }}/>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Sub-component to reduce Cognitive Complexity ─────────────────────────────

const ProgressSection: React.FC<Readonly<{
  displayProgress: number
  numericProgress: number
  isComplete: boolean
  stageLabel: string
  textMain: string
  textDim: string
  trackBg: string
}>> = ({
  displayProgress,
  numericProgress,
  isComplete,
  stageLabel,
  textMain,
  textDim,
  trackBg,
}) => {
  return (
    <>
      {/* Progress bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 7 }}>
        <div style={{ flex: 1, height: 8, background: trackBg, borderRadius: 5, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 5, width: `${displayProgress}%`,
            backgroundImage: isComplete
              ? 'linear-gradient(90deg, #10b981, #34d399)'
              : 'linear-gradient(90deg, #3b82f6, #60a5fa, #93c5fd)',
            backgroundSize: '200% 100%',
            boxShadow: isComplete ? '0 0 10px rgba(16,185,129,.5)' : '0 0 10px rgba(59,130,246,.4)',
            transition: 'width .3s ease-out, background .5s ease, box-shadow .5s ease',
            animation: isComplete ? 'none' : 'shimmerGL 2s linear infinite',
          }}/>
        </div>
        <span style={{ fontSize: 13, fontWeight: 800, minWidth: 42, textAlign: 'right', color: isComplete ? '#10b981' : textMain, transition: 'color .4s' }}>
          {numericProgress}%
        </span>
      </div>

      {/* Stage */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: isComplete ? '#10b981' : textDim, marginBottom: 20, transition: 'color .4s' }}>
        {isComplete ? (
          <span style={{ fontSize: 14 }}>✓</span>
        ) : (
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', flexShrink: 0,
            boxShadow: '0 0 0 3px rgba(59,130,246,.16)',
            animation: 'pulseDotGL 1.6s ease-in-out infinite',
          }}/>
        )}
        <span style={{ fontWeight: isComplete ? 700 : 400 }}>{stageLabel}</span>
      </div>
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export const GenerationLoading: React.FC<Readonly<Props>> = ({
  progress: progressMsg,
  attractions: _attractions,
  generatedDays,
  elapsedTime,
  destination,
  totalDays = 0,
  isComplete = false,
}) => {
  const { isDark } = useTheme()

  // Target progress based on actual days received
  const targetProgress = useMemo(() => {
    if (isComplete) return 100
    if (totalDays === 0) return Math.min(10, elapsedTime * 1.5)
    // 0-10%: initial base (time-based, first ~7s)
    const base = Math.min(10, elapsedTime * 1.4)
    // 10-95%: each received day contributes equally
    const dayPct = (generatedDays.length / totalDays) * 85
    return Math.min(95, base + dayPct)
  }, [isComplete, totalDays, generatedDays.length, elapsedTime])

  // Smoothly chase target — creeps toward it so bar never jumps backwards
  const [displayProgress, setDisplayProgress] = useState(0)
  const displayRef = useRef(0)

  useEffect(() => {
    const id = setInterval(() => {
      const current = displayRef.current
      const target  = targetProgress
      if (current >= target) return
      // Fast when there's a big gap (new day arrived), slow when creeping
      const gap  = target - current
      let step = 0.08
      if (gap > 8) {
        step = gap * 0.12
      } else if (gap > 2) {
        step = 0.4
      }
      const next = Math.min(target, current + step)
      displayRef.current = next
      setDisplayProgress(Math.round(next * 10) / 10)
    }, 80)
    return () => clearInterval(id)
  }, [targetProgress])

  const numericProgress = Math.round(displayProgress)

  const stage = useMemo(() => {
    let s = STAGES[0]
    for (const st of STAGES) {
      if (numericProgress >= st.at) {
        s = st
      }
    }
    return s
  }, [numericProgress])

  let stageLabel = progressMsg || stage.label
  if (isComplete) {
    stageLabel = 'Your itinerary is complete!'
  } else if (numericProgress >= 95) {
    stageLabel = 'Finalizing your itinerary…'
  }

  // Color tokens
  const bg         = isDark ? '#08091a'                     : '#f0f4ff'
  const cardBg     = isDark ? 'rgba(22,24,48,.97)'           : '#fff'
  const cardBorder = isDark ? 'rgba(255,255,255,.07)'        : 'rgba(15,23,42,.07)'
  const cardShadow = isDark
    ? '0 18px 50px rgba(0,0,0,.55), 0 4px 12px rgba(0,0,0,.35)'
    : '0 18px 50px rgba(59,130,246,.14), 0 4px 12px rgba(15,23,42,.06)'
  const textMain   = isDark ? '#f0eeff'                     : '#0f172a'
  const textSub    = isDark ? '#a3a1c8'                     : '#475569'
  const textDim    = isDark ? '#6e6c93'                     : '#94a3b8'
  const trackBg    = isDark ? 'rgba(255,255,255,.07)'        : '#e8edf5'
  const glow1      = isDark ? 'rgba(59,130,246,.3)'          : '#bfdbfe'
  const glow2      = isDark ? 'rgba(96,165,250,.18)'         : '#dbeafe'

  return createPortal(
    <>
      <style>{`
        @keyframes twinkleGL   { 0%,100%{opacity:.65}50%{opacity:.25} }
        @keyframes spinGL      { to{transform:rotate(360deg)} }
        @keyframes shimmerGL   { to{background-position:200% 0} }
        @keyframes pulseDotGL  { 0%,100%{box-shadow:0 0 0 3px rgba(59,130,246,.16)}50%{box-shadow:0 0 0 6px rgba(59,130,246,0)} }
        @keyframes cardInGL    { from{opacity:0;transform:translateY(18px) scale(.98)} }
        @keyframes floatBgGL   { 0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(40px,-30px) scale(1.08)} }
        @keyframes factInGL    { 0%{opacity:0;transform:translateY(12px) scale(.97)}100%{opacity:1;transform:none} }
        @keyframes emojiInGL   { 0%{opacity:0;transform:scale(.3) rotate(-20deg)}60%{transform:scale(1.12) rotate(6deg)}100%{opacity:1;transform:none} }
        @keyframes dotFillGL   { from{transform:scaleX(0)}to{transform:scaleX(1)} }
      `}</style>

      {/* Full-screen overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, overflow: 'hidden',
      }}>
        {/* Ambient glows */}
        <div style={{ position: 'absolute', width: 520, height: 520, top: -160, left: -120, borderRadius: '50%', filter: 'blur(90px)', background: `radial-gradient(circle,${glow1},transparent 62%)`, opacity: 0.7, animation: 'floatBgGL 18s ease-in-out infinite', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', width: 460, height: 460, bottom: -180, right: -100, borderRadius: '50%', filter: 'blur(90px)', background: `radial-gradient(circle,${glow2},transparent 62%)`, opacity: 0.6, animation: 'floatBgGL 22s ease-in-out infinite', animationDelay: '-7s', pointerEvents: 'none' }}/>

        {/* Card */}
        <div style={{
          position: 'relative', zIndex: 1,
          width: '100%', maxWidth: 540,
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: 28,
          boxShadow: cardShadow,
          overflow: 'hidden',
          animation: 'cardInGL .6s cubic-bezier(.22,.61,.36,1)',
        }}>
          {/* Flight header */}
          <RouteHeader progress={numericProgress} destination={destination || 'Your Trip'} />

          {/* Body */}
          <div style={{ padding: '22px 24px 24px' }}>
            {/* Title */}
            <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.4px', margin: '0 0 4px', color: textMain }}>
              Building your trip to <span style={{ color: '#3b82f6' }}>{destination || 'your destination'}</span>…
            </h1>
            <p style={{ fontSize: 13, color: textSub, margin: '0 0 18px' }}>
              Routiq is putting together the perfect route — just a moment.
            </p>

            {/* Progress Bar & Stage Section */}
            <ProgressSection
              displayProgress={displayProgress}
              numericProgress={numericProgress}
              isComplete={isComplete}
              stageLabel={stageLabel}
              textMain={textMain}
              textDim={textDim}
              trackBg={trackBg}
            />

            {/* Fun facts */}
            <FunFacts isDark={isDark} />
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
