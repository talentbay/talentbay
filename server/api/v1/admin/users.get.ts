import { z } from 'zod'
import { listAdminUsers } from '#server/services/admin/users'
import { requireAdminSession } from '#server/utils/admin-session'

const querySchema = z.object({
  q: z.string().trim().max(120).optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
})

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const query = await getValidatedQuery(event, value => querySchema.parse(value))
  const items = await listAdminUsers({
    query: query.q,
    role: query.role,
  })

  return {
    items,
    total: items.length,
  }
})
