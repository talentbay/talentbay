import { z } from 'zod'
import { annualGrossSchema } from './data-contract'

export const relocationPreviewQuery = z.object({
  location: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80),
  annualGross: z.union([z.number(), z.string().trim().regex(/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/).transform(Number)]).pipe(annualGrossSchema),
})
