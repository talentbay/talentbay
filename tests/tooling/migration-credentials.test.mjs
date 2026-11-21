import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const cli = join(root, 'node_modules/drizzle-kit/bin.cjs')

function run(command, cwd, env) {
  const result = spawnSync(process.execPath, [cli, command], {
    cwd, env: { DOTENV_CONFIG_PATH: '/dev/null', ...env }, encoding: 'utf8', timeout: 60_000,
  })
  assert.ifError(result.error)
  return { status: result.status, output: result.stdout + result.stderr }
}

test('actual migrate CLI refuses a runtime-only target before selecting a driver', () => {
  for (const migration of [{}, { DATABASE_MIGRATION_URL: '  ' }]) {
    const result = run('migrate', root, { DATABASE_URL: 'postgresql://runtime_only@127.0.0.1:1/never_connect', ...migration })
    assert.equal(result.status, 1)
    assert.match(result.output, /DATABASE_MIGRATION_URL is required for migrations/)
    assert.doesNotMatch(result.output, /runtime_only|never_connect|ECONNREFUSED|applying migrations/i)
  }
})

test('actual generate CLI writes a migration without either database URL', (t) => {
  const dir = mkdtempSync(join(root, '.generate-test-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  copyFileSync(join(root, 'drizzle.config.ts'), join(dir, 'drizzle.config.ts'))
  mkdirSync(join(dir, 'server/db/schema'), { recursive: true })
  writeFileSync(join(dir, 'server/db/schema/index.ts'), [
    "import { integer, pgTable } from 'drizzle-orm/pg-core'",
    "export const fixture = pgTable('generation_fixture', { id: integer('id').primaryKey() })",
  ].join('\n'))
  const result = run('generate', dir, {})
  assert.equal(result.status, 0, result.output)
  assert.ok(readdirSync(join(dir, 'server/db/migrations')).some(name => /^0000_.*\.sql$/.test(name)))
})
