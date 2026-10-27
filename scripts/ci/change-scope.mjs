import { execFileSync } from 'node:child_process'
import { appendFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const revision = /^[a-f0-9]{40}$/
const full = reason => ({ full: true, reason })

export function documentationOnly(paths) {
  return paths.length > 0 && paths.every(path => path === 'README.md' || (
    path.startsWith('docs/') && path.endsWith('.md')
    && path.split('/').every(part => part !== '' && part !== '.' && part !== '..')
  ))
}

export function changeScope(environment = process.env, git = execFileSync) {
  // Protected-branch pushes always recheck the complete integrated application.
  if (environment.GITHUB_EVENT_NAME !== 'pull_request') return full('protected-push-or-unknown-event')
  const { BASE_SHA: base, HEAD_SHA: head } = environment
  if (!revision.test(base ?? '') || !revision.test(head ?? '') || /^0+$/.test(base)) return full('unknown-revision')
  try {
    const output = git('git', ['diff', '--no-ext-diff', '--no-textconv', '--no-renames', '--name-only', '-z', `${base}...${head}`, '--'], {
      encoding: 'utf8', timeout: 10_000, maxBuffer: 16 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
    })
    if (!output.endsWith('\0')) return full('empty-or-incomplete-diff')
    const paths = output.slice(0, -1).split('\0')
    return documentationOnly(paths) ? { full: false, reason: 'documentation-only' } : full('code-or-configuration')
  } catch {
    return full('diff-unavailable')
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const scope = changeScope()
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `full=${scope.full}\n`)
  console.log(`CI scope: ${scope.full ? 'full' : 'documentation'} (${scope.reason}).`)
}
