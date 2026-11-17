import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'
import { recoveryEnvironment } from '../../scripts/recovery/environment.mjs'

test('direct Vitest integration config refuses shared URLs before test collection and withholds credentials', () => {
  const env = { ...recoveryEnvironment(), CI: 'true', TALENTBAY_TEST_DATABASE: 'disposable', DATABASE_URL: 'postgresql://talentbay_ci:PRIVATE_SECRET@shared.invalid/talentbay_ci', DATABASE_MIGRATION_URL: 'postgresql://talentbay_ci:PRIVATE_SECRET@shared.invalid/talentbay_ci' }
  const result = spawnSync(process.execPath, ['--import', 'tsx', '-e', 'import("./vitest.integration.config.ts")'], { env, encoding: 'utf8', timeout: 15_000 })
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /must target the local talentbay_ci database/)
  assert.equal(result.stderr.includes('PRIVATE_SECRET'), false)
  assert.equal(result.stderr.includes('shared.invalid'), false)
})
test('default integration command rejects an injected existing target argument before cluster creation', () => {
  const result = spawnSync(process.execPath, ['scripts/testing/integration.mjs', '--database', 'PRIVATE_TARGET'], { env: recoveryEnvironment(), encoding: 'utf8', timeout: 15_000 })
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /accepts no target, env-file or credential arguments/)
  assert.equal(result.stderr.includes('PRIVATE_TARGET'), false)
})
