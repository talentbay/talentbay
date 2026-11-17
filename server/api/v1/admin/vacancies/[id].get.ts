import { z } from 'zod'
import { requireAdminSession } from '#server/utils/admin-session'
import { getAdminVacancy } from '#server/services/vacancies/admin-vacancy'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  setHeader(event, 'cache-control', 'no-store')
  const id = z.coerce.number().int().positive().safeParse(getRouterParam(event, 'id'))
  if (!id.success) throw createError({ statusCode: 400, statusMessage: 'Invalid vacancy id' })
  return await getAdminVacancy(id.data)
})
