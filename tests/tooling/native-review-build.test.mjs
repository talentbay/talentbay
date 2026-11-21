import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { buildInvocation, installOutput, stageSources } from '../../scripts/native-review/build.mjs'

function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'talentbay-native-build-test-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}

function put(dir, name, value = '') {
  mkdirSync(dirname(join(dir, name)), { recursive: true })
  writeFileSync(join(dir, name), value)
}

function artifact(dir, preset = 'node-server') {
  put(dir, 'nitro.json', JSON.stringify({ preset, framework: { name: 'nuxt' }, commands: { preview: 'node server/index.mjs' } }))
  put(dir, 'server/index.mjs', 'export {}')
  put(dir, 'public/_nuxt/asset.js')
}

test('build:telegram uses local Nuxt, forced node-server, explicit empty dotenv and a fresh child env', () => {
  const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url)))
  assert.equal(pkg.scripts['build:telegram'], 'node scripts/native-review/build.mjs')
  const { args, cwd, env } = buildInvocation('/isolated', '/runtime/bin/node')
  assert.equal(cwd, '/isolated/project')
  assert.deepEqual(args, [join(cwd, 'node_modules/nuxt/bin/nuxt.mjs'), 'build', '--preset=node-server', '--dotenv', '/isolated/empty.env'])
  assert.deepEqual(env, {
    PATH: '/runtime/bin:/usr/bin:/bin', HOME: '/isolated/home', TMPDIR: '/isolated/tmp', CI: 'true',
    NODE_ENV: 'production', NUXT_TELEMETRY_DISABLED: '1', NO_UPDATE_NOTIFIER: '1',
    npm_config_offline: 'true', DOTENV_CONFIG_PATH: '/isolated/empty.env',
  })
})

test('stages current sources but not dotenv, old generated files, repository state or local user data', t => {
  const src = fixture(t), dst = fixture(t)
  const allowed = ['nuxt.config.ts', 'tsconfig.json', 'package.json', 'pnpm-workspace.yaml', 'public/favicon.ico',
    'public/robots.txt', 'public/templates/vacancies.csv', 'app/pages/jobs.vue', 'server/api/jobs.ts', 'shared/styles.css']
  for (const path of allowed) put(src, path, 'current source')
  for (const path of ['.output/server/index.mjs', '.output-native-review/server/index.mjs', '.nuxt/stale.ts', '.git/config', 'public/extra.txt', 'app/.private/config.ts', 'server/private.key'])
    put(src, path, 'not an input')
  // Even trying to follow these synthetic dotenv links would fail the test.
  for (const name of ['.env', '.env.production.local', 'app/.env.local']) symlinkSync('missing', join(src, name))
  stageSources(src, dst)
  for (const path of allowed) assert.equal(readFileSync(join(dst, path), 'utf8'), 'current source')
  for (const name of ['.env', '.output', '.output-native-review', '.nuxt', '.git', 'public/extra.txt', 'app/.private', 'server/private.key'])
    assert.equal(existsSync(join(dst, name)), false)
  symlinkSync(join(src, 'nuxt.config.ts'), join(src, 'server/alias.ts'))
  assert.throws(() => stageSources(src, dst), /symlink/)
})

test('only a fresh complete node-server artifact replaces native output; the shared output is untouched', t => {
  const checkout = fixture(t), built = fixture(t)
  const native = join(checkout, '.output-native-review')
  put(checkout, '.output/server/index.mjs', 'other mode')
  put(native, 'old-only', 'intact')
  put(native, '.talentbay-native-build', 'stale')
  artifact(built, 'vercel')
  assert.throws(() => installOutput(built, checkout), /node-server/)
  assert.equal(readFileSync(join(native, 'old-only'), 'utf8'), 'intact')
  artifact(built)
  symlinkSync(join(native, 'old-only'), join(built, 'server/external'))
  assert.throws(() => installOutput(built, checkout), /nonportable/)
  assert.equal(existsSync(join(native, 'old-only')), true)
  rmSync(join(built, 'server/external'))
  put(built, '.talentbay-native-build', 'pre-stamped')
  assert.throws(() => installOutput(built, checkout), { code: 'EEXIST' })
  assert.equal(readFileSync(join(native, '.talentbay-native-build'), 'utf8'), 'stale')
  rmSync(join(built, '.talentbay-native-build'))
  installOutput(built, checkout)
  assert.deepEqual(readFileSync(join(native, '.talentbay-native-build')), Buffer.from('isolated-node-v1\n'))
  assert.equal(readFileSync(join(native, 'server/index.mjs'), 'utf8'), 'export {}')
  assert.equal(existsSync(join(native, 'old-only')), false)
  assert.equal(readFileSync(join(checkout, '.output/server/index.mjs'), 'utf8'), 'other mode')
  assert.equal(existsSync(join(checkout, '.output/.talentbay-native-build')), false)
  assert.equal(existsSync(join(checkout, '.native-review-publish')), false)
})

test('does not overwrite another publisher or follow a symlink at the launch destination', t => {
  const checkout = fixture(t), built = fixture(t)
  artifact(built)
  put(checkout, '.native-review-publish/owned', 'in progress')
  assert.throws(() => installOutput(built, checkout), { code: 'EEXIST' })
  assert.equal(readFileSync(join(checkout, '.native-review-publish/owned'), 'utf8'), 'in progress')
  rmSync(join(checkout, '.native-review-publish'), { recursive: true })
  symlinkSync(built, join(checkout, '.output-native-review'))
  assert.throws(() => installOutput(built, checkout), /non-directory/)
  assert.equal(readFileSync(join(built, 'server/index.mjs'), 'utf8'), 'export {}')
})
