import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// CI injects only fake server-side values with this marker. Never read real env secrets.
const marker = Buffer.from('talentbay_build_secret_probe_')
export function assertPublicOutput(folder = '.output/public') {
  let files = 0, scripts = 0
  function visit(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) visit(path)
      else if (entry.isFile()) {
        files++
        if (entry.name.endsWith('.js')) scripts++
        assert(!readFileSync(path).includes(marker), 'Server-only build canary leaked into a public asset')
      }
    }
  }
  visit(folder)
  assert(scripts > 0, 'No browser JavaScript found; build the application before checking public output')
  return { files, scripts }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify({ result: 'PASS', ...assertPublicOutput(process.argv[2]) })) }
  catch { console.error('Public build boundary check failed; raw asset/env contents are withheld.'); process.exitCode = 1 }
}
