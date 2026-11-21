import { z } from 'zod'
import { listVacancies } from '#server/repositories/vacancies'

const querySchema = z.object({
  q: z.string().optional(),
  company: z.string().optional(),
  countryCode: z.string().optional(),
  workplaceType: z.enum(['ONSITE', 'HYBRID', 'REMOTE']).optional(),
  visaSponsorship: z.enum(['true', 'false']).optional(),
  salaryDisclosed: z.enum(['true', 'false']).optional(),
  sort: z.enum(['newest', 'salary-desc']).optional(),
  salaryCurrency: z.string().optional(), salaryPeriod: z.enum(['YEAR', 'MONTH', 'HOUR']).optional(),
  limit: z.coerce.number().optional(), before: z.string().optional(),
}).strict()

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, value => querySchema.parse(value))

  return await listVacancies({ ...query, visaSponsorship: query.visaSponsorship === 'true', salaryDisclosed: query.salaryDisclosed === 'true' })
})
