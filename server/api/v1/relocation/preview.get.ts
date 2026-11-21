import { relocationPreviewQuery } from '#server/services/relocation/preview-query'
import { resolveRelocationPreview } from '#server/services/relocation/resolve-preview'

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, value => relocationPreviewQuery.parse(value))

  return resolveRelocationPreview(query)
})
