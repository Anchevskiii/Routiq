import { format, parseISO, differenceInDays } from 'date-fns'

export const formatDate = (date: string | Date, formatStr: string = 'dd. MM. yyyy'): string => {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, formatStr)
}

export const getDaysBetween = (start: string | Date, end: string | Date): number => {
  const s = typeof start === 'string' ? parseISO(start) : start
  const e = typeof end === 'string' ? parseISO(end) : end
  return differenceInDays(e, s)
}
