import { createHash } from 'node:crypto'
import type { CandidateProfileResponse } from '#shared/types/candidates'
import { applicationContacts } from '#shared/utils/application-contact'
import { safeHttpHref } from '#shared/utils/safe-http-url'

export function applicationCandidateReview(candidate: CandidateProfileResponse) {
  const { user, profile } = candidate
  const contacts = applicationContacts(candidate)
  // Fixed field order: the same material goes into the review digest and the receipt.
  const material = {
    name: user.name,
    email: contacts.email,
    profile: profile ? {
      headline: profile.headline, about: profile.about, countryCode: profile.countryCode, city: profile.city,
      phone: contacts.phone, telegram: contacts.telegram,
      githubUrl: safeHttpHref(profile.githubUrl) ?? null, linkedinUrl: safeHttpHref(profile.linkedinUrl) ?? null,
    } : null,
  }
  const input = JSON.stringify(['application-candidate:v1', user.id, material])
  return { material, candidateContext: `v1:${createHash('sha256').update(input).digest('hex')}` }
}
