import { z } from 'zod'
import { annualGrossPattern } from '#shared/utils/relocation-income'
import { annualGrossSchema } from './data-contract'

export const relocationPreviewQuery = z.object({
  location: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80),
  annualGross: z.union([z.number(), z.string().trim().regex(annualGrossPattern).transform(Number)]).pipe(annualGrossSchema),
})
