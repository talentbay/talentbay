import { getCandidateProfile } from '#server/services/candidates/profile'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  return await getCandidateProfile(session.user.id)
})
