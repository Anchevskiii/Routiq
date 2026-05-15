import React from 'react'
import { Calendar } from 'lucide-react'

export function FieldLabel({ num, text, required }: { num: string; text: string; required?: boolean }) {
  return (
    <label className="flex items-center gap-2 mb-2.5 text-[11px] font-mono uppercase tracking-[0.1em] text-ink-dim">
      <span className="inline-grid place-items-center w-[18px] h-[18px] rounded-[5px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-[10px] font-semibold">
        {num}
      </span>
      {text}
      {required && <span className="text-pink-500 font-semibold">*</span>}
    </label>
  )
}

export function FieldShell({ children, focused, filled, error }: {
  children: React.ReactNode
  focused: boolean
  filled: boolean
  error?: boolean
}) {
  return (
    <div className={[
      'relative rounded-[14px] bg-white dark:bg-[#1e1b38] transition-all border-[1.5px]',
      error   ? 'border-red-400' :
      focused ? 'border-transparent shadow-[0_0_0_1.5px_theme(colors.indigo.500),0_0_0_5px_rgba(99,102,241,0.12),0_12px_30px_-10px_var(--accent-glow)]' :
      filled  ? 'border-line-strong' : 'border-line',
    ].join(' ')}>
      {children}
    </div>
  )
}

export function DateField({ id, num, label, focused, filled, onFocus, onBlur, reg, error }: {
  id: string
  num: string
  label: string
  focused: boolean
  filled: boolean
  onFocus: () => void
  onBlur: () => void
  reg: object
  error: boolean
}) {
  return (
    <div>
      <FieldLabel num={num} text={label} />
      <FieldShell focused={focused} filled={filled} error={error}>
        <Calendar
          className={[
            'absolute left-[18px] top-1/2 -translate-y-1/2 w-[18px] h-[18px] pointer-events-none transition-colors',
            focused ? 'text-indigo-500' : 'text-ink-faint',
          ].join(' ')}
        />
        <input
          id={id}
          type="date"
          {...reg}
          onFocus={onFocus}
          onBlur={onBlur}
          className="w-full bg-transparent border-none outline-none text-ink text-[15px] font-mono font-medium py-[18px] pl-[50px] pr-5 tracking-wide"
        />
      </FieldShell>
    </div>
  )
}

export function MetaCell({ k, v, unit, aurora, last }: {
  k: string
  v: React.ReactNode
  unit: string
  aurora?: boolean
  last?: boolean
}) {
  return (
    <div className={['px-[22px] py-4', !last && 'border-r border-line'].filter(Boolean).join(' ')}>
      <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-ink-faint mb-1.5">{k}</div>
      <div className="text-[17px] font-semibold text-ink flex items-baseline gap-1.5">
        <span className={aurora ? 'text-aurora' : ''}>{v}</span>
        {unit && <span className="text-xs font-mono font-normal text-ink-faint">{unit}</span>}
      </div>
    </div>
  )
}
