import { requireAdminSession } from '#server/utils/admin-session'
import { getApprovedSource } from '#server/services/sources/registry'
import { sourceQuerySchema } from '#server/services/sources/commands'
import { getSourceProgress } from '#server/services/sources/import-run'

export default defineEventHandler(async (event) => {
  const admin = await requireAdminSession(event)
  setHeader(event, 'cache-control', 'no-store')
  const parsed = sourceQuerySchema.safeParse(getQuery(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid source progress request' })
  return { progress: await getSourceProgress(getApprovedSource(parsed.data.sourceKey), admin.id) }
})
