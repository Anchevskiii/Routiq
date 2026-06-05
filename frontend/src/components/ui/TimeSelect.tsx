import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Clock, X } from 'lucide-react'

interface TimeSelectProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}

const SLOT_HEIGHT = 36

function generateSlots(): string[] {
  const slots: string[] = []
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return slots
}

const SLOTS = generateSlots()

export const TimeSelect: React.FC<TimeSelectProps> = ({
  value,
  onChange,
  placeholder = 'Set time',
  className = '',
}) => {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const selectedIndex = value ? SLOTS.findIndex(s => s === value) : -1

  const scrollToSelected = useCallback((index: number) => {
    if (!listRef.current || index < 0) return
    listRef.current.scrollTop = Math.max(0, index * SLOT_HEIGHT - SLOT_HEIGHT * 3)
  }, [])

  useEffect(() => {
    if (open) scrollToSelected(selectedIndex >= 0 ? selectedIndex : 0)
  }, [open, selectedIndex, scrollToSelected])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleSelect = (slot: string) => {
    onChange(slot)
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setOpen(false)
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all
          ${open
            ? 'border-primary ring-2 ring-primary/20 bg-white dark:bg-[#1e1b38]'
            : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 hover:border-primary/50'
          }
          text-gray-900 dark:text-blue-300`}
      >
        <Clock className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" />
        <span className={`flex-1 text-left ${!value ? 'text-gray-400 dark:text-slate-500' : ''}`}>
          {value || placeholder}
        </span>
        {value && (
          <span
            role="button"
            tabIndex={0}
            onClick={handleClear}
            onKeyDown={e => e.key === 'Enter' && handleClear(e as unknown as React.MouseEvent)}
            className="p-0.5 rounded-md hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-400"
          >
            <X className="w-3.5 h-3.5" />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-[#1e1b38] border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
          <ul
            ref={listRef}
            className="overflow-y-auto"
            style={{ maxHeight: SLOT_HEIGHT * 7 }}
          >
            {SLOTS.map((slot) => (
              <li key={slot}>
                <button
                  type="button"
                  onClick={() => handleSelect(slot)}
                  className={`w-full text-left px-4 text-sm font-medium transition-colors
                    ${slot === value
                      ? 'bg-primary text-white font-bold'
                      : 'text-gray-700 dark:text-blue-200 hover:bg-primary/10 dark:hover:bg-primary/20'
                    }`}
                  style={{ height: SLOT_HEIGHT }}
                >
                  {slot}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
