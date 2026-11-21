import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ensureBrowser } from '../../scripts/ci/browser.mjs'

test('ready Chromium avoids system installation and closes the probe', async () => {
  let closed = 0
  assert.equal(await ensureBrowser({ launch: async () => ({ close: async () => { closed++ } }), install: () => assert.fail('No installation needed') }), 'ready')
  assert.equal(closed, 1)
})
test('missing Linux libraries trigger official installation and an actual second startup', async () => {
  let launched = 0; let installed = 0; let closed = 0
  assert.equal(await ensureBrowser({ platform: 'linux', launch: async () => {
    if (++launched === 1) throw Error('Host system is missing dependencies to run browsers.')
    return { close: async () => { closed++ } }
  }, install: () => { installed++ } }), 'installed-system-dependencies')
  assert.deepEqual([launched, installed, closed], [2, 1, 1])
})
test('unknown browser failures, failed installation and failed retry stay failures', async () => {
  const missing = async () => { throw Error('error while loading shared libraries: libmissing.so') }
  await assert.rejects(ensureBrowser({ platform: 'linux', launch: async () => { throw Error('Sandbox failed') }, install: () => assert.fail('Unknown error is not an apt problem') }), /Sandbox failed/)
  await assert.rejects(ensureBrowser({ platform: 'darwin', launch: missing, install: () => assert.fail('No apt outside Linux') }), /shared libraries/)
  await assert.rejects(ensureBrowser({ platform: 'linux', launch: missing, install: () => { throw Error('Installation failed') } }), /Installation failed/)
  await assert.rejects(ensureBrowser({ platform: 'linux', launch: missing, install: () => {} }), /shared libraries/)
})
test('WebKit probes and installs for its own engine; an unknown engine cannot run the installer', async () => {
  const targets = []
  let launches = 0
  const probe = { platform: 'linux', install: target => targets.push(target), launch: async () => {
    if (++launches === 1) throw Error('Host system is missing dependencies')
    return { close: async () => {} }
  } }
  assert.equal(await ensureBrowser({ ...probe, engine: 'webkit' }), 'installed-system-dependencies')
  await assert.rejects(ensureBrowser({ ...probe, engine: 'unknown' }), /Unsupported browser/)
  assert.deepEqual(targets, ['webkit'])
  assert.equal(launches, 2)
})
