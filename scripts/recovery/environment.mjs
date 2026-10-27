import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:net'
import { dirname, join } from 'node:path'
import postgres from 'postgres'
import { assertCiDatabaseEnvironment } from '../assert-ci-database.mjs'

export function recoveryEnvironment(input = process.env) {
  const env = Object.fromEntries(['HOME', 'USER', 'TMPDIR', 'PATH', 'LANG'].flatMap(key => input[key] ? [[key, input[key]]] : []))
  env.PATH = `${dirname(process.execPath)}:${env.PATH || ''}`
  return env
}

export function runChecked(file, args, options, stage) {
  try { return execFileSync(file, args, { ...options, stdio: 'pipe', timeout: 120_000, maxBuffer: 1024 * 1024 }).toString() }
  catch { throw new Error(`Recovery rehearsal failed during ${stage}; raw child output is withheld.`) }
}

export function existingPostgresBin(env) {
  const bin = process.env.PG_BIN || ['/opt/homebrew/opt/postgresql@18/bin', '/usr/local/opt/postgresql@18/bin', '/usr/lib/postgresql/18/bin'].find(path => existsSync(join(path, 'pg_ctl')))
  if (!bin || !/PostgreSQL\) 18\./.test(runChecked(join(bin, 'postgres'), ['--version'], { env }, 'PostgreSQL version check'))) throw new Error('Recovery rehearsal requires already installed PostgreSQL18; set PG_BIN, no installer is run.')
  return bin
}

export async function freePort() {
  const listener = createServer()
  await new Promise((resolve, reject) => { listener.once('error', reject); listener.listen(0, '127.0.0.1', resolve) })
  const port = listener.address().port
  await new Promise(resolve => listener.close(resolve))
  return port
}

export async function newRecoveryCluster(folder, bin, baseEnv, cwd) {
  mkdirSync(folder, { mode: 0o700 })
  const port = await freePort(), data = join(folder, 'data')
  const env = { ...baseEnv, CI: 'true', TALENTBAY_TEST_DATABASE: 'disposable', DATABASE_URL: `postgresql://talentbay_ci@127.0.0.1:${port}/talentbay_ci`, DATABASE_MIGRATION_URL: `postgresql://talentbay_ci@127.0.0.1:${port}/talentbay_ci` }
  assertCiDatabaseEnvironment(env)
  const command = (name, args) => runChecked(join(bin, name), args, { env, cwd }, name)
  const connectionArgs = ['-h', '127.0.0.1', '-p', String(port), '-U', 'talentbay_ci']
  let client
  return {
    env,
    async start() {
      command('initdb', ['-D', data, '-U', 'talentbay_ci', '-A', 'trust', '--encoding=UTF8', '--no-locale'])
      command('pg_ctl', ['-D', data, '-l', join(folder, 'postgres.log'), '-o', `-h 127.0.0.1 -p ${port} -k ''`, '-w', 'start'])
      command('createdb', [...connectionArgs, 'talentbay_ci'])
      client = postgres(env.DATABASE_URL, { max: 1, prepare: false, connect_timeout: 2, connection: { timezone: 'UTC' } })
    },
    sql() { if (!client) throw new Error('Recovery cluster is not started'); return client },
    migrate() { return runChecked(process.execPath, ['node_modules/drizzle-kit/bin.cjs', 'migrate'], { env, cwd }, 'committed migrations') },
    dump(path) { command('pg_dump', [...connectionArgs, '--format=custom', '--no-owner', '--no-acl', '--file', path, 'talentbay_ci']) },
    restore(path) { command('pg_restore', [...connectionArgs, '--exit-on-error', '--single-transaction', '--no-owner', '--no-acl', '--dbname', 'talentbay_ci', path]) },
    async stop() {
      await client?.end({ timeout: 2 }); client = undefined
      if (existsSync(join(data, 'postmaster.pid'))) command('pg_ctl', ['-D', data, '-m', 'fast', '-w', 'stop'])
    },
  }
}

export async function recoveryInventory(sql) {
  const tables = await sql`select schemaname,tablename from pg_tables where schemaname in ('public','drizzle') order by schemaname,tablename`
  const inventory = []
  for (const table of tables) {
    assert.match(table.schemaname, /^[a-z_]+$/); assert.match(table.tablename, /^[a-z_]+$/)
    const [row] = await sql`select count(*)::int as count,coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]'::jsonb)::text as rows from ${sql(table.schemaname+'.'+table.tablename)} t`
    inventory.push({ table: table.schemaname+'.'+table.tablename, count: row.count, digest: createHash('sha256').update(row.rows).digest('hex') })
  }
  const sequences = await sql`select schemaname,sequencename,last_value,start_value,increment_by,cycle from pg_sequences where schemaname in ('public','drizzle') order by schemaname,sequencename`
  const indexes = await sql`select schemaname,indexname,indexdef from pg_indexes where schemaname in ('public','drizzle') order by schemaname,indexname`
  return { inventory, sequences, indexes }
}
