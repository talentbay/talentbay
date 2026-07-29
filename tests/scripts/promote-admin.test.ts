import { describe, expect, it } from 'vitest'
import { parsePromotionArgs } from '../../scripts/promote-admin.mjs'

describe('parsePromotionArgs', () => {
  it('normalizes an email and defaults to dry-run mode', () => {
    expect(parsePromotionArgs([' Admin@Example.com '])).toEqual({
      help: false,
      email: 'admin@example.com',
      apply: false,
    })
  })

  it('requires an explicit apply flag before changing data', () => {
    expect(parsePromotionArgs(['--', 'admin@example.com', '--apply']).apply)
      .toBe(true)
  })

  it.each([
    [],
    ['first@example.com', 'second@example.com'],
    ['not-an-email'],
    ['admin@example.com', '--force'],
  ])('rejects unsafe arguments: %j', (args) => {
    expect(() => parsePromotionArgs(args)).toThrow()
  })

  it('supports a help-only invocation', () => {
    expect(parsePromotionArgs(['--help'])).toEqual({ help: true })
  })
})
