import { getCandidateApplication } from '#server/services/candidates/applications'

export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'no-store')
  const session = await requireUserSession(event)
  const raw = getRouterParam(event, 'id') ?? ''
  const id = Number(raw)
  if (!/^[1-9]\d{0,9}$/.test(raw) || id > 2_147_483_647) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid application id' })
  }
  return getCandidateApplication(session.user.id, id)
})
