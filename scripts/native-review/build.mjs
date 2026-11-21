import { execFileSync } from 'node:child_process'
import { copyFileSync, cpSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, readlinkSync, realpathSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, dirname, extname, isAbsolute, join, relative, sep } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const sourceExtensions = new Set(['.ts', '.vue', '.css'])
const inputs = ['nuxt.config.ts', 'tsconfig.json', 'package.json', 'pnpm-workspace.yaml',
  'public/favicon.ico', 'public/robots.txt', 'public/templates/vacancies.csv']

function copyInput(from, to, name) {
  const source = join(from, name)
  if (source !== realpathSync(source) || !lstatSync(source).isFile()) throw new Error('Expected a regular build input')
  mkdirSync(dirname(join(to, name)), { recursive: true })
  copyFileSync(source, join(to, name))
}

export function stageSources(from, to) {
  from = realpathSync(from)
  for (const name of inputs) copyInput(from, to, name)
  function visit(dir) {
    if (!lstatSync(join(from, dir)).isDirectory()) throw new Error('Expected a source directory')
    for (const entry of readdirSync(join(from, dir), { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
      const name = join(dir, entry.name)
      if (entry.isSymbolicLink()) throw new Error('Unexpected symlink in source tree')
      if (entry.isDirectory()) visit(name)
      else if (sourceExtensions.has(extname(entry.name))) copyInput(from, to, name)
    }
  }
  for (const dir of ['app', 'shared', 'server']) visit(dir)
}

export function buildInvocation(stage, node = process.execPath) {
  const cwd = join(stage, 'project'), dotenv = join(stage, 'empty.env')
  return {
    cwd, args: [join(cwd, 'node_modules/nuxt/bin/nuxt.mjs'), 'build', '--preset=node-server', '--dotenv', dotenv],
    env: {
      PATH: [dirname(node), '/usr/bin', '/bin'].join(delimiter), HOME: join(stage, 'home'), TMPDIR: join(stage, 'tmp'),
      CI: 'true', NODE_ENV: 'production', NUXT_TELEMETRY_DISABLED: '1', NO_UPDATE_NOTIFIER: '1',
      npm_config_offline: 'true', DOTENV_CONFIG_PATH: dotenv,
    },
  }
}

export function validateOutput(dir) {
  const base = realpathSync(dir)
  function checkLinks(path) {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const file = join(path, entry.name)
      if (entry.isDirectory()) checkLinks(file)
      else if (entry.isSymbolicLink() && (isAbsolute(readlinkSync(file)) || relative(base, realpathSync(file)).split(sep)[0] === '..'))
        throw new Error('Build output contains a nonportable dependency link')
    }
  }
  checkLinks(base)
  const metadata = JSON.parse(readFileSync(join(dir, 'nitro.json'), 'utf8'))
  if (metadata.preset !== 'node-server' || metadata.framework?.name !== 'nuxt'
    || metadata.commands?.preview !== 'node server/index.mjs' || !lstatSync(join(dir, 'server/index.mjs')).isFile()
    || !readdirSync(join(dir, 'public/_nuxt')).some(name => name.endsWith('.js')))
    throw new Error('Build did not produce a complete Nuxt node-server artifact')
}

export function installOutput(from, checkout) {
  validateOutput(from)
  const target = join(checkout, '.output-native-review')
  const swap = join(checkout, '.native-review-publish')
  mkdirSync(swap, { mode: 0o700 }) // Exclusive; never clean another publisher's staging directory.
  const candidate = join(swap, 'candidate'), previous = join(swap, 'previous')
  let parked = false
  try {
    // TMPDIR need not be on the checkout's volume. Finish copying before the swap.
    cpSync(from, candidate, { recursive: true, verbatimSymlinks: true })
    validateOutput(candidate)
    execFileSync(process.execPath, ['--check', join(candidate, 'server/index.mjs')], { cwd: candidate, env: {}, stdio: 'pipe' })
    writeFileSync(join(candidate, '.talentbay-native-build'), 'isolated-node-v1\n', { flag: 'wx', mode: 0o600 })
    const old = lstatSync(target, { throwIfNoEntry: false })
    if (old) {
      if (!old.isDirectory()) throw new Error('Refusing to replace a non-directory output')
      renameSync(target, previous)
      parked = true
    }
    renameSync(candidate, target)
    parked = false
  } finally {
    // If rollback itself fails, preserve the previous artifact for recovery.
    if (parked) renameSync(previous, target)
    rmSync(swap, { recursive: true, force: true })
  }
}

function main() {
  const [major, minor, patch] = process.versions.node.split('.').map(Number)
  if (major !== 22 || minor < 23 || (minor === 23 && patch < 5)) throw new Error('Use the project Node 22 runtime (>=22.23.5)')
  if (process.argv.length !== 2) throw new Error('Native build accepts no arguments')
  const stage = mkdtempSync(join(realpathSync(tmpdir()), 'talentbay-native-build-'))
  try {
    const { cwd, args, env } = buildInvocation(stage)
    for (const dir of [cwd, env.HOME, env.TMPDIR, join(cwd, 'node_modules')]) mkdirSync(dir, { mode: 0o700 })
    writeFileSync(env.DOTENV_CONFIG_PATH, '', { flag: 'wx', mode: 0o600 })
    stageSources(root, cwd)
    // Share installed dependencies, not .cache, .vite, other build output or user config.
    const modules = join(root, 'node_modules')
    for (const name of readdirSync(modules)) {
      if (!name.startsWith('.') || name === '.pnpm')
        symlinkSync(realpathSync(join(modules, name)), join(cwd, 'node_modules', name), 'dir')
    }
    execFileSync(process.execPath, args, { cwd, env, stdio: 'inherit' })
    installOutput(join(cwd, '.output'), root)
    console.log('Native node-server build ready in .output-native-review.')
  } finally {
    rmSync(stage, { recursive: true, force: true })
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { main() }
  catch (error) {
    console.error('Native build failed:', error.code ?? (error.status ? 'Nuxt exited ' + error.status : error.message))
    process.exitCode = 1
  }
}
