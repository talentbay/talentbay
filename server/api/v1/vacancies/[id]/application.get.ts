import { candidateApplicationForVacancy } from '#server/services/candidates/applications'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  setHeader(event, 'cache-control', 'no-store')
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0 || id > 2147483647) throw createError({ statusCode: 400, statusMessage: 'Invalid vacancy id' })
  return await candidateApplicationForVacancy(session.user.id, id)
})
