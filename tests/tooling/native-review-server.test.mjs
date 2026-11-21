import assert from 'node:assert/strict'
import { fork } from 'node:child_process'
import { EventEmitter } from 'node:events'
import { test } from 'node:test'
import { nodeOutput, reviewInputs, runtimeEnvironment, supervise, verifyTester } from '../../scripts/native-review/server.mjs'

const token = '12345:' + 'x'.repeat(32)
const input = { TALENTBAY_NATIVE_ORIGIN: 'https://fictional.ngrok-free.dev', TALENTBAY_TEST_BOT_TOKEN: token }
const fixture = { id: 1, slug: 'native-review-' + 'a'.repeat(32), companySlug: 'fictional-native-review-' + 'b'.repeat(32) }
const row = {
  id: fixture.id, slug: fixture.slug, title: 'Fictional Native Review Engineer',
  company: { name: 'Fictional Native Review Company', slug: fixture.companySlug },
  source: { name: 'TalentBay editorial', status: 'VERIFIED', url: null }, applicationContext: 'v1:' + 'a'.repeat(64),
}

test('accepts only bare HTTPS ngrok origins and only dedicated test credentials', () => {
  for (const suffix of ['ngrok-free.dev', 'ngrok-free.app', 'ngrok.dev', 'ngrok.app']) {
    const origin = 'https://fictional-1.' + suffix
    assert.equal(reviewInputs({ ...input, TALENTBAY_NATIVE_ORIGIN: origin + '/' }).origin, origin)
  }
  for (const invalid of [undefined, 'http://test.ngrok.app', 'https://ngrok.app', 'https://test.ngrok.app.evil',
    'https://test.ngrok.app:443', 'https://test.ngrok.app@evil', 'https://token@test.ngrok.app',
    'https://test.ngrok.app/x/..', 'https://test.ngrok.app?', 'https://test.ngrok.app/#']) {
    assert.throws(() => reviewInputs({ ...input, TALENTBAY_NATIVE_ORIGIN: invalid }), { message: 'Expected an HTTPS ngrok origin' })
  }
  for (const invalid of [undefined, token + '/otherMethod', token + '?', '']) {
    assert.throws(() => reviewInputs({ ...input, TALENTBAY_TEST_BOT_TOKEN: invalid, NUXT_TELEGRAM_BOT_TOKEN: token }),
      { message: 'Expected a tester bot token' })
  }
  assert.throws(() => reviewInputs({ ...input, TALENTBAY_TEST_WEBHOOK_SECRET: 'too-short' }))
  assert.equal(reviewInputs({ ...input, NUXT_TELEGRAM_WEBHOOK_SECRET: 'unrelated' }).secret, undefined)
})

test('getMe is read-only, does not follow redirects, and authenticates both bot name and token ID', async () => {
  const signal = new AbortController().signal
  const bot = { is_bot: true, id: 12345, username: 'talentbay_tester_bot' }
  const call = async (url, options) => {
    assert.equal(url, 'https://api.telegram.org/bot' + token + '/getMe')
    assert.equal(options.method, 'POST')
    assert.equal(options.redirect, 'error')
    assert.ok(options.signal instanceof AbortSignal)
    return Response.json({ ok: true, result: bot })
  }
  assert.equal(await verifyTester(token, signal, call), '12345')
  for (const request of [
    async () => Response.json({ ok: false, result: bot }),
    ...[{ is_bot: false }, { id: 99999 }, { username: 'other_bot' }, { username: 'Talentbay_Tester_Bot' }]
      .map(change => async () => Response.json({ ok: true, result: { ...bot, ...change } })),
    async () => new Response(token, { status: 401 }),
    async () => new Response(token),
    async url => { throw new Error(url) },
  ]) {
    await assert.rejects(verifyTester(token, signal, request), { message: 'Tester bot identity verification failed' })
  }
})

test('only the Nuxt node-server output is accepted', () => {
  const node = { preset: 'node-server', framework: { name: 'nuxt' }, commands: { preview: 'node server/index.mjs' } }
  const marker = 'isolated-node-v1\n'
  assert.equal(nodeOutput(node, marker), true)
  assert.equal(nodeOutput(node), false)
  for (const other of [null, {}, { ...node, preset: 'cloudflare_module' }, { ...node, preset: 'vercel' },
    { ...node, commands: { preview: 'nuxt dev' } }]) assert.equal(nodeOutput(other, marker), false)
})

test('runtime gets the supplied runtime URL, fixed address and fresh sessions, never coordinator or DDL env', () => {
  const ambient = { ...input, DATABASE_MIGRATION_URL: 'owner', PGUSER: 'owner', NODE_OPTIONS: '--inspect', PORT: '8080',
    NUXT_PUBLIC_LOCAL_REVIEW_PORTAL: 'wrong', NUXT_SESSION_PASSWORD: 'wrong', NUXT_OAUTH_GOOGLE_CLIENT_SECRET: 'wrong' }
  const env = runtimeEnvironment('runtime-only', reviewInputs(ambient), '12345')
  assert.equal(env.DATABASE_URL, 'runtime-only')
  assert.equal(env.NITRO_HOST, '127.0.0.1')
  assert.equal(env.NITRO_PORT, '4317')
  assert.equal(env.NUXT_TELEGRAM_BOT_TOKEN, token)
  assert.equal(env.NUXT_TELEGRAM_WEBHOOK_SECRET, '')
  assert.equal(env.NUXT_PUBLIC_LOCAL_REVIEW_PORTAL, '')
  for (const key of ['DATABASE_MIGRATION_URL', 'PGUSER', 'NODE_OPTIONS', 'TALENTBAY_TEST_BOT_TOKEN']) assert.equal(env[key], undefined)
  assert.ok(!Object.values(env).includes('wrong'))
  const secret = 's'.repeat(32)
  const next = runtimeEnvironment('runtime-only', reviewInputs({ ...input, TALENTBAY_TEST_WEBHOOK_SECRET: secret }), '12345')
  assert.notEqual(env.NUXT_SESSION_PASSWORD, next.NUXT_SESSION_PASSWORD)
  assert.equal(next.NUXT_TELEGRAM_WEBHOOK_SECRET, secret)
})

function fakeChild() {
  const child = Object.assign(new EventEmitter(), { pid: 123, exitCode: null, signalCode: null, kills: [] })
  child.kill = (signal) => {
    child.kills.push(signal)
    child.signalCode = signal
    queueMicrotask(() => { child.emit('exit'); child.emit('close') })
  }
  return child
}

test('sends exactly the owned slug after canonical readiness and stops its child on disconnect', async () => {
  const shutdown = new AbortController(), child = fakeChild(), messages = []
  await supervise(child, fixture, shutdown.signal, msg => { messages.push(msg); shutdown.abort() }, async (url, options) => {
    assert.equal(url, 'http://127.0.0.1:4317/api/v1/vacancies/' + fixture.slug)
    assert.equal(options.redirect, 'error')
    assert.deepEqual(messages, [])
    return Response.json(row)
  })
  assert.deepEqual(messages, [{ type: 'ready', slug: fixture.slug }])
  assert.deepEqual(child.kills, ['SIGTERM'])
})

test('wrong listener, stale slug or unverified content never emits ready', async () => {
  for (const response of [new Response(null, { status: 404 }), Response.json({ ok: true }),
    Response.json({ ...row, id: 99 }), Response.json({ ...row, slug: 'stale' }), Response.json({ ...row, applicationContext: null }),
    Response.json({ ...row, company: { ...row.company, slug: 'unrelated' } }),
    Response.json({ ...row, source: { status: 'DEMO', name: 'TalentBay preview dataset' } })]) {
    const child = fakeChild()
    await assert.rejects(supervise(child, fixture, new AbortController().signal, assert.fail, async () => response),
      { message: 'Loopback listener did not return the owned vacancy' })
    assert.deepEqual(child.kills, ['SIGTERM'])
  }
})

test('child exiting during a successful readiness response is not reported or signalled again', async () => {
  const child = fakeChild()
  let notified = false
  await assert.rejects(supervise(child, fixture, new AbortController().signal, () => { notified = true }, async () => {
    child.exitCode = 1
    child.emit('exit')
    child.emit('close')
    return Response.json(row)
  }))
  assert.equal(notified, false)
  assert.deepEqual(child.kills, [])
})

test('forked launcher fails closed before network or setup on invalid input, with no ready or credential output', async () => {
  const child = fork(new URL('../../scripts/native-review/server.mjs', import.meta.url), [], {
    env: { ...input, TALENTBAY_NATIVE_ORIGIN: 'https://invalid.example/' + token }, execArgv: [], silent: true,
  })
  let output = ''
  const messages = []
  child.on('message', message => messages.push(message))
  for (const stream of [child.stdout, child.stderr]) stream.on('data', data => { output += data })
  const exit = await new Promise((resolve, reject) => { child.once('close', resolve); child.once('error', reject) })
  assert.equal(exit, 1)
  assert.deepEqual(messages, [])
  assert.equal(output.trim(), 'Native review failed during input validation; details withheld.')
})
