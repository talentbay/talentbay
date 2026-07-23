import { listCandidateApplications } from '#server/services/candidates/applications'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  return await listCandidateApplications(session.user.id)
})
