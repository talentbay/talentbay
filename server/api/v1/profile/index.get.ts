import { getReviewedCandidateProfile } from '#server/services/candidates/profile'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  setHeader(event, 'cache-control', 'no-store')
  return await getReviewedCandidateProfile(session.user.id)
})
