import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export function assertVercelOutput(directory = '.vercel/output') {
  const config = JSON.parse(readFileSync(join(directory, 'config.json'), 'utf8'))
  assert.equal(config.version, 3, 'Expected Vercel Build Output API v3')
  const routes = config.routes ?? []
  for (const destination of ['/jobs', '/jobs/[slug]', '/profile', '/api/v1/auth/telegram', '/api/v1/admin/vacancies/file', '/api/v1/admin/vacancies/[id]']) {
    assert(routes.some(route => route.dest === destination), `Missing route: ${destination}`)
    assert(existsSync(join(directory, 'functions', `${destination.slice(1)}.func`)), `Missing function: ${destination}`)
  }
  assert(existsSync(join(directory, 'static/templates/vacancies.csv')), 'Missing CSV template')
  const functions = []
  function visit(folder) {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const path = join(folder, entry.name)
      // Route aliases are symlinks; inspect each real function bundle once.
      if (entry.isDirectory()) visit(path)
      else if (entry.isFile() && entry.name === '.vc-config.json') {
        const metadata = JSON.parse(readFileSync(path, 'utf8'))
        assert.equal(metadata.runtime, 'nodejs22.x', 'Runtime must match the tested Node 22 baseline')
        assert.equal(typeof metadata.handler, 'string', 'Missing function handler')
        assert(existsSync(resolve(dirname(path), metadata.handler)), 'Function handler does not exist')
        functions.push(metadata.runtime)
      }
    }
  }
  visit(join(directory, 'functions'))
  assert(functions.length > 0, 'No function bundles found')
  return { functions: functions.length, routes: routes.length, runtime: 'nodejs22.x' }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify({ result: 'PASS', ...assertVercelOutput(process.argv[2]) })) }
  catch (error) { console.error(error.message); process.exitCode = 1 }
}
