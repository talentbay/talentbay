import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { EventEmitter } from 'node:events'
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs'
import http from 'node:http'
import https from 'node:https'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { test } from 'node:test'
import { cliEnvironment, runBridge } from '../../scripts/native-review/bridge.mjs'

const origin = 'https://fixture.ngrok-free.dev'
const local = 'http://127.0.0.1:4317'
const slug = 'native-review-' + randomBytes(16).toString('hex')
const path = '/api/v1/vacancies/' + slug
const ready = { type: 'ready', slug }
const health = { service: 'talentbay', status: 'ok', runtime: 'node' }
const vacancy = {
  slug, id: 1, title: 'Fictional Native Review Engineer', company: { name: 'Fictional Native Review Company' },
  source: { status: 'VERIFIED' }, applicationContext: 'v1:' + randomBytes(32).toString('hex'),
}

function previewFixture(t) {
  const dir = mkdtempSync('/tmp/talentbay-preview-fixture-')
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return { dir, file: join(dir, '.env.preview-review.local') }
}

test('CLI accepts the bare ngrok dashboard hostname but not an HTTP URL', () => {
  const parse = v => cliEnvironment({ TALENTBAY_NATIVE_ORIGIN: v, TALENTBAY_TEST_BOT_TOKEN: 'fixture' }, '.').TALENTBAY_NATIVE_ORIGIN
  assert.equal(parse('fixture.ngrok-free.dev'), origin)
  assert.equal(parse(origin), origin)
  assert.equal(parse('http://fixture.ngrok-free.dev'), 'http://fixture.ngrok-free.dev')
})

test('CLI fallback selects only the exact preview tester key, without mutating its input', (t) => {
  const { dir, file } = previewFixture(t)
  const token = '1:' + randomBytes(24).toString('hex')
  const native = { TALENTBAY_NATIVE_ORIGIN: origin, TALENTBAY_NGROK_AUTHTOKEN: 'dedicated', TALENTBAY_TEST_WEBHOOK_SECRET: 'from-native' }
  const ambient = Object.freeze({ ...native, NUXT_TELEGRAM_BOT_TOKEN: 'ignore-me' })
  writeFileSync(file, [
    'TALENTBAY_NATIVE_ORIGIN=https://other.invalid', 'TALENTBAY_NGROK_AUTHTOKEN=ignore',
    'TALENTBAY_TEST_WEBHOOK_SECRET=ignore', 'TALENTBAY_TEST_BOT_TOKEN=ignore', 'DATABASE_URL=ignore',
    'X_NUXT_TELEGRAM_BOT_TOKEN=ignore', `NUXT_TELEGRAM_BOT_TOKEN="${token}" # synthetic`,
  ].join('\n'), { mode: 0o600 })
  assert.deepEqual(cliEnvironment(ambient, dir), { ...native, TALENTBAY_TEST_BOT_TOKEN: token })
})

test('CLI skips the preview file for an explicit token or incomplete or invalid native inputs', (t) => {
  const { dir, file } = previewFixture(t)
  // Any attempt to use this malformed file would throw.
  writeFileSync(file, 'DATABASE_URL=ignore\n', { mode: 0o600 })
  const native = { TALENTBAY_NATIVE_ORIGIN: origin, TALENTBAY_NGROK_AUTHTOKEN: 'dedicated' }
  for (const change of [
    { TALENTBAY_TEST_BOT_TOKEN: 'explicit' }, { TALENTBAY_NATIVE_ORIGIN: undefined },
    { TALENTBAY_NATIVE_ORIGIN: 'https://other.invalid' }, { TALENTBAY_NGROK_AUTHTOKEN: undefined },
    { TALENTBAY_NGROK_AUTHTOKEN: ' ' },
  ]) {
    const env = { ...native, ...change }
    assert.equal(cliEnvironment(env, dir).TALENTBAY_TEST_BOT_TOKEN, env.TALENTBAY_TEST_BOT_TOKEN)
  }
  assert.throws(() => cliEnvironment(native, dir), /supply TALENTBAY_TEST_BOT_TOKEN/)
})

test('CLI does not search other dotenv files, follow symlinks, or expand token references', (t) => {
  const { dir, file } = previewFixture(t)
  const native = { TALENTBAY_NATIVE_ORIGIN: origin, TALENTBAY_NGROK_AUTHTOKEN: 'dedicated' }
  const other = join(dir, '.env')
  writeFileSync(other, 'NUXT_TELEGRAM_BOT_TOKEN=1:' + randomBytes(24).toString('hex'), { mode: 0o600 })
  assert.equal(cliEnvironment(native, dir).TALENTBAY_TEST_BOT_TOKEN, undefined)
  symlinkSync(other, file)
  assert.throws(() => cliEnvironment(native, dir), /supply TALENTBAY_TEST_BOT_TOKEN/)
  rmSync(file)
  writeFileSync(file, 'NUXT_TELEGRAM_BOT_TOKEN=$OTHER_TOKEN', { mode: 0o600 })
  assert.throws(() => cliEnvironment(native, dir), /supply TALENTBAY_TEST_BOT_TOKEN/)
})

function fakeChild() {
  const child = Object.assign(new EventEmitter(), { pid: 100, exitCode: null, signalCode: null, kills: [] })
  child.finish = (code, signal) => {
    child.exitCode = code
    child.signalCode = signal
    child.emit('exit', code, signal)
    child.emit('close', code, signal)
  }
  child.kill = (signal) => {
    child.kills.push(signal)
    queueMicrotask(() => child.finish(null, signal))
    return true
  }
  return child
}

function harness(t, opts = {}) {
  const stop = new AbortController()
  const calls = [], children = [], requests = [], bindings = [], versions = []
  const env = {
    TALENTBAY_NATIVE_ORIGIN: origin, TALENTBAY_TEST_BOT_TOKEN: '1:' + randomBytes(24).toString('hex'),
    TALENTBAY_NGROK_AUTHTOKEN: randomBytes(24).toString('hex'),
    NGROK_AUTHTOKEN: 'ambient', DATABASE_URL: 'ambient', NUXT_TELEGRAM_BOT_TOKEN: 'ambient',
    HTTPS_PROXY: 'ambient', PATH: '/ambient', HOME: '/ambient', NODE_OPTIONS: 'ambient', ...opts.env,
  }
  // Replace both transports: even an unexpected destination cannot reach a real socket.
  for (const client of [http, https]) {
    t.mock.method(client, 'get', (url, options, handle) => {
      requests.push({ url, options })
      const [status, payload, type] = opts.reply?.(url) ?? [200, url.endsWith('/api/health') ? health : vacancy]
      const res = Readable.from([Buffer.from(typeof payload === 'string' ? payload : JSON.stringify(payload))])
      Object.assign(res, { statusCode: status, headers: { 'content-type': type ?? 'application/json', location: 'https://elsewhere.invalid' } })
      queueMicrotask(() => handle(res))
      return new EventEmitter()
    })
  }
  const start = () => runBridge({
    env, signal: stop.signal,
    verifyCli: (env) => { versions.push(env); return '/fake/ngrok' },
    spawnChild(file, args, options) {
      const child = fakeChild()
      calls.push({ file, args, options })
      children.push(child)
      if (file === process.execPath) queueMicrotask(() => {
        if (opts.exitBeforeReady) child.finish(1, null)
        else child.emit('message', opts.ready ?? ready)
      })
      return child
    },
    bot: {
      async configureNativeBot(binding) {
        bindings.push(['configure', binding])
        await opts.configure?.(children, stop)
      },
      async detachNativeBot(binding) {
        bindings.push(['detach', binding])
        await opts.detach?.()
      },
    },
    announce() {
      if (opts.onReady) opts.onReady({ children, calls, stop })
      else stop.abort()
    },
  })
  return { start, stop, children, calls, env, bindings, requests, versions }
}

test('only an owned loopback server is forwarded, with separate homes, credentials and no inspector', async (t) => {
  let yaml, mode, homeMode
  const h = harness(t, { onReady({ calls, stop }) {
    const config = join(calls[1].options.cwd, 'ngrok.yml')
    yaml = readFileSync(config, 'utf8')
    mode = statSync(config).mode & 0o777
    homeMode = statSync(calls[1].options.cwd).mode & 0o777
    stop.abort()
  } })
  await h.start()
  const [server, agent] = h.calls
  const s = server.options.env, a = agent.options.env
  assert.equal(server.file, process.execPath)
  assert.match(server.args[0], /\/scripts\/native-review\/server\.mjs$/)
  assert.equal(server.options.stdio[3], 'ipc')
  assert.equal(agent.file, '/fake/ngrok')
  assert.deepEqual(agent.args, ['http', local, '--url=' + origin, '--inspect=false', '--config=' + join(a.HOME, 'ngrok.yml')])
  assert.deepEqual(h.versions, [Object.fromEntries(Object.entries(a).filter(([key]) => key !== 'NGROK_AUTHTOKEN'))])
  assert.equal(a.NGROK_AUTHTOKEN, h.env.TALENTBAY_NGROK_AUTHTOKEN)
  assert.equal(s.TALENTBAY_TEST_BOT_TOKEN, h.env.TALENTBAY_TEST_BOT_TOKEN)
  assert.match(s.TALENTBAY_TEST_WEBHOOK_SECRET, /^[a-f0-9]{64}$/)
  assert.equal(s.TALENTBAY_NATIVE_ORIGIN, origin)
  assert.notEqual(a.HOME, s.HOME)
  assert.equal(a.HOME, a.TMPDIR)
  assert.equal(agent.options.cwd, a.HOME)
  assert.equal(agent.options.stdio, 'ignore')
  assert.deepEqual([mode, homeMode], [0o600, 0o700])
  assert.match(yaml, /^version: "3"\nagent:\n/)
  assert.ok(yaml.split('\n').includes('  web_addr: false'))
  assert.ok(yaml.split('\n').includes('  log: false'))
  for (const value of ['ambient', h.env.TALENTBAY_NGROK_AUTHTOKEN]) assert.ok(!JSON.stringify(s).includes(value))
  for (const value of ['ambient', s.TALENTBAY_TEST_BOT_TOKEN, s.TALENTBAY_TEST_WEBHOOK_SECRET]) assert.ok(!JSON.stringify(a).includes(value))
  for (const value of [a.NGROK_AUTHTOKEN, s.TALENTBAY_TEST_BOT_TOKEN, s.TALENTBAY_TEST_WEBHOOK_SECRET])
    assert.ok(!(yaml + JSON.stringify(agent.args) + JSON.stringify(server.args)).includes(value))
  assert.deepEqual(h.requests.map(r => r.url), [local + path, origin + '/api/health', origin + path])
  for (const { options } of h.requests) {
    assert.deepEqual(options.headers, { accept: 'application/json', 'ngrok-skip-browser-warning': '1', 'cache-control': 'no-cache' })
    assert.equal(options.rejectUnauthorized, true)
    assert.equal(options.agent, false)
  }
  assert.deepEqual(h.bindings, [
    ['configure', { token: s.TALENTBAY_TEST_BOT_TOKEN, origin, webhookSecret: s.TALENTBAY_TEST_WEBHOOK_SECRET }],
    ['detach', { token: s.TALENTBAY_TEST_BOT_TOKEN, origin }],
  ])
  assert.deepEqual(h.children.map(c => c.kills), [['SIGTERM'], ['SIGTERM']])
  assert.ok(!existsSync(a.HOME) && !existsSync(s.HOME))
})

test('invalid origins and absent dedicated inputs fail before child creation; no ambient fallback', async (t) => {
  const h = harness(t)
  for (const invalid of ['http://fixture.ngrok.app', 'https://a.b.ngrok.dev', 'https://user@fixture.ngrok.dev',
    origin + '/dev', origin + ':443', origin + '?x', origin + '#frag', origin + '.invalid', origin + '\n']) {
    h.env.TALENTBAY_NATIVE_ORIGIN = invalid
    await assert.rejects(h.start, /exact dedicated HTTPS/)
  }
  h.env.TALENTBAY_NATIVE_ORIGIN = origin
  delete h.env.TALENTBAY_NGROK_AUTHTOKEN
  await assert.rejects(h.start, /dedicated test bot token and ngrok/)
  assert.equal(h.versions.length + h.calls.length + h.requests.length + h.bindings.length, 0)
})

for (const [label, opts] of [
  ['early server exit', { exitBeforeReady: true }],
  ['untrusted IPC route', { ready: { type: 'ready', slug: '../elsewhere' } }],
  ['unrelated loopback process', { reply: () => [200, { slug }] }],
]) {
  test(label + ' never starts a tunnel', async (t) => {
    const h = harness(t, opts)
    await assert.rejects(h.start)
    assert.equal(h.calls.length, 1)
    assert.deepEqual(h.bindings, [])
    assert.ok(!existsSync(h.calls[0].options.env.HOME))
  })
}

for (const [label, suffix, response] of [
  ['unexpected public health', '/api/health', [200, { status: 'ok' }]],
  ['redirect', '/api/health', [302, health]],
  ['HTML warning', '/api/health', [200, '<html>', 'text/html']],
  ['malformed JSON', '/api/health', [200, '{']],
  ['oversized body', '/api/health', [200, 'x'.repeat(150_000)]],
  ['different vacancy', path, [200, { ...vacancy, slug: 'other' }]],
  ['echoed slug, wrong context', path, [200, { ...vacancy, applicationContext: 'other' }]],
  ['wrapped rather than actual schema', path, [200, { data: vacancy }]],
]) {
  test(label + ' never binds or detaches the bot', async (t) => {
    const h = harness(t, { reply: url => url === origin + suffix ? response : undefined })
    await assert.rejects(h.start)
    assert.deepEqual(h.bindings, [])
    assert.ok(h.requests.every(r => r.url.startsWith(local + '/') || r.url.startsWith(origin + '/')))
    assert.deepEqual(h.children.map(c => c.kills), [['SIGTERM'], ['SIGTERM']])
  })
}

test('rejected partial configure detaches only the same origin and suppresses provider errors', async (t) => {
  const h = harness(t, { configure: () => { throw new Error('private provider details') } })
  await assert.rejects(h.start, { message: 'Native review failed during Telegram test bot binding.' })
  assert.deepEqual(h.bindings.map(([op]) => op), ['configure', 'detach'])
  assert.deepEqual(h.bindings[1][1], { origin, token: h.env.TALENTBAY_TEST_BOT_TOKEN })
})

test('transient edge startup retries without credentials; server remains reserved throughout detach', async (t) => {
  const secret = randomBytes(32).toString('hex')
  let probes = 0, serverStillOwned = false
  const h = harness(t, {
    env: { TALENTBAY_TEST_WEBHOOK_SECRET: secret },
    reply: url => url === origin + '/api/health' && ++probes === 1 ? [503, {}] : undefined,
    async detach() {
      await Promise.resolve()
      serverStillOwned = h.children[0].kills.length === 0
    },
  })
  await h.start()
  assert.equal(probes, 2)
  assert.equal(serverStillOwned, true)
  assert.equal(h.bindings[0][1].webhookSecret, secret)
  assert.ok(!JSON.stringify(h.requests).includes(secret))
})

test('server loss during configure closes the tunnel immediately, then detaches after configure settles', async (t) => {
  const order = []
  const h = harness(t, {
    async configure([server, agent]) {
      server.finish(1, null)
      await Promise.resolve()
      order.push(agent.signalCode, 'configure settled')
    },
    detach: () => order.push('detach'),
  })
  await assert.rejects(h.start, /Owned server stopped/)
  assert.deepEqual(order, ['SIGTERM', 'configure settled', 'detach'])
})

test('ngrok loss after bind stops the server and reports a failed detach without leaking its cause', async (t) => {
  const h = harness(t, {
    onReady: ({ children }) => children[1].finish(1, null),
    detach: () => { throw new Error('private provider details') },
  })
  await assert.rejects(h.start, { message: 'Could not confirm removal of the test bot binding.' })
  assert.deepEqual(h.children.map(c => c.kills), [['SIGTERM'], []])
  assert.ok(!existsSync(h.calls[1].options.env.HOME))
})
