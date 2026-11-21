import assert from 'node:assert/strict'
import test from 'node:test'
import { configureNativeBot, detachNativeBot } from '../../scripts/native-review/bot.mjs'

const origin = 'https://example-talentbay.ngrok-free.dev'
const options = { token: '42:fixture', origin, webhookSecret: 'x'.repeat(40) }
function api(username = 'talentbay_tester_bot') {
  const state = { menu: { type: 'commands' }, hook: { url: '' }, writes: [] }
  const call = async (_, method, p) => {
    if (method === 'getMe') return { id: 42, username, is_bot: true }
    if (method === 'getChatMenuButton') return state.menu
    if (method === 'getWebhookInfo') return state.hook
    state.writes.push(method)
    if (method === 'setChatMenuButton') state.menu = p.menu_button
    else if (method === 'setWebhook' || method === 'deleteWebhook') {
      assert.equal(p.drop_pending_updates, false)
      state.hook = { url: p.url ?? '' }
    } else assert.fail('Unexpected method')
    return true
  }
  return { state, call }
}

test('binds both tester settings and detaches only the matching origin', async () => {
  const { state, call } = api()
  await configureNativeBot(options, call)
  assert.equal(state.menu.web_app.url, origin + '/jobs')
  assert.equal(state.hook.url, origin + '/api/v1/bot/telegram')
  await detachNativeBot({ ...options, origin: 'https://another.ngrok.dev' }, call)
  assert.equal(state.writes.length, 2)
  assert.deepEqual(await detachNativeBot(options, call), { hasMenu: false, hasWebhook: false })
  assert.equal(state.writes.length, 4)
})

test('refuses another identity, an unrelated prior webhook or a production origin without changes', async () => {
  for (const reason of ['identity', 'foreign-webhook', 'production-origin', 'old-review-menu']) {
    const { state, call } = api(reason === 'identity' ? 'TalentBayBot' : undefined)
    if (reason === 'foreign-webhook') state.hook.url = 'https://example.invalid/custom'
    if (reason === 'old-review-menu') state.menu = { type: 'web_app', web_app: { url: 'https://talentbay-review.vercel.app/jobs' } }
    const args = reason === 'production-origin' ? { ...options, origin: 'https://talentbay.org' } : options
    await assert.rejects(configureNativeBot(args, call)); assert.deepEqual(state.writes, [])
  }
})

test('tolerates delayed readback without repeating writes; repeated stale reads fail closed', async () => {
  const { state, call } = api()
  let stale = 2
  const lag = (t, m, p) => m === 'getChatMenuButton' && state.writes.length && stale-- > 0
    ? { type: 'commands' } : call(t, m, p)
  const pauses = []
  await configureNativeBot(options, lag, ms => pauses.push(ms))
  assert.equal(pauses.length, 2)
  assert.deepEqual(state.writes, ['setWebhook', 'setChatMenuButton'])
  const staleMenu = state.menu
  const stuck = (t, m, p) => m === 'getChatMenuButton' ? staleMenu : call(t, m, p)
  await assert.rejects(detachNativeBot(options, stuck, () => {}), /still active/)
  assert.deepEqual(state.writes.slice(2), ['setChatMenuButton', 'deleteWebhook'])
})
