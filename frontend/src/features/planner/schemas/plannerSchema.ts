import { z } from 'zod'
import { parseISO, isBefore } from 'date-fns'

export const plannerSchema = z.object({
  destination: z.string().min(2, 'Destination must be at least 2 characters'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  travelType: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.enum(['CULTURAL', 'GASTRONOMIC', 'NATURE', 'ADVENTURE'], {
      required_error: 'Travel type is required',
    })
  ),
  latitude: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number().optional()
  ),
  longitude: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number().optional()
  ),
  placeId: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : val),
    z.string().optional()
  ),
}).superRefine((values, ctx) => {
  if (!values.startDate || !values.endDate) return
  const start = parseISO(values.startDate)
  const end = parseISO(values.endDate)
  if (isBefore(end, start)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endDate'],
      message: 'End date must be after start date',
    })
  }
})

export type PlannerFormValues = z.infer<typeof plannerSchema>
