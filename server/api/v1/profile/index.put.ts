import {
  candidateProfileInputSchema,
  saveCandidateProfile,
} from '#server/services/candidates/profile'
import { requireSameOrigin } from '#server/utils/same-origin'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  requireSameOrigin(event)
  setHeader(event, 'cache-control', 'no-store')
  const body = await readValidatedBody(event, value => candidateProfileInputSchema.parse(value))
  return await saveCandidateProfile(session.user.id, body)
})
