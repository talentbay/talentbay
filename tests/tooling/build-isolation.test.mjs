import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const { scripts } = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'))

test('install and artifact builds only invoke the reviewed Nuxt entry points', () => {
  // Compare whole commands: a harmless-looking build may chain a schema write or call a wrapper.
  const expected = {
    postinstall: 'nuxt prepare',
    build: 'nuxt build',
    'build:cloudflare': 'nuxt build --preset=cloudflare_module',
    generate: 'nuxt generate',
  }
  for (const [name, command] of Object.entries(expected)) {
    assert.equal(scripts[name], command, name)
  }
  for (const name of ['pnpm:devPreinstall', 'preinstall', 'install', 'prepare', 'vercel-build',
    'prebuild', 'postbuild', 'prebuild:cloudflare', 'postbuild:cloudflare', 'pregenerate', 'postgenerate']) {
    assert.equal(scripts[name], undefined, `Review the side effects of lifecycle hook: ${name}`)
  }
})

test('schema migration stays a separate explicit operation', () => {
  assert.equal(scripts['db:migrate'], 'drizzle-kit migrate')
})
