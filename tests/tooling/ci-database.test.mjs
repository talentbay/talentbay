import assert from 'node:assert/strict'
import { test } from 'node:test'
import { assertCiDatabaseEnvironment } from '../../scripts/assert-ci-database.mjs'

const localUrl = 'postgresql://talentbay_ci:ci-only@127.0.0.1:5432/talentbay_ci'
const environment = () => ({
  CI: 'true',
  TALENTBAY_TEST_DATABASE: 'disposable',
  DATABASE_URL: localUrl,
  DATABASE_MIGRATION_URL: localUrl,
})

test('accepts the explicitly marked disposable database', () => {
  assert.doesNotThrow(() => assertCiDatabaseEnvironment(environment()))
})

test('requires both the CI and disposable markers', () => {
  for (const key of ['CI', 'TALENTBAY_TEST_DATABASE']) {
    const env = environment()
    delete env[key]
    assert.throws(() => assertCiDatabaseEnvironment(env), /explicit disposable-database marker/)
  }
})

test('requires both runtime and migration URLs', () => {
  for (const key of ['DATABASE_URL', 'DATABASE_MIGRATION_URL']) {
    const env = environment()
    delete env[key]
    assert.throws(() => assertCiDatabaseEnvironment(env), /valid disposable PostgreSQL URL/)
  }
})

for (const [reason, unsafeUrl] of [
  ['remote host', 'postgresql://talentbay_ci:secret@database.example.com/talentbay_ci'],
  ['production database', 'postgresql://talentbay_ci:secret@127.0.0.1/production'],
  ['wrong role', 'postgresql://production_owner:secret@127.0.0.1/talentbay_ci'],
  ['wrong protocol', 'https://talentbay_ci:secret@127.0.0.1/talentbay_ci'],
  ['query options', `${localUrl}?host=database.example.com`],
  ['fragment', `${localUrl}#production`],
  ['malformed URL', 'secret-not-a-connection-url'],
]) {
  test(`rejects ${reason} in either connection without leaking values`, () => {
    for (const key of ['DATABASE_URL', 'DATABASE_MIGRATION_URL']) {
      assert.throws(() => assertCiDatabaseEnvironment({ ...environment(), [key]: unsafeUrl }), (error) => {
        assert.ok(!error.message.includes('secret'))
        assert.ok(!error.message.includes(unsafeUrl))
        return true
      })
    }
  })
}

test('rejects different target ports', () => {
  assert.throws(() => assertCiDatabaseEnvironment({
    ...environment(),
    DATABASE_MIGRATION_URL: localUrl.replace(':5432/', ':5433/'),
  }), /same disposable database/)
})

test('allows equivalent PostgreSQL schemes and the default port', () => {
  assert.doesNotThrow(() => assertCiDatabaseEnvironment({
    ...environment(),
    DATABASE_MIGRATION_URL: localUrl.replace('postgresql:', 'postgres:').replace(':5432/', '/'),
  }))
})

test('does not mutate the provided environment', () => {
  const env = Object.freeze(environment())
  assert.doesNotThrow(() => assertCiDatabaseEnvironment(env))
})
