import { z } from 'zod'

export const relocationPreviewQuery = z.object({
  location: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80).default('london'),
  annualGross: z.coerce.number().positive().max(2_000_000).default(110_000),
})
