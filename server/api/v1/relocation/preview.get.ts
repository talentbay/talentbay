import { z } from 'zod'
import {
  calculateRelocationPreview,
  isRelocationLocationKey,
} from '#server/services/relocation/calculate-preview'

const querySchema = z.object({
  location: z.string().trim().toLowerCase().catch('london'),
  annualGross: z.coerce.number().positive().max(2_000_000).catch(110_000),
})

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, value => querySchema.parse(value))

  if (!isRelocationLocationKey(query.location)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Unsupported relocation location',
    })
  }

  return calculateRelocationPreview(query.location, query.annualGross)
})
