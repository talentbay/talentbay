import { requireAdminSession } from '#server/utils/admin-session'
import { requireSameOrigin } from '#server/utils/same-origin'
import { readBoundedJson } from '#server/utils/bounded-json'
import { getApprovedSource } from '#server/services/sources/registry'
import { sourceCommandSchema } from '#server/services/sources/commands'
import { fetchSourceRun } from '#server/services/sources/fetch-run'
import { importSourceBatch, previewSourceBatch } from '#server/services/sources/import-run'
import { setRequestOperation } from '#server/utils/observability'

export default defineEventHandler(async (event) => {
  const admin = await requireAdminSession(event)
  requireSameOrigin(event)
  setHeader(event, 'cache-control', 'no-store')
  const parsed = sourceCommandSchema.safeParse(await readBoundedJson(event, 4096))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid source command' })
  const command = parsed.data
  setRequestOperation(event, command.action === 'FETCH' ? 'source.fetch' : command.action === 'PREVIEW' ? 'source.preview' : 'source.import')
  const source = getApprovedSource(command.sourceKey)
  if (command.action === 'FETCH') {
    const progress = await fetchSourceRun(source, command.runID, admin.id)
    if (progress.state === 'FAILED') setRequestOperation(event, 'source.fetch', 'failed')
    return { progress }
  }
  if (command.action === 'PREVIEW') return await previewSourceBatch(source, command.runID, admin.id)
  return { progress: await importSourceBatch(source, { runID: command.runID, offset: command.offset, revision: command.revision }, admin.id) }
})
