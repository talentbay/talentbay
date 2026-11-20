import { z } from 'zod'
import { listPublicCompanyOptions } from '#server/repositories/company-options'

const querySchema = z.strictObject({ q: z.string().trim().max(120).refine(value => !value.includes('\0')).default('') })
export default defineEventHandler(async event => {
  const { q } = await getValidatedQuery(event, input => querySchema.parse(input))
  return { items: await listPublicCompanyOptions(q) }
})
