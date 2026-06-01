import { format, parseISO, differenceInDays, eachDayOfInterval } from 'date-fns'

export const formatDate = (date: string | Date, formatStr: string = 'dd. MM. yyyy'): string => {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, formatStr)
}

export const getDaysBetween = (start: string | Date, end: string | Date): number => {
  const s = typeof start === 'string' ? parseISO(start) : start
  const e = typeof end === 'string' ? parseISO(end) : end
  return differenceInDays(e, s)
}

export const getDateRange = (start: string | Date, end: string | Date): string[] => {
  const s = typeof start === 'string' ? parseISO(start) : start
  const e = typeof end === 'string' ? parseISO(end) : end
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return []
  return eachDayOfInterval({ start: s, end: e }).map((d) => format(d, 'yyyy-MM-dd'))
}

export const addMinutesToTime = (time: string, minutesToAdd: number): string => {
  const [hoursStr, minutesStr] = time.split(':')
  const hours = Number(hoursStr)
  const minutes = Number(minutesStr)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time
  const total = (hours * 60 + minutes + minutesToAdd) % (24 * 60)
  const normalized = total < 0 ? total + 24 * 60 : total
  const hh = String(Math.floor(normalized / 60)).padStart(2, '0')
  const mm = String(normalized % 60).padStart(2, '0')
  return `${hh}:${mm}`
}
