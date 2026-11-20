import { describe, expect, it } from 'vitest'
import { parseBotEntryConfig, prepareBotEntry, verifyBotWebhookSecret } from '#server/services/bot/entry-contract'

const raw = { botID: '1234567', username: 'talentbay_test_bot', token: 'fake-bot-token', secret: 'fictional_webhook_secret_at_least_32_chars', appOrigin: 'https://talentbay.example' }
const config = parseBotEntryConfig(raw)!
const update = (text = '/start') => ({ update_id: 123, message: { message_id: 7, from: { id: 42, is_bot: false, first_name: 'Never echoed or persisted' }, chat: { id: 42, type: 'private' }, text } })

describe('bot entry configuration and static navigation, not auth/delivery', () => {
  it('is default-off, rejects unsafe/incomplete origins/secrets/identities and normalizes origin', () => {
    expect(parseBotEntryConfig({})).toBeNull()
    expect(config.appOrigin).toBe('https://talentbay.example')
    expect(parseBotEntryConfig({ ...raw, botID: 1234567 })?.botID).toBe('1234567')
    expect(parseBotEntryConfig({ ...raw, botID: true })).toBeNull()
    for (const appOrigin of ['', 'not-a-url', 'http://talentbay.example', 'https://talentbay.example/jobs', 'https://user:secret@talentbay.example', 'https://talentbay.example?q=private', 'https://talentbay.example#private', 'https://127.0.0.1', 'https://talentbay.example:444']) expect(parseBotEntryConfig({ ...raw, appOrigin })).toBeNull()
    for (const secret of ['', 'short', 'with spaces'.repeat(5), 'a'.repeat(257)]) expect(parseBotEntryConfig({ ...raw, secret })).toBeNull()
    expect(parseBotEntryConfig({ ...raw, botID: '9007199254740992' })).toBeNull()
    expect(parseBotEntryConfig({ ...raw, token: '' })).toBeNull()
    expect(verifyBotWebhookSecret(raw.secret, raw.secret)).toBe(true)
    for (const value of [undefined, '', 'wrong', `${raw.secret}x`, 'x'.repeat(257)]) expect(verifyBotWebhookSecret(value, raw.secret)).toBe(false)
  })
  it.each(['start', 'jobs', 'applications', 'help', 'privacy'])('prepares bounded /%s without private records/identity query parameters', (command) => {
    const entry = prepareBotEntry(update(`/${command}`), config)!
    expect(entry.reply).toMatchObject({ method: 'sendMessage', chat_id: 42 })
    expect(entry.reply!.text.length).toBeLessThan(600)
    const urls = entry.reply!.reply_markup.inline_keyboard.flat().map(button => new URL(button.url ?? button.web_app!.url))
    expect(urls.every(url => url.origin === config.appOrigin && !url.search && !url.hash && !url.username)).toBe(true)
    expect(JSON.stringify(entry)).not.toContain('Never echoed')
    expect(JSON.stringify(entry)).not.toContain(raw.secret)
    expect(JSON.stringify(entry)).not.toContain(raw.token)
    expect(JSON.stringify(entry)).not.toContain('nuxt-session')
  })
  it('keeps Applications inside the app and Privacy a normal notice link', () => {
    expect(prepareBotEntry(update('/applications'), config)!.reply!.reply_markup.inline_keyboard[0]![0]).toEqual({ text: 'Your applications', web_app: { url: `${raw.appOrigin}/applications` } })
    expect(prepareBotEntry(update('/privacy'), config)!.reply!.reply_markup.inline_keyboard[0]![0]).toEqual({ text: 'Privacy Notice', url: `${raw.appOrigin}/privacy` })
  })
  it('recognizes only complete pinned vacancy starts in a private message to this bot', () => {
    const tag = 'abcdef0123456789abcdef01'
    const payload = `job_2147483647_${tag}`
    expect(prepareBotEntry(update(`/start@TALENTBAY_TEST_BOT ${payload}`), config)?.vacancyStart).toEqual({ id: 2147483647, payload })
    for (const invalid of ['job_7', `job_0_${tag}`, `job_07_${tag}`, `job_2147483648_${tag}`, `job_7_${tag.toUpperCase()}`, payload + ' extra', payload + '\n', payload + '&next=elsewhere']) {
      expect(prepareBotEntry(update('/start ' + invalid), config)).toEqual(prepareBotEntry(update('/start'), config))
    }
    const privateStart = update('/start ' + payload)
    expect(prepareBotEntry({ ...privateStart, message: { ...privateStart.message, chat: { id: -1, type: 'group' } } }, config)?.vacancyStart).toBeUndefined()
    expect(prepareBotEntry(update('/start@different_bot ' + payload), config)?.vacancyStart).toBeUndefined()
    expect(prepareBotEntry(update('/jobs ' + payload), config)?.vacancyStart).toBeUndefined()
  })
  it('does not treat chat text, arbitrary URLs, other-bot commands or media as a support inbox/redirect', () => {
    const text = 'My private passport and profile, https://attacker.invalid'
    expect(prepareBotEntry(update(text), config)!.reply!.text).toContain('does not process messages')
    expect(JSON.stringify(prepareBotEntry(update(text), config))).not.toContain(text)
    expect(prepareBotEntry(update('/start https://attacker.invalid'), config)!.reply!.reply_markup.inline_keyboard[0]![0]!.web_app!.url).toBe(`${raw.appOrigin}/jobs`)
    expect(prepareBotEntry(update('/jobs@Other_bot'), config)!.reply).toBeNull()
    expect(prepareBotEntry(update('/jobs@TALENTBAY_TEST_BOT'), config)!.reply).not.toBeNull()
    const media = update(); delete (media.message as { text?: string }).text
    expect(prepareBotEntry(media, config)!.reply).toBeNull()
  })
  it('ignores groups, bots, edited messages and mismatched private-chat senders', () => {
    for (const value of [
      { update_id: 1, edited_message: update().message },
      { ...update(), message: { ...update().message, chat: { id: -50, type: 'group' } } },
      { ...update(), message: { ...update().message, from: { id: 42, is_bot: true } } },
      { ...update(), message: { ...update().message, from: { id: 41, is_bot: false } } },
    ]) expect(prepareBotEntry(value, config)!.reply).toBeNull()
    for (const value of [null, {}, { update_id: -1 }, { update_id: Number.MAX_SAFE_INTEGER + 1 }, update('x'.repeat(4097))]) expect(prepareBotEntry(value, config)).toBeNull()
  })
})
