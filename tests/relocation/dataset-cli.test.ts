import { mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { parseDatasetArguments, readDatasetFile, runDatasetCommand } from '../../scripts/relocation-dataset'
import { validateRelocationDataset } from '#server/services/relocation/import-dataset'
import fixture from '../../docs/examples/relocation-synthetic.v1.json'

let folder: string
const example = fileURLToPath(new URL('../../docs/examples/relocation-synthetic.v1.json', import.meta.url))
beforeAll(async () => { folder = await mkdtemp(join(tmpdir(), 'talentbay-dataset-cli-')) })
afterEach(() => vi.unstubAllEnvs())
afterAll(async () => { await rm(folder, { recursive: true, force: true }) })

describe('bounded engineer dataset CLI', () => {
  it('defaults to preview and requires exact actor/revision for apply', () => {
    expect(parseDatasetArguments(['--file', example, '--actor-id', '42'])).toMatchObject({ apply: false, actorID: 42 })
    expect(parseDatasetArguments(['--file', example, '--actor-id', '42', '--apply', '--revision', 'a'.repeat(64)])).toMatchObject({ apply: true })
    for (const args of [[], ['--file', example], ['--file', example, '--actor-id', '0'], ['--file', example, '--actor-id', '42', '--apply'], ['--file', example, '--validate-only', '--apply'], ['--file', example, '--validate-only', '--file', example]]) expect(() => parseDatasetArguments(args)).toThrow()
  })
  it('validates the fictional package without a database or credentials', async () => {
    vi.stubEnv('DATABASE_URL', '')
    const result = await runDatasetCommand(['--file', example, '--validate-only'])
    expect(result).toMatchObject({ mode: 'validation-only', writes: false })
    expect(JSON.stringify(result)).not.toContain('VERIFIED')
  })
  it('refuses cloud/shared targets before any database access, even in dry-run mode', async () => {
    vi.stubEnv('CI', 'true'); vi.stubEnv('TALENTBAY_TEST_DATABASE', 'disposable')
    vi.stubEnv('DATABASE_URL', 'postgresql://fixture:never-a-real-password@cloud.example.invalid/neondb')
    vi.stubEnv('DATABASE_MIGRATION_URL', process.env.DATABASE_URL!)
    await expect(runDatasetCommand(['--file', example, '--actor-id', '42'])).rejects.toThrow('local talentbay_ci')
  })
  it('rejects a future review instant even within the same UTC day', () => {
    const input = structuredClone(fixture)
    const record = { ...input.records[0]!, status: 'VERIFIED', review: { at: '2026-10-27T23:00:00Z', by: 'Fictional later reviewer', reference: 'Fictional future review only', validUntil: '2099-12-31' } }
    expect(() => validateRelocationDataset({ ...input, purpose: 'PILOT', records: [record] }, new Date('2026-10-27T12:00:00Z'))).toThrow('Relocation dataset input')
  })
  it('bounds regular UTF-8 JSON input, refusing symlinks, folders, invalid encoding and oversize', async () => {
    expect(await readDatasetFile(example)).toMatchObject({ schemaVersion: 1, purpose: 'SYNTHETIC' })
    await writeFile(join(folder, 'large.json'), 'x'.repeat(1024 * 1024 + 1))
    await writeFile(join(folder, 'encoding.json'), Buffer.from([0xff]))
    await symlink(example, join(folder, 'link.json'))
    for (const name of ['large.json', 'encoding.json', 'link.json']) await expect(readDatasetFile(join(folder, name))).rejects.toThrow()
    await expect(readDatasetFile(folder)).rejects.toThrow()
  })
})
