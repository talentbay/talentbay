import type { CandidateProfileResponse } from '#shared/types/candidates'
import { candidateReviewRequiredCode } from '#shared/types/candidates'
import { applicationDisclosureVersion } from '#shared/types/application-handling'
import type { ApplicationSnapshot } from '#shared/types/application-handling'
import { canSubmitApplication } from '#shared/utils/application-contact'
import { applicationCandidateReview } from './application-candidate-context'

export function captureApplicationSnapshot(
  candidate: CandidateProfileResponse,
  expectedCandidateContext: string,
  vacancy: ApplicationSnapshot['vacancy'],
  recipient: ApplicationSnapshot['recipient'],
  submittedAt: Date,
): ApplicationSnapshot {
  const { material, candidateContext } = applicationCandidateReview(candidate)
  if (expectedCandidateContext !== candidateContext) {
    throw createError({ statusCode: 412, statusMessage: 'Review the changed candidate profile before applying', data: { code: candidateReviewRequiredCode } })
  }
  if (!material.profile || !canSubmitApplication(candidate)) {
    throw createError({ statusCode: 422, statusMessage: 'Add a profile and valid contact before applying' })
  }
  return {
    version: 1,
    submittedAt: submittedAt.toISOString(),
    disclosureVersion: applicationDisclosureVersion,
    candidate: { ...material, profile: material.profile },
    vacancy,
    recipient,
  }
}
