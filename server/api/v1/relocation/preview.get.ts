import { getRelocationPreview } from '#server/repositories/relocation'
import { relocationPreviewQuery } from '#server/services/relocation/preview-query'

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, value => relocationPreviewQuery.parse(value))

  const preview = await getRelocationPreview(query.location, query.annualGross)

  if (!preview) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Unsupported relocation location',
    })
  }

  return preview
})
