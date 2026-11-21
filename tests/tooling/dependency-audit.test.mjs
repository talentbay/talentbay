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

const eslint = '.>eslint>minimatch'
const tsEstree = '.>@nuxt/eslint>@nuxt/eslint-config>@typescript-eslint/eslint-plugin>@typescript-eslint/type-utils>@typescript-eslint/typescript-estree>minimatch'
const archive = '.>nuxt>@nuxt/nitro-server>nitropack>archiver>readdir-glob>minimatch'
function minimatchReport(findings) {
  return report({ one: { module_name: 'minimatch', severity: 'moderate', url: 'https://github.com/advisories/GHSA-g3hv-75wg-m249', findings } }, { moderate: findings.length })
}

test('accepts only the reviewed minimatch version/path combinations for full and prod reports', () => {
  const full = [{ version: '10.2.5', paths: [tsEstree] }, { version: '10.2.6', paths: [eslint] }]
  assert.equal(evaluateAudit(minimatchReport(full)).result, 'PASS')
  assert.equal(evaluateAudit(minimatchReport([{ version: '10.2.6', paths: [archive] }])).result, 'PASS')
  assert.equal(evaluateAudit(minimatchReport([{ version: '10.2.6', paths: [eslint, archive] }])).result, 'PASS')
})

test('rejects recombined reviewed versions and paths, even alongside valid findings and paths', () => {
  for (const [version, wrongPath] of [
    ['10.2.5', eslint], ['10.2.5', archive], ['10.2.6', tsEstree], ['10.2.6', '.>runtime>minimatch'],
  ]) {
    const findings = [{ version: '10.2.6', paths: [archive] }, { version, paths: [version === '10.2.5' ? tsEstree : eslint, wrongPath] }]
    assert.equal(evaluateAudit(minimatchReport(findings)).result, 'FAIL', `${version} via ${wrongPath}`)
  }
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
