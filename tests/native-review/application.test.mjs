import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { once } from 'node:events'
import { mkdtempSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { request } from '@playwright/test'
import { applicationDisclosureVersion } from '../../shared/types/application-handling.ts'
import { signedReviewLaunch, personas } from '../../scripts/local-review/portal.mjs'
import { prepareDatabase, runtimeEnvironment } from '../../scripts/native-review/server.mjs'
import { existingPostgresBin, freePort, newRecoveryCluster, recoveryEnvironment } from '../../scripts/recovery/environment.mjs'

// No ngrok, Telegram requests, developer dotenv, or shared database. Use the same
// fixture provisioning and restricted login as the app behind the tester bot.
test('native review runtime: save the profile, apply once and find the receipt', async () => {
  const root = fileURLToPath(new URL('../../', import.meta.url))
  const env = recoveryEnvironment(), bin = existingPostgresBin(env)
  const dir = mkdtempSync(join(realpathSync(tmpdir()), 'tb-native-apply-'))
  const folder = join(dir, 'pg')
  const cluster = await newRecoveryCluster(folder, bin, env, root)
  let api, server
  try {
    await cluster.start()
    const { database, fixture } = await prepareDatabase(cluster, folder)
    const port = String(await freePort()), origin = 'http://127.0.0.1:' + port
    const token = '12345:' + randomBytes(32).toString('hex')
    server = spawn(process.execPath, [join(root, '.output/server/index.mjs')], {
      cwd: dir, stdio: 'ignore', env: { ...runtimeEnvironment(database, { token, origin }, '12345'), PORT: port, NITRO_PORT: port },
    })
    api = await request.newContext({ baseURL: origin, extraHTTPHeaders: { origin }, timeout: 5000 })
    const path = '/api/v1/vacancies/' + fixture.slug
    for (let i = 0; i < 60; i++) {
      if (server.exitCode !== null) assert.fail('Compiled test app exited before startup')
      if ((await api.get(path).catch(() => null))?.ok()) break
      await sleep(100)
    }
    const vacancy = await (await api.get(path)).json()
    assert.equal(vacancy.slug, fixture.slug)
    const login = await api.post('/api/v1/auth/telegram', { data: { initData: signedReviewLaunch(personas.newcomer, token) } })
    assert.equal(login.status(), 200)
    const { user } = await login.json()
    const profile = await api.put('/api/v1/profile', { headers: { 'X-TalentBay-Profile-Owner': String(user.id) }, data: { telegram: '@test_candidate' } })
    assert.equal(profile.status(), 200)
    const { candidateContext } = await profile.json()
    const input = { disclosureVersion: applicationDisclosureVersion, shareAcknowledged: true,
      expectedContext: vacancy.applicationContext, expectedCandidateContext: candidateContext, coverLetter: 'Synthetic candidate note' }
    const submit = () => api.post('/api/v1/vacancies/' + fixture.id + '/applications', { data: input })
    const first = await submit()
    const sql = cluster.sql()
    const [inventory] = await sql`select count(*)::int as applications from applications where vacancy_id=${fixture.id}`
    assert.equal(first.status(), 200, 'First submit: HTTP ' + first.status() + ', saved rows: ' + inventory.applications)
    const receipt = await first.json()
    assert.ok(Number.isSafeInteger(receipt.id) && receipt.id > 0)
    assert.equal((await submit()).status(), 409)
    const history = await api.get('/api/v1/applications')
    assert.equal(history.status(), 200)
    const { items, total } = await history.json()
    assert.equal(total, 1)
    assert.equal(items[0].id, receipt.id)
    assert.deepEqual((await sql`select kind from application_handling_events where application_id=${receipt.id}`).map(row => row.kind), ['RECEIVED'])
    for (const table of ['vacancies', 'organisations']) {
      const [perms] = await sql`select has_table_privilege('native_review_runtime', ${table}::text, 'INSERT,UPDATE,DELETE,TRUNCATE') as writable`
      assert.equal(perms.writable, false)
    }
    assert.equal((await sql`select column_name from information_schema.column_privileges
      where grantee='native_review_runtime' and table_name in ('vacancies','organisations')
      and privilege_type in ('INSERT','UPDATE','DELETE') and column_name <> 'native_review_lock'`).length, 0)
  } finally {
    await api?.dispose()
    if (server?.pid && server.exitCode === null && server.signalCode === null) {
      const closed = once(server, 'close')
      server.kill('SIGTERM')
      const timer = setTimeout(() => server.kill('SIGKILL'), 3000)
      try { await closed } finally { clearTimeout(timer) }
    }
    await cluster.stop()
    rmSync(dir, { recursive: true, force: true })
  }
})
