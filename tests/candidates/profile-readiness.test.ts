import { describe, expect, it } from 'vitest'
import type { CandidateProfileResponse } from '#shared/types/candidates'
import { emptyCandidateProfile, profileApplicationReadiness, profileSections } from '../../app/utils/candidate-profile'

const account = { id: 1, name: 'Candidate', email: 'candidate@example.test', avatarUrl: null }

describe('candidate profile readiness', () => {
  it('accepts account email without counting it as an optional profile field', () => {
    const profile = emptyCandidateProfile()
    expect(profileSections(profile).filter(section => section.complete)).toHaveLength(0)
    expect(profileApplicationReadiness({ user: account, profile })).toBe('ready')
  })

  it('does not treat five filled sections as eligibility when the contacts are invalid', () => {
    const profile = {
      ...emptyCandidateProfile(), headline: 'Engineer', city: 'Berlin', about: 'Open to relocation.',
      githubUrl: 'https://github.com/example', phone: '123', telegram: '@x',
    }
    expect(profileSections(profile).filter(section => section.complete)).toHaveLength(5)
    expect(profileApplicationReadiness({ user: { ...account, email: 'invalid' }, profile })).toBe('missingContact')
    expect(profileApplicationReadiness({ user: account, profile })).toBe('ready')
  })

  it.each([{ phone: '+49 12345678' }, { telegram: '@candidate' }])(
    'accepts a single valid profile contact without an account email or professional details',
    (contact) => {
      const profile = { ...emptyCandidateProfile(), ...contact }
      expect(profileSections(profile).filter(section => section.complete)).toHaveLength(1)
      expect(profileApplicationReadiness({ user: { ...account, email: null }, profile })).toBe('ready')
    },
  )

  it('requires a saved profile and a nonblank account name even with a valid email', () => {
    const candidate: CandidateProfileResponse = { user: account, profile: null }
    expect(profileApplicationReadiness(candidate)).toBe('unsaved')
    expect(profileApplicationReadiness({ user: { ...account, name: ' ' }, profile: emptyCandidateProfile() })).toBe('missingName')
  })
})
