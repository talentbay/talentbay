import { requireAdminSession } from '#server/utils/admin-session'
import { requireSameOrigin } from '#server/utils/same-origin'
import { readBoundedJson } from '#server/utils/bounded-json'
import { getApprovedSource } from '#server/services/sources/registry'
import { sourceCommandSchema } from '#server/services/sources/commands'
import { fetchSourceRun } from '#server/services/sources/fetch-run'
import { importSourceBatch, previewSourceBatch } from '#server/services/sources/import-run'

export default defineEventHandler(async (event) => {
  const admin = await requireAdminSession(event)
  requireSameOrigin(event)
  setHeader(event, 'cache-control', 'no-store')
  const parsed = sourceCommandSchema.safeParse(await readBoundedJson(event, 4096))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid source command' })
  const command = parsed.data
  const source = getApprovedSource(command.sourceKey)
  if (command.action === 'FETCH') return { progress: await fetchSourceRun(source, command.runID, admin.id) }
  if (command.action === 'PREVIEW') return await previewSourceBatch(source, command.runID, admin.id)
  return { progress: await importSourceBatch(source, { runID: command.runID, offset: command.offset, revision: command.revision }, admin.id) }
})
