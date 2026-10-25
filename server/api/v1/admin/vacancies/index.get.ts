import { z } from 'zod'
import { listAdminVacancies } from '#server/services/vacancies/list-admin-vacancies'
import { requireAdminSession } from '#server/utils/admin-session'

const querySchema = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  reviewStatus: z.enum(['UNREVIEWED', 'VERIFIED', 'FLAGGED']).optional(),
})

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  setHeader(event, 'cache-control', 'no-store')
  const query = await getValidatedQuery(event, value => querySchema.parse(value))
  const items = await listAdminVacancies(query)

  return {
    items,
    total: items.length,
  }
})
