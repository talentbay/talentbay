import { describe, expect, it, vi, afterAll } from 'vitest'
import { applicationDisclosureVersion } from '#shared/types/application-handling'
import type { CandidateProfileResponse } from '#shared/types/candidates'
import { applicationContacts, canSubmitApplication } from '#shared/utils/application-contact'
import { applicationInputSchema } from '#server/services/candidates/applications'
import { captureApplicationSnapshot } from '#server/services/candidates/application-snapshot'
import { applicationCandidateReview } from '#server/services/candidates/application-candidate-context'
import { safeApiFailure } from '#server/utils/private-api'
import { safeHttpUrl } from '../../app/utils/safe-http-url'

vi.stubGlobal('createError', (input: object) => Object.assign(new Error('Cannot submit'), input))
afterAll(() => vi.unstubAllGlobals())
const candidate: CandidateProfileResponse = {
  user: { id: 1, name: 'Synthetic Candidate', email: null, avatarUrl: null },
  profile: { headline: 'Engineer', about: null, city: null, countryCode: null, phone: null, telegram: '@synthetic_fixture', githubUrl: null, linkedinUrl: null },
}
const context = (value: CandidateProfileResponse) => applicationCandidateReview(value).candidateContext
const vacancy = { id: 2, slug: 'fixture', title: 'Engineer', city: null, countryCode: 'DE', sourceUrl: null, sourceExternalID: null }
const snapshotFor = (value: CandidateProfileResponse, expected = context(value)) =>
  captureApplicationSnapshot(value, expected, vacancy, { organisationID: 3, name: 'Fixture Company' }, new Date('2026-10-27T08:00:00Z'))

describe('application submission contract', () => {
  it('requires a versioned explicit acknowledgment and rejects injected authority', () => {
    const valid = { disclosureVersion: applicationDisclosureVersion, shareAcknowledged: true, expectedContext: `v1:${'a'.repeat(64)}`, expectedCandidateContext: context(candidate) }
    expect(applicationInputSchema.parse(valid)).toEqual(valid)
    for (const expectedCandidateContext of [undefined, null, 1, '', 'v2:' + 'a'.repeat(64), 'v1:' + 'A'.repeat(64), context(candidate) + '\n']) {
      expect(applicationInputSchema.safeParse({ ...valid, expectedCandidateContext }).success).toBe(false)
    }
    for (const body of [{}, { ...valid, expectedContext: undefined }, { ...valid, expectedContext: 'old' }, { ...valid, shareAcknowledged: false }, { ...valid, disclosureVersion: 'old' }, { ...valid, userID: 8 }, { ...valid, recipient: 'Other' }, { ...valid, coverLetter: 'a'.repeat(5001) }]) {
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
    const snapshot = snapshotFor(candidate)
    expect(snapshot).toMatchObject({ version: 1, disclosureVersion: applicationDisclosureVersion, submittedAt: '2026-10-27T08:00:00.000Z', candidate: { name: 'Synthetic Candidate', email: null } })
    expect(snapshot.candidate).not.toHaveProperty('id')
    expect(snapshot.candidate).not.toHaveProperty('avatarUrl')
    expect(snapshot.candidate.profile).not.toBe(candidate.profile)
    expect(snapshot).not.toHaveProperty('candidateContext')
    expect(snapshot.candidate).not.toHaveProperty('candidateContext')
    expect(() => snapshotFor({ ...candidate, profile: null })).toThrowError(expect.objectContaining({ statusCode: 422 }))
  })

  it('binds the local account and every released field, without depending on object key order', () => {
    const reviewed = context(candidate)
    expect(reviewed).toMatch(/^v1:[0-9a-f]{64}$/)
    expect(context({ ...candidate, profile: Object.fromEntries(Object.entries(candidate.profile!).reverse()) as typeof candidate.profile })).toBe(reviewed)
    for (const [key, value] of Object.entries({
      headline: 'New title', about: 'New summary', city: 'Paris', countryCode: 'FR', phone: '+49 12345678',
      telegram: '@changed_fixture', githubUrl: 'https://example.invalid/cv', linkedinUrl: 'https://example.invalid/profile',
    })) expect(context({ ...candidate, profile: { ...candidate.profile!, [key]: value } }), key).not.toBe(reviewed)
    for (const user of [{ ...candidate.user, id: 2 }, { ...candidate.user, name: 'Changed name' }, { ...candidate.user, email: 'fixture@example.invalid' }]) {
      expect(() => snapshotFor({ ...candidate, user }, reviewed)).toThrowError(expect.objectContaining({ statusCode: 412, data: { code: 'CANDIDATE_REVIEW_REQUIRED' } }))
    }
  })

  it('hashes the normalized receipt material only and does not copy account or storage metadata', () => {
    const original = {
      user: { ...candidate.user, email: 'fixture@example.invalid' },
      profile: { ...candidate.profile!, phone: '+49 12345678' },
    }
    const edited = {
      user: { ...original.user, email: '  fixture@example.invalid  ', avatarUrl: 'https://example.invalid/avatar', role: 'USER' },
      profile: { ...original.profile, phone: '  +49 12345678 ', telegram: ' @synthetic_fixture ', updatedAt: new Date(), userID: 1 },
    }
    expect(context(edited)).toBe(context(original))
    const submitted = snapshotFor(edited, context(original))
    expect(submitted.candidate).toEqual({ name: original.user.name, email: original.user.email, profile: original.profile })
    expect(JSON.stringify(submitted)).not.toContain(context(original))
  })

  it.each(['githubUrl', 'linkedinUrl'] as const)('releases only the preview-safe %s, including for previously stored links', (field) => {
    const withLink = (value: string | null) => ({ ...candidate, profile: { ...candidate.profile!, [field]: value } })
    for (const stored of ['https://fixture-user@example.invalid/profile', 'http://u:fixture@example.invalid/', 'not a URL']) {
      expect(safeHttpUrl(stored)).toBeUndefined()
      const hidden = withLink(stored)
      expect(context(hidden)).toBe(context(withLink(null)))
      expect(snapshotFor(hidden, context(withLink(null))).candidate.profile[field]).toBeNull()
      expect(hidden.profile[field]).toBe(stored)
    }
    const stored = '  https://EXAMPLE.invalid:443  '
    const shown = safeHttpUrl(stored)!
    expect(shown).toBe('https://example.invalid/')
    expect(context(withLink(stored))).toBe(context(withLink(shown)))
    expect(snapshotFor(withLink(stored)).candidate.profile[field]).toBe(shown)
    expect(context(withLink(shown + 'different'))).not.toBe(context(withLink(shown)))
  })

  it('rejects a stale review before contact eligibility; a fresh review does not override eligibility', () => {
    const edited = { ...candidate, profile: { ...candidate.profile!, telegram: null } }
    expect(() => snapshotFor(edited, context(candidate))).toThrowError(expect.objectContaining({ statusCode: 412, data: { code: 'CANDIDATE_REVIEW_REQUIRED' } }))
    expect(() => snapshotFor(edited)).toThrowError(expect.objectContaining({ statusCode: 422 }))
    const restored = { ...edited, profile: { ...edited.profile, telegram: '@new_fixture' } }
    expect(snapshotFor(restored).candidate.profile.telegram).toBe('@new_fixture')
    expect(context({ ...candidate, profile: null })).not.toBe(context(edited))
  })

  it('exposes only the fixed candidate-review code on its 412, never arbitrary error metadata', () => {
    const code = 'CANDIDATE_REVIEW_REQUIRED'
    const base = { error: true, statusCode: 412, statusMessage: 'Review the changed resource', message: 'Review the changed resource' }
    const error = { statusCode: 412, statusMessage: 'PRIVATE', message: 'SQL_DETAIL', data: { code, contact: 'PRIVATE' } }
    expect(safeApiFailure(error).body).toEqual({ ...base, code })
    for (const data of [undefined, null, code, { code: 'SOME_OTHER_CODE' }, { sql: 'PRIVATE' }, Object.create({ code })]) {
      expect(safeApiFailure({ ...error, data }).body).toEqual(base)
    }
    for (const statusCode of [400, 409, 422, 500]) {
      const body = safeApiFailure({ ...error, statusCode }).body
      expect(body).not.toHaveProperty('code')
      expect(JSON.stringify(body)).not.toMatch(/PRIVATE|SQL_DETAIL/)
    }
  })
})
