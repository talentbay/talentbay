import { relocationPreviewQuery } from '#server/services/relocation/preview-query'
import { resolveRelocationPreview } from '#server/services/relocation/resolve-preview'
import { readBoundedJson } from '#server/utils/bounded-json'
import { requireSameOrigin } from '#server/utils/same-origin'

const previewBody = relocationPreviewQuery.strict()

export default defineEventHandler(async (event) => {
  requireSameOrigin(event)
  const body = previewBody.safeParse(await readBoundedJson(event, 1024))
  if (!body.success) throw createError({ statusCode: 400, statusMessage: 'Invalid relocation preview request' })
  return resolveRelocationPreview(body.data)
})
