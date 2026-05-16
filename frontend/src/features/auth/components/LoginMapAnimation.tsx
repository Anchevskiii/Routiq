import React, { useState, useEffect } from 'react'
import { cn } from '@/utils/cn'
import { CITY_POOL, shuffle, arcPath } from './loginMap.data'
import { WorldMapSvg }    from './WorldMapSvg'
import { CityMarker }     from './CityMarker'
import { AnimationReel }  from './AnimationReel'
import { WelcomeOverlay } from './WelcomeOverlay'

interface Props {
  name: string
  onEnd: () => void
}

export const LoginMapAnimation: React.FC<Props> = ({ name, onEnd }) => {
  const [picked]       = useState(() => shuffle(CITY_POOL).slice(0, 3))
  const [worldTf, setWorldTf]       = useState('translate(-50%,-50%) scale(1)')
  const [active, setActive]         = useState<number[]>([])
  const [labels, setLabels]         = useState<number[]>([])
  const [doneSteps, setDoneSteps]   = useState<number[]>([])
  const [curStep, setCurStep]       = useState(1)
  const [drawRoutes, setDrawRoutes] = useState(false)
  const [welcome, setWelcome]       = useState(false)

  const A = picked[0].pos, B = picked[1].pos, C = picked[2].pos

  const camTo = (pos: { x: number; y: number }, scale: number) =>
    `translate(-50%,-50%) scale(${scale}) translate(${800 - pos.x}px,${450 - pos.y}px)`
  const camAll = (scale: number) =>
    camTo({ x: (A.x + B.x + C.x) / 3, y: (A.y + B.y + C.y) / 3 }, scale)

  useEffect(() => {
    const act  = (i: number) => setActive(p => [...p, i])
    const lab  = (i: number) => setLabels(p => [...p, i])
    const done = (n: number) => setDoneSteps(p => [...p, n])
    const ids = [
      setTimeout(() => setCurStep(1), 0),
      setTimeout(() => { setWorldTf(camTo(A, 1.3)); done(1); setCurStep(2) }, 1500),
      setTimeout(() => act(0), 2400),
      setTimeout(() => { lab(0); done(2); setCurStep(3) }, 3300),
      setTimeout(() => { setWorldTf(camTo(B, 1.3)); act(1) }, 3900),
      setTimeout(() => { lab(1); done(3); setCurStep(4) }, 4900),
      setTimeout(() => { setWorldTf(camTo(C, 1.3)); act(2) }, 5500),
      setTimeout(() => lab(2), 6500),
      setTimeout(() => { setWorldTf(camAll(1.05)); done(4); setCurStep(5); setDrawRoutes(true) }, 7200),
      setTimeout(() => { setWelcome(true); done(5) }, 8400),
      setTimeout(() => onEnd(), 10200),
    ]
    return () => ids.forEach(clearTimeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stepItems = [
    { id: 1, label: 'Loading map' },
    { id: 2, label: picked[0]?.name ?? '…' },
    { id: 3, label: picked[1]?.name ?? '…' },
    { id: 4, label: picked[2]?.name ?? '…' },
    { id: 5, label: 'Welcome' },
  ]

  return (
    <div className="relative w-full h-full overflow-hidden bg-white dark:bg-[#0c0b1a]">
      {/* Headline */}
      <div className="lm-fade-up-hero absolute left-1/2 top-[8%] -translate-x-1/2 text-center z-10">
        <div className="text-xs font-medium tracking-[0.16em] uppercase text-ink-dim mb-2.5">
          <span className="lm-blink inline-block w-1.5 h-1.5 bg-red-500 rounded-full mr-2 shadow-[0_0_8px_rgba(239,68,68,.6)]"/>
          Preparing your dashboard
        </div>
        <h1 className="text-4xl font-medium tracking-tight text-ink">
          Routing you to your{' '}
          <em className="font-serif italic font-normal gradient-aurora-text">next journey</em>
        </h1>
      </div>

      {/* World container — only the camera transform is dynamic */}
      <div
        className="absolute left-1/2 top-1/2 w-[1600px] h-[900px] origin-center"
        style={{ transform: worldTf, transition: 'transform 1.4s cubic-bezier(.65,.05,.36,1)' }}
      >
        <WorldMapSvg />

        {/* Route arcs */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1600 900">
          <path d={arcPath(A, B, 50)} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 4" strokeLinecap="round"
            className={cn(drawRoutes ? 'lm-draw-route' : 'opacity-0')}/>
          <path d={arcPath(A, C, 50)} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 4" strokeLinecap="round"
            className={cn(drawRoutes ? 'lm-draw-route-2' : 'opacity-0')}/>
        </svg>

        {picked.map((city, i) => (
          <CityMarker
            key={city.name} city={city} index={i}
            isActive={active.includes(i)} showLabel={labels.includes(i)}
          />
        ))}
      </div>

      <AnimationReel steps={stepItems} curStep={curStep} doneSteps={doneSteps} />
      <WelcomeOverlay name={name} visible={welcome} onSkip={onEnd} />
    </div>
  )
}
