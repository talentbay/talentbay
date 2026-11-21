import { z } from 'zod'
import { listAdminVacancies } from '#server/services/vacancies/list-admin-vacancies'
import { requireAdminSession } from '#server/utils/admin-session'

const querySchema = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  reviewStatus: z.enum(['UNREVIEWED', 'VERIFIED', 'FLAGGED']).optional(),
  publicOnly: z.literal('true').optional(),
  company: z.string().optional(),
  q: z.string().optional(), before: z.string().optional(), limit: z.coerce.number().optional(),
}).strict()

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  setHeader(event, 'cache-control', 'no-store')
  const query = await getValidatedQuery(event, value => querySchema.parse(value))
  return await listAdminVacancies(query)
})
