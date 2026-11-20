import type { z } from 'zod'
import { getRelocationPreview } from '#server/repositories/relocation'
import type { relocationPreviewQuery } from './preview-query'

export async function resolveRelocationPreview({ location, annualGross }: z.output<typeof relocationPreviewQuery>) {
  const preview = await getRelocationPreview(location, annualGross)
  if (!preview) throw createError({ statusCode: 400, statusMessage: 'Unsupported relocation location' })
  return preview
}
