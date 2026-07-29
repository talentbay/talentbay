import { z } from 'zod'
import { listAdminVacancies } from '#server/services/vacancies/list-admin-vacancies'

const querySchema = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  reviewStatus: z.enum(['UNREVIEWED', 'VERIFIED', 'FLAGGED']).optional(),
})

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, value => querySchema.parse(value))
  const items = await listAdminVacancies(query)

  return {
    items,
    total: items.length,
  }
})
