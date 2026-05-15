import React, { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MapPin, Sparkles, ArrowRight, RotateCcw } from 'lucide-react'
import { plannerSchema, type PlannerFormValues } from '../schemas/plannerSchema'
import { TripPreview } from './TripPreview'
import { FieldLabel, FieldShell, DateField, MetaCell } from './PlannerFormFields'

interface Props {
  onSubmit: (values: PlannerFormValues) => void
  isLoading: boolean
}

const DEST_DB = [
  { name: 'Tokyo',     country: 'Japan',    flag: '🗾', code: 'TYO', temp: '22°', pop: '13.9M' },
  { name: 'Lisbon',    country: 'Portugal', flag: '🏰', code: 'LIS', temp: '18°', pop: '2.9M'  },
  { name: 'Reykjavík', country: 'Iceland',  flag: '❄️', code: 'REK', temp: '6°',  pop: '0.13M' },
  { name: 'Marrakesh', country: 'Morocco',  flag: '🕌', code: 'RAK', temp: '26°', pop: '0.93M' },
  { name: 'Paris',     country: 'France',   flag: '🗼', code: 'PAR', temp: '14°', pop: '2.16M' },
  { name: 'Kyoto',     country: 'Japan',    flag: '⛩️', code: 'UKY', temp: '21°', pop: '1.46M' },
  { name: 'Barcelona', country: 'Spain',    flag: '🌊', code: 'BCN', temp: '23°', pop: '1.6M'  },
]

const TRAVEL_OPTIONS = [
  { value: 'CULTURAL'    as const, label: 'Cultural',    sub: 'MUSEUMS · HISTORY', glyph: 'M3 21h18M5 21V10l7-5 7 5v11M9 21v-7h6v7M5 10h14' },
  { value: 'GASTRONOMIC' as const, label: 'Gastronomic', sub: 'FOOD · WINE',        glyph: 'M7 3v9a3 3 0 0 0 6 0V3M10 3v18M17 3c-2 0-3 3-3 6s1 5 3 5v7' },
  { value: 'NATURE'      as const, label: 'Nature',      sub: 'PARKS · TRAILS',     glyph: 'M12 22V10M5 22c0-7 4-10 7-10s7 3 7 10M8 13c1-4 2-6 4-6s3 2 4 6' },
  { value: 'ADVENTURE'   as const, label: 'Adventure',   sub: 'THRILL · SPORT',     glyph: 'M3 19l4-8 4 4 4-7 4 6 2-3M3 19h18' },
]

export const PlannerForm: React.FC<Props> = ({ onSubmit, isLoading }) => {
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<PlannerFormValues>({
    resolver: zodResolver(plannerSchema),
  })

  const [focusKey, setFocusKey] = useState<string | null>(null)

  const destination = watch('destination') || ''
  const startDate   = watch('startDate')   || ''
  const endDate     = watch('endDate')     || ''
  const experience  = watch('travelType')  || ''

  const matched = DEST_DB.find(d => d.name.toLowerCase() === destination.toLowerCase())
  const dur = useMemo(() => {
    if (!startDate || !endDate) return null
    const d = Math.round((+new Date(endDate) - +new Date(startDate)) / 86400000)
    return d > 0 ? d : null
  }, [startDate, endDate])

  const filled   = [destination, startDate, endDate, experience].filter(Boolean).length
  const progress = Math.round((filled / 4) * 100)

  const matches = useMemo(() => {
    if (!destination) return []
    const v = destination.toLowerCase()
    return DEST_DB.filter(d =>
      d.name.toLowerCase().startsWith(v) || d.country.toLowerCase().startsWith(v)
    ).slice(0, 4)
  }, [destination])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-[22px] items-start">
      <section className="relative bg-white dark:bg-[#1e1b38] border border-line rounded-[22px] shadow-card overflow-hidden">
        {/* progress strip — width is dynamic, inline is required */}
        <div className="relative h-1 bg-indigo-100/60 dark:bg-indigo-900/30 overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-aurora shadow-[0_0_8px_var(--accent-glow)] transition-[width] duration-700 ease-[cubic-bezier(.2,.8,.2,1)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center gap-3 pt-[18px] px-[26px] pb-[6px]">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-[0.08em] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shadow-[0_0_8px_currentColor] animate-pulse" />
            Trip parameters
          </span>
          <span className="ml-auto text-xs font-mono text-ink-faint">{filled}/4 fields complete</span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-[26px] pt-4 pb-[22px]">
          <h3 className="text-[22px] font-semibold tracking-tight mb-[22px] text-ink">
            Where are you <em className="font-serif italic font-normal text-aurora">heading?</em>
          </h3>

          {/* 01 Destination */}
          <div className="mb-5 relative">
            <FieldLabel num="01" text="Destination" required />
            <FieldShell focused={focusKey === 'dest'} filled={!!destination} error={!!errors.destination}>
              <MapPin
                className={[
                  'absolute left-[18px] top-1/2 -translate-y-1/2 w-[18px] h-[18px] transition-colors',
                  focusKey === 'dest' ? 'text-indigo-500' : 'text-ink-faint',
                ].join(' ')}
              />
              <input
                {...register('destination')}
                onFocus={() => setFocusKey('dest')}
                onBlur={() => setTimeout(() => setFocusKey(null), 120)}
                placeholder="e.g. Tokyo, Lisbon, Reykjavík…"
                autoComplete="off"
                spellCheck={false}
                className="w-full bg-transparent border-none outline-none text-ink text-[17px] font-medium py-[18px] pl-[50px] pr-5"
              />
              {focusKey === 'dest' && matches.length > 0 && (
                <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white dark:bg-[#1e1b38] border border-line rounded-[14px] p-1.5 shadow-pop z-20">
                  <div className="px-2.5 pt-2 pb-2.5 text-[10px] font-mono uppercase tracking-[0.12em] text-ink-faint flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shadow-[0_0_8px_currentColor] animate-pulse" />
                    Live · {matches.length} matches
                  </div>
                  {matches.map(m => (
                    <button
                      key={m.name}
                      type="button"
                      onMouseDown={e => { e.preventDefault(); setValue('destination', m.name, { shouldValidate: true }) }}
                      className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-[10px] text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                    >
                      <span className="text-xl">{m.flag}</span>
                      <span className="text-left">
                        <span className="block font-semibold text-ink">{m.name}</span>
                        <span className="block text-[11px] font-mono text-ink-faint">{m.country}</span>
                      </span>
                      <span className="ml-auto text-[11px] font-mono text-ink-faint">
                        <b className="text-ink-dim font-medium">{m.code}</b> · {m.temp} · {m.pop}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </FieldShell>
            {errors.destination && <p className="mt-1.5 text-sm text-red-500 font-medium">{errors.destination.message}</p>}
          </div>

          {/* 02 + 03 Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <DateField
              id="sd" num="02" label="Start Date"
              focused={focusKey === 'sd'} filled={!!startDate}
              onFocus={() => setFocusKey('sd')} onBlur={() => setFocusKey(null)}
              reg={register('startDate')} error={!!errors.startDate}
            />
            <DateField
              id="ed" num="03" label="End Date"
              focused={focusKey === 'ed'} filled={!!endDate}
              onFocus={() => setFocusKey('ed')} onBlur={() => setFocusKey(null)}
              reg={register('endDate')} error={!!errors.endDate}
            />
          </div>

          {/* 04 Experience */}
          <div className="mt-[22px]">
            <FieldLabel num="04" text="Experience Type" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {TRAVEL_OPTIONS.map(opt => {
                const selected = experience === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setValue('travelType', opt.value, { shouldValidate: true })}
                    className={[
                      'relative overflow-hidden text-center rounded-[16px] border-[1.5px] bg-white dark:bg-[#1e1b38] px-3.5 pt-[18px] pb-3.5',
                      'flex flex-col items-center gap-2.5 transition-all',
                      selected
                        ? 'border-transparent shadow-[0_0_0_1.5px_theme(colors.indigo.500),0_14px_28px_-16px_var(--accent-glow)]'
                        : 'border-line hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/20 hover:shadow-[0_10px_22px_-16px_var(--accent-glow)]',
                    ].join(' ')}
                  >
                    <span className={[
                      'grid place-items-center w-[38px] h-[38px] rounded-[11px] transition-all',
                      selected
                        ? 'bg-aurora text-white shadow-[0_6px_16px_-4px_var(--accent-glow)] animate-glyph-float'
                        : 'bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/40 dark:to-violet-900/40 text-ink-dim',
                    ].join(' ')}>
                      <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <path d={opt.glyph} />
                      </svg>
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-ink">{opt.label}</span>
                      <span className="block text-[10px] font-mono uppercase tracking-wider text-ink-faint mt-0.5">{opt.sub}</span>
                    </span>
                    {selected && (
                      <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-aurora ring-2 ring-white shadow-[0_4px_8px_-2px_var(--accent-glow)]" />
                    )}
                  </button>
                )
              })}
            </div>
            {errors.travelType && <p className="mt-2 text-sm text-red-500 font-medium">{errors.travelType.message}</p>}
          </div>

          {/* Submit */}
          <div className="mt-6 grid grid-cols-[1fr_auto] gap-3">
            <button
              type="submit"
              disabled={isLoading || progress < 100}
              className="relative overflow-hidden bg-aurora text-white rounded-[16px] px-6 py-[18px] font-semibold text-base flex items-center justify-center gap-3 shadow-[0_12px_32px_-8px_var(--accent-glow),inset_0_1px_0_rgba(255,255,255,0.4)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-10px_var(--accent-glow),inset_0_1px_0_rgba(255,255,255,0.4)] disabled:opacity-55 disabled:cursor-not-allowed disabled:transform-none group"
            >
              <Sparkles className="w-[18px] h-[18px]" />
              <span>
                {isLoading
                  ? 'Preparing Your Trip…'
                  : progress < 100
                    ? `Complete ${4 - filled} field${4 - filled === 1 ? '' : 's'}`
                    : 'Generate Itinerary'}
              </span>
              <ArrowRight className="w-[18px] h-[18px] transition-transform group-hover:translate-x-1" />
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer pointer-events-none" />
            </button>
            <button
              type="button"
              onClick={() => reset()}
              className="bg-white/90 dark:bg-[#1e1b38]/90 border-[1.5px] border-line text-ink-dim rounded-[16px] px-[22px] py-[18px] font-mono text-xs uppercase tracking-wider flex items-center gap-2 transition-colors hover:text-ink hover:bg-white dark:hover:bg-[#1e1b38] hover:border-line-strong"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          </div>
        </form>

        <div className="grid grid-cols-3 border-t border-line bg-gradient-to-b from-transparent to-indigo-50/40 dark:to-indigo-900/10">
          <MetaCell k="Duration"      v={dur ?? '—'}                                     unit={dur ? 'nights' : ''}    aurora={dur != null} />
          <MetaCell k="Est. budget"   v={dur ? '€' + (dur * 220).toLocaleString() : '—'} unit={dur ? 'pp' : ''}       />
          <MetaCell k="AI confidence" v={progress === 100 ? '94%' : '—'}                 unit={progress === 100 ? 'match' : ''} aurora={progress === 100} last />
        </div>
      </section>

      <TripPreview
        destination={destination}
        startDate={startDate}
        endDate={endDate}
        experience={experience}
        matched={matched}
        dur={dur}
      />
    </div>
  )
}
