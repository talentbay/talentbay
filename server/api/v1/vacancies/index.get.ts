import { z } from 'zod'
import { listVacancies } from '#server/repositories/vacancies'

const querySchema = z.object({
  q: z.string().trim().max(100).catch(''),
  countryCode: z.string().trim().length(2).optional(),
  workplaceType: z.enum(['ONSITE', 'HYBRID', 'REMOTE']).optional(),
  visaSponsorship: z.enum(['true', 'false']).optional(),
  salaryDisclosed: z.enum(['true', 'false']).optional(),
  sort: z.enum(['newest', 'salary-desc']).catch('newest'),
  limit: z.coerce.number().int().min(1).max(50).catch(20),
})

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, value => querySchema.parse(value))

  return await listVacancies({
    q: query.q,
    countryCode: query.countryCode,
    workplaceType: query.workplaceType,
    visaSponsorship: query.visaSponsorship === 'true' || undefined,
    salaryDisclosed: query.salaryDisclosed === 'true' || undefined,
    sort: query.sort,
    limit: query.limit,
  })
})
