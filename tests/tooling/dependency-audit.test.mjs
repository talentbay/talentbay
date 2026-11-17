import assert from 'node:assert/strict'
import test from 'node:test'
import { evaluateAudit } from '../../scripts/ci/dependency-audit.mjs'

const report = (advisories = {}, counts = {}) => ({ advisories, metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0, ...counts } } })
const known = () => ({ module_name: 'esbuild', severity: 'moderate', url: 'https://github.com/advisories/GHSA-67mh-4wv8-2f99', findings: [{ version: '0.18.20', paths: ['.>drizzle-kit>@esbuild-kit/esm-loader>@esbuild-kit/core-utils>esbuild'] }] })

test('accepts a clean audit or the exact reviewed tooling finding', () => {
  assert.equal(evaluateAudit(report()).result, 'PASS')
  assert.equal(evaluateAudit(report({ one: known() }, { moderate: 1 })).result, 'PASS')
})

test('rejects a new advisory, changed severity, version or dependency path', () => {
  for (const change of [
    { url: 'https://github.com/advisories/GHSA-new-advisory' },
    { severity: 'high' },
    { findings: [{ version: '0.18.21', paths: known().findings[0].paths }] },
    { findings: [{ version: '0.18.20', paths: ['.>runtime>esbuild'] }] },
    { findings: [] },
    { findings: [{ version: '0.18.20', paths: [] }] },
  ]) assert.equal(evaluateAudit(report({ one: { ...known(), ...change } }, { moderate: 1 })).result, 'FAIL')
})

test('reviews the production-only archive path without allowing another production parent', () => {
  const path = '.>nuxt>@nuxt/nitro-server>nitropack>archiver>readdir-glob>minimatch'
  const advisory = { module_name: 'minimatch', severity: 'moderate', url: 'https://github.com/advisories/GHSA-g3hv-75wg-m249', findings: [{ version: '10.2.6', paths: [path] }] }
  assert.equal(evaluateAudit(report({ one: advisory }, { moderate: 1 })).result, 'PASS')
  advisory.findings[0].paths.push('.>runtime>minimatch')
  assert.equal(evaluateAudit(report({ one: advisory }, { moderate: 1 })).result, 'FAIL')
})

test('does not accept registry errors, malformed data or hidden high/critical results', () => {
  for (const invalid of [undefined, {}, { ...report(), error: { code: 'ERR_REGISTRY' } }, { ...report(), advisories: [] }, report({}, { low: -1 })]) {
    assert.throws(() => evaluateAudit(invalid), /invalid report/)
  }
  assert.equal(evaluateAudit(report({}, { high: 1 })).result, 'FAIL')
  assert.equal(evaluateAudit(report({}, { critical: 1 })).result, 'FAIL')
  assert.equal(evaluateAudit(report({}, { moderate: 1 })).result, 'FAIL')
  assert.equal(evaluateAudit(report({ one: known() })).result, 'FAIL')
  assert.equal(evaluateAudit(report({ one: known() }, { moderate: 2 })).result, 'FAIL')
})
