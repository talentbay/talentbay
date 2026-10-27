import { spawn, execFileSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import postgres from 'postgres'
import { assertCiDatabaseEnvironment } from '../assert-ci-database.mjs'
import { createReviewPortal, personas, signedReviewLaunch } from './portal.mjs'
import { reviewCsv, seedReview } from './fixtures.mjs'

const root = fileURLToPath(new URL('../../', import.meta.url))
const { values } = parseArgs({ options: { port: { type: 'string', default: '3130' }, 'portal-port': { type: 'string', default: '3131' } } })
function port(value) {
  if (!/^\d+$/.test(value) || Number(value) < 1024 || Number(value) > 65535) throw new Error('Use an unprivileged port between 1024 and 65535')
  return Number(value)
}
const appPort = port(values.port)
const portalPort = port(values['portal-port'])
if (appPort === portalPort) throw new Error('Application and review portal need different ports')
const appOrigin = `http://127.0.0.1:${appPort}`
const portalOrigin = `http://127.0.0.1:${portalPort}`
const pgBin = process.env.PG_BIN || ['/opt/homebrew/opt/postgresql@18/bin', '/usr/local/opt/postgresql@18/bin', '/usr/lib/postgresql/18/bin']
  .find(path => existsSync(join(path, 'pg_ctl')))
if (!pgBin) throw new Error('PostgreSQL 18 is required. Set PG_BIN to its existing bin directory; nothing is installed automatically.')

// Deliberately do not inherit database URLs, provider credentials or dotenv files.
const env = Object.fromEntries(['HOME', 'USER', 'TMPDIR', 'PATH', 'LANG', 'TERM'].flatMap(key => process.env[key] ? [[key, process.env[key]]] : []))
env.PATH = `${dirname(process.execPath)}:${env.PATH || ''}`
let app, portal, sql, folder
let pgStarted = false
let stopping = false
const pg = (command, args) => execFileSync(join(pgBin, command), args, { env, cwd: root, stdio: 'pipe' })
async function availablePort(wanted = 0) {
  const listener = createServer()
  await new Promise((resolve, reject) => { listener.once('error', reject); listener.listen(wanted, '127.0.0.1', resolve) })
  const actual = listener.address().port
  await new Promise(resolve => listener.close(resolve))
  return actual
}
async function stop() {
  if (stopping) return
  stopping = true
  portal?.closeAllConnections()
  portal?.close()
  if (app?.pid && app.exitCode === null) {
    try { process.kill(-app.pid, 'SIGTERM') } catch { /* Already stopped. */ }
    await Promise.race([new Promise(resolve => app.once('exit', resolve)), new Promise(resolve => setTimeout(resolve, 3000))])
    try { process.kill(-app.pid, 'SIGKILL') } catch { /* Process group exited. */ }
  }
  await sql?.end({ timeout: 2 })
  if (pgStarted) pg('pg_ctl', ['-D', join(folder, 'data'), '-m', 'fast', '-w', 'stop'])
  if (folder) console.log(`Local review stopped. Synthetic database retained at ${folder}`)
}
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { void stop().finally(() => process.exit(0)) })

try {
  await availablePort(appPort)
  await availablePort(portalPort)
  const dbPort = await availablePort()
  folder = mkdtempSync(join(tmpdir(), 'talentbay-review-'))
  const emptyEnv = join(folder, 'empty.env')
  writeFileSync(emptyEnv, '# Local review intentionally loads no developer secrets.\n', { mode: 0o600 })
  pg('initdb', ['-D', join(folder, 'data'), '-U', 'talentbay_ci', '-A', 'trust', '--encoding=UTF8', '--no-locale'])
  pg('pg_ctl', ['-D', join(folder, 'data'), '-l', join(folder, 'postgres.log'), '-o', `-h 127.0.0.1 -p ${dbPort} -k ${folder}`, '-w', 'start'])
  pgStarted = true
  pg('createdb', ['-h', '127.0.0.1', '-p', String(dbPort), '-U', 'talentbay_ci', 'talentbay_ci'])
  const database = `postgresql://talentbay_ci@127.0.0.1:${dbPort}/talentbay_ci`
  Object.assign(env, {
    DATABASE_URL: database, DATABASE_MIGRATION_URL: database,
    CI: 'true', TALENTBAY_TEST_DATABASE: 'disposable', NUXT_TELEMETRY_DISABLED: '1',
    NUXT_SESSION_PASSWORD: randomBytes(48).toString('hex'), NUXT_TELEGRAM_BOT_TOKEN: randomBytes(48).toString('hex'),
    NUXT_TELEGRAM_BOT_ID: '', NUXT_TELEGRAM_BOT_USERNAME: '', NUXT_TELEGRAM_WEBHOOK_SECRET: '', NUXT_TELEGRAM_APP_ORIGIN: '',
    NUXT_OAUTH_GOOGLE_CLIENT_ID: '', NUXT_OAUTH_GOOGLE_CLIENT_SECRET: '',
    NUXT_OAUTH_GITHUB_CLIENT_ID: '', NUXT_OAUTH_GITHUB_CLIENT_SECRET: '',
    NUXT_PUBLIC_LOCAL_REVIEW_PORTAL: portalOrigin,
  })
  assertCiDatabaseEnvironment(env)
  console.log('Created isolated local PostgreSQL. Applying committed migrations...')
  execFileSync(process.execPath, ['node_modules/drizzle-kit/bin.cjs', 'migrate'], { env, cwd: root, stdio: 'pipe' })
  sql = postgres(database, { max: 1, prepare: false })
  app = spawn(process.execPath, ['node_modules/nuxt/bin/nuxt.mjs', 'dev', '--host', '127.0.0.1', '--port', String(appPort), '--dotenv', emptyEnv], { env, cwd: root, stdio: 'inherit', detached: true })
  app.once('error', () => { void stop().finally(() => { process.exitCode = 1 }) })
  app.once('exit', () => { if (!stopping) void stop().finally(() => { process.exitCode = 1 }) })
  let ready = false
  for (let attempt = 0; attempt < 120 && !stopping; attempt++) {
    try { ready = (await fetch(`${appOrigin}/api/health`, { signal: AbortSignal.timeout(2000) })).ok } catch { /* Initial compilation. */ }
    if (ready) break
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  if (!ready) throw new Error('Local Nuxt server did not become ready')
  const request = async (path, { method = 'GET', body, cookies = [] } = {}) => {
    const response = await fetch(`${appOrigin}${path}`, {
      method, signal: AbortSignal.timeout(30000),
      headers: { origin: appOrigin, 'content-type': 'application/json', cookie: cookies.map(cookie => cookie.split(';')[0]).join('; ') },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!response.ok) throw new Error(`Local review request ${method} ${path} failed (${response.status})`)
    return { data: await response.json(), cookies: response.headers.getSetCookie() }
  }
  const signIn = async (persona) => {
    const result = await request('/api/v1/auth/telegram', { method: 'POST', body: { initData: signedReviewLaunch(persona, env.NUXT_TELEGRAM_BOT_TOKEN) } })
    return { user: result.data.user, cookies: result.cookies }
  }
  await seedReview({ sql, request: async (...args) => (await request(...args)).data, signIn, personas })
  portal = createReviewPortal({ origin: portalOrigin, appOrigin, signIn, csv: reviewCsv() })
  await new Promise((resolve, reject) => { portal.once('error', reject); portal.listen(portalPort, '127.0.0.1', resolve) })
  console.log(`\nTalentBay local review: ${portalOrigin}\nApplication: ${appOrigin}/jobs\nFictional content and accounts only. No external provider or employer is contacted.\nCtrl+C stops Nuxt, the review portal and this disposable PostgreSQL cluster.`)
}
catch (error) {
  // Child-process errors may contain environment details; only print our own bounded errors.
  console.error(error?.status !== undefined ? 'A local setup command failed. Check the PostgreSQL installation and project dependencies.' : error.message)
  await stop()
  process.exitCode = 1
}
