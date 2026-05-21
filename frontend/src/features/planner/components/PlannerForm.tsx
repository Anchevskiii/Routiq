import React, { useState, useMemo, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MapPin, Sparkles, ArrowRight, RotateCcw } from 'lucide-react'
import { plannerSchema, type PlannerFormValues } from '../schemas/plannerSchema'
import { TripPreview }    from './TripPreview'
import { TravelTypeGrid } from './TravelTypeGrid'
import { FieldLabel, FieldShell, DateField, MetaCell } from './PlannerFormFields'
import { DEST_DB } from '../planner.data'

interface Props {
  onSubmit: (values: PlannerFormValues) => void
  isLoading: boolean
}

export const PlannerForm: React.FC<Props> = ({ onSubmit, isLoading }) => {
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<PlannerFormValues>({
    resolver: zodResolver(plannerSchema),
  })

  const [focusKey, setFocusKey] = useState<string | null>(null)
  const selectingRef = useRef(false)

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
    return DEST_DB.filter(d => d.name.toLowerCase().startsWith(v) || d.country.toLowerCase().startsWith(v)).slice(0, 4)
  }, [destination])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-[22px] items-start">
      <section className="relative bg-white dark:bg-[#1e1b38] border border-line rounded-[22px] shadow-card overflow-hidden">
        <div className="h-1 bg-blue-100/60 dark:bg-blue-900/30">
          <div
            className="h-full bg-aurora shadow-[0_0_8px_var(--accent-glow)] transition-[width] duration-700 ease-[cubic-bezier(.2,.8,.2,1)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center gap-3 pt-[18px] px-[26px] pb-[6px]">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-[0.08em] text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shadow-[0_0_8px_currentColor] animate-pulse" />
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
              <MapPin className={['absolute left-[18px] top-1/2 -translate-y-1/2 w-[18px] h-[18px] transition-colors', focusKey === 'dest' ? 'text-blue-600' : 'text-ink-faint'].join(' ')} />
              <input
                {...register('destination')}
                onFocus={() => setFocusKey('dest')}
                onBlur={() => { if (!selectingRef.current) setFocusKey(null); selectingRef.current = false }}
                placeholder="e.g. Tokyo, Lisbon, Reykjavík…"
                autoComplete="off" spellCheck={false}
                className="w-full bg-transparent border-none outline-none text-ink text-[17px] font-medium py-[18px] pl-[50px] pr-5"
              />
              {focusKey === 'dest' && matches.length > 0 && (
                <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white dark:bg-[#1e1b38] border border-line rounded-[14px] p-1.5 shadow-pop z-20">
                  <div className="px-2.5 pt-2 pb-2.5 text-[10px] font-mono uppercase tracking-[0.12em] text-ink-faint flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shadow-[0_0_8px_currentColor] animate-pulse" />
                    Live · {matches.length} matches
                  </div>
                  {matches.map(m => (
                    <button key={m.name} type="button"
                      onMouseDown={() => { selectingRef.current = true }}
                      onClick={() => { setValue('destination', m.name, { shouldValidate: true }); setFocusKey(null) }}
                      className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-[10px] text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
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
            <DateField id="sd" num="02" label="Start Date" focused={focusKey === 'sd'} filled={!!startDate} onFocus={() => setFocusKey('sd')} onBlur={() => setFocusKey(null)} reg={register('startDate')} error={!!errors.startDate} />
            <DateField id="ed" num="03" label="End Date"   focused={focusKey === 'ed'} filled={!!endDate}   onFocus={() => setFocusKey('ed')} onBlur={() => setFocusKey(null)} reg={register('endDate')}   error={!!errors.endDate}   />
          </div>

          {/* 04 Experience */}
          <TravelTypeGrid experience={experience} setValue={setValue} error={errors.travelType} />

          {/* Submit */}
          <div className="mt-6 grid grid-cols-[1fr_auto] gap-3">
            <button type="submit" disabled={isLoading || progress < 100}
              className="relative overflow-hidden bg-aurora text-white rounded-[16px] px-6 py-[18px] font-semibold text-base flex items-center justify-center gap-3 shadow-[0_12px_32px_-8px_var(--accent-glow),inset_0_1px_0_rgba(255,255,255,0.4)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-10px_var(--accent-glow),inset_0_1px_0_rgba(255,255,255,0.4)] disabled:opacity-55 disabled:cursor-not-allowed disabled:transform-none group"
            >
              <Sparkles className="w-[18px] h-[18px]" />
              <span>{isLoading ? 'Preparing Your Trip…' : progress < 100 ? `Complete ${4 - filled} field${4 - filled === 1 ? '' : 's'}` : 'Generate Itinerary'}</span>
              <ArrowRight className="w-[18px] h-[18px] transition-transform group-hover:translate-x-1" />
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer pointer-events-none" />
            </button>
            <button type="button" onClick={() => reset()}
              className="bg-white/90 dark:bg-[#1e1b38]/90 border-[1.5px] border-line text-ink-dim rounded-[16px] px-[22px] py-[18px] font-mono text-xs uppercase tracking-wider flex items-center gap-2 transition-colors hover:text-ink hover:bg-white dark:hover:bg-[#1e1b38] hover:border-line-strong"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          </div>
        </form>

        <div className="grid grid-cols-3 border-t border-line bg-gradient-to-b from-transparent to-blue-50/40 dark:to-blue-900/10">
          <MetaCell k="Duration"      v={dur ?? '—'}                                     unit={dur ? 'nights' : ''}    aurora={dur != null} />
          <MetaCell k="Est. budget"   v={dur ? '€' + (dur * 220).toLocaleString() : '—'} unit={dur ? 'pp' : ''}       />
          <MetaCell k="AI confidence" v={progress === 100 ? '94%' : '—'}                 unit={progress === 100 ? 'match' : ''} aurora={progress === 100} last />
        </div>
      </section>

      <TripPreview destination={destination} startDate={startDate} endDate={endDate} experience={experience} matched={matched} dur={dur} />
    </div>
  )
}
