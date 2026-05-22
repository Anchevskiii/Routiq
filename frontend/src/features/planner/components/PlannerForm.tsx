import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MapPin, Sparkles, ArrowRight, RotateCcw, Calendar, Check, Plus, Minus } from 'lucide-react'
import { plannerSchema, type PlannerFormValues } from '../schemas/plannerSchema'
import { DEST_DB } from '../planner.data'

interface Props {
  onSubmit: (values: PlannerFormValues) => void
  isLoading: boolean
}

const TRAVEL_TYPES = [
  { value: 'CULTURAL'    as const, label: 'Cultural',    tags: 'Museums · History', colA: 'rgba(168,85,247,0.20)', colBg: 'rgba(168,85,247,0.18)', colBr: 'rgba(168,85,247,0.4)', colFg: '#a855f7', lightBg: 'rgba(168,85,247,0.08)' },
  { value: 'GASTRONOMIC' as const, label: 'Gastronomic', tags: 'Food · Wine',        colA: 'rgba(249,115,22,0.20)', colBg: 'rgba(249,115,22,0.18)', colBr: 'rgba(249,115,22,0.4)', colFg: '#f97316', lightBg: 'rgba(249,115,22,0.08)' },
  { value: 'NATURE'      as const, label: 'Nature',      tags: 'Parks · Outdoors',   colA: 'rgba(16,185,129,0.20)', colBg: 'rgba(16,185,129,0.18)', colBr: 'rgba(16,185,129,0.4)', colFg: '#10b981', lightBg: 'rgba(16,185,129,0.08)'  },
  { value: 'ADVENTURE'   as const, label: 'Adventure',   tags: 'Thrill · Sport',     colA: 'rgba(244,63,94,0.20)',  colBg: 'rgba(244,63,94,0.18)',  colBr: 'rgba(244,63,94,0.4)',  colFg: '#f43f5e', lightBg: 'rgba(244,63,94,0.08)'  },
]

const BUDGET_OPTS = [
  { id: 'budget', label: 'Budget',    sub: '≤ €80/day' },
  { id: 'mid',    label: 'Mid-range', sub: '€80–250'   },
  { id: 'lux',    label: 'Luxury',    sub: '€250+'     },
]

const PACE_OPTS = [
  { id: 'chill',   label: 'Chill',    sub: '2–3 stops/day' },
  { id: 'balance', label: 'Balanced', sub: '4–5 stops/day' },
  { id: 'packed',  label: 'Packed',   sub: '6+ stops/day'  },
]

const TYPE_ICON: Record<string, React.ReactNode> = {
  CULTURAL: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M3 10 12 4l9 6v2H3zM5 12v8M9 12v8M15 12v8M19 12v8M3 20h18"/>
    </svg>
  ),
  GASTRONOMIC: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M8 3v8a3 3 0 0 0 6 0V3M11 3v18M16 3v18a3 3 0 0 0 3-3v-6h-3"/>
    </svg>
  ),
  NATURE: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M12 3 4 13h4l-3 5h14l-3-5h4z"/><path d="M12 18v3"/>
    </svg>
  ),
  ADVENTURE: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M3 19l6-9 4 6 2-3 6 6z"/><circle cx="17" cy="6" r="2"/>
    </svg>
  ),
}

function FieldNum({ n }: { n: string }) {
  return (
    <span className="font-mono text-[10px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-400/10 border border-sky-200 dark:border-sky-400/20 px-1.5 py-0.5 rounded-[5px] tracking-wider">
      {n}
    </span>
  )
}

function FieldOk({ label }: { label: string }) {
  return (
    <span className="ml-auto inline-flex items-center gap-1 font-mono text-[9px] font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-400/10 border border-green-200 dark:border-green-400/25 px-1.5 py-0.5 rounded-[5px] tracking-[0.08em] uppercase">
      <Check className="w-2 h-2" /> {label}
    </span>
  )
}

export const PlannerForm: React.FC<Props> = ({ onSubmit, isLoading }) => {
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<PlannerFormValues>({
    resolver: zodResolver(plannerSchema),
  })

  const [focusKey, setFocusKey]         = useState<string | null>(null)
  const [budget, setBudget]             = useState<string | null>(null)
  const [pace, setPace]                 = useState<string | null>(null)
  const [travelers, setTravelers]       = useState(2)
  const [photoUrl, setPhotoUrl]         = useState<string | null>(null)
  const [photoLoading, setPhotoLoading] = useState(false)
  const selectingRef = useRef(false)

  const destination = watch('destination') || ''
  const startDate   = watch('startDate')   || ''
  const endDate     = watch('endDate')     || ''
  const travelType  = watch('travelType')  || ''

  useEffect(() => {
    if (!destination || destination.length < 2) { setPhotoUrl(null); setPhotoLoading(false); return }
    setPhotoLoading(true)
    const timer = setTimeout(() => {
      const city = destination.split(',')[0].trim()
      fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(city)}`)
        .then(r => r.json())
        .then(data => {
          setPhotoUrl(data.originalimage?.source || data.thumbnail?.source || null)
          setPhotoLoading(false)
        })
        .catch(() => { setPhotoUrl(null); setPhotoLoading(false) })
    }, 400)
    return () => clearTimeout(timer)
  }, [destination])

  const dur = useMemo(() => {
    if (!startDate || !endDate) return null
    const d = Math.round((+new Date(endDate) - +new Date(startDate)) / 86400000)
    return d > 0 ? d : null
  }, [startDate, endDate])

  const estBudget = useMemo(() => {
    if (!dur || !budget) return null
    const perDay = budget === 'budget' ? 80 : budget === 'mid' ? 180 : 380
    return (perDay * dur * travelers).toLocaleString()
  }, [dur, budget, travelers])

  const filled    = [destination, startDate, endDate, travelType].filter(Boolean).length
  const progress  = Math.round((filled / 4) * 100)
  const matchedDest = DEST_DB.find(d => d.name.toLowerCase() === destination.toLowerCase())

  const matches = useMemo(() => {
    if (!destination) return []
    const v = destination.toLowerCase()
    return DEST_DB.filter(d =>
      d.name.toLowerCase().startsWith(v) || d.country.toLowerCase().startsWith(v)
    ).slice(0, 5)
  }, [destination])

  return (
    <div className="grid gap-6 items-start" style={{ gridTemplateColumns: 'minmax(0, 1.05fr) minmax(360px, 1fr)' }}>

      {/* ── LEFT ── */}
      <div className="flex flex-col gap-5 min-w-0">

        {/* Heading */}
        <div>
          <div className="inline-flex items-center gap-2.5 font-mono text-[11px] font-semibold tracking-[0.18em] uppercase text-sky-500 dark:text-sky-400 mb-3">
            <span className="w-[7px] h-[7px] rounded-full bg-sky-500 dark:bg-sky-400 animate-pulse"
              style={{ boxShadow: '0 0 0 4px rgba(56,189,248,0.18), 0 0 12px rgba(56,189,248,0.5)' }} />
            AI <span className="text-gray-300 dark:text-[#6e6c93] opacity-60">·</span> Planner <span className="text-gray-300 dark:text-[#6e6c93] opacity-60">·</span> v3.2
          </div>
          <h1 className="text-5xl font-semibold leading-[1] text-gray-900 dark:text-[#f0eeff] mb-3" style={{ letterSpacing: '-0.035em' }}>
            Plan your next{' '}
            <em className="font-serif italic font-normal"
              style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #0ea5e9 60%, #06b6d4 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              journey
            </em>
          </h1>
          <p className="text-base text-gray-500 dark:text-[#a3a1c8] leading-relaxed max-w-[520px]">
            Tell Routiq where you're going. Watch your trip take shape on the right while you fill it in.
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3.5">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-gray-200 dark:bg-white/[0.06]">
            <div className="h-full rounded-full transition-[width] duration-500 ease-out"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#3b82f6,#38bdf8,#22d3ee)', boxShadow: '0 0 14px rgba(56,189,248,0.45)' }} />
          </div>
          <span className="font-mono text-[12px] tracking-[0.06em] text-gray-400 dark:text-[#a3a1c8] whitespace-nowrap">
            <strong className="text-gray-800 dark:text-[#f0eeff] font-semibold">{filled}</strong>/4 fields complete
          </span>
        </div>

        {/* Form card */}
        <form onSubmit={handleSubmit(onSubmit)}
          className="bg-white dark:bg-[rgba(22,24,48,0.6)] dark:backdrop-blur-xl border border-gray-200 dark:border-white/[0.07] rounded-[20px] p-[26px] shadow-sm dark:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_10px_32px_-12px_rgba(0,0,0,0.6)]"
        >

          {/* 01 Destination */}
          <div className="mb-[22px]">
            <div className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-[#6e6c93] mb-2.5">
              <FieldNum n="01" /> Destination <span className="text-pink-500 dark:text-pink-400">*</span>
              {destination && <FieldOk label="SET" />}
            </div>
            <div className="relative">
              <MapPin className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focusKey === 'dest' ? 'text-sky-500 dark:text-sky-400' : 'text-gray-400 dark:text-[#6e6c93]'}`} />
              <input
                {...register('destination')}
                onFocus={() => setFocusKey('dest')}
                onBlur={() => { if (!selectingRef.current) setFocusKey(null); selectingRef.current = false }}
                placeholder="e.g. Tokyo, Lisbon, Reykjavík…"
                autoComplete="off" spellCheck={false}
                className="w-full bg-gray-50 dark:bg-[rgba(8,9,26,0.5)] border border-gray-200 dark:border-white/[0.07] rounded-[12px] py-3.5 pl-10 pr-4 text-[16px] font-medium text-gray-900 dark:text-[#f0eeff] placeholder:text-gray-400 dark:placeholder:text-[#6e6c93] placeholder:font-normal outline-none transition-all focus:border-sky-400 dark:focus:border-sky-400/40 focus:bg-white dark:focus:bg-[rgba(8,9,26,0.75)] focus:shadow-[0_0_0_3px_rgba(56,189,248,0.12)]"
              />
              {focusKey === 'dest' && matches.length > 0 && (
                <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white dark:bg-[#161830] border border-gray-200 dark:border-white/[0.14] rounded-[14px] p-1.5 z-20 shadow-xl dark:shadow-[0_24px_50px_rgba(0,0,0,0.5)]">
                  <div className="px-2.5 pt-2 pb-2 text-[10px] font-mono uppercase tracking-[0.12em] text-gray-400 dark:text-[#6e6c93] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                    {matches.length} match{matches.length !== 1 ? 'es' : ''}
                  </div>
                  {matches.map(m => (
                    <button key={m.name} type="button"
                      onMouseDown={() => { selectingRef.current = true }}
                      onClick={() => { setValue('destination', m.name, { shouldValidate: true }); setFocusKey(null) }}
                      className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-[10px] text-sm hover:bg-sky-50 dark:hover:bg-sky-400/[0.08] transition-colors"
                    >
                      <span className="text-xl">{m.flag}</span>
                      <span className="flex-1 text-left">
                        <span className="block font-semibold text-gray-900 dark:text-[#f0eeff]">{m.name}</span>
                        <span className="block text-[11px] font-mono text-gray-400 dark:text-[#6e6c93]">{m.country}</span>
                      </span>
                      <span className="text-[11px] font-mono text-gray-400 dark:text-[#6e6c93]">
                        <strong className="text-gray-600 dark:text-[#a3a1c8] font-medium">{m.code}</strong> · {m.temp} · {m.pop}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.destination && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.destination.message}</p>}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              <span className="font-mono text-[11px] text-gray-400 dark:text-[#6e6c93] self-center mr-1 tracking-[0.08em]">Try:</span>
              {DEST_DB.slice(0, 6).map(d => (
                <button key={d.name} type="button"
                  onClick={() => setValue('destination', d.name, { shouldValidate: true })}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gray-100 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.07] text-[12px] font-medium text-gray-600 dark:text-[#a3a1c8] hover:text-gray-900 dark:hover:text-[#f0eeff] hover:border-sky-300 dark:hover:border-sky-400/30 hover:bg-sky-50 dark:hover:bg-sky-400/[0.06] transition-all"
                >
                  <span className="text-[13px] leading-none">{d.flag}</span>{d.name}
                </button>
              ))}
            </div>
          </div>

          {/* 02 + 03 Dates */}
          <div className="mb-[22px]">
            <div className="grid grid-cols-2 gap-3">
              {[
                { num: '02', label: 'Start date', field: 'startDate' as const, val: startDate },
                { num: '03', label: 'End date',   field: 'endDate'   as const, val: endDate   },
              ].map(({ num, label, field, val }) => (
                <div key={field}>
                  <div className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-[#6e6c93] mb-2.5">
                    <FieldNum n={num} /> {label} {val && <FieldOk label="SET" />}
                  </div>
                  <div className="relative">
                    <Calendar className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none ${val ? 'text-sky-500 dark:text-sky-400' : 'text-gray-400 dark:text-[#6e6c93]'}`} />
                    <input type="date" {...register(field)}
                      className="w-full bg-gray-50 dark:bg-[rgba(8,9,26,0.5)] border border-gray-200 dark:border-white/[0.07] rounded-[12px] py-3 pl-10 pr-3 text-[14px] font-medium text-gray-900 dark:text-[#f0eeff] outline-none transition-all focus:border-sky-400 dark:focus:border-sky-400/40 focus:bg-white dark:focus:bg-[rgba(8,9,26,0.75)] appearance-none [color-scheme:light] dark:[color-scheme:dark]"
                    />
                  </div>
                  {errors[field] && <p className="mt-1 text-xs text-red-500">{errors[field]?.message}</p>}
                </div>
              ))}
            </div>
            {dur && (
              <div className="flex justify-center mt-2.5">
                <span className="font-mono text-[11px] text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-400/[0.08] border border-sky-200 dark:border-sky-400/20 px-2.5 py-1.5 rounded-full tracking-[0.05em]">
                  {dur} day trip
                </span>
              </div>
            )}
          </div>

          {/* 04 Experience type */}
          <div className="mb-[22px]">
            <div className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-[#6e6c93] mb-2.5">
              <FieldNum n="04" /> Experience type <span className="text-pink-500 dark:text-pink-400">*</span>
              {travelType && <FieldOk label={travelType} />}
            </div>
            <div className="grid grid-cols-4 gap-2.5">
              {TRAVEL_TYPES.map(t => {
                const isOn = travelType === t.value
                return (
                  <button key={t.value} type="button"
                    onClick={() => setValue('travelType', t.value, { shouldValidate: true })}
                    className="relative flex flex-col items-center gap-2 px-3 py-4 rounded-[14px] text-center cursor-pointer transition-all duration-200 overflow-hidden border"
                    style={{
                      background: isOn ? t.lightBg : 'rgba(0,0,0,0.02)',
                      borderColor: isOn ? t.colBr : 'rgba(0,0,0,0.08)',
                    }}
                  >
                    <div className="absolute inset-0 pointer-events-none dark:block hidden"
                      style={{ background: isOn ? t.colBg : 'rgba(8,9,26,0.4)', borderColor: isOn ? t.colBr : 'rgba(255,255,255,0.07)' }} />
                    {isOn && <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(135deg, ${t.colA}, transparent 60%)` }} />}
                    <div className="w-11 h-11 rounded-[12px] grid place-items-center border transition-all relative z-10"
                      style={isOn
                        ? { background: t.lightBg, borderColor: t.colBr, color: t.colFg }
                        : { background: 'rgba(0,0,0,0.04)', borderColor: 'rgba(0,0,0,0.08)', color: '#6b7280' }
                      }>
                      {TYPE_ICON[t.value]}
                    </div>
                    <span className="text-[13px] font-semibold text-gray-800 dark:text-[#f0eeff] relative z-10">{t.label}</span>
                    <span className="text-[9px] font-mono uppercase tracking-[0.1em] text-gray-400 dark:text-[#6e6c93] relative z-10">{t.tags}</span>
                    {isOn && (
                      <div className="absolute top-2 right-2 w-[18px] h-[18px] rounded-full grid place-items-center z-10"
                        style={{ background: 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)' }}>
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
            {errors.travelType && <p className="mt-1.5 text-xs text-red-500">{errors.travelType.message}</p>}
          </div>

          {/* 05 Budget */}
          <div className="mb-[22px]">
            <div className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-[#6e6c93] mb-2.5">
              <FieldNum n="05" /> Budget {budget && <FieldOk label={budget} />}
            </div>
            <div className="grid grid-cols-3 gap-2 bg-gray-100 dark:bg-[rgba(8,9,26,0.4)] border border-gray-200 dark:border-white/[0.07] rounded-[12px] p-1">
              {BUDGET_OPTS.map(o => (
                <button key={o.id} type="button" onClick={() => setBudget(o.id)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-[9px] text-[13px] font-medium transition-all ${budget !== o.id ? 'text-gray-500 dark:text-[#a3a1c8]' : ''}`}
                  style={budget === o.id
                    ? { background: 'linear-gradient(180deg,#3b82f6 0%,#2563eb 100%)', color: 'white', boxShadow: '0 4px 12px -4px rgba(37,99,235,0.5)' }
                    : {}
                  }
                >
                  {o.label}
                  <span className={`font-mono text-[10px] tracking-[0.06em] ${budget !== o.id ? 'text-gray-400 dark:text-[#6e6c93]' : ''}`}
                    style={{ color: budget === o.id ? 'rgba(255,255,255,0.7)' : undefined }}
                  >{o.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 06 Pace */}
          <div className="mb-[22px]">
            <div className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-[#6e6c93] mb-2.5">
              <FieldNum n="06" /> Pace {pace && <FieldOk label={pace} />}
            </div>
            <div className="grid grid-cols-3 gap-2 bg-gray-100 dark:bg-[rgba(8,9,26,0.4)] border border-gray-200 dark:border-white/[0.07] rounded-[12px] p-1">
              {PACE_OPTS.map(o => (
                <button key={o.id} type="button" onClick={() => setPace(o.id)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-[9px] text-[13px] font-medium transition-all ${pace !== o.id ? 'text-gray-500 dark:text-[#a3a1c8]' : ''}`}
                  style={pace === o.id
                    ? { background: 'linear-gradient(180deg,#3b82f6 0%,#2563eb 100%)', color: 'white', boxShadow: '0 4px 12px -4px rgba(37,99,235,0.5)' }
                    : {}
                  }
                >
                  {o.label}
                  <span className={`font-mono text-[10px] tracking-[0.06em] ${pace !== o.id ? 'text-gray-400 dark:text-[#6e6c93]' : ''}`}
                    style={{ color: pace === o.id ? 'rgba(255,255,255,0.7)' : undefined }}
                  >{o.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 07 Travelers */}
          <div className="mb-[26px]">
            <div className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-[#6e6c93] mb-2.5">
              <FieldNum n="07" /> Travelers
              <FieldOk label={`${travelers} ${travelers === 1 ? 'person' : 'people'}`} />
            </div>
            <div className="inline-flex items-center gap-2.5 bg-gray-100 dark:bg-[rgba(8,9,26,0.4)] border border-gray-200 dark:border-white/[0.07] rounded-[12px] p-2">
              <button type="button" onClick={() => setTravelers(Math.max(1, travelers - 1))}
                className="w-8 h-8 rounded-[9px] bg-white dark:bg-white/[0.04] border border-gray-300 dark:border-white/[0.07] text-gray-500 dark:text-[#a3a1c8] hover:text-gray-900 dark:hover:text-[#f0eeff] hover:border-gray-400 dark:hover:border-white/[0.14] grid place-items-center transition-all">
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-[18px] font-semibold text-gray-900 dark:text-[#f0eeff] w-8 text-center">{travelers}</span>
              <span className="font-mono text-[11px] text-gray-400 dark:text-[#6e6c93] tracking-[0.08em]">
                {travelers === 1 ? 'traveler' : 'travelers'}
              </span>
              <button type="button" onClick={() => setTravelers(travelers + 1)}
                className="w-8 h-8 rounded-[9px] bg-white dark:bg-white/[0.04] border border-gray-300 dark:border-white/[0.07] text-gray-500 dark:text-[#a3a1c8] hover:text-gray-900 dark:hover:text-[#f0eeff] hover:border-gray-400 dark:hover:border-white/[0.14] grid place-items-center transition-all">
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* CTA */}
          <div className="flex gap-3">
            <button type="submit" disabled={isLoading || filled < 4}
              className="flex-1 relative overflow-hidden flex items-center justify-center gap-2.5 py-4 rounded-[14px] text-[15px] font-medium text-white transition-transform hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              style={{ background: 'linear-gradient(180deg,#3b82f6 0%,#2563eb 100%)', boxShadow: '0 12px 30px -10px rgba(37,99,235,0.6),inset 0 1px 0 rgba(255,255,255,0.2)' }}
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {isLoading
                  ? 'Preparing your trip…'
                  : filled < 4
                  ? `Complete ${4 - filled} more field${4 - filled === 1 ? '' : 's'}`
                  : 'Generate itinerary'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button type="button"
              onClick={() => { reset(); setBudget(null); setPace(null); setTravelers(2) }}
              className="flex items-center gap-2 px-5 py-4 rounded-[14px] text-[13px] font-medium text-gray-500 dark:text-[#a3a1c8] bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.14] hover:text-gray-900 dark:hover:text-[#f0eeff] hover:border-gray-300 dark:hover:border-white/[0.25] transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3.5 mt-[22px] pt-[22px] border-t border-dashed border-gray-200 dark:border-white/[0.07]">
            {[
              { label: 'Duration',    val: dur ? `${dur}` : '—', unit: dur ? 'days' : '', pct: Math.min(100, (dur ?? 0) * 7) },
              { label: 'Est. budget', val: estBudget ? `€${estBudget}` : '—', unit: '', pct: estBudget ? Math.min(100, parseInt(estBudget.replace(/,/g, '')) / 50) : 0 },
            ].map(m => (
              <div key={m.label} className="flex flex-col gap-1.5">
                <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-[#6e6c93]">{m.label}</div>
                <div className={`text-[22px] font-medium leading-none tracking-[-0.02em] flex items-baseline gap-1.5 ${m.val !== '—' ? 'text-gray-900 dark:text-[#f0eeff]' : 'text-gray-300 dark:text-[#6e6c93]'}`}>
                  {m.val}
                  {m.unit && <span className="text-[12px] text-gray-400 dark:text-[#6e6c93] font-medium">{m.unit}</span>}
                </div>
                <div className="h-1 rounded-full bg-gray-200 dark:bg-white/[0.06] overflow-hidden">
                  <div className="h-full rounded-full transition-[width] duration-500"
                    style={{ width: `${m.pct}%`, background: 'linear-gradient(90deg,#38bdf8,#22d3ee)', boxShadow: '0 0 8px rgba(56,189,248,0.45)' }} />
                </div>
              </div>
            ))}
          </div>
        </form>
      </div>

      {/* ── RIGHT: live preview ── */}
      <div className="flex flex-col gap-3.5" style={{ position: 'sticky', top: '22px', alignSelf: 'start' }}>

        <div className="relative rounded-[22px] overflow-hidden border border-gray-200 dark:border-white/[0.07] shadow-md dark:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_10px_32px_-12px_rgba(0,0,0,0.6)]"
          style={{ aspectRatio: '4/5', maxHeight: 680 }}>

          {/* Loading spinner */}
          {photoLoading && !photoUrl && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-[#0a1226]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-sky-200 dark:border-sky-400/30 border-t-sky-500 dark:border-t-sky-400 animate-spin" />
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-gray-400 dark:text-[#6e6c93]">Loading photo…</span>
              </div>
            </div>
          )}

          {photoUrl ? (
            <>
              <img src={photoUrl} alt={destination}
                className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500"
                style={{ filter: 'saturate(0.9) brightness(0.78)' }}
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,rgba(8,9,26,0) 0%,rgba(8,9,26,0.2) 35%,rgba(8,9,26,0.92) 100%),linear-gradient(90deg,rgba(8,9,26,0.55) 0%,transparent 55%)' }} />
              <div className="absolute inset-0 flex flex-col justify-between p-[22px] gap-5">
                <div className="flex justify-between items-start">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(8,9,26,0.65)] border border-white/[0.12] backdrop-blur-sm font-mono text-[11px] font-semibold tracking-[0.1em] uppercase text-[#d8d4ff]">
                    <MapPin className="w-2.5 h-2.5 text-sky-400" />
                    {matchedDest?.country || destination.split(',').slice(-1)[0]?.trim() || 'Destination'}
                  </span>
                  {matchedDest && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[12px] bg-[rgba(8,9,26,0.65)] border border-white/[0.12] backdrop-blur-sm text-[13px] font-medium text-[#f0eeff]">
                      {matchedDest.temp}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  <div>
                    <h2 className="text-[42px] font-semibold leading-[0.95] text-white mb-2"
                      style={{ letterSpacing: '-0.035em', textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                      {destination}
                    </h2>
                    {(dur || travelType) && (
                      <p className="text-[13px] text-[#d8d4ff] leading-snug">
                        {dur ? `${dur}-day ` : ''}{travelType ? travelType.toLowerCase() : 'trip'}
                        {travelers > 1 ? ` · ${travelers} travelers` : ''}
                      </p>
                    )}
                  </div>
                  {matchedDest && (
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { lbl: 'Code', val: matchedDest.code },
                        { lbl: 'Temp', val: matchedDest.temp },
                        { lbl: 'Pop.',  val: matchedDest.pop  },
                      ].map(s => (
                        <div key={s.lbl} className="bg-[rgba(8,9,26,0.55)] border border-white/[0.10] backdrop-blur-sm rounded-[11px] px-3 py-2.5">
                          <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#6e6c93] mb-1.5">{s.lbl}</div>
                          <div className="text-[14px] font-semibold text-[#f0eeff]">{s.val}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : !photoLoading ? (
            /* Empty globe */
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-8 text-center bg-gradient-to-b from-slate-100 to-blue-50 dark:from-[#0a1226] dark:to-[#060914]"
              style={{ background: undefined }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-blue-50 dark:from-transparent dark:to-transparent" />
              <div className="absolute inset-0 dark:block hidden"
                style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 30%,rgba(56,189,248,0.15),transparent 70%),radial-gradient(ellipse 70% 50% at 50% 90%,rgba(37,99,235,0.20),transparent 70%),linear-gradient(180deg,#0a1226 0%,#060914 100%)' }} />
              <div className="relative w-[130px] h-[130px] rounded-full z-10"
                style={{
                  background: 'radial-gradient(circle at 30% 30%,rgba(56,189,248,0.5),transparent 60%),radial-gradient(circle at 70% 60%,rgba(168,85,247,0.35),transparent 60%),conic-gradient(from 0deg,#1e3a8a,#0c4a6e,#155e75,#1e40af,#1e3a8a)',
                  boxShadow: '0 0 60px rgba(56,189,248,0.25),inset -10px -10px 40px rgba(0,0,0,0.3)',
                  animation: 'spin 30s linear infinite',
                }}>
                <div className="absolute inset-[-6px] rounded-full border border-dashed border-sky-400/30"
                  style={{ animation: 'spin 18s linear infinite reverse' }} />
              </div>
              <div className="relative z-10">
                <h3 className="text-[22px] font-medium tracking-[-0.02em] text-gray-800 dark:text-[#f0eeff] mb-2">
                  Your trip{' '}
                  <em className="font-serif italic font-normal text-sky-500 dark:text-sky-400">preview</em>
                </h3>
                <p className="text-[13px] text-gray-500 dark:text-[#a3a1c8] leading-snug max-w-[280px]">
                  As you fill out the form, this card comes alive with the destination photo and details.
                </p>
              </div>
              <span className="relative z-10 inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-[#6e6c93]">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"
                  style={{ boxShadow: '0 0 10px rgba(56,189,248,0.5)' }} />
                Waiting for input
              </span>
            </div>
          ) : null}
        </div>

        {/* AI highlights */}
        {(matchedDest || photoUrl) && (
          <div className="bg-white dark:bg-[rgba(22,24,48,0.6)] dark:backdrop-blur-xl border border-gray-200 dark:border-white/[0.07] rounded-[18px] p-4 shadow-sm dark:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_10px_32px_-12px_rgba(0,0,0,0.6)]">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-6 h-6 rounded-[8px] bg-sky-50 dark:bg-sky-400/10 text-sky-500 dark:text-sky-400 grid place-items-center flex-shrink-0">
                <Sparkles className="w-3 h-3" />
              </div>
              <h4 className="text-[13px] font-semibold text-gray-800 dark:text-[#f0eeff] flex-1" style={{ letterSpacing: '-0.005em' }}>
                AI highlights in {destination.split(',')[0]}
              </h4>
              <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-400/10 border border-violet-200 dark:border-violet-400/25 px-1.5 py-0.5 rounded-[5px]">
                Suggested
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {[
                { flag: matchedDest?.flag ?? '📍', name: `${destination.split(',')[0]} city centre`,  sub: 'Explore the local streets' },
                { flag: '🗺️', name: 'Day trip to surroundings', sub: `Best of ${matchedDest?.country ?? 'the region'}` },
                { flag: '🍽️', name: 'Local food tour',          sub: 'Markets · street food' },
                { flag: '🌅', name: 'Scenic viewpoints',        sub: 'Sunrise & sunset spots' },
              ].map(h => (
                <div key={h.name}
                  className="flex items-center gap-2.5 p-2 rounded-[10px] bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.07] hover:bg-gray-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer">
                  <div className="w-7 h-7 rounded-[8px] bg-gray-100 dark:bg-white/[0.04] grid place-items-center text-[16px] flex-shrink-0">{h.flag}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-gray-700 dark:text-[#d8d4ff] truncate">{h.name}</div>
                    <div className="text-[11px] text-gray-400 dark:text-[#6e6c93]">{h.sub}</div>
                  </div>
                  <span className="font-mono text-[11px] text-gray-400 dark:text-[#6e6c93] px-2 py-1 rounded-[7px] bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.07] hover:text-sky-600 dark:hover:text-sky-400 hover:border-sky-300 dark:hover:border-sky-400/30 hover:bg-sky-50 dark:hover:bg-sky-400/[0.06] transition-all whitespace-nowrap">
                    + Add
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
