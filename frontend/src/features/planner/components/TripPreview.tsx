import React from 'react'
import { PVCard, AIThink }   from './TripPreviewCards'
import { TripPreviewHero }   from './TripPreviewHero'

interface Destination {
  name: string
  country: string
  flag: string
  code: string
  temp: string
  pop: string
}

interface Props {
  destination: string
  startDate: string
  endDate: string
  experience: string
  matched?: Destination
  dur: number | null
}

const EXPERIENCE_MOODS: Record<string, string[]> = {
  CULTURAL:    ['museum', 'galleries', 'old town', 'history'],
  GASTRONOMIC: ['tasting', 'street food', 'fine dining', 'markets'],
  NATURE:      ['hiking', 'coast', 'lakes', 'wildlife'],
  ADVENTURE:   ['surf', 'climbing', 'kayak', 'diving'],
}

const EXPERIENCE_LABEL: Record<string, { label: string; sub: string }> = {
  CULTURAL:    { label: 'Cultural',    sub: 'museums · history' },
  GASTRONOMIC: { label: 'Gastronomic', sub: 'food · wine' },
  NATURE:      { label: 'Nature',      sub: 'parks · trails' },
  ADVENTURE:   { label: 'Adventure',   sub: 'thrill · sport' },
}

function fmtDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en', { day: '2-digit', month: 'short' })
}

function seasonLabel(d: string): string | null {
  if (!d) return null
  const m = new Date(d).getMonth()
  if (m <= 1 || m === 11) return 'Winter'
  if (m <= 4) return 'Spring'
  if (m <= 7) return 'Summer'
  return 'Autumn'
}

export const TripPreview: React.FC<Props> = ({ destination, startDate, endDate, experience, matched, dur }) => {
  const exp = EXPERIENCE_LABEL[experience]
  const moods = EXPERIENCE_MOODS[experience] || ['museums', 'food', 'nature', 'nightlife']
  const season = seasonLabel(startDate)

  return (
    <section className="relative bg-white dark:bg-[#1e1b38] border border-line rounded-[22px] shadow-card overflow-visible">
      <TripPreviewHero destination={destination} matched={matched} season={season} />

      {/* Body */}
      <div className="px-[22px] pt-5 pb-1.5">
        <div className="grid grid-cols-2 gap-3.5">
          <PVCard
            k="Dates"
            v={
              <>
                {startDate ? fmtDate(startDate) : '—'}
                <span className="text-ink-faint font-medium mx-1">→</span>
                {endDate ? fmtDate(endDate) : '—'}
              </>
            }
            sub={
              dur
                ? <><em className="font-serif italic font-normal text-aurora">{dur}</em> nights total</>
                : 'Pick your travel window'
            }
          />
          <PVCard
            k="Vibe"
            v={exp
              ? <em className="font-serif italic font-normal text-aurora">{exp.label}</em>
              : <span className="text-ink-faint">—</span>
            }
            sub={exp ? exp.sub : 'Choose your experience'}
          />
        </div>

        {/* date arc — dynamic width, inline required */}
        <div className="mt-3.5 border border-line rounded-[14px] p-4 bg-gradient-to-b from-white to-indigo-50/40 dark:from-[#1e1b38] dark:to-indigo-900/10">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-ink-faint">Itinerary window</span>
            <span className="text-[13px] font-mono font-semibold text-ink">
              {dur ? `${dur} nights · ${dur * 1440} min` : 'awaiting dates'}
            </span>
          </div>
          <div className="relative h-7 rounded-full overflow-hidden bg-gradient-to-r from-indigo-100/80 to-violet-100/80 dark:from-indigo-900/40 dark:to-violet-900/40">
            <div
              className="absolute inset-y-0 left-0 bg-aurora shadow-[0_0_12px_var(--accent-glow)] transition-[width] duration-700 ease-[cubic-bezier(.2,.8,.2,1)]"
              style={{ width: dur ? `${Math.min(100, (dur / 21) * 100)}%` : '0%' }}
            >
              <span className="absolute right-[-3px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white dark:bg-[#1e1b38] rounded-full shadow-[0_0_0_3px_theme(colors.indigo.500),0_2px_10px_var(--accent-glow)]" />
            </div>
          </div>
          <div className="flex justify-between mt-2 text-[10px] font-mono tracking-wider text-ink-faint">
            <span>{startDate ? fmtDate(startDate) : 'start'}</span>
            <span>day {Math.max(1, Math.ceil((dur || 0) / 2))}</span>
            <span>{endDate ? fmtDate(endDate) : 'end'}</span>
          </div>
        </div>
      </div>

      <AIThink destination={destination} dur={dur} experience={experience} />

      {/* Mood tags */}
      <div className="flex flex-wrap gap-2 px-[22px] pb-[22px]">
        {moods.map(m => (
          <span
            key={m}
            className={[
              'inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium border transition-all',
              experience
                ? 'text-indigo-600 border-indigo-500 bg-indigo-50/60 dark:bg-indigo-900/20'
                : 'text-ink-dim border-line bg-white dark:bg-[#1e1b38]',
            ].join(' ')}
          >
            <span className="w-2 h-2 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500" />
            {m}
          </span>
        ))}
      </div>
    </section>
  )
}
