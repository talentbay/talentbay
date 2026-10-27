import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { assertVercelOutput } from '../../scripts/assert-vercel-output.mjs'

const destinations = ['/jobs', '/jobs/[slug]', '/profile', '/api/v1/auth/telegram', '/api/v1/admin/vacancies/file', '/api/v1/admin/vacancies/[id]', '/api/v1/bot/telegram']
function fixture(run, runtime = 'nodejs22.x') {
  const root = mkdtempSync(join(tmpdir(), 'talentbay-vercel-test-'))
  const put = (name, value) => { const path = join(root, name); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, typeof value === 'string' ? value : JSON.stringify(value)) }
  put('config.json', { version: 3, routes: destinations.map(dest => ({ src: dest, dest })) })
  put('static/templates/vacancies.csv', 'source_name')
  for (const dest of destinations) {
    put(`functions/${dest.slice(1)}.func/.vc-config.json`, { runtime, handler: 'index.mjs' })
    put(`functions/${dest.slice(1)}.func/index.mjs`, 'export default {}')
  }
  try { run(root, put) }
  finally { rmSync(root, { recursive: true, force: true }) }
}

test('accepts Node 22 output with required Candidate/auth/admin routes', () => fixture(root => {
  assert.deepEqual(assertVercelOutput(root), { functions: destinations.length, routes: destinations.length, runtime: 'nodejs22.x' })
}))
test('rejects an untested runtime rather than trusting dashboard metadata', () => fixture(root => {
  assert.throws(() => assertVercelOutput(root), /Node 22/)
}, 'nodejs24.x'))
test('rejects a missing application route', () => fixture((root, put) => {
  put('config.json', { version: 3, routes: [] })
  assert.throws(() => assertVercelOutput(root), /Missing route/)
}))
test('rejects an omitted bot webhook in the deployment adapter', () => fixture((root, put) => {
  put('config.json', { version: 3, routes: destinations.filter(dest => dest !== '/api/v1/bot/telegram').map(dest => ({ src: dest, dest })) })
  assert.throws(() => assertVercelOutput(root), /Missing route: \/api\/v1\/bot\/telegram/)
}))
test('rejects incomplete bundles and missing static templates', () => fixture((root) => {
  rmSync(join(root, 'functions/jobs.func/index.mjs'))
  assert.throws(() => assertVercelOutput(root), /handler does not exist/)
  rmSync(join(root, 'static/templates/vacancies.csv'))
  assert.throws(() => assertVercelOutput(root), /Missing CSV/)
}))
