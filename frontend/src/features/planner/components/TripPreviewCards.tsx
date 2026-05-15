import React from 'react'

export function PVCard({ k, v, sub }: { k: string; v: React.ReactNode; sub: React.ReactNode }) {
  return (
    <div className="border border-line rounded-[14px] p-3.5 bg-gradient-to-b from-white to-indigo-50/40 dark:from-[#1e1b38] dark:to-indigo-900/10">
      <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-ink-faint mb-2">{k}</div>
      <div className="text-[22px] font-semibold tracking-tight text-ink">{v}</div>
      <div className="text-xs text-ink-dim mt-1">{sub}</div>
    </div>
  )
}

export function AIThink({ destination, dur, experience }: {
  destination: string
  dur: number | null
  experience: string
}) {
  const msg = !destination
    ? { line: 'Waiting for destination',                                                       sub: 'Type a city to begin' }
    : !dur
      ? { line: `Scanning ${destination} for highlights`,                                       sub: 'Need dates to lock the plan' }
      : !experience
        ? { line: `Mapping routes across ${dur} nights`,                                        sub: 'Pick a vibe to refine' }
        : { line: `Ready to compose your ${experience.toLowerCase()} trip in ${destination}`,   sub: 'routiq-planner-v3 · 94% match' }

  return (
    <div className="relative mx-[22px] mt-3.5 mb-5 overflow-hidden border border-indigo-200/60 dark:border-indigo-500/20 bg-gradient-to-b from-indigo-50/60 to-violet-50/40 dark:from-indigo-900/30 dark:to-violet-900/20 rounded-[14px] p-4 flex items-center gap-3.5">
      <div className="absolute inset-y-0 left-0 right-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-think-shimmer pointer-events-none" />
      <div className="relative w-9 h-9 rounded-full bg-aurora shadow-[0_0_20px_var(--accent-glow)] animate-orb-breathe flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-ink tracking-tight flex items-center gap-1">
          {msg.line}
          <span className="inline-flex gap-0.5 ml-1">
            <i className="w-1 h-1 rounded-full bg-indigo-500 animate-dot-blink" />
            <i className="w-1 h-1 rounded-full bg-indigo-500 animate-dot-blink [animation-delay:0.2s]" />
            <i className="w-1 h-1 rounded-full bg-indigo-500 animate-dot-blink [animation-delay:0.4s]" />
          </span>
        </div>
        <div className="text-[11px] font-mono tracking-wider text-ink-faint mt-1">{msg.sub}</div>
      </div>
    </div>
  )
}
