import assert from 'node:assert/strict'
import { test } from 'node:test'
import { recoveryEnvironment, runChecked } from '../../scripts/recovery/environment.mjs'

test('recovery children never inherit databases, provider credentials, PG services or Node injection', () => {
  const input = { HOME: '/synthetic-home', PATH: '/bin', DATABASE_URL: 'PRIVATE_DB', DATABASE_MIGRATION_URL: 'PRIVATE_DB', NUXT_TELEGRAM_BOT_TOKEN: 'SECRET', NODE_OPTIONS: '--import malicious', PGHOST: 'remote.example', PGSERVICE: 'production', PGPASSFILE: '/private/secrets', VERCEL_TOKEN: 'SECRET', NUXT_SESSION_PASSWORD: 'SECRET' }
  const result = recoveryEnvironment(input)
  assert.deepEqual(Object.keys(result).sort(), ['HOME', 'PATH'])
  assert.equal(JSON.stringify(result).includes('SECRET'), false)
  assert.equal(input.NODE_OPTIONS, '--import malicious')
})
test('failed child output never leaks raw stderr/stdout into a recovery error', () => {
  assert.throws(() => runChecked(process.execPath, ['-e', 'console.error("PRIVATE_DB_SECRET"); process.exit(1)'], { env: recoveryEnvironment() }, 'synthetic-command'), error => error.message === 'Recovery rehearsal failed during synthetic-command; raw child output is withheld.')
})
