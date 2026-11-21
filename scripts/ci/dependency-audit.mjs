import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

// Reviewed 2026-11-17 in docs/16-security-review.md; never exempt a whole package/severity.
const exceptions = [
  { id: 'GHSA-67mh-4wv8-2f99', module: 'esbuild', severity: 'moderate', pairs: [
    ['0.18.20', '.>drizzle-kit>@esbuild-kit/esm-loader>@esbuild-kit/core-utils>esbuild'],
  ] },
  { id: 'GHSA-g7r4-m6w7-qqqr', module: 'esbuild', severity: 'low', pairs: [
    ['0.27.7', '.>@nuxt/ui>@nuxt/fonts>fontless>esbuild'],
  ] },
  { id: 'GHSA-g3hv-75wg-m249', module: 'minimatch', severity: 'moderate', pairs: [
    ['10.2.5', '.>@nuxt/eslint>@nuxt/eslint-config>@typescript-eslint/eslint-plugin>@typescript-eslint/type-utils>@typescript-eslint/typescript-estree>minimatch'],
    ['10.2.6', '.>eslint>minimatch'],
    ['10.2.6', '.>nuxt>@nuxt/nitro-server>nitropack>archiver>readdir-glob>minimatch'],
  ] },
]

export function evaluateAudit(report) {
  const counts = report?.metadata?.vulnerabilities
  if (!report || report.error || !report.advisories || typeof report.advisories !== 'object' || Array.isArray(report.advisories)
    || !counts || !['info', 'low', 'moderate', 'high', 'critical'].every(key => Number.isInteger(counts[key]) && counts[key] >= 0)) {
    throw new Error('Dependency audit returned an invalid report')
  }
  const blocked = [], reviewed = []
  const observed = { info: 0, low: 0, moderate: 0, high: 0, critical: 0 }
  for (const advisory of Object.values(report.advisories)) {
    const exception = exceptions.find(item => advisory?.url === `https://github.com/advisories/${item.id}` && advisory.module_name === item.module && advisory.severity === item.severity)
    const findings = advisory?.findings
    if (Object.hasOwn(observed, advisory?.severity) && Array.isArray(findings)) observed[advisory.severity] += findings.length
    const covered = exception && Array.isArray(findings) && findings.length > 0 && findings.every(finding =>
      Array.isArray(finding?.paths) && finding.paths.length > 0 && finding.paths.every(path =>
        exception.pairs.some(([version, reviewedPath]) => version === finding.version && reviewedPath === path)))
    if (!covered) {
      blocked.push(typeof advisory?.module_name === 'string' ? advisory.module_name.slice(0, 100) : 'unknown')
    } else reviewed.push(exception.id)
  }
  if (counts.high || counts.critical || Object.keys(observed).some(key => counts[key] !== observed[key])) {
    blocked.push('inconsistent or high/critical audit result')
  }
  return { result: blocked.length ? 'FAIL' : 'PASS', counts, reviewed: [...new Set(reviewed)], blocked }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const scopes = []
    // pnpm deduplicates reported paths differently when dev dependencies are excluded.
    for (const scope of ['all', 'prod']) {
      const audit = spawnSync('pnpm', ['audit', '--json', ...(scope === 'prod' ? ['--prod'] : [])], { encoding: 'utf8', timeout: 180_000, maxBuffer: 4 * 1024 * 1024 })
      if (audit.error || ![0, 1].includes(audit.status)) throw new Error('Dependency registry audit did not complete')
      scopes.push({ scope, ...evaluateAudit(JSON.parse(audit.stdout)) })
    }
    const result = scopes.every(scope => scope.result === 'PASS') ? 'PASS' : 'FAIL'
    console.log(JSON.stringify({ result, scopes }))
    if (result !== 'PASS') process.exitCode = 1
  } catch {
    console.error('Dependency audit failed: registry/report unavailable or invalid; no result was accepted.')
    process.exitCode = 1
  }
}
