import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { request } from 'node:http'
import { spawnSync } from 'node:child_process'
import { assertReviewOrigin, createReviewPortal, personas } from '../../scripts/local-review/portal.mjs'
import { recoveryEnvironment } from '../../scripts/recovery/environment.mjs'

const origin = 'http://127.0.0.1:3131'
const appOrigin = 'http://127.0.0.1:3130'
const calls = []
const server = createReviewPortal({
  origin, appOrigin, csv: 'title\nLocal fixture\n',
  botPreview: [{ command: '/start', text: '<script>not executable</script>', links: [{ label: 'Open TalentBay', path: '/jobs' }] }],
  signIn: async (persona) => { calls.push(persona); return { cookies: ['nuxt-session=local-fixture; Path=/; HttpOnly; SameSite=Lax'] } },
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const target = `http://127.0.0.1:${server.address().port}`
after(() => { server.closeAllConnections(); server.close() })
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = request(url, { method: options.method, headers: options.headers }, (res) => {
      const chunks = []
      res.on('data', chunk => chunks.push(chunk))
      res.on('end', () => resolve(new Response(Buffer.concat(chunks), { status: res.statusCode, headers: res.headers })))
    })
    req.on('error', reject)
    req.end(options.body?.toString())
  })
}
const headers = { host: '127.0.0.1:3131' }
const landing = await fetch(target, { headers })
const html = await landing.text()
const nonce = html.match(/name="nonce" value="([a-f0-9]+)"/)[1]
const session = (path, extra = {}) => fetch(`${target}/session/${path}`, {
  method: 'POST', redirect: 'manual',
  headers: { ...headers, origin, 'content-type': 'application/x-www-form-urlencoded', ...extra.headers },
  body: extra.body || new URLSearchParams({ nonce }),
})

test('review portal refuses remote origins and non-origin URL values', () => {
  assert.equal(assertReviewOrigin(origin), origin)
  for (const value of ['https://example.com', 'http://localhost:3131', 'http://127.0.0.1:3131/path', 'http://user@127.0.0.1:3131', 'http://127.0.0.1:3131/?secret=x']) {
    assert.throws(() => assertReviewOrigin(value))
  }
})

test('landing discloses fictional data, exposes all personas, never signs in on GET', async () => {
  assert.equal(landing.status, 200)
  assert.equal(landing.headers.get('cache-control'), 'no-store')
  assert.equal(landing.headers.get('referrer-policy'), 'same-origin')
  assert.ok(landing.headers.get('content-security-policy').includes(`form-action 'self' ${appOrigin}`))
  for (const item of Object.values(personas)) assert.ok(html.includes(item.label))
  assert.match(html, /fictional/)
  assert.match(html, /all outreach\/handoff events are fictional local examples/)
  assert.match(html, /No sender, confirmed employer delivery, live providers or real support service is connected/)
  assert.equal((await fetch(`${target}/session/admin`, { headers })).status, 403)
  assert.equal(calls.length, 0)
})

test('DNS-rebinding host and foreign-origin POST cannot obtain sessions', async () => {
  assert.equal((await fetch(target, { headers: { host: 'attacker.invalid:3131' } })).status, 403)
  assert.equal((await session('admin', { headers: { origin: 'https://attacker.invalid' } })).status, 403)
  assert.equal((await session('admin', { headers: { origin: 'null' } })).status, 403)
  assert.equal((await session('admin', { body: new URLSearchParams({ nonce: 'wrong' }) })).status, 403)
  assert.equal(calls.length, 0)
})

test('portal rejects oversized, wrong-content-type and arbitrary-identity requests', async () => {
  assert.equal((await session('admin', { body: 'x'.repeat(600) })).status, 413)
  assert.equal((await session('admin', { headers: { 'content-type': 'application/json' } })).status, 403)
  assert.equal((await session('arbitrary-user')).status, 404)
  assert.equal(calls.length, 0)
})

test('explicit candidate selection forwards HTTP-only session without a URL credential', async () => {
  const response = await session('candidate')
  assert.equal(response.status, 303)
  assert.equal(response.headers.get('location'), `${appOrigin}/jobs`)
  assert.match(response.headers.get('set-cookie'), /HttpOnly/)
  assert.deepEqual(calls, [personas.candidate])
})

test('guest selection clears the session and does not create an identity', async () => {
  const before = calls.length
  const response = await session('guest')
  assert.equal(response.status, 303)
  assert.match(response.headers.get('set-cookie'), /Max-Age=0/)
  assert.equal(calls.length, before)
})

test('operator CSV download is a bounded fixture and not executable HTML', async () => {
  const response = await fetch(`${target}/sample.csv`, { headers })
  assert.equal(response.headers.get('content-type'), 'text/csv; charset=utf-8')
  assert.equal(await response.text(), 'title\nLocal fixture\n')
})

test('fixed role destinations support direct review without an open redirect or privilege change', async () => {
  const response = await session('candidate', { body: new URLSearchParams({ nonce, destination: 'applications' }) })
  assert.equal(response.status, 303)
  assert.equal(response.headers.get('location'), `${appOrigin}/applications`)
  const before = calls.length
  for (const destination of ['https://attacker.invalid', '//attacker.invalid', 'overview', '__proto__', 'constructor']) {
    assert.equal((await session('candidate', { body: new URLSearchParams({ nonce, destination }) })).status, 400)
  }
  assert.equal((await session('candidate', { body: new URLSearchParams([['nonce', nonce], ['destination', 'jobs'], ['destination', 'applications']]) })).status, 400)
  assert.equal(calls.length, before)
})
test('offline bot preview is non-mutating escaped HTML with only local fixed links', async () => {
  const before = calls.length
  const response = await fetch(`${target}/bot`, { headers })
  const text = await response.text()
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.match(text, /This is not Telegram/)
  assert.match(text, /&lt;script&gt;not executable&lt;\/script&gt;/)
  assert.ok(text.includes(`href="${appOrigin}/jobs"`))
  assert.equal(calls.length, before)
  assert.throws(() => createReviewPortal({ origin, appOrigin, signIn: () => {}, csv: '', botPreview: [{ command: '/start', text: 'Unsafe fixture', links: [{ label: 'External', path: '//attacker.invalid' }] }] }), /Invalid offline bot preview/)
})
test('offline generator uses the real five-command contract without DB/provider credentials', () => {
  const result = spawnSync(process.execPath, ['node_modules/tsx/dist/cli.mjs', '--tsconfig', 'tsconfig.operations.json', 'scripts/local-review/bot-preview.ts'], { env: recoveryEnvironment(), encoding: 'utf8', timeout: 15_000 })
  assert.equal(result.status, 0)
  const preview = JSON.parse(result.stdout)
  assert.deepEqual(preview.map(item => item.command), ['/start', '/jobs', '/applications', '/help', '/privacy'])
  for (const item of preview) {
    assert.equal(typeof item.text, 'string')
    assert.ok(item.links.every(link => ['/jobs', '/applications', '/privacy'].includes(link.path)))
    assert.deepEqual(Object.keys(item).sort(), ['command', 'links', 'text'])
  }
})
