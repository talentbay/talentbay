import { setTimeout as delay } from 'node:timers/promises'

const legacy = 'https://talentbay-review.vercel.app'
const testBot = 'talentbay_tester_bot'
const ngrokOrigin = /^https:\/\/[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.ngrok(?:-free)?\.(?:dev|app)$/
const webhookPath = '/api/v1/bot/telegram'

async function telegram(token, method, body) {
  const failed = new Error(`Test bot: ${method} did not succeed`)
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
      redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(10000),
    })
    const data = await res.json()
    if (res.ok && data.ok === true) return data.result
  } catch { /* Never report a URL containing a bot token. */ }
  throw failed
}

async function readBindings(token, call) {
  const me = await call(token, 'getMe', {})
  if (!me?.is_bot || me.username !== testBot || String(me.id) !== token?.split(':')[0]) throw new Error('Not the TalentBay test bot')
  const menu = await call(token, 'getChatMenuButton', {})
  const hook = await call(token, 'getWebhookInfo', {})
  if (!['default', 'commands', 'web_app'].includes(menu?.type) || typeof hook?.url !== 'string'
    || (menu.type === 'web_app' && !menu.web_app?.url)) throw new Error('Unknown Telegram binding state')
  return { menu: menu.type === 'web_app' ? menu.web_app.url : '', hook: hook.url }
}

// Telegram's global menu can briefly return the previous value after a successful write.
async function confirm(token, call, matches, message, sleep) {
  for (const ms of [0, 300, 800, 1600, 2700, 4000]) {
    if (ms) await sleep(ms)
    const state = await readBindings(token, call)
    if (matches(state)) return state
  }
  throw new Error(message)
}

export async function configureNativeBot({ token, origin, webhookSecret }, call = telegram, sleep = delay) {
  if (!ngrokOrigin.test(origin) || !/^[A-Za-z0-9_-]{32,256}$/.test(webhookSecret ?? '')) throw new Error('Invalid native review configuration')
  const targets = { menu: origin + '/jobs', hook: origin + webhookPath }
  const state = await readBindings(token, call)
  if ((state.menu && state.menu !== origin + '/jobs' && state.menu !== origin + '/')
    || (state.hook && state.hook !== targets.hook)) throw new Error('Unexpected existing test bot binding; refusing to overwrite')
  await call(token, 'setWebhook', { url: targets.hook, secret_token: webhookSecret, allowed_updates: ['message'], drop_pending_updates: false })
  await call(token, 'setChatMenuButton', { menu_button: { type: 'web_app', text: 'Open TalentBay', web_app: { url: targets.menu } } })
  await confirm(token, call, s => s.menu === targets.menu && s.hook === targets.hook, 'Test bot binding readback mismatch', sleep)
}

export async function detachNativeBot({ token, origin }, call = telegram, sleep = delay) {
  if (origin !== legacy && !ngrokOrigin.test(origin)) throw new Error('Not a native review origin')
  const matchesMenu = url => url === origin + '/jobs' || url === origin + '/'
  const matchesHook = url => url === origin + webhookPath
  const state = await readBindings(token, call)
  if (matchesMenu(state.menu)) await call(token, 'setChatMenuButton', { menu_button: { type: 'commands' } })
  if (matchesHook(state.hook)) await call(token, 'deleteWebhook', { drop_pending_updates: false })
  const check = await confirm(token, call, s => !matchesMenu(s.menu) && !matchesHook(s.hook), 'Old test bot binding is still active', sleep)
  return { hasMenu: Boolean(check.menu), hasWebhook: Boolean(check.hook) }
}
