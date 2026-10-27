import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { randomBytes, randomUUID } from 'node:crypto'
import { chmodSync, existsSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { personas, signedReviewLaunch } from '../local-review/portal.mjs'
import { seedReview } from '../local-review/fixtures.mjs'
import { existingPostgresBin, freePort, newRecoveryCluster, recoveryEnvironment, recoveryInventory, runChecked } from './environment.mjs'

const root = fileURLToPath(new URL('../../', import.meta.url))
const env = recoveryEnvironment(), bin = existingPostgresBin(env)
const folder = mkdtempSync(join(tmpdir(), 'tb-restore-'))
chmodSync(folder, 0o700)
const clusters = []
const token = randomBytes(48).toString('hex'), session = randomBytes(48).toString('hex')
let app, report, logs = '', failed = false, phase = 'setup'

async function stopApp() {
  const child = app; app = undefined
  if (!child || child.exitCode !== null || child.signalCode !== null) return
  const exited = new Promise(resolve => child.once('close', resolve))
  child.kill('SIGTERM')
  const timer = setTimeout(() => { if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL') }, 3000)
  await exited; clearTimeout(timer)
}
async function cleanup() {
  await stopApp()
  for (const cluster of [...clusters].reverse()) try { await cluster.stop() } catch { failed = true }
}
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { void cleanup().finally(() => process.exit(1)) })

async function startApp(cluster) {
  await stopApp()
  const port = await freePort(), origin = `http://127.0.0.1:${port}`
  app = spawn(process.execPath, ['.output/server/index.mjs'], { cwd: root, env: {
    ...cluster.env, HOST: '127.0.0.1', PORT: String(port), NUXT_SESSION_PASSWORD: session, NUXT_TELEGRAM_BOT_TOKEN: token,
    NUXT_TELEGRAM_BOT_ID: '', NUXT_TELEGRAM_BOT_USERNAME: '', NUXT_TELEGRAM_WEBHOOK_SECRET: '', NUXT_TELEGRAM_APP_ORIGIN: '',
    NUXT_OAUTH_GOOGLE_CLIENT_ID: '', NUXT_OAUTH_GOOGLE_CLIENT_SECRET: '', NUXT_OAUTH_GITHUB_CLIENT_ID: '', NUXT_OAUTH_GITHUB_CLIENT_SECRET: '',
    NUXT_PUBLIC_LOCAL_REVIEW_PORTAL: '', NUXT_TELEMETRY_DISABLED: '1',
  }, stdio: ['ignore', 'pipe', 'pipe'] })
  app.once('error', () => { failed = true })
  for (const stream of [app.stdout, app.stderr]) stream.on('data', bytes => { logs = (logs + bytes.toString()).slice(-128_000) })
  for (let attempt = 0; attempt < 50; attempt++) {
    try { if ((await fetch(origin+'/api/health', { signal: AbortSignal.timeout(1000) })).ok) break } catch { /* Process startup. */ }
    if (app.exitCode !== null || app.signalCode !== null || attempt === 49) throw new Error('Synthetic app startup failed')
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  const request = async (path, { method = 'GET', body, cookies = [], expected = 200 } = {}) => {
    const response = await fetch(origin+path, { method, headers: { origin, 'content-type': 'application/json', cookie: cookies.map(value => value.split(';')[0]).join('; ') }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(15_000) })
    assert.equal(response.status, expected, 'Unexpected synthetic API status')
    return { data: await response.json(), cookies: response.headers.getSetCookie(), requestID: response.headers.get('x-request-id') }
  }
  const signIn = async persona => {
    const result = await request('/api/v1/auth/telegram', { method: 'POST', body: { initData: signedReviewLaunch(persona, token) } })
    return { user: result.data.user, cookies: result.cookies }
  }
  return { origin, request, signIn }
}

try {
  if (process.argv.length !== 2) throw new Error('Recovery rehearsal accepts no source, target, archive or credential arguments')
  if (!existsSync(join(root, '.output/server/index.mjs'))) throw new Error('Build the Node application before recovery rehearsal')
  for (const name of ['source', 'restored']) {
    const cluster = await newRecoveryCluster(join(folder, name), bin, env, root)
    clusters.push(cluster); await cluster.start()
  }
  const [source, restored] = clusters
  phase = 'source migrations and API fixtures'
  source.migrate()
  const first = await startApp(source)
  phase = 'unknown API privacy boundary'
  const missing = await first.request('/api/PRIVATE_RECOVERY_PATH/private%40example.invalid', { expected: 404 })
  assert.equal(JSON.stringify(missing.data).includes('PRIVATE_RECOVERY_PATH'), false)
  phase = 'source API fixtures'
  await seedReview({ sql: source.sql(), request: async (...args) => (await first.request(...args)).data, signIn: first.signIn, personas })
  const admin = await first.signIn(personas.admin), candidate = await first.signIn(personas.candidate)
  const cli = args => JSON.parse(runChecked(process.execPath, ['node_modules/tsx/dist/cli.mjs', '--tsconfig', 'tsconfig.operations.json', 'scripts/relocation-dataset.ts', '--file', 'docs/examples/relocation-synthetic.v1.json', '--actor-id', String(admin.user.id), ...args], { cwd: root, env: source.env }, 'synthetic relocation import'))
  phase = 'synthetic relocation package'
  const plan = cli([]); cli(['--apply', '--revision', plan.result.revision])
  await source.sql()`insert into bot_entry_receipts (bot_id,update_id) values (999999,1),(999999,2)`
  await source.sql()`insert into source_imports (source_key,run_id,config_revision,state,actor_user_id,expires_at,report)
    values ('synthetic-recovery',${randomUUID()},'synthetic-only','FAILED',${admin.user.id},now()+interval '1 minute',${source.sql().json({ fetchedAt: null, pageCount: 0, recordCount: 0, created: 0, updated: 0, unchanged: 0, failure: 'SYNTHETIC', issues: [] })})`
  phase = 'append-only recovery fixture'
  const [handoff] = await source.sql()`select application_id from application_handling_events where kind='SHARED' limit 1`
  const detail = await first.request(`/api/v1/admin/applications/${handoff.application_id}`, { cookies: admin.cookies })
  const correction = { action: 'CORRECT', expectedRevision: detail.data.handling.revision, commandKey: randomUUID(), targetRevision: 5, reason: 'DETAILS_INACCURATE', privateNote: 'Synthetic recovery correction only' }
  await first.request(`/api/v1/admin/applications/${handoff.application_id}/handling`, { method: 'POST', cookies: admin.cookies, body: correction })
  assert.equal((await first.request(`/api/v1/admin/applications/${handoff.application_id}/handling`, { method: 'POST', cookies: admin.cookies, body: correction })).data.replayed, true)
  await stopApp()
  phase = 'source inventory and dump'
  const before = await recoveryInventory(source.sql())
  const archive = join(folder, 'synthetic.dump')
  source.dump(archive); chmodSync(archive, 0o600)
  phase = 'restore and exact inventory comparison'
  restored.restore(archive)
  assert.deepEqual(await recoveryInventory(restored.sql()), before, 'Restored table rows/sequences/indexes differ')
  restored.migrate()
  assert.deepEqual(await recoveryInventory(restored.sql()), before, 'Migration replay altered the restored state')
  phase = 'restored identities and application history'
  const after = await startApp(restored)
  const restoredAdmin = await after.signIn(personas.admin), restoredCandidate = await after.signIn(personas.candidate)
  assert.equal(restoredAdmin.user.id, admin.user.id); assert.equal(restoredCandidate.user.id, candidate.user.id)
  const overview = await after.request('/api/v1/admin/dashboard', { cookies: restoredAdmin.cookies })
  assert.equal(overview.data.applications, 5)
  const progress = await after.request(`/api/v1/applications/${handoff.application_id}/progress`, { cookies: restoredCandidate.cookies })
  assert.equal(progress.data.events.some(event => event.kind === 'CORRECTED'), true)
  assert.equal(JSON.stringify(progress.data).includes('Synthetic recovery correction only'), false)
  await after.request(`/api/v1/admin/applications/${handoff.application_id}/package`, { cookies: restoredAdmin.cookies, expected: 409 })
  const newCandidate = await after.signIn(personas.newcomer)
  await after.request('/api/v1/profile', { method: 'PUT', cookies: newCandidate.cookies, body: { telegram: '@synthetic_restore_candidate' } })
  const jobs = await after.request('/api/v1/vacancies')
  assert.equal(jobs.data.total, 6)
  const application = await after.request(`/api/v1/vacancies/${jobs.data.items[0].id}/applications`, { method: 'POST', cookies: newCandidate.cookies, body: { disclosureVersion: 'talentbay-managed-v1', shareAcknowledged: true } })
  await after.request(`/api/v1/applications/${application.data.id}/withdraw`, { method: 'POST', cookies: newCandidate.cookies, body: {} })
  // A running process is not DB readiness. Return a real error, never an empty fake queue.
  phase = 'liveness versus database failure'
  await restored.stop()
  await after.request('/api/health')
  const unavailable = await after.request('/api/v1/admin/dashboard', { cookies: restoredAdmin.cookies, expected: 500 })
  assert.equal('applications' in unavailable.data, false)
  assert.match(unavailable.requestID, /^[a-f0-9-]{36}$/)
  assert.equal(JSON.stringify(unavailable.data).includes('postgresql:'), false)
  await stopApp()
  phase = 'runtime log redaction'
  for (const privateValue of [token, session, 'Sam Taylor', '@local_review_fixture', 'Synthetic recovery correction only', '@synthetic_restore_candidate', 'PRIVATE_RECOVERY_PATH', 'private%40example.invalid']) assert.equal(logs.includes(privateValue), false, 'Private data appeared in app logs')
  const records = logs.split('\n').flatMap(line => { try { const record = JSON.parse(line); return record.event ? [record] : [] } catch { return [] } })
  assert.equal(records.some(row => row.operation === 'application.handling' && row.result === 'replayed'), true)
  assert.equal(records.some(row => row.event === 'request.completed' && row.operation === 'application.handling' && row.path === '/api/v1/admin/applications/:id/handling'), true)
  report = { result: 'PASS', syntheticOnly: true, tables: before.inventory.length, rows: before.inventory.reduce((total, row) => total + row.count, 0), checks: ['rows/sequences/indexes identical', 'migration replay unchanged', 'permanent identities', 'corrected history/private boundary', 'no repeated handoff', 'profile/apply/withdraw', 'liveness is not DB readiness', 'redacted operation/replay logs'], artifacts: folder }
} catch {
  failed = true
  console.error(`Recovery rehearsal failed during ${phase}. No shared target or external provider is enabled; raw data/errors are withheld.`)
} finally {
  await cleanup()
  if (failed) process.exitCode = 1
  else console.log(JSON.stringify(report))
}
