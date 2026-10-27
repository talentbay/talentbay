import { requireAdminSession } from '#server/utils/admin-session'
import { listApprovedSources } from '#server/services/sources/registry'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  setHeader(event, 'cache-control', 'no-store')
  return { items: listApprovedSources() }
})
