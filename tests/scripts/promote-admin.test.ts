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
  it('accepts a permanent local ID for Telegram-only users without email', () => {
    expect(parsePromotionArgs(['--', '--user-id', '42'])).toEqual({ help: false, userId: 42, apply: false })
    expect(parsePromotionArgs(['--apply', '--user-id=42'])).toEqual({ help: false, userId: 42, apply: true })
  })

  it.each([
    [],
    ['first@example.com', 'second@example.com'],
    ['not-an-email'],
    ['admin@example.com', '--force'],
    ['--user-id', '42', 'admin@example.com'],
    ['--user-id', '0'], ['--user-id', '-1'], ['--user-id', '1.5'], ['--user-id', '1e3'],
    ['--user-id', '2147483648'], ['--user-id'],
    ['--user-id', '42', '--user-id', '43'], ['admin@example.com', '--apply', '--apply'],
  ])('rejects unsafe arguments: %j', (args) => {
    expect(() => parsePromotionArgs(args)).toThrow()
  })

  it('supports a help-only invocation', () => {
    expect(parsePromotionArgs(['--help'])).toEqual({ help: true })
  })
})
