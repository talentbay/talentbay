import { z } from 'zod'
import { resolveVacancies } from '#server/repositories/vacancies'

const inputSchema = z.object({
  slugs: z.array(z.string().max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)).min(1).max(50),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, value => inputSchema.parse(value))
  setHeader(event, 'cache-control', 'no-store')
  return resolveVacancies(body.slugs)
})
