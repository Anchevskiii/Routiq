import React from 'react'
import { FieldLabel } from './PlannerFormFields'
import type { PlannerFormValues } from '../schemas/plannerSchema'
import type { UseFormSetValue, FieldError } from 'react-hook-form'

type TravelType = PlannerFormValues['travelType']

const TRAVEL_OPTIONS: { value: TravelType; label: string; sub: string; glyph: string }[] = [
  { value: 'CULTURAL',    label: 'Cultural',    sub: 'MUSEUMS · HISTORY', glyph: 'M3 21h18M5 21V10l7-5 7 5v11M9 21v-7h6v7M5 10h14' },
  { value: 'GASTRONOMIC', label: 'Gastronomic', sub: 'FOOD · WINE',        glyph: 'M7 3v9a3 3 0 0 0 6 0V3M10 3v18M17 3c-2 0-3 3-3 6s1 5 3 5v7' },
  { value: 'NATURE',      label: 'Nature',      sub: 'PARKS · TRAILS',     glyph: 'M12 22V10M5 22c0-7 4-10 7-10s7 3 7 10M8 13c1-4 2-6 4-6s3 2 4 6' },
  { value: 'ADVENTURE',   label: 'Adventure',   sub: 'THRILL · SPORT',     glyph: 'M3 19l4-8 4 4 4-7 4 6 2-3M3 19h18' },
]

interface Props {
  experience: string
  setValue: UseFormSetValue<PlannerFormValues>
  error?: FieldError
}

export const TravelTypeGrid: React.FC<Props> = ({ experience, setValue, error }) => (
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
                ? 'border-transparent shadow-[0_0_0_1.5px_theme(colors.blue.600),0_14px_28px_-16px_var(--accent-glow)]'
                : 'border-line hover:-translate-y-0.5 hover:border-blue-600 hover:bg-blue-50/30 dark:hover:bg-blue-900/20 hover:shadow-[0_10px_22px_-16px_var(--accent-glow)]',
            ].join(' ')}
          >
            <span className={[
              'grid place-items-center w-[38px] h-[38px] rounded-[11px] transition-all',
              selected
                ? 'bg-aurora text-white shadow-[0_6px_16px_-4px_var(--accent-glow)] animate-glyph-float'
                : 'bg-blue-50 dark:bg-blue-900/40 text-ink-dim',
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
    {error && <p className="mt-2 text-sm text-red-500 font-medium">{error.message}</p>}
  </div>
)
