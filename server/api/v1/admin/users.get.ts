import { z } from 'zod'
import { listAdminUsers } from '#server/services/admin/users'
import { requireAdminSession } from '#server/utils/admin-session'

const querySchema = z.object({
  q: z.string().trim().max(120).optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  before: z.string().optional(), limit: z.coerce.number().optional(),
}).strict()

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  setHeader(event, 'cache-control', 'no-store')
  const query = await getValidatedQuery(event, value => querySchema.parse(value))
  return await listAdminUsers(query)
})
