import { z } from 'zod'
import { getRelocationPreview } from '#server/repositories/relocation'

const querySchema = z.object({
  location: z.string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(80)
    .catch('london'),
  annualGross: z.coerce.number().positive().max(2_000_000).catch(110_000),
})

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, value => querySchema.parse(value))

  const preview = await getRelocationPreview(query.location, query.annualGross)

  if (!preview) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Unsupported relocation location',
    })
  }

  return preview
})
