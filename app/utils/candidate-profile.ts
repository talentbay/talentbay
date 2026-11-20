import type { CandidateProfileData, CandidateProfileResponse } from '#shared/types/candidates'
import { canSubmitApplication } from '#shared/utils/application-contact'

export type CandidateProfileDraft = { [Key in keyof CandidateProfileData]: string }

export const emptyCandidateProfile = (): CandidateProfileDraft => ({
  headline: '', about: '', countryCode: '', city: '', phone: '', telegram: '', githubUrl: '', linkedinUrl: '',
})

export function profileSections(profile: CandidateProfileData | null | undefined) {
  return [
    { label: 'Professional headline', complete: Boolean(profile?.headline?.trim()) },
    { label: 'Location', complete: Boolean(profile?.countryCode?.trim() || profile?.city?.trim()) },
    { label: 'Contact', complete: Boolean(profile?.phone?.trim() || profile?.telegram?.trim()) },
    { label: 'Links', complete: Boolean(profile?.githubUrl || profile?.linkedinUrl) },
    { label: 'About', complete: Boolean(profile?.about?.trim()) },
  ]
}

export function profileApplicationReadiness(candidate: CandidateProfileResponse | null | undefined) {
  if (canSubmitApplication(candidate)) return 'ready'
  if (!candidate?.profile) return 'unsaved'
  if (!candidate.user.name.trim()) return 'missingName'
  return 'missingContact'
}
