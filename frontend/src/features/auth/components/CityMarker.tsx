import React from 'react'
import { cn } from '@/utils/cn'
import { City, PIN_SVG } from './loginMap.data'

interface Props {
  city: City
  index: number
  isActive: boolean
  showLabel: boolean
}

export const CityMarker: React.FC<Props> = ({ city, index, isActive, showLabel }) => {
  const lmSvg = city.svg.replace(/ID/g, String(index))
  return (
    <div className="absolute origin-bottom" style={{ left: city.pos.x, top: city.pos.y }}>
      {/* Landmark */}
      <div className="absolute left-1/2 bottom-2 -translate-x-1/2" style={{ width: city.lm.w, height: city.lm.h }}>
        <div
          className={cn(
            'w-full h-full origin-bottom drop-shadow-[0_8px_16px_rgba(20,18,43,.15)]',
            isActive ? 'lm-rise-up' : 'opacity-0',
          )}
          dangerouslySetInnerHTML={{ __html: lmSvg }}
        />
      </div>

      {/* Pin shadow */}
      <div className={cn(
        'absolute left-1/2 top-0 w-[18px] h-[5px] rounded-full -translate-x-1/2 -translate-y-[2px]',
        'bg-[radial-gradient(ellipse,rgba(124,92,255,.35),transparent_70%)]',
        isActive ? 'lm-shadow-pulse' : 'opacity-0',
      )}/>

      {/* Ripples */}
      {[0, 1].map(r => (
        <div key={r} className={cn(
          'absolute left-1/2 top-0.5 w-1.5 h-1.5 border-[1.5px] border-red-500 rounded-full -translate-x-1/2 -translate-y-1/2',
          isActive ? (r === 0 ? 'lm-ripple-1' : 'lm-ripple-2') : 'opacity-0',
        )}/>
      ))}

      {/* Pin */}
      <div
        className={cn(
          'absolute left-1/2 top-0 w-[22px] h-[30px] -translate-x-1/2 -translate-y-[120%]',
          isActive ? 'lm-pin-drop' : 'opacity-0',
        )}
        dangerouslySetInnerHTML={{ __html: PIN_SVG }}
      />

      {/* Label */}
      <div className={cn(
        'absolute left-full top-[-20px] ml-2 whitespace-nowrap px-[11px] py-1.5',
        'bg-white dark:bg-[#1e1b38] border border-[rgba(20,18,43,.08)] dark:border-[rgba(139,92,246,0.2)] rounded-full shadow-[0_6px_18px_-6px_rgba(124,92,255,.25)]',
        showLabel ? 'lm-label-in' : 'opacity-0',
      )}>
        <div className="text-xs font-semibold leading-none text-ink">{city.name}</div>
        <div className="text-[10px] font-medium leading-none text-[#b8b4c8] mt-[3px]">{city.country}</div>
      </div>
    </div>
  )
}
