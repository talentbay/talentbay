import {
  candidateProfileInputSchema,
  saveCandidateProfile,
} from '#server/services/candidates/profile'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const body = await readValidatedBody(event, value => candidateProfileInputSchema.parse(value))
  return await saveCandidateProfile(session.user.id, body)
})
