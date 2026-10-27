import { describe, expect, it, vi, afterAll } from 'vitest'
import { applicationDisclosureVersion } from '#shared/types/application-handling'
import type { CandidateProfileResponse } from '#shared/types/candidates'
import { applicationContacts, canSubmitApplication } from '#shared/utils/application-contact'
import { applicationInputSchema } from '#server/services/candidates/applications'
import { captureApplicationSnapshot } from '#server/services/candidates/application-snapshot'

vi.stubGlobal('createError', (input: object) => Object.assign(new Error('Cannot submit'), input))
afterAll(() => vi.unstubAllGlobals())
const candidate: CandidateProfileResponse = {
  user: { id: 1, name: 'Synthetic Candidate', email: null, avatarUrl: null },
  profile: { headline: 'Engineer', about: null, city: null, countryCode: null, phone: null, telegram: '@synthetic_fixture', githubUrl: null, linkedinUrl: null },
}

describe('application submission contract', () => {
  it('requires a versioned explicit acknowledgment and rejects injected authority', () => {
    const valid = { disclosureVersion: applicationDisclosureVersion, shareAcknowledged: true }
    expect(applicationInputSchema.parse(valid)).toEqual(valid)
    for (const body of [{}, { ...valid, shareAcknowledged: false }, { ...valid, disclosureVersion: 'old' }, { ...valid, userID: 8 }, { ...valid, recipient: 'Other' }, { ...valid, coverLetter: 'a'.repeat(5001) }]) {
      expect(applicationInputSchema.safeParse(body).success).toBe(false)
    }
  })

  it('accepts a Telegram-only contact without fabricating email or a CV', () => {
    expect(canSubmitApplication(candidate)).toBe(true)
    expect(applicationContacts(candidate)).toEqual({ email: null, phone: null, telegram: '@synthetic_fixture' })
  })

  it('does not mistake a professional link or whitespace for a contact', () => {
    expect(canSubmitApplication({ ...candidate, profile: { ...candidate.profile!, telegram: ' ', githubUrl: 'https://example.invalid/profile', phone: 'call me' } })).toBe(false)
    expect(canSubmitApplication({ ...candidate, profile: null })).toBe(false)
    expect(canSubmitApplication(null)).toBe(false)
  })

  it('captures only the allowed submitted fields with explicit purpose and recipient', () => {
    const snapshot = captureApplicationSnapshot(candidate, { id: 2, slug: 'fixture', title: 'Engineer', city: null, countryCode: 'DE', sourceUrl: null, sourceExternalID: null }, { organisationID: 3, name: 'Fixture Company' }, new Date('2026-10-27T08:00:00Z'))
    expect(snapshot).toMatchObject({ version: 1, disclosureVersion: applicationDisclosureVersion, submittedAt: '2026-10-27T08:00:00.000Z', candidate: { name: 'Synthetic Candidate', email: null } })
    expect(snapshot.candidate).not.toHaveProperty('id')
    expect(snapshot.candidate).not.toHaveProperty('avatarUrl')
    expect(snapshot.candidate.profile).not.toBe(candidate.profile)
    expect(() => captureApplicationSnapshot({ ...candidate, profile: null }, snapshot.vacancy, snapshot.recipient, new Date())).toThrow()
  })
})
