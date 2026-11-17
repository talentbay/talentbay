import { requireAdminSession } from '#server/utils/admin-session'
import { requireSameOrigin } from '#server/utils/same-origin'
import { readBoundedJson } from '#server/utils/bounded-json'
import {
  importVacancies,
  vacancyImportRequestSchema,
} from '#server/services/vacancies/import-vacancies'

export default defineEventHandler(async (event) => {
  const admin = await requireAdminSession(event)
  requireSameOrigin(event)
  setHeader(event, 'cache-control', 'no-store')
  const parsed = vacancyImportRequestSchema.safeParse(await readBoundedJson(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid vacancy import request' })
  const body = parsed.data
  const items = await importVacancies(body.items, { actorUserID: admin.id })

  return {
    items,
    total: items.length,
  }
})
