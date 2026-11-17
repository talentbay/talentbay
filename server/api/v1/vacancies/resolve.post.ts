import { z } from 'zod'
import { resolveVacancies } from '#server/repositories/vacancies'
import { readBoundedJson } from '#server/utils/bounded-json'

const inputSchema = z.object({
  slugs: z.array(z.string().max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)).min(1).max(50),
}).strict()

export default defineEventHandler(async (event) => {
  const body = inputSchema.safeParse(await readBoundedJson(event, 16 * 1024))
  if (!body.success) throw createError({ statusCode: 400, statusMessage: 'Invalid saved vacancy request' })
  setHeader(event, 'cache-control', 'no-store')
  return resolveVacancies(body.data.slugs)
})
