import assert from 'node:assert/strict'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { assertCiDatabaseEnvironment } from '../assert-ci-database.mjs'
import { recoveryInventory } from '../recovery/environment.mjs'

// CI's guarded empty service or the owned runner only. Never reset/drop an existing DB.
assertCiDatabaseEnvironment()
if (process.argv.length !== 2) throw new Error('Migration verification accepts no target arguments')
const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false, connect_timeout: 2, onnotice: () => {} })
const migrations = fileURLToPath(new URL('../../server/db/migrations', import.meta.url))
const partial = mkdtempSync(join(tmpdir(), 'tb-upgrade-'))
let failed = false
try {
  const tables = await sql`select tablename from pg_tables where schemaname in ('public','drizzle')`
  assert.equal(tables.length, 0, 'Migration upgrade verification requires an empty disposable database; no reset is performed')
  const journal = JSON.parse(readFileSync(join(migrations, 'meta/_journal.json'), 'utf8'))
  assert.deepEqual(journal.entries.slice(0, 2).map(entry => entry.tag), ['0000_init', '0001_round_paibok'])
  mkdirSync(join(partial, 'meta'))
  writeFileSync(join(partial, 'meta/_journal.json'), JSON.stringify({ ...journal, entries: journal.entries.slice(0, 2) }))
  for (const entry of journal.entries.slice(0, 2)) copyFileSync(join(migrations, entry.tag+'.sql'), join(partial, entry.tag+'.sql'))
  const db = drizzle(sql)
  await migrate(db, { migrationsFolder: partial })
  const [owner] = await sql`insert into users (name,email) values ('Synthetic Legacy Candidate','legacy-upgrade@talentbay.invalid') returning id`
  await sql`insert into oauth_accounts (user_id,provider,provider_account_id) values (${owner.id},'GOOGLE','synthetic-legacy-subject')`
  await sql`insert into candidate_profiles (user_id,headline,telegram) values (${owner.id},'Synthetic unchanged profile','@synthetic_upgrade')`
  const [company] = await sql`insert into organisations (name,slug,status) values ('Synthetic Upgrade Company','synthetic-upgrade','ACTIVE') returning id`
  const [vacancy] = await sql`insert into vacancies (organisation_id,slug,title,description,status,review_status,employment_type,workplace_type,country_code,skills)
    values (${company.id},'synthetic-upgrade','Synthetic legacy vacancy','Synthetic only','PUBLISHED','VERIFIED','FULL_TIME','REMOTE','GB',array['TypeScript']) returning id`
  const [application] = await sql`insert into applications (user_id,vacancy_id,cover_letter) values (${owner.id},${vacancy.id},'Unchanged synthetic note') returning id`
  const originals = new Map()
  for (const table of ['users','oauth_accounts','candidate_profiles','organisations','vacancies','applications']) {
    const rows = await sql`select to_jsonb(t) as row from ${sql(table)} t`
    originals.set(table, rows.map(item => item.row))
  }
  await migrate(db, { migrationsFolder: migrations })
  for (const [table, before] of originals) {
    const rows = await sql`select to_jsonb(t) as row from ${sql(table)} t`
    assert.deepEqual(rows.map(item => Object.fromEntries(Object.keys(before[0]).map(key => [key, item.row[key]]))), before, 'Migration changed legacy fields/IDs')
  }
  const [legacy] = await sql`select submission_snapshot,handling_revision,handling_stage from applications where id=${application.id}`
  assert.deepEqual(legacy, { submission_snapshot: null, handling_revision: 0, handling_stage: 'RECEIVED' })
  assert.equal((await sql`select id from application_handling_events`).length, 0, 'No invented legacy events')
  const [modern] = await sql`insert into users (name) values ('Synthetic Telegram Candidate') returning id`
  await sql`insert into oauth_accounts (user_id,provider,provider_account_id) values (${modern.id},'TELEGRAM','synthetic-new-subject')`
  const beforeReplay = await recoveryInventory(sql)
  await migrate(db, { migrationsFolder: migrations })
  assert.deepEqual(await recoveryInventory(sql), beforeReplay, 'Migration replay changed rows/sequences/indexes')
  const [{ count }] = await sql`select count(*)::int as count from drizzle.__drizzle_migrations`
  assert.equal(count, journal.entries.length)
  await sql`delete from users where id in (${owner.id},${modern.id})`
  await sql`delete from vacancies where id=${vacancy.id}`
  await sql`delete from organisations where id=${company.id}`
  console.log(JSON.stringify({ check: 'legacy migration upgrade', result: 'PASS', from: '0001', to: journal.entries.at(-1).tag, preservedTables: originals.size, inventedHistory: false, mixedIdentity: true, replayUnchanged: true }))
} catch {
  failed = true
  console.error('Synthetic migration upgrade failed; existing databases are never dropped/reset and raw errors are withheld.')
} finally {
  await sql.end({ timeout: 2 })
  rmSync(partial, { recursive: true, force: true })
  if (failed) process.exitCode = 1
}
