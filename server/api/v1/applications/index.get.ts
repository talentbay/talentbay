import { candidateApplicationQuery, listCandidateApplications } from '#server/services/candidates/applications'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  setHeader(event, 'cache-control', 'no-store')
  const query = candidateApplicationQuery.safeParse(getQuery(event))
  if (!query.success) throw createError({ statusCode: 400, statusMessage: 'Invalid application filters' })
  return await listCandidateApplications(session.user.id, query.data)
})
