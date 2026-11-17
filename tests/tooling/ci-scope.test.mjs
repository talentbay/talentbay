import assert from 'node:assert/strict'
import { test } from 'node:test'
import { changeScope, documentationOnly } from '../../scripts/ci/change-scope.mjs'

const environment = { GITHUB_EVENT_NAME: 'pull_request', BASE_SHA: 'a'.repeat(40), HEAD_SHA: 'b'.repeat(40) }

test('only explicit Markdown documentation qualifies, never unknown/runtime/config paths', () => {
  assert.equal(documentationOnly(['README.md', 'docs/plan.md', 'docs/adr/0006.md']), true)
  for (const path of ['app/index.vue', 'server/auth.ts', 'package.json', 'pnpm-lock.yaml', '.github/workflows/ci.yml', 'AGENTS.md', 'docs/data.json', 'docs/../app/test.md', 'docs//a.md']) {
    assert.equal(documentationOnly(['docs/plan.md', path]), false, path)
  }
  assert.equal(documentationOnly([]), false)
})
test('scope uses the complete PR diff, NUL delimiters and conservative failure defaults', () => {
  let args
  assert.deepEqual(changeScope(environment, (...input) => { args = input; return 'README.md\0docs/nested/note with spaces.md\0' }), { full: false, reason: 'documentation-only' })
  assert.equal(args[0], 'git')
  assert.equal(args[1].includes('--no-renames'), true)
  assert.equal(args[1].includes('-z'), true)
  assert.equal(args[1].includes(`${environment.BASE_SHA}...${environment.HEAD_SHA}`), true)
  for (const output of ['', 'docs/plan.md', 'docs/plan.md\0server/deleted.ts\0', 'app/renamed.vue\0docs/note.md\0']) {
    assert.equal(changeScope(environment, () => output).full, true)
  }
  assert.equal(changeScope(environment, () => { throw Error('No merge base') }).full, true)
})
test('protected pushes, unknown events and invalid revisions cannot skip full checks', () => {
  const neverGit = () => { assert.fail('Must not call Git') }
  for (const override of [{ GITHUB_EVENT_NAME: 'push' }, { GITHUB_EVENT_NAME: 'workflow_dispatch' }, { BASE_SHA: '' }, { BASE_SHA: '0'.repeat(40) }, { HEAD_SHA: '--output=unsafe' }]) {
    assert.equal(changeScope({ ...environment, ...override }, neverGit).full, true)
  }
})
