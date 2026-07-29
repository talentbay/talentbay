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
})
