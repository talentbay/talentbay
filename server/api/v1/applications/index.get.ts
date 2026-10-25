import { listCandidateApplications } from '#server/services/candidates/applications'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  setHeader(event, 'cache-control', 'no-store')
  return await listCandidateApplications(session.user.id)
})
