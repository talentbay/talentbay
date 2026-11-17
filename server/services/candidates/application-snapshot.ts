import type { CandidateProfileResponse } from '#shared/types/candidates'
import { applicationDisclosureVersion } from '#shared/types/application-handling'
import type { ApplicationSnapshot } from '#shared/types/application-handling'
import { applicationContacts, canSubmitApplication } from '#shared/utils/application-contact'

export function captureApplicationSnapshot(
  candidate: CandidateProfileResponse,
  vacancy: ApplicationSnapshot['vacancy'],
  recipient: ApplicationSnapshot['recipient'],
  submittedAt: Date,
): ApplicationSnapshot {
  if (!canSubmitApplication(candidate)) {
    throw createError({ statusCode: 422, statusMessage: 'Add a profile and valid contact before applying' })
  }
  const contacts = applicationContacts(candidate)
  return {
    version: 1,
    submittedAt: submittedAt.toISOString(),
    disclosureVersion: applicationDisclosureVersion,
    candidate: {
      name: candidate.user.name,
      email: contacts.email,
      profile: { ...candidate.profile!, phone: contacts.phone, telegram: contacts.telegram },
    },
    vacancy,
    recipient,
  }
}
