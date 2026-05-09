import { z } from 'zod'

export const plannerSchema = z.object({
  destination: z.string().min(2, 'Destination must be at least 2 characters'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  travelType: z.enum(['CULTURAL', 'GASTRONOMIC', 'NATURE', 'ADVENTURE'], {
    required_error: 'Travel type is required',
  }),
})

export type PlannerFormValues = z.infer<typeof plannerSchema>
