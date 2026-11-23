import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { lstatSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { existingPostgresBin, newRecoveryCluster, recoveryEnvironment } from '../recovery/environment.mjs'

const root = fileURLToPath(new URL('../../', import.meta.url))
const output = join(root, '.output-native-review')
const entry = join(output, 'server/index.mjs')
const host = '127.0.0.1', port = 4317
const username = 'talentbay_tester_bot'
const title = 'Fictional Native Review Engineer'
const company = 'Fictional Native Review Company'
const source = 'TalentBay editorial'
const runtimeRole = 'native_review_runtime'

export function reviewInputs(input) {
  const origin = input.TALENTBAY_NATIVE_ORIGIN
  if (typeof origin !== 'string' || !/^https:\/\/[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.ngrok(?:-free)?\.(?:app|dev)\/?$/.test(origin))
    throw new Error('Expected an HTTPS ngrok origin')
  const token = input.TALENTBAY_TEST_BOT_TOKEN
  if (typeof token !== 'string' || !/^[1-9]\d{0,15}:[A-Za-z0-9_-]{20,128}$/.test(token))
    throw new Error('Expected a tester bot token')
  const secret = input.TALENTBAY_TEST_WEBHOOK_SECRET
  if (secret !== undefined && !/^[A-Za-z0-9_-]{32,256}$/.test(secret))
    throw new Error('Invalid test webhook secret')
  return { origin: new URL(origin).origin, token, secret }
}

export async function verifyTester(token, signal, fetchImpl = fetch) {
  try {
    const response = await fetchImpl(`https://api.telegram.org/bot${token}/getMe`, {
      method: 'POST', redirect: 'error', signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]),
    })
    if (response.ok) {
      const { ok, result } = await response.json()
      if (ok === true && result?.is_bot === true && result.username === username
        && Number.isSafeInteger(result.id) && String(result.id) === token.split(':')[0]) return String(result.id)
    } else await response.body?.cancel()
  } catch { /* Fetch/parser errors can contain the credential-bearing URL. */ }
  throw new Error('Tester bot identity verification failed')
}

export function nodeOutput(metadata, marker) {
  return marker === 'isolated-node-v1\n' && metadata?.preset === 'node-server' && metadata.framework?.name === 'nuxt'
    && metadata.commands?.preview === 'node server/index.mjs'
}

export function runtimeEnvironment(database, config, botID) {
  return {
    NODE_ENV: 'production', HOST: host, PORT: String(port), NITRO_HOST: host, NITRO_PORT: String(port),
    DATABASE_URL: database, NUXT_SESSION_PASSWORD: randomBytes(48).toString('hex'),
    NUXT_TELEGRAM_BOT_TOKEN: config.token, NUXT_TELEGRAM_BOT_ID: botID, NUXT_TELEGRAM_BOT_USERNAME: username,
    NUXT_TELEGRAM_APP_ORIGIN: config.origin, NUXT_TELEGRAM_WEBHOOK_SECRET: config.secret ?? '',
    NUXT_PUBLIC_LOCAL_REVIEW_PORTAL: '', NUXT_OAUTH_GOOGLE_CLIENT_ID: '', NUXT_OAUTH_GOOGLE_CLIENT_SECRET: '',
    NUXT_OAUTH_GITHUB_CLIENT_ID: '', NUXT_OAUTH_GITHUB_CLIENT_SECRET: '',
  }
}

export async function prepareDatabase(cluster, folder) {
  const sql = cluster.sql()
  const [owner] = await sql`select current_setting('data_directory') as data,
    current_database() as db, current_user as role`
  if (owner.data !== join(folder, 'data') || owner.role !== 'talentbay_ci' || owner.db !== 'talentbay_ci')
    throw new Error('Unexpected cluster identity')
  cluster.migrate()
  const slug = 'native-review-' + randomBytes(16).toString('hex')
  const companySlug = 'fictional-native-review-' + randomBytes(16).toString('hex')
  const [vacancy] = await sql`with org as (
    insert into organisations (slug,name,status) values (${companySlug},${company},'ACTIVE') returning id
  ) insert into vacancies (organisation_id,slug,title,summary,description,status,review_status,
    employment_type,workplace_type,country_code,city,salary_min,salary_max,salary_currency,salary_period,
    relocation_offered,source_name,published_at,talentbay_published_at,reviewed_at)
    select id,${slug},${title},'Fictional role for a native client check.',
    'This fictional employer is not hiring. Applications are not sent to an employer.',
    'PUBLISHED','VERIFIED','FULL_TIME','HYBRID','GB','London',95000,125000,'GBP','YEAR',
    true,${source},now(),now(),now() from org returning id`

  const password = randomBytes(32).toString('hex')
  // CREATE ROLE does not accept a bind parameter. Only the generated hex literal enters SQL.
  await sql.unsafe(`create role native_review_runtime login password '${password}'`)
  await sql`revoke temporary on database talentbay_ci from public`
  await sql`revoke create on schema public from public`
  await sql`grant select on all tables in schema public to native_review_runtime`
  // FOR SHARE needs UPDATE on one column of each locked table. Use inert,
  // fixture-only columns so the exposed runtime cannot change catalogue fields.
  await sql`alter table vacancies add column native_review_lock boolean generated always as (true) stored`
  await sql`alter table organisations add column native_review_lock boolean generated always as (true) stored`
  await sql`grant update (native_review_lock) on vacancies, organisations to native_review_runtime`
  await sql`grant insert, update, delete on users, oauth_accounts, candidate_profiles,
    applications, application_handling_events, bot_entry_receipts to native_review_runtime`
  await sql`grant usage on all sequences in schema public to native_review_runtime`
  await sql.begin(async tx => {
    await tx`set local role native_review_runtime`
    const rows = await tx`select v.id from vacancies v join organisations o on o.id = v.organisation_id
      where v.id = ${vacancy.id} for share of v, o`
    if (rows.length !== 1) throw new Error('Fixture unavailable for application intake')
  })
  // The recovery helper bootstraps with trust. Close owner logins and require
  // SCRAM before exposing the app; do not persist request/statement errors.
  await sql`alter system set log_min_messages = 'panic'`
  await sql`alter system set log_min_error_statement = 'panic'`
  writeFileSync(join(folder, 'data/pg_hba.conf'), `host talentbay_ci ${runtimeRole} 127.0.0.1/32 scram-sha-256\n`)
  await sql`select pg_reload_conf()`
  const database = new URL(cluster.env.DATABASE_URL)
  database.username = runtimeRole
  database.password = password
  return { database: database.href, fixture: { id: vacancy.id, slug, companySlug } }
}

async function waitForVacancy({ id, slug, companySlug }, signal, fetchImpl) {
  const deadline = AbortSignal.any([signal, AbortSignal.timeout(30_000)])
  for (;;) {
    deadline.throwIfAborted()
    let response
    try {
      response = await fetchImpl(`http://${host}:${port}/api/v1/vacancies/${slug}`, {
        redirect: 'error', signal: AbortSignal.any([deadline, AbortSignal.timeout(2000)]),
      })
    } catch { /* A fresh Nitro process may not be listening yet. */ }
    if (response) {
      if (response.ok) {
        const row = await response.json()
        if (row?.id === id && row.slug === slug && row.title === title && row.company?.name === company && row.company.slug === companySlug
          && row.source?.status === 'VERIFIED' && row.source.name === source && /^v1:[0-9a-f]{64}$/.test(row.applicationContext)) return
      } else await response.body?.cancel()
      throw new Error('Loopback listener did not return the owned vacancy')
    }
    await sleep(100, undefined, { signal: deadline })
  }
}

export async function supervise(child, fixture, shutdown, ready, fetchImpl = fetch) {
  const stopped = new AbortController()
  const closed = new Promise(resolve => child.once('close', () => { stopped.abort(); resolve() }))
  child.once('error', () => stopped.abort())
  child.once('exit', () => stopped.abort())
  const signal = AbortSignal.any([shutdown, stopped.signal])
  try {
    await waitForVacancy(fixture, signal, fetchImpl)
    signal.throwIfAborted()
    await ready({ type: 'ready', slug: fixture.slug })
    if (!signal.aborted) await new Promise(resolve => signal.addEventListener('abort', resolve, { once: true }))
    if (!shutdown.aborted) throw new Error('Owned Nitro process exited')
  } finally {
    // Only signal this child handle, never a process found by port or process name.
    if (child.pid && child.exitCode === null && child.signalCode === null) child.kill('SIGTERM')
    const timer = setTimeout(() => {
      if (child.pid && child.exitCode === null && child.signalCode === null) child.kill('SIGKILL')
    }, 3000)
    try { await closed } finally { clearTimeout(timer) }
  }
}

async function main() {
  const shutdown = new AbortController()
  const stop = () => shutdown.abort()
  const signals = ['SIGINT', 'SIGTERM', 'SIGHUP', 'disconnect']
  for (const event of signals) process.on(event, stop)
  let phase = 'input validation', reservation, folder, cluster
  try {
    if (process.argv.length !== 2) throw new Error('No arguments supported')
    const config = reviewInputs(process.env)
    const base = recoveryEnvironment()
    // postgres.js also consults ambient PG* variables inside the launcher.
    process.env = { ...base, ...(process.env.PG_BIN ? { PG_BIN: process.env.PG_BIN } : {}) }
    phase = 'compiled Node output validation'
    if (!nodeOutput(JSON.parse(readFileSync(join(output, 'nitro.json'), 'utf8')),
      readFileSync(join(output, '.talentbay-native-build'), 'utf8')) || !lstatSync(entry).isFile())
      throw new Error('Expected a compiled Nuxt node-server artifact')
    phase = 'exclusive loopback port check'
    reservation = createServer(socket => socket.destroy())
    await new Promise((resolve, reject) => {
      reservation.once('error', reject)
      reservation.listen({ host, port, exclusive: true }, resolve)
    })
    phase = 'tester bot verification'
    const botID = await verifyTester(config.token, shutdown.signal)
    shutdown.signal.throwIfAborted()
    phase = 'isolated PostgreSQL setup'
    const bin = existingPostgresBin(base)
    folder = mkdtempSync(join(realpathSync(tmpdir()), 'talentbay-native-review-'))
    const pgFolder = join(folder, 'pg')
    cluster = await newRecoveryCluster(pgFolder, bin, { ...base, HOME: folder, DOTENV_CONFIG_PATH: '/dev/null' }, root)
    shutdown.signal.throwIfAborted()
    await cluster.start()
    shutdown.signal.throwIfAborted()
    phase = 'migration and fictional fixture setup'
    const { database, fixture } = await prepareDatabase(cluster, pgFolder)
    phase = 'compiled app supervision'
    await new Promise(resolve => reservation.close(resolve))
    shutdown.signal.throwIfAborted()
    const child = spawn(process.execPath, [entry], { cwd: folder, env: runtimeEnvironment(database, config, botID), stdio: 'ignore' })
    await supervise(child, fixture, shutdown.signal, async (message) => {
      if (process.send) await new Promise((resolve, reject) => process.send(message, error => error ? reject(error) : resolve()))
      console.log('Native review ready on loopback port 4317.')
    })
  } catch {
    if (!shutdown.signal.aborted) {
      console.error(`Native review failed during ${phase}; details withheld.`)
      process.exitCode = 1
    }
  } finally {
    if (reservation?.listening) await new Promise(resolve => reservation.close(resolve))
    try {
      await cluster?.stop()
      if (folder) rmSync(folder, { recursive: true, force: true })
    } catch {
      // Never unlink a data directory whose postmaster may still be running.
      console.error('Native review cleanup incomplete; details withheld.')
      process.exitCode = 1
    }
    for (const event of signals) process.off(event, stop)
    if (process.connected) process.disconnect()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => { console.error('Native review stopped unexpectedly; details withheld.'); process.exitCode = 1 })
}
