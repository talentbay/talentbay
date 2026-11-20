import { createError, defineEventHandler, getHeader, setHeader } from 'h3'
import {
  candidateProfileInputSchema,
  saveCandidateProfile,
} from '#server/services/candidates/profile'
import { requireSameOrigin } from '#server/utils/same-origin'
import { readBoundedJson } from '#server/utils/bounded-json'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  requireSameOrigin(event)
  setHeader(event, 'cache-control', 'no-store')
  const expectedOwner = getHeader(event, 'x-talentbay-profile-owner')
  if (expectedOwner !== String(session.user.id)) {
    throw createError({ statusCode: 412, statusMessage: 'Reload the profile before saving' })
  }
  const body = candidateProfileInputSchema.safeParse(await readBoundedJson(event, 64 * 1024))
  if (!body.success) throw createError({ statusCode: 400, statusMessage: 'Invalid profile fields' })
  return await saveCandidateProfile(session.user.id, body.data)
})
