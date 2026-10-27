import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { assertPublicOutput } from '../../scripts/assert-public-output.mjs'

test('public output probe rejects canaries in scripts/maps/HTML/binary, never prints their value', () => {
  const folder = mkdtempSync(join(tmpdir(), 'tb-public-output-'))
  try {
    assert.throws(() => assertPublicOutput(folder), /No browser JavaScript/)
    mkdirSync(join(folder, '_nuxt'))
    writeFileSync(join(folder, '_nuxt/app.js'), 'console.log("Public application")')
    assert.deepEqual(assertPublicOutput(folder), { files: 1, scripts: 1 })
    for (const name of ['private.js', 'nested.map', 'index.html', 'binary.bin']) {
      const path = join(folder, '_nuxt', name)
      writeFileSync(path, Buffer.from('\0talentbay_build_secret_probe_PRIVATE_VALUE'))
      assert.throws(() => assertPublicOutput(folder), error => error.message === 'Server-only build canary leaked into a public asset')
      rmSync(path)
    }
  } finally { rmSync(folder, { recursive: true, force: true }) }
})
