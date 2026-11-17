import { describe, expect, it } from 'vitest'
import { candidateProfileInputSchema } from '#server/services/candidates/profile'

describe('candidateProfileInputSchema', () => {
  it('normalizes optional profile fields', () => {
    const result = candidateProfileInputSchema.parse({
      headline: '  Senior Engineer  ',
      countryCode: 'de',
      githubUrl: '',
      linkedinUrl: 'https://linkedin.com/in/example',
    })

    expect(result).toMatchObject({
      headline: 'Senior Engineer',
      countryCode: 'DE',
      githubUrl: null,
      linkedinUrl: 'https://linkedin.com/in/example',
    })
  })

  it('rejects non-http profile URLs', () => {
    const result = candidateProfileInputSchema.safeParse({
      githubUrl: 'github dot com/example',
    })

    expect(result.success).toBe(false)
  })

  it.each(['javascript:alert(1)', 'data:text/html,hello', 'ftp://example.com/file'])('rejects unsafe URL %s', (url) => {
    expect(candidateProfileInputSchema.safeParse({ githubUrl: url }).success).toBe(false)
    expect(candidateProfileInputSchema.safeParse({ linkedinUrl: url }).success).toBe(false)
  })

  it('rejects invalid country codes', () => {
    expect(candidateProfileInputSchema.safeParse({ countryCode: '12' }).success).toBe(false)
  })
  it('does not accept identity, privilege or undeclared private fields', () => {
    for (const value of [{ userID: 42 }, { role: 'ADMIN' }, { passport: 'not a profile field' }, { email: 'client-cannot-replace-provider@example.invalid' }]) {
      expect(candidateProfileInputSchema.safeParse(value).success).toBe(false)
    }
  })
})
