import { describe, expect, it } from 'vitest'
import { hasCachedTelegramLaunch } from '../../app/utils/telegram-launch'

describe('Telegram SDK cache hint', () => {
  it('recognizes only a bounded cached launch hint, never an authenticated identity', () => {
    let readKey = ''
    expect(hasCachedTelegramLaunch((key) => {
      readKey = key
      return JSON.stringify({ tgWebAppData: 'untrusted-until-server-validation' })
    })).toBe(true)
    expect(readKey).toBe('__telegram__initParams')
  })
  it('keeps ordinary browsers usable with absent, corrupt or unavailable storage', () => {
    for (const value of [null, '', '{', '[]', 'null', '{}', '{"tgWebAppData":""}', '{"tgWebAppData":true}', 'x'.repeat(65_537)]) {
      expect(hasCachedTelegramLaunch(() => value)).toBe(false)
    }
    expect(hasCachedTelegramLaunch(() => { throw new Error('Storage denied') })).toBe(false)
  })
})
