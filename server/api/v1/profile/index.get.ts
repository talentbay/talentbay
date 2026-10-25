import { getCandidateProfile } from '#server/services/candidates/profile'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  setHeader(event, 'cache-control', 'no-store')
  return await getCandidateProfile(session.user.id)
})
