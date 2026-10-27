import { open } from 'node:fs/promises'
import { constants } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { assertCiDatabaseEnvironment } from './assert-ci-database.mjs'
import { closeDatabase } from '#server/db'
import { DatasetImportError, importRelocationDataset, previewRelocationDataset, validateRelocationDataset } from '#server/services/relocation/import-dataset'
import { relocationDatasetCoverage } from '#server/services/relocation/dataset-contract'

const usage = `Usage:
  pnpm db:relocation --file package.json --validate-only
  pnpm db:relocation --file package.json --actor-id 42
  pnpm db:relocation --file package.json --actor-id 42 --apply --revision <preview-revision>

Default database mode is a no-write preview. This initial CLI accepts only explicitly
marked LOCAL DISPOSABLE databases. Cloud/shared targets are refused, not auto-approved.
No dotenv file is loaded. Real Neon execution needs the separate verified-target H/D06 gate.`
export function parseDatasetArguments(args: string[]) {
  const { values, tokens } = parseArgs({ args: args[0] === '--' ? args.slice(1) : args, strict: true, tokens: true, options: {
    file: { type: 'string' }, 'actor-id': { type: 'string' }, apply: { type: 'boolean' }, revision: { type: 'string' }, 'validate-only': { type: 'boolean' }, help: { type: 'boolean', short: 'h' },
  } })
  if (values.help) return { help: true as const }
  for (const name of ['file', 'actor-id', 'apply', 'revision', 'validate-only']) {
    if (tokens.filter(token => token.kind === 'option' && token.name === name).length > 1) throw new DatasetImportError('INPUT')
  }
  if (!values.file || (values['validate-only'] && (values.apply || values['actor-id'] || values.revision))) throw new DatasetImportError('INPUT')
  if (!values['validate-only'] && (!/^[1-9]\d{0,9}$/.test(values['actor-id'] ?? '') || Number(values['actor-id']) > 2147483647)) throw new DatasetImportError('INPUT')
  if (values.apply ? !/^[a-f0-9]{64}$/.test(values.revision ?? '') : values.revision !== undefined) throw new DatasetImportError('INPUT')
  return { help: false as const, file: values.file, validateOnly: values['validate-only'] ?? false, actorID: Number(values['actor-id']), apply: values.apply ?? false, revision: values.revision }
}
export async function readDatasetFile(path: string) {
  const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK)
  try {
    const stat = await handle.stat()
    const maximum = 1024 * 1024
    if (!stat.isFile() || stat.size === 0 || stat.size > maximum) throw new DatasetImportError('INPUT')
    const bytes = Buffer.alloc(maximum + 1)
    let size = 0
    while (size < bytes.length) {
      const read = await handle.read(bytes, size, bytes.length - size, null)
      if (!read.bytesRead) break
      size += read.bytesRead
    }
    if (size > maximum) throw new DatasetImportError('INPUT')
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(0, size))) as unknown
  }
  finally { await handle.close() }
}
export async function runDatasetCommand(args: string[]) {
  const options = parseDatasetArguments(args)
  if (options.help) return { usage }
  const input = await readDatasetFile(options.file)
  if (options.validateOnly) {
    const now = new Date()
    const dataset = validateRelocationDataset(input, now)
    return { mode: 'validation-only', writes: false, coverage: relocationDatasetCoverage(dataset, now.toISOString().slice(0, 10)) }
  }
  // The provider passport is not yet verified. Never infer isolation from a branch name.
  assertCiDatabaseEnvironment()
  return options.apply
    ? { mode: 'apply', result: await importRelocationDataset(input, options.actorID, options.revision!) }
    : { mode: 'preview', writes: false, result: await previewRelocationDataset(input, options.actorID) }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(await runDatasetCommand(process.argv.slice(2)), null, 2)) }
  catch (error) {
    // Do not print SQL/connection errors, file contents, env or raw validation values.
    console.error(error instanceof DatasetImportError ? JSON.stringify({ error: error.code, issues: error.issues }) : 'Dataset command failed. Verify the input, local disposable target and schema; no cloud target is enabled.')
    process.exitCode = 1
  }
  finally { await closeDatabase() }
}
