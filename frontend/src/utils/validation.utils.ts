import { z } from 'zod'

export const passwordSchema = z.string().min(8, 'Geslo mora vsebovati vsaj 8 znakov')
export const emailSchema = z.string().email('Vnesite veljaven email')
