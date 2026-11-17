import { spawn } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existingPostgresBin, newRecoveryCluster, recoveryEnvironment } from '../recovery/environment.mjs'

const root = fileURLToPath(new URL('../../', import.meta.url))
let cluster
let failed = false
let interrupted = false
let active
let killTimer
function stopChild() {
  if (!active?.pid) return
  const pid = active.pid
  try { process.kill(-pid, 'SIGTERM') } catch { /* Already stopped. */ }
  if (!killTimer) killTimer = setTimeout(() => {
    try { process.kill(-pid, 'SIGKILL') } catch { /* Process group exited. */ }
  }, 2000)
}
const interrupt = () => { interrupted = true; stopChild() }
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, interrupt)

async function runStage(args, env) {
  if (interrupted) throw new Error('Disposable integration interrupted')
  const status = await new Promise((resolve, reject) => {
    active = spawn(process.execPath, args, { env, cwd: root, stdio: 'inherit', detached: true })
    const timeout = setTimeout(stopChild, 180_000)
    const clear = () => { clearTimeout(timeout); clearTimeout(killTimer); killTimer = undefined; active = undefined }
    active.once('error', () => { clear(); reject(new Error('Cannot start disposable integration stage')) })
    active.once('close', (code) => { clear(); resolve(code) })
  })
  if (status !== 0 || interrupted) throw new Error('Disposable integration stage failed or interrupted; no shared database was used')
}
try {
  if (process.argv.length !== 2) throw new Error('Integration runner accepts no target, env-file or credential arguments')
  // Reuse the existing clean-environment/owned-cluster boundary, never a developer URL.
  const env = recoveryEnvironment()
  const bin = existingPostgresBin(env)
  const folder = mkdtempSync(join(tmpdir(), 'tb-integration-'))
  cluster = await newRecoveryCluster(join(folder, 'database'), bin, env, root)
  await cluster.start()
  for (const args of [
    ['scripts/testing/migration-upgrade.mjs'],
    ['node_modules/vitest/vitest.mjs', 'run', '--config', 'vitest.integration.config.ts'],
  ]) {
    await runStage(args, cluster.env)
  }
} catch (error) {
  failed = true
  console.error(error.message)
} finally {
  try { await cluster?.stop() } catch { failed = true; console.error('Owned integration cluster cleanup failed; inspect the local test processes') }
  for (const signal of ['SIGINT', 'SIGTERM']) process.removeListener(signal, interrupt)
  if (interrupted) failed = true
  if (failed) process.exitCode = 1
  else console.log('Disposable integration PASS; owned PostgreSQL stopped.')
}
