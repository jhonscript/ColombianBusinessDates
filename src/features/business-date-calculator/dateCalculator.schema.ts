import { z } from 'zod';

export const calculationSchema = z.object({
  // Limite de ~2 años para evitar bucles excesivos
  days: z.coerce.number().int().min(1).max(730).optional(),
  // Limite de ~1 año hábil en horas para evitar bucles excesivos
  hours: z.coerce.number().int().min(1).max(2080).optional(),
  date: z.string().datetime({ message: "Invalid ISO 8601 date format." }).optional(),
}).refine(data => data.days !== undefined || data.hours !== undefined, {
  message: "At least one of 'days' or 'hours' must be provided.",
});
