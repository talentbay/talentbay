import type { CandidateProfileData } from '#shared/types/candidates'

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
