import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MapPin, Sparkles, ArrowRight, RotateCcw, Minus, Plus as PlusIcon, Calendar } from 'lucide-react'
import { addMonths, subMonths, startOfMonth, getDaysInMonth, getDay, isSameDay, isToday, isBefore, parseISO, format, startOfToday, differenceInCalendarDays } from 'date-fns'
import { cn } from '@/utils/cn'
import { plannerSchema, type PlannerFormValues } from '../schemas/plannerSchema'
import { DEST_DB } from '../planner.data'
import { useGoogleMaps } from '@/components/providers/GoogleMapsProvider'

interface Props {
  onSubmit: (values: PlannerFormValues) => void
  isLoading: boolean
}

const BUDGET_OPTS = [
  { id: 'Budget',    label: '€',   sub: '' },
  { id: 'Mid-range', label: '€€',  sub: '' },
  { id: 'Luxury',    label: '€€€', sub: '' },
]

const PACE_OPTS = [
  { id: 'Chill',    label: 'Chill',    sub: '2–3 stops/day' },
  { id: 'Balanced', label: 'Balanced', sub: '4–5 stops/day' },
  { id: 'Packed',   label: 'Packed',   sub: '6+ stops/day'  },
]

const EXP_TYPES = [
  {
    value: 'CULTURAL' as const, name: 'Cultural', tags: 'Museums · History',
    glyph: 'M3 21h18M5 21V10l7-5 7 5v11M9 21v-7h6v7M5 10h14',
    selBg: 'bg-violet-50 dark:bg-violet-500/[0.12]',
    selBorder: 'border-violet-400/80 dark:border-violet-500/40',
    selIcon: 'bg-violet-100 dark:bg-violet-500/[0.18] border-violet-300 dark:border-violet-500/40 text-violet-600 dark:text-violet-400',
    selGlow: 'shadow-[0_8px_24px_-10px_rgba(168,85,247,0.4)]',
    gradient: 'rgba(168,85,247,0.18)',
  },
  {
    value: 'GASTRONOMIC' as const, name: 'Gastronomic', tags: 'Food · Wine',
    glyph: 'M7 3v9a3 3 0 0 0 6 0V3M10 3v18M17 3c-2 0-3 3-3 6s1 5 3 5v7',
    selBg: 'bg-orange-50 dark:bg-orange-500/[0.12]',
    selBorder: 'border-orange-400/80 dark:border-orange-500/40',
    selIcon: 'bg-orange-100 dark:bg-orange-500/[0.18] border-orange-300 dark:border-orange-500/40 text-orange-600 dark:text-orange-400',
    selGlow: 'shadow-[0_8px_24px_-10px_rgba(249,115,22,0.4)]',
    gradient: 'rgba(249,115,22,0.18)',
  },
  {
    value: 'NATURE' as const, name: 'Nature', tags: 'Parks · Trails',
    glyph: 'M12 3 4 13h4l-3 5h14l-3-5h4zM12 18v3',
    selBg: 'bg-emerald-50 dark:bg-emerald-500/[0.12]',
    selBorder: 'border-emerald-400/80 dark:border-emerald-500/40',
    selIcon: 'bg-emerald-100 dark:bg-emerald-500/[0.18] border-emerald-300 dark:border-emerald-500/40 text-emerald-600 dark:text-emerald-400',
    selGlow: 'shadow-[0_8px_24px_-10px_rgba(16,185,129,0.4)]',
    gradient: 'rgba(16,185,129,0.18)',
  },
  {
    value: 'ADVENTURE' as const, name: 'Adventure', tags: 'Thrill · Sport',
    glyph: 'M3 19l4-8 4 4 4-7 4 6 2-3M3 19h18',
    selBg: 'bg-rose-50 dark:bg-rose-500/[0.12]',
    selBorder: 'border-rose-400/80 dark:border-rose-500/40',
    selIcon: 'bg-rose-100 dark:bg-rose-500/[0.18] border-rose-300 dark:border-rose-500/40 text-rose-600 dark:text-rose-400',
    selGlow: 'shadow-[0_8px_24px_-10px_rgba(244,63,94,0.4)]',
    gradient: 'rgba(244,63,94,0.18)',
  },
]

interface WikiData { photo: string | null; extract: string | null }

function useWikiData(destination: string): WikiData {
  const [data, setData] = useState<WikiData>({ photo: null, extract: null })
  const timer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (!destination || destination.length < 2) {
      setData({ photo: null, extract: null })
      return
    }
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      try {
        const city = destination.split(',')[0].trim()
        const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(city)}`)
        if (!res.ok) { setData({ photo: null, extract: null }); return }
        const json = await res.json()
        setData({
          photo: json.originalimage?.source || json.thumbnail?.source || null,
          extract: json.description || (json.extract ? json.extract.split('.')[0] + '.' : null),
        })
      } catch {
        setData({ photo: null, extract: null })
      }
    }, 400)
    return () => clearTimeout(timer.current)
  }, [destination])

  return data
}

// OkBadge replaced by green border + label color on field

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

function CalendarPopup({ value, minDate, rangeOther, onChange, onClose }: Readonly<{
  value: string
  minDate?: string
  rangeOther?: string  // the other anchor date for range highlight
  onChange: (val: string) => void
  onClose: () => void
}>) {
  const today      = startOfToday()
  const initDate   = value ? parseISO(value) : today
  const [viewDate, setViewDate] = React.useState(startOfMonth(initDate))
  const [hoverDate, setHoverDate] = React.useState<Date | null>(null)

  const selected       = value ? parseISO(value) : null
  const min            = minDate ? parseISO(minDate) : null
  const rangeAnchor    = rangeOther ? parseISO(rangeOther) : null

  const firstDow = (getDay(viewDate) + 6) % 7
  const numDays  = getDaysInMonth(viewDate)
  const cells: (number | null)[] = [
    ...new Array(firstDow).fill(null),
    ...Array.from({ length: numDays }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-cal]')) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div data-cal className="absolute top-[calc(100%+8px)] left-0 z-50 w-[272px] rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#13111f] shadow-xl dark:shadow-[0_24px_64px_-12px_rgba(0,0,0,0.7)] overflow-hidden">

      {/* Month nav */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/[0.06]">
        <button type="button" onClick={() => setViewDate(d => subMonths(d, 1))}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-[#f0eeff] hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
        >
          <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <span className="text-[14px] font-semibold text-gray-900 dark:text-[#f0eeff] tracking-tight">
          {format(viewDate, 'MMMM yyyy')}
        </span>
        <button type="button" onClick={() => setViewDate(d => addMonths(d, 1))}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 dark:text-white/40 hover:text-gray-700 dark:hover:text-[#f0eeff] hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
        >
          <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>

      <div className="px-3 pt-2 pb-3">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map(d => (
            <div key={d} className="text-center text-[10px] font-mono font-semibold uppercase tracking-wider text-gray-400 dark:text-[#4e4c6a] py-1.5">
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div role="grid" tabIndex={-1} className="grid grid-cols-7" onMouseLeave={() => setHoverDate(null)}>
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} />
            const date       = new Date(viewDate.getFullYear(), viewDate.getMonth(), day)
            const iso        = format(date, 'yyyy-MM-dd')
            const isSel      = !!selected && isSameDay(date, selected)
            const isTodayDay = isToday(date)
            const isDisabled = !!min && isBefore(date, min)

            // Range highlight: from rangeOther anchor to hoverDate
            // rangeOther takes priority (e.g. startDate when picking endDate)
            const anchor = rangeAnchor ?? selected
            const hover  = hoverDate
            const isInRange = !isDisabled && anchor && hover
              ? (() => {
                  const lo = isBefore(anchor, hover) ? anchor : hover
                  const hi = isBefore(anchor, hover) ? hover : anchor
                  return !isBefore(date, lo) && !isBefore(hi, date) && !isSameDay(date, lo) && !isSameDay(date, hi)
                })()
              : false
            const isRangeEdge = !isDisabled && anchor && hover && isSameDay(date, hover) && !isSameDay(date, anchor)
            const isRangeAnchorEdge = !isDisabled && rangeAnchor && hover && isSameDay(date, rangeAnchor) && !isSameDay(date, hover)

            return (
              <button key={iso} type="button" disabled={isDisabled}
                onClick={() => onChange(iso)}
                onMouseEnter={() => !isDisabled && setHoverDate(date)}
                className={cn(
                  'relative h-8 w-full rounded-lg text-[13px] font-medium transition-all',
                  isDisabled   && 'text-gray-300 dark:text-[#2e2c45] cursor-not-allowed',
                  isSel        && 'bg-blue-600 text-white font-semibold shadow-[0_2px_8px_rgba(37,99,235,0.45)] dark:shadow-[0_2px_12px_rgba(37,99,235,0.55)] z-10',
                  (isRangeEdge || isRangeAnchorEdge) && !isSel && 'bg-blue-400/80 dark:bg-blue-500/70 text-white font-semibold rounded-lg',
                  isInRange    && 'bg-blue-50 dark:bg-blue-500/[0.12] text-blue-700 dark:text-blue-300 rounded-none',
                  isTodayDay  && !isSel && !isInRange && 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20',
                  !isDisabled && !isSel && !isTodayDay && !isInRange && !isRangeEdge && 'text-gray-700 dark:text-[#c8c6e8] hover:bg-gray-100 dark:hover:bg-white/[0.06]',
                )}
              >
                {day}
                {isTodayDay && !isSel && !isInRange && (
                  <span className="absolute bottom-[3px] left-1/2 -translate-x-1/2 w-[3px] h-[3px] rounded-full bg-blue-500 dark:bg-blue-400" />
                )}
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-white/[0.06]">
          <button type="button" onClick={() => onChange(format(today, 'yyyy-MM-dd'))}
            className="w-full text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors tracking-wide"
          >
            Today
          </button>
        </div>
      </div>
    </div>
  )
}

function FieldLabel({ text, req }: Readonly<{ text: string; req?: boolean }>) {
  return (
    <div className="flex items-center gap-2 mb-2.5 text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-white/50">
      {text}
      {req && <span className="text-pink-500">*</span>}
    </div>
  )
}

interface AutocompleteInstance {
  addListener(eventName: string, handler: () => void): google.maps.MapsEventListener
  getPlace(): google.maps.places.PlaceResult
}

export const PlannerForm: React.FC<Props> = ({ onSubmit, isLoading }) => {
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<PlannerFormValues>({
    resolver: zodResolver(plannerSchema),
  })

  const { isLoaded } = useGoogleMaps()
  const autocompleteInputRef = useRef<HTMLInputElement | null>(null)
  const autocompleteInstanceRef = useRef<AutocompleteInstance | null>(null)

  useEffect(() => {
    if (!isLoaded || !autocompleteInputRef.current || autocompleteInstanceRef.current) return

    const placesLib = google.maps.places as unknown as Record<
      string,
      new (
        input: HTMLInputElement,
        options?: {
          types?: string[];
          fields?: string[];
        }
      ) => AutocompleteInstance
    >;
    const AutocompleteConstructor = placesLib['Autocomplete'];

    const instance = new AutocompleteConstructor(
      autocompleteInputRef.current,
      {
        types: ['(cities)'],
        fields: ['name', 'formatted_address', 'place_id', 'geometry'],
      }
    )

    autocompleteInstanceRef.current = instance

    instance.addListener('place_changed', () => {
      const place = instance.getPlace()
      if (place) {
        const formattedAddress = place.formatted_address || place.name || ''
        setValue('destination', formattedAddress, { shouldValidate: true })

        if (place.geometry?.location) {
          setValue('latitude', place.geometry.location.lat())
          setValue('longitude', place.geometry.location.lng())
        }
        if (place.place_id) {
          setValue('placeId', place.place_id)
        }
      }
    })
  }, [isLoaded, setValue])

  const { ref: destinationRef, ...destinationRest } = register('destination')

  const [budget,    setBudget]    = useState('Mid-range')
  const [pace,      setPace]      = useState('Balanced')
  const [travelers, setTravelers] = useState(2)
  const [openCal,   setOpenCal]   = useState<'start' | 'end' | null>(null)

  const destination = watch('destination') || ''
  const startDate   = watch('startDate')   || ''
  const endDate     = watch('endDate')     || ''
  const travelType  = watch('travelType')  || ''
  useWikiData(destination) // kept for potential future use

  const dur = useMemo(() => {
    if (!startDate || !endDate) return null
    const d = differenceInCalendarDays(parseISO(endDate), parseISO(startDate))
    return d > 0 ? d : null
  }, [startDate, endDate])

  const fields = { destination: !!destination, startDate: !!startDate, endDate: !!endDate, travelType: !!travelType }
  const reqFilled  = Object.values(fields).filter(Boolean).length
  const allFilled  = reqFilled === 4
  // count all 7 fields (budget/pace/travelers always count once defaults are set)
  const totalFilled = reqFilled + 3
  const pct         = Math.round((totalFilled / 7) * 100)

  const SUGGESTIONS = DEST_DB.slice(0, 6)

  // estBudget kept for metrics section if re-enabled
  useMemo(() => {
    if (!dur) return null
    let perDay = 380
    if (budget === 'Budget') {
      perDay = 80
    } else if (budget === 'Mid-range') {
      perDay = 180
    }
    return Math.round(perDay * dur * travelers)
  }, [dur, budget, travelers])

  let ctaText = 'Generate itinerary'
  if (isLoading) {
    ctaText = 'Preparing Your Trip…'
  } else if (!allFilled) {
    const missing = 4 - reqFilled
    ctaText = `Complete ${missing} field${missing === 1 ? '' : 's'}`
  }

  return (
    <div className="max-w-[680px] mx-auto flex flex-col gap-5">

        {/* Heading */}
        <div>
          <h1 className="text-[48px] font-semibold leading-[0.95] text-gray-900 dark:text-[#f0eeff] mb-3" style={{ letterSpacing: '-0.035em' }}>
            Plan your next{' '}
            <em className="font-serif italic font-normal not-italic" style={{
              background: 'linear-gradient(135deg, #93c5fd 0%, #38bdf8 60%, #67e8f9 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              journey
            </em>
          </h1>
          <p className="text-[15px] text-gray-500 dark:text-[#a3a1c8] leading-relaxed max-w-[520px]">
            Tell Routiq where you're going and watch your trip come together.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white dark:bg-[rgba(22,24,48,0.6)] dark:backdrop-blur-xl border border-gray-200 dark:border-white/[0.07] rounded-[20px] p-[26px] shadow-sm dark:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_10px_32px_-12px_rgba(0,0,0,0.6)]">
          <form onSubmit={handleSubmit(onSubmit)}>
            <input type="hidden" {...register('startDate')} />
            <input type="hidden" {...register('endDate')} />
            <input type="hidden" {...register('travelType')} />
            <input type="hidden" {...register('latitude')} />
            <input type="hidden" {...register('longitude')} />
            <input type="hidden" {...register('placeId')} />

            {/* 01 Destination */}
            <div className="mb-[22px]">
              <FieldLabel text="Destination" req />
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/40 pointer-events-none" />
                <input
                  type="text"
                  placeholder="e.g. Tokyo, Lisbon, Reykjavík…"
                  autoComplete="off" spellCheck={false}
                  {...destinationRest}
                  ref={(e) => {
                    destinationRef(e)
                    autocompleteInputRef.current = e
                  }}
                  className={cn(
                    "w-full bg-gray-50 dark:bg-[rgba(8,9,26,0.5)] rounded-[12px] py-3.5 pl-10 pr-4 text-[15px] font-medium text-gray-900 dark:text-[#f0eeff] placeholder:text-gray-400 dark:placeholder:text-[#6e6c93] outline-none transition-all",
                    fields.destination
                      ? "border border-emerald-400/70 dark:border-emerald-400/40 ring-4 ring-emerald-400/10"
                      : "border border-gray-200 dark:border-white/[0.07] focus:border-sky-400/70 dark:focus:border-sky-400/40 focus:ring-4 focus:ring-sky-400/10 dark:focus:bg-[rgba(8,9,26,0.75)]"
                  )}
                />
              </div>
              {errors.destination && <p className="mt-1.5 text-sm text-red-500">{errors.destination.message}</p>}
              <div className="flex items-center flex-wrap gap-1.5 mt-2.5">
                <span className="text-[11px] font-mono text-gray-400 dark:text-white/40 mr-1">Try:</span>
                {SUGGESTIONS.map(s => (
                  <button key={s.name} type="button"
                    onClick={() => setValue('destination', s.name, { shouldValidate: true })}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.07] text-[12px] font-medium text-gray-600 dark:text-[#a3a1c8] hover:text-sky-600 dark:hover:text-[#f0eeff] hover:border-sky-300 dark:hover:border-sky-400/30 hover:bg-sky-50 dark:hover:bg-sky-400/[0.06] transition-all"
                  >
                    <span>{s.flag}</span>{s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 02 + 03 Dates */}
            <div className="mb-[22px]">
              <div className="grid grid-cols-2 gap-3">
                {/* Start */}
                <div>
                  <FieldLabel text="Start date" />
                  <div className="relative">
                    <button type="button" className={cn("w-full text-left relative flex items-center gap-2.5 bg-gray-50 dark:bg-[rgba(8,9,26,0.5)] rounded-[12px] px-3.5 py-3 transition-all cursor-pointer", fields.startDate ? "border border-emerald-400/70 dark:border-emerald-400/40 ring-2 ring-emerald-400/10" : "border border-gray-200 dark:border-white/[0.07] hover:border-sky-300 dark:hover:border-sky-400/40")} onClick={() => setOpenCal(openCal === 'start' ? null : 'start')}>
                      <div className="w-8 h-8 rounded-[9px] bg-sky-50 dark:bg-sky-400/10 text-sky-500 dark:text-sky-400 grid place-items-center flex-shrink-0">
                        <Calendar className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[9px] font-mono font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-white/40 mb-1">Departure</div>
                        <div className={`text-[13px] font-medium ${startDate ? 'text-gray-900 dark:text-[#f0eeff]' : 'text-gray-400 dark:text-white/40'}`}>
                          {startDate ? format(parseISO(startDate), 'd MMM yyyy') : 'Pick a date'}
                        </div>
                      </div>
                    </button>
                    {openCal === 'start' && (
                      <CalendarPopup
                        value={startDate}
                        minDate={undefined}
                        rangeOther={endDate || undefined}
                        onChange={val => { setValue('startDate', val, { shouldValidate: true }); setOpenCal(null) }}
                        onClose={() => setOpenCal(null)}
                      />
                    )}
                  </div>
                  {errors.startDate && <p className="mt-1 text-xs text-red-500">{errors.startDate.message}</p>}
                </div>
                {/* End */}
                <div>
                  <FieldLabel text="End date" />
                  <div className="relative">
                    <button type="button" className={cn("w-full text-left relative flex items-center gap-2.5 bg-gray-50 dark:bg-[rgba(8,9,26,0.5)] rounded-[12px] px-3.5 py-3 transition-all cursor-pointer", fields.endDate ? "border border-emerald-400/70 dark:border-emerald-400/40 ring-2 ring-emerald-400/10" : "border border-gray-200 dark:border-white/[0.07] hover:border-sky-300 dark:hover:border-sky-400/40")} onClick={() => setOpenCal(openCal === 'end' ? null : 'end')}>
                      <div className="w-8 h-8 rounded-[9px] bg-sky-50 dark:bg-sky-400/10 text-sky-500 dark:text-sky-400 grid place-items-center flex-shrink-0">
                        <Calendar className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[9px] font-mono font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-white/40 mb-1">Return</div>
                        <div className={`text-[13px] font-medium ${endDate ? 'text-gray-900 dark:text-[#f0eeff]' : 'text-gray-400 dark:text-white/40'}`}>
                          {endDate ? format(parseISO(endDate), 'd MMM yyyy') : 'Pick a date'}
                        </div>
                      </div>
                    </button>
                    {openCal === 'end' && (
                      <CalendarPopup
                        value={endDate}
                        minDate={startDate || undefined}
                        rangeOther={startDate || undefined}
                        onChange={val => { setValue('endDate', val, { shouldValidate: true }); setOpenCal(null) }}
                        onClose={() => setOpenCal(null)}
                      />
                    )}
                  </div>
                  {errors.endDate && <p className="mt-1 text-xs text-red-500">{errors.endDate.message}</p>}
                </div>
              </div>
              {dur && (
                <div className="flex justify-center mt-2">
                  <span className="text-[11px] font-mono font-medium text-sky-500 dark:text-sky-400 bg-sky-50 dark:bg-sky-400/[0.08] border border-sky-200 dark:border-sky-400/20 px-2.5 py-1.5 rounded-full" style={{ letterSpacing: '0.05em' }}>
                    {dur} day trip
                  </span>
                </div>
              )}
            </div>

            {/* 04 Experience type */}
            <div className="mb-[22px]">
              <FieldLabel text="Experience type" req />
              <div className="grid grid-cols-4 gap-2.5">
                {EXP_TYPES.map(opt => {
                  const selected = travelType === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setValue('travelType', opt.value, { shouldValidate: true })}
                      className={[
                        'relative overflow-hidden text-center rounded-[14px] border-[1.5px] px-3 pt-4 pb-3.5 flex flex-col items-center gap-2 transition-all',
                        selected
                          ? `${opt.selBg} ${opt.selBorder} ${opt.selGlow} -translate-y-[2px]`
                          : 'bg-gray-50 dark:bg-[rgba(8,9,26,0.4)] border-gray-200 dark:border-white/[0.07] hover:border-gray-300 dark:hover:border-white/[0.14] hover:-translate-y-0.5 hover:bg-white dark:hover:bg-[rgba(8,9,26,0.7)]',
                      ].join(' ')}
                    >
                      {selected && (
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{ background: `linear-gradient(135deg, ${opt.gradient}, transparent 60%)`, opacity: 1 }}
                        />
                      )}
                      <div className={[
                        'w-11 h-11 rounded-[12px] grid place-items-center border transition-all relative z-10',
                        selected
                          ? opt.selIcon
                          : 'bg-white dark:bg-white/[0.04] border-gray-200 dark:border-white/[0.07] text-gray-500 dark:text-[#a3a1c8]',
                      ].join(' ')}>
                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                          <path d={opt.glyph} />
                        </svg>
                      </div>
                      <div className="relative z-10">
                        <div className="text-[13px] font-semibold text-gray-800 dark:text-[#f0eeff]">{opt.name}</div>
                        <div className="text-[9px] font-mono uppercase tracking-[0.1em] text-gray-400 dark:text-white/40 mt-0.5">{opt.tags}</div>
                      </div>
                      {selected && (
                        <div className="absolute top-2 right-2 w-[18px] h-[18px] rounded-full bg-gradient-to-b from-blue-500 to-blue-600 grid place-items-center z-10 shadow-[0_4px_10px_-4px_rgba(37,99,235,0.5)]">
                          <svg viewBox="0 0 24 24" width="10" height="10" stroke="white" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4 4 10-10"/></svg>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
              {errors.travelType && <p className="mt-1.5 text-sm text-red-500">{errors.travelType.message}</p>}
            </div>

            {/* 05 Budget */}
            <div className="mb-[22px]">
              <FieldLabel text="Budget" />
              <div className="grid grid-cols-3 gap-1.5 bg-gray-100 dark:bg-[rgba(8,9,26,0.4)] border border-gray-200 dark:border-white/[0.07] rounded-[11px] p-[3px]">
                {BUDGET_OPTS.map(o => (
                  <button key={o.id} type="button" onClick={() => setBudget(o.id)}
                    className={cn('py-2 px-2 rounded-[8px] text-center transition-all', budget === o.id
                      ? 'bg-blue-500 dark:bg-gradient-to-b dark:from-blue-500 dark:to-blue-600 text-white shadow-sm ring-1 ring-blue-400/50 dark:ring-0 dark:shadow-[0_4px_12px_-4px_rgba(37,99,235,0.5)]'
                      : 'text-gray-500 dark:text-[#a3a1c8] hover:text-gray-800 dark:hover:text-[#f0eeff]')}
                  >
                    <div className="text-[13px] font-semibold leading-none">{o.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 06 Pace */}
            <div className="mb-[22px]">
              <FieldLabel text="Pace" />
              <div className="grid grid-cols-3 gap-1.5 bg-gray-100 dark:bg-[rgba(8,9,26,0.4)] border border-gray-200 dark:border-white/[0.07] rounded-[11px] p-[3px]">
                {PACE_OPTS.map(o => (
                  <button key={o.id} type="button" onClick={() => setPace(o.id)}
                    className={cn('py-2 px-2 rounded-[8px] text-center transition-all', pace === o.id
                      ? 'bg-blue-500 dark:bg-gradient-to-b dark:from-blue-500 dark:to-blue-600 text-white shadow-sm ring-1 ring-blue-400/50 dark:ring-0 dark:shadow-[0_4px_12px_-4px_rgba(37,99,235,0.5)]'
                      : 'text-gray-500 dark:text-[#a3a1c8] hover:text-gray-800 dark:hover:text-[#f0eeff]')}
                  >
                    <div className="text-[13px] font-semibold leading-none">{o.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 07 Travelers */}
            <div className="mb-[26px]">
              <FieldLabel text="Travelers" />
              <div className="inline-flex items-center gap-3 bg-gray-50 dark:bg-[rgba(8,9,26,0.4)] border border-gray-200 dark:border-white/[0.07] rounded-[12px] px-3.5 py-2.5">
                <button type="button" onClick={() => setTravelers(t => Math.max(1, t - 1))}
                  className="w-8 h-8 rounded-[9px] bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.07] grid place-items-center text-gray-500 dark:text-[#a3a1c8] hover:text-gray-900 dark:hover:text-[#f0eeff] hover:border-gray-300 dark:hover:border-white/[0.14] transition-all">
                  <Minus className="w-3 h-3" />
                </button>
                <div className="text-center min-w-[64px]">
                  <div className="text-[18px] font-semibold text-gray-900 dark:text-[#f0eeff] leading-none">{travelers}</div>
                  <div className="text-[11px] font-mono text-gray-400 dark:text-white/40 mt-0.5">{travelers === 1 ? 'traveler' : 'travelers'}</div>
                </div>
                <button type="button" onClick={() => setTravelers(t => Math.min(20, t + 1))}
                  className="w-8 h-8 rounded-[9px] bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.07] grid place-items-center text-gray-500 dark:text-[#a3a1c8] hover:text-gray-900 dark:hover:text-[#f0eeff] hover:border-gray-300 dark:hover:border-white/[0.14] transition-all">
                  <PlusIcon className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Progress strip */}
            <div className="flex items-center gap-3.5 mb-4">
              <div className="flex-1 h-[6px] rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{
                    width: `${pct}%`,
                    background: 'linear-gradient(90deg, #3b82f6, #38bdf8, #22d3ee)',
                    boxShadow: '0 0 14px rgba(56,189,248,0.45)',
                  }}
                />
              </div>
              <span className="text-[12px] font-mono text-gray-500 dark:text-[#a3a1c8] shrink-0">
                <strong className="text-gray-900 dark:text-[#f0eeff] font-semibold">{totalFilled}</strong>/7 fields complete
              </span>
            </div>

            {/* CTA row */}
            <div className="flex gap-3">
              <button type="submit" disabled={isLoading || !allFilled}
                className="flex-1 relative overflow-hidden bg-gradient-to-b from-blue-500 to-blue-600 text-white rounded-[14px] px-6 py-4 font-medium text-[15px] flex items-center justify-center gap-2.5 shadow-[0_12px_30px_-10px_rgba(37,99,235,0.6),inset_0_1px_0_rgba(255,255,255,0.2)] transition-transform hover:-translate-y-px disabled:opacity-55 disabled:cursor-not-allowed disabled:transform-none"
              >
                <Sparkles className="w-4 h-4" />
                <span>{ctaText}</span>
                <ArrowRight className="w-4 h-4" />
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.18] to-transparent animate-shimmer pointer-events-none" />
              </button>
              <button type="button" onClick={() => reset()}
                className="flex items-center gap-2 px-[18px] py-4 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.14] text-gray-500 dark:text-[#a3a1c8] rounded-[14px] font-medium text-[13px] hover:text-gray-900 dark:hover:text-[#f0eeff] hover:border-gray-300 dark:hover:border-white/[0.22] transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>

            {/* Metrics — commented out
            <div className="grid grid-cols-2 gap-3.5 mt-[22px] pt-[22px] border-t border-dashed border-gray-200 dark:border-white/[0.07]">
              ...
            </div>
            */}

          </form>
        </div>
    </div>
  )
}
